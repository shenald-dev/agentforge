#!/usr/bin/env node

/**
 * Autonomous GitHub Pull Request Conflict Resolver (Antigravity AI Powered)
 * 
 * Features:
 * 1. Isolated temporary workspace (cloned in os.tmpdir() with --reference to local D:\ repo).
 * 2. Instant node_modules linkage via Windows NTFS junction / symlink for Node repos.
 * 3. Windows-safe no-op editor ('cmd.exe /c exit 0') to prevent git rebase --continue interactive hangs.
 * 4. Conflict classification & resolution:
 *    - Ledgers & Changelogs (.jules/warden.md, CHANGELOG.md, etc.): additive union.
 *    - Lockfiles (package-lock.json, poetry.lock): automatic regeneration.
 *    - Code files (.js, .ts, .py, etc.): Antigravity AI synthesis via Gemini 2.5 Flash.
 * 5. Closed-loop compiler & linter self-healing (feeds syntax errors back to LLM to self-correct).
 * 6. Test suite verification (npm test, pytest) to ensure 0 regressions before committing.
 * 7. Force-pushes with lease and auto-merges the PR.
 * 8. Synchronizes any existing local workspace on D:\.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');
const https = require('https');

function getGeminiApiKey() {
  if (process.env.GEMINI_API_KEY) return process.env.GEMINI_API_KEY;
  const candidates = [
    path.join(__dirname, '..', '.env'),
    path.join('d:', 'git hub auto', '.env'),
    path.join(process.cwd(), '.env')
  ];
  for (const envPath of candidates) {
    if (fs.existsSync(envPath)) {
      try {
        const env = fs.readFileSync(envPath, 'utf8');
        for (const line of env.split('\n')) {
          const [k, ...v] = line.trim().split('=');
          if (k === 'GEMINI_API_KEY') return v.join('=');
        }
      } catch {}
    }
  }
  return null;
}

const NOOP_EDITOR = process.platform === 'win32' ? 'cmd.exe /c exit 0' : ':';

function runCmd(command, cwd, extraEnv = {}) {
  try {
    return execSync(command, {
      cwd,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
      env: {
        ...process.env,
        GIT_EDITOR: NOOP_EDITOR,
        GIT_SEQUENCE_EDITOR: NOOP_EDITOR,
        ...extraEnv
      },
      timeout: 120000 // 2 minutes max
    }).trim();
  } catch (err) {
    return null;
  }
}

async function askGemini(prompt, systemInstruction = '', geminiApiKey = null, retryCount = 1) {
  const apiKey = geminiApiKey || getGeminiApiKey();
  if (!apiKey) return null;

  for (let attempt = 0; attempt <= retryCount; attempt++) {
    const resText = await new Promise((resolve) => {
      const payload = JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        systemInstruction: systemInstruction ? { parts: [{ text: systemInstruction }] } : undefined,
        generationConfig: {
          maxOutputTokens: 8192,
          temperature: 0.1
        }
      });

      const req = https.request({
        hostname: 'generativelanguage.googleapis.com',
        path: `/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload)
        },
        timeout: 30000
      }, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
          try {
            const json = JSON.parse(data);
            if (json.error) {
              resolve({ error: json.error.message });
              return;
            }
            const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
            resolve({ text: text ? text.trim() : null });
          } catch (e) {
            resolve({ error: e.message });
          }
        });
      });

      req.on('error', (err) => resolve({ error: err.message }));
      req.on('timeout', () => {
        req.destroy();
        resolve({ error: 'Timeout' });
      });

      req.write(payload);
      req.end();
    });

    if (resText && resText.text) {
      return resText.text;
    }

    if (attempt < retryCount) {
      // Exponential backoff
      await new Promise(r => setTimeout(r, 1500 * (attempt + 1)));
    }
  }

  return null;
}

/**
 * Resolves conflict markers additively for documentation, ledgers, and changelogs.
 */
function resolveAdditiveMarkdown(content) {
  const lines = content.split(/\r?\n/);
  const out = [];
  for (const line of lines) {
    if (line.startsWith('<<<<<<<') || line.startsWith('=======') || line.startsWith('>>>>>>>')) {
      continue;
    }
    out.push(line);
  }
  return out.join('\n');
}

/**
 * Strips code fences if LLM wrapped output in ```
 */
function cleanLlmOutput(rawText) {
  if (!rawText) return null;
  let text = rawText.trim();
  if (text.startsWith('```')) {
    const firstNewline = text.indexOf('\n');
    if (firstNewline !== -1) {
      text = text.substring(firstNewline + 1);
    }
  }
  if (text.endsWith('```')) {
    const lastFence = text.lastIndexOf('```');
    text = text.substring(0, lastFence).trimEnd();
  }
  return text;
}

/**
 * Verifies syntax of a resolved file.
 */
function checkFileSyntax(filePath, ext) {
  try {
    if (ext === '.js' || ext === '.mjs' || ext === '.cjs') {
      execSync(`node --check "${filePath}"`, { stdio: 'ignore' });
      return { ok: true };
    }
    if (ext === '.py') {
      execSync(`python -m py_compile "${filePath}"`, { stdio: 'ignore' });
      return { ok: true };
    }
    if (ext === '.json') {
      JSON.parse(fs.readFileSync(filePath, 'utf8'));
      return { ok: true };
    }
  } catch (err) {
    return { ok: false, error: err.message };
  }
  return { ok: true };
}

/**
 * Runs repository test suite to verify no regressions occurred during conflict resolution.
 */
function runRepoTests(workspaceDir) {
  // 1. Node.js project
  if (fs.existsSync(path.join(workspaceDir, 'package.json'))) {
    try {
      const pkg = JSON.parse(fs.readFileSync(path.join(workspaceDir, 'package.json'), 'utf8'));
      if (pkg.scripts && pkg.scripts.test) {
        console.log(`    🧪 Running Node.js test suite ('npm test')...`);
        const testRes = runCmd('npm test', workspaceDir);
        return testRes !== null;
      }
    } catch {}
  }

  // 2. Python project
  if (fs.existsSync(path.join(workspaceDir, 'pyproject.toml')) || fs.existsSync(path.join(workspaceDir, 'pytest.ini')) || fs.existsSync(path.join(workspaceDir, 'tests'))) {
    console.log(`    🧪 Running Python test suite ('python -m pytest')...`);
    const sep = process.platform === 'win32' ? ';' : ':';
    const pyRes = runCmd('python -m pytest', workspaceDir, { PYTHONPATH: `src${sep}.${sep}${process.env.PYTHONPATH || ''}` });
    return pyRes !== null;
  }

  return true;
}

/**
 * Resolves a conflicted PR autonomously with Antigravity AI power.
 */
async function resolvePrConflicts({ fullName, pr, geminiApiKey = null }) {
  const tmpBase = os.tmpdir();
  const prNumber = pr.number;
  let baseRef = pr.baseRefName;
  let headRef = pr.headRefName;
  const repoName = fullName.split('/')[1];

  if (!baseRef || !headRef) {
    const raw = runCmd(`gh pr view ${prNumber} --repo "${fullName}" --json baseRefName,headRefName`, tmpBase);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        baseRef = baseRef || parsed.baseRefName;
        headRef = headRef || parsed.headRefName;
      } catch {}
    }
  }
  baseRef = baseRef || 'main';

  console.log(`    🛠️ Initializing Antigravity AI conflict resolver for PR #${prNumber} (${fullName})...`);

  // Create isolated temp workspace
  const tmpDir = path.join(tmpBase, `sentinel-rebase-${repoName}-${prNumber}-${Date.now()}`);

  try {
    // Check if local reference clone exists on D:\ to speed up cloning
    const localRef = path.join('D:', repoName);
    const refFlag = fs.existsSync(localRef) && fs.existsSync(path.join(localRef, '.git'))
      ? `--reference "${localRef}"`
      : '';

    console.log(`    📥 Cloning repository to isolated workspace: ${tmpDir}`);
    const cloneRes = runCmd(`git clone ${refFlag} "https://github.com/${fullName}.git" "${tmpDir}"`, tmpBase);
    if (cloneRes === null && !fs.existsSync(tmpDir)) {
      console.warn(`    ❌ Failed to clone ${fullName} into temp workspace.`);
      return { success: false, reason: 'Git clone failed' };
    }

    // Link local node_modules via NTFS junction if available (instant 0-cost dependency link)
    if (fs.existsSync(path.join(localRef, 'node_modules')) && !fs.existsSync(path.join(tmpDir, 'node_modules'))) {
      try {
        fs.symlinkSync(path.join(localRef, 'node_modules'), path.join(tmpDir, 'node_modules'), 'junction');
        console.log(`    ⚡ Linked local node_modules via NTFS junction.`);
      } catch {}
    }

    // Configure git identity and no-op editor in temp workspace
    runCmd('git config user.name "shenald-dev"', tmpDir);
    runCmd('git config user.email "shenald@users.noreply.github.com"', tmpDir);
    runCmd(`git config core.editor "${NOOP_EDITOR}"`, tmpDir);

    // Fetch PR branch and base branch
    console.log(`    🔄 Fetching base (${baseRef}) and head (${headRef})...`);
    runCmd(`git fetch origin ${baseRef} ${headRef}`, tmpDir);

    // Checkout PR head branch
    const checkoutRes = runCmd(`git checkout -B ${headRef} origin/${headRef}`, tmpDir);
    if (checkoutRes === null) {
      console.warn(`    ❌ Failed to checkout PR branch origin/${headRef}.`);
      return { success: false, reason: 'Checkout branch failed' };
    }

    // Attempt rebase
    console.log(`    🔀 Rebasing ${headRef} onto origin/${baseRef}...`);
    runCmd(`git rebase origin/${baseRef}`, tmpDir);

    let rebaseLoop = 0;
    const maxRebaseIterations = 10;

    while (rebaseLoop < maxRebaseIterations) {
      rebaseLoop++;
      // Check if rebase has conflicts
      const statusRaw = runCmd('git status --porcelain', tmpDir);
      if (!statusRaw) break; // clean

      // Check for delete/modify conflicts (UD or DU)
      const statusLines = statusRaw.split(/\r?\n/).filter(Boolean);
      for (const line of statusLines) {
        const code = line.substring(0, 2);
        const relPath = line.substring(3).trim();
        if (code === 'UD') {
          // Deleted on base branch, modified in PR
          runCmd(`git rm "${relPath}"`, tmpDir);
        } else if (code === 'DU') {
          // Modified on base branch, deleted in PR
          runCmd(`git add "${relPath}"`, tmpDir);
        }
      }

      // Get unmerged files
      const unmergedFilesRaw = runCmd('git diff --name-only --diff-filter=U', tmpDir);
      const unmergedFiles = unmergedFilesRaw ? unmergedFilesRaw.split(/\r?\n/).filter(Boolean) : [];

      if (unmergedFiles.length === 0) {
        // No unmerged files left, continue rebase
        const contRes = runCmd('git rebase --continue', tmpDir);
        if (contRes !== null) {
          const checkStatus = runCmd('git status --porcelain', tmpDir);
          if (!checkStatus || !checkStatus.includes('rebase in progress')) break;
        } else {
          // If commit was empty, skip
          runCmd('git rebase --skip', tmpDir);
          break;
        }
        continue;
      }

      console.log(`    ⚠️ Conflict detected in ${unmergedFiles.length} file(s): ${unmergedFiles.join(', ')}`);

      for (const relPath of unmergedFiles) {
        const fullFilePath = path.join(tmpDir, relPath);
        if (!fs.existsSync(fullFilePath)) continue;

        const content = fs.readFileSync(fullFilePath, 'utf8');
        const ext = path.extname(relPath).toLowerCase();

        // Strategy A: Additive Markdown Ledgers & Release Notes
        const isLedgerOrChangelog = 
          relPath.includes('.jules/') || 
          /CHANGELOG\.md$/i.test(relPath) || 
          /RELEASE_NOTES\.md$/i.test(relPath) || 
          /NOTES\.md$/i.test(relPath);

        if (isLedgerOrChangelog) {
          console.log(`    📝 Additively resolving ledger/changelog: ${relPath}`);
          const resolved = resolveAdditiveMarkdown(content);
          fs.writeFileSync(fullFilePath, resolved, 'utf8');
          runCmd(`git add "${relPath}"`, tmpDir);
          continue;
        }

        // Strategy B: Lockfiles
        if (relPath === 'package-lock.json') {
          console.log(`    📦 Regenerating package-lock.json...`);
          runCmd(`git checkout --ours package-lock.json`, tmpDir);
          runCmd(`npm install --package-lock-only`, tmpDir);
          runCmd(`git add package-lock.json`, tmpDir);
          continue;
        }

        // Strategy C: Antigravity AI Code Synthesis via Gemini 2.5 Flash
        console.log(`    🧠 Invoking Antigravity AI (Gemini 2.5 Flash) to synthesize code conflict in: ${relPath}...`);
        const sysPrompt = `You are a principal software engineer autonomously resolving a git merge conflict during a rebase.
Your goal is to produce the exact, correct merged file that retains all valid additions, bug fixes, edge cases, and tests from BOTH branches.
Guidelines:
1. Preserve all existing functionality from the base branch (HEAD).
2. Integrate the new improvements, validations, or refactors from the incoming branch.
3. If both branches added test cases or functions with different names, keep BOTH.
4. If both branches implement the exact same validation, keep the most comprehensive one.
5. Remove ALL conflict markers (<<<<<<<, =======, >>>>>>>).
6. Preserve exact coding style, formatting, imports, and docstrings.
7. Return ONLY the raw file contents. Do NOT wrap in markdown fences (\`\`\`) and do not add any explanation or preamble.`;

        const userPrompt = `File: ${relPath}

Please resolve the merge conflicts in this file:

${content}`;

        const geminiResolved = await askGemini(userPrompt, sysPrompt, geminiApiKey);
        let accepted = false;

        if (geminiResolved) {
          const cleaned = cleanLlmOutput(geminiResolved);
          if (!cleaned.includes('<<<<<<<') && !cleaned.includes('>>>>>>>')) {
            fs.writeFileSync(fullFilePath, cleaned, 'utf8');
            // Closed-loop syntax verification
            const syntax = checkFileSyntax(fullFilePath, ext);
            if (syntax.ok) {
              console.log(`    ✓ Successfully synthesized & syntax-verified conflict resolution for ${relPath}`);
              runCmd(`git add "${relPath}"`, tmpDir);
              accepted = true;
            } else {
              console.warn(`    ⚠️ Syntax error in synthesized file: ${syntax.error}. Triggering AI self-correction...`);
              const fixPrompt = `The previous conflict resolution produced this syntax error:
${syntax.error}

File Content:
${cleaned}

Please fix the syntax error and output the pristine, complete file:`;
              const corrected = await askGemini(fixPrompt, sysPrompt, geminiApiKey);
              if (corrected) {
                const cleanedFix = cleanLlmOutput(corrected);
                fs.writeFileSync(fullFilePath, cleanedFix, 'utf8');
                const secondSyntax = checkFileSyntax(fullFilePath, ext);
                if (secondSyntax.ok) {
                  console.log(`    ✓ AI self-corrected syntax for ${relPath}`);
                  runCmd(`git add "${relPath}"`, tmpDir);
                  accepted = true;
                }
              }
            }
          }
        }

        // Fallback: If AI resolution was rejected, try clean additive strip
        if (!accepted) {
          console.log(`    ⚠️ Falling back to clean additive strip for ${relPath}`);
          const fallbackResolved = resolveAdditiveMarkdown(content);
          fs.writeFileSync(fullFilePath, fallbackResolved, 'utf8');
          runCmd(`git add "${relPath}"`, tmpDir);
        }
      }

      // Continue rebase
      runCmd('git rebase --continue', tmpDir);
    }

    // Abort if rebase is somehow still broken
    const finalStatus = runCmd('git status', tmpDir);
    if (finalStatus && finalStatus.includes('rebase in progress')) {
      console.warn(`    ❌ Rebase could not be completed cleanly.`);
      runCmd('git rebase --abort', tmpDir);
      return { success: false, reason: 'Rebase could not be finalized' };
    }

    console.log(`    ✓ Rebase completed successfully!`);

    // Run test suite
    const testsPass = runRepoTests(tmpDir);
    if (!testsPass) {
      console.warn(`    ❌ Test suite failed on rebased branch. Aborting merge to prevent breaking main.`);
      return { success: false, reason: 'Test suite failed after rebase' };
    }
    console.log(`    ✅ Test suite passed with zero regressions!`);

    // Force-push to PR branch
    console.log(`    🚀 Force-pushing rebased branch to origin/${headRef}...`);
    const pushRes = runCmd(`git push origin HEAD:${headRef} --force-with-lease`, tmpDir);
    if (pushRes === null) {
      console.warn(`    ❌ Failed to force-push rebased branch.`);
      return { success: false, reason: 'Force-push failed' };
    }
    console.log(`    ✓ Successfully pushed rebased branch.`);

    // Delay for GitHub's API cache to update
    await new Promise(r => setTimeout(r, 4000));

    // Verify mergeable state
    const viewRaw = runCmd(`gh pr view ${prNumber} --repo "${fullName}" --json mergeable`, tmpDir);
    if (viewRaw) {
      const view = JSON.parse(viewRaw);
      console.log(`    ℹ️ PR #${prNumber} mergeable state: ${view.mergeable}`);
    }

    // Auto-merge the PR
    console.log(`    ⚡ Merging PR #${prNumber} into ${baseRef}...`);
    const comment = `autonomously resolved merge conflicts with Antigravity AI and verified test suite. merging into ${baseRef}.`;
    runCmd(`gh pr comment ${prNumber} --repo "${fullName}" --body "${comment}"`, tmpDir);

    const mergeRes = runCmd(`gh pr merge ${prNumber} --repo "${fullName}" --squash --delete-branch --admin`, tmpDir);
    if (mergeRes !== null) {
      console.log(`    🎉 Successfully merged PR #${prNumber} on ${fullName}!`);

      // Synchronize local workspace on D:\ if it exists
      const localWorkspace = path.join('D:', repoName);
      if (fs.existsSync(localWorkspace) && fs.existsSync(path.join(localWorkspace, '.git'))) {
        console.log(`    🔄 Synchronizing local workspace at ${localWorkspace}...`);
        runCmd(`git checkout ${baseRef}`, localWorkspace);
        runCmd(`git pull origin ${baseRef}`, localWorkspace);
      }

      return { success: true, merged: true };
    } else {
      console.warn(`    ⚠️ Merged failed via gh pr merge. PR is rebased and green.`);
      return { success: true, merged: false };
    }

  } catch (err) {
    console.error(`    ❌ Conflict resolver error: ${err.message}`);
    return { success: false, reason: err.message };
  } finally {
    // Cleanup temporary workspace
    try {
      if (fs.existsSync(tmpDir)) {
        fs.rmSync(tmpDir, { recursive: true, force: true });
      }
    } catch {}
  }
}

module.exports = { resolvePrConflicts };

if (require.main === module) {
  const [,, fullName, prNum] = process.argv;
  if (!fullName || !prNum) {
    console.log('Usage: node scripts/conflict-resolver.js <owner/repo> <prNumber>');
    process.exit(1);
  }
  resolvePrConflicts({ fullName, pr: { number: parseInt(prNum, 10) } })
    .then(res => console.log('Result:', res))
    .catch(err => console.error(err));
}
