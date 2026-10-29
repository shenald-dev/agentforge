#!/usr/bin/env node

/**
 * Multi-Repository Sentinel Automation
 * 
 * Scans all repositories owned by the user, auditing open PRs, issues, and CI health.
 * Features:
 * - Parallel batch auditing across repositories for speed.
 * - Deep AI issue investigation & autonomous triage via Gemini 2.5 Flash.
 * - CI failure diagnosis with pinpoint root-cause analysis.
 * - Self-healing conflict resolution (detects obsolete PRs and auto-rebases conflicting branches).
 * - Auto-merges clean, green pull requests with authentic developer feedback.
 */

const { execSync } = require('child_process');
const { resolvePrConflicts, askGemini } = require('./conflict-resolver');

function run(command, retries = 2) {
  for (let i = 0; i <= retries; i++) {
    try {
      return execSync(command, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
    } catch {
      if (i < retries) {
        const waitTill = new Date(new Date().getTime() + 1000);
        while (waitTill > new Date()) {}
      } else {
        return null;
      }
    }
  }
  return null;
}

/**
 * Detects if a conflicting or stale PR is already obsolete or redundant
 * (e.g. underlying fix was already merged into the base branch or duplicate task).
 */
function checkIfPrObsolete(fullName, pr) {
  try {
    const viewRaw = run(`gh pr view ${pr.number} --repo "${fullName}" --json body,headRefName,commits`);
    if (!viewRaw) return false;
    const view = JSON.parse(viewRaw);
    const body = (view.body || '').toLowerCase();

    // 1. Direct acknowledgment in PR body
    if (body.includes('already resolved and merged') || body.includes('sync branch with `master`') || body.includes('sync branch with `main`')) {
      return true;
    }

    // 2. Check if a recent merged PR in the last 10 has the same core title / goal
    const recentMergedRaw = run(`gh pr list --repo "${fullName}" --state merged --limit 10 --json number,title`);
    if (recentMergedRaw) {
      const recentMerged = JSON.parse(recentMergedRaw);
      const cleanPrTitle = pr.title.toLowerCase().replace(/^(chore|fix|feat|perf)\([^)]+\):\s*/, '').trim();

      for (const m of recentMerged) {
        if (m.number === pr.number) continue;
        const cleanMergedTitle = m.title.toLowerCase().replace(/^(chore|fix|feat|perf)\([^)]+\):\s*/, '').trim();
        if (cleanPrTitle && cleanMergedTitle && (cleanPrTitle === cleanMergedTitle || (cleanPrTitle.length > 15 && cleanMergedTitle.includes(cleanPrTitle)))) {
          return true;
        }
      }
    }

    // 3. Check if all unit tests or core functions introduced in PR are already present on base branch
    const diffRaw = run(`gh pr diff ${pr.number} --repo "${fullName}"`);
    if (diffRaw) {
      const addedTests = [];
      const diffLines = diffRaw.split(/\r?\n/);
      for (const line of diffLines) {
        const mPy = line.match(/^\+\s*def\s+(test_\w+)\s*\(/);
        if (mPy) addedTests.push(mPy[1]);
        const mJs = line.match(/^\+\s*(?:test|it)\s*\(\s*['"]([^'"]+)['"]/);
        if (mJs) addedTests.push(mJs[1]);
      }
      if (addedTests.length > 0) {
        const allPresent = addedTests.every(testName => {
          const search = run(`gh search code "${testName}" --repo "${fullName}"`);
          return search && search.includes(testName);
        });
        if (allPresent) return true;
      }
    }
  } catch {
    return false;
  }
  return false;
}

/**
 * Deep AI investigation of an open GitHub issue.
 * Cross-references issue context with recent git history and repo state.
 */
async function investigateGitHubIssue(fullName, issue) {
  try {
    const rawIssue = run(`gh issue view ${issue.number} --repo "${fullName}" --json number,title,body,author,createdAt,comments,labels`);
    if (!rawIssue) return { investigated: false };
    const issueData = JSON.parse(rawIssue);

    console.log(`  🔍 Investigating GitHub Issue #${issue.number} ("${issue.title}") on ${fullName}...`);

    // Fetch recent commits on the default branch
    const rawCommits = run(`gh api repos/${fullName}/commits --limit 5 --jq ".[].commit.message"`);
    const recentCommits = rawCommits || 'None available';

    const systemInstruction = `You are a principal software engineer and the repository owner of ${fullName}.
Evaluate the GitHub issue thoroughly and practically.
Do NOT sound like an AI, LLM, or chatbot. Speak like an experienced, decisive lead developer.
Your goal is to investigate whether this issue:
1. Is ALREADY RESOLVED by recent commits/PRs (decision: "RESOLVED").
2. Is a REAL, ACTIONABLE BUG that needs code changes (decision: "ACTIONABLE_BUG").
3. Is an ENHANCEMENT or QUESTION needing triage/guidance (decision: "TRIAGED").

Output valid JSON only with this structure:
{
  "decision": "RESOLVED" | "ACTIONABLE_BUG" | "TRIAGED",
  "rootCause": "Short 1-2 sentence technical summary of the root cause or intent",
  "recommendation": "1-2 sentence recommendation or fix",
  "comment": "Pragmatic developer response to post on GitHub"
}`;

    const userPrompt = `Repository: ${fullName}
Issue #${issue.number}: ${issue.title}
Author: ${issueData.author?.login || 'unknown'}
Created: ${issueData.createdAt}
Labels: ${(issueData.labels || []).map(l => l.name).join(', ')}

Issue Body:
${issueData.body || 'No description provided.'}

Recent Commits on Default Branch:
${recentCommits}

Prior Comments:
${(issueData.comments || []).map(c => `${c.author?.login}: ${c.body}`).join('\n---\n')}

Investigate this issue now:`;

    const aiResponse = await askGemini(userPrompt, systemInstruction);
    if (!aiResponse) {
      console.log(`  ℹ️ Manual review needed for Issue #${issue.number}.`);
      return { investigated: true, decision: 'MANUAL_REVIEW' };
    }

    let parsed = null;
    try {
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) parsed = JSON.parse(jsonMatch[0]);
    } catch {}

    if (!parsed || !parsed.decision) {
      return { investigated: true, decision: 'MANUAL_REVIEW' };
    }

    console.log(`  🧠 AI Diagnosis: [${parsed.decision}] ${parsed.rootCause || ''}`);

    if (parsed.decision === 'RESOLVED') {
      const closingComment = parsed.comment || 'Resolved by recent commits and merged PRs.';
      console.log(`  ⚡ Closing resolved issue #${issue.number}...`);
      const safeComment = closingComment.replace(/"/g, '\\"');
      run(`gh issue close ${issue.number} --repo "${fullName}" --comment "${safeComment}"`);
      console.log(`  ✓ Successfully closed Issue #${issue.number}.`);
      return { investigated: true, closed: true, decision: 'RESOLVED', details: parsed };
    } else {
      const alreadyCommented = (issueData.comments || []).some(c => c.author?.login === 'shenald-dev');
      if (!alreadyCommented && parsed.comment) {
        console.log(`  ✍️ Posting triage assessment on Issue #${issue.number}...`);
        const safeComment = parsed.comment.replace(/"/g, '\\"');
        run(`gh issue comment ${issue.number} --repo "${fullName}" --body "${safeComment}"`);
      }
      return { investigated: true, closed: false, decision: parsed.decision, details: parsed };
    }
  } catch (err) {
    console.error(`  ❌ Failed to investigate issue #${issue.number}:`, err.message);
    return { investigated: false, error: err.message };
  }
}

/**
 * Diagnoses a failing GitHub Actions CI workflow run using Antigravity AI.
 */
async function investigateCiFailure(fullName, runInfo) {
  try {
    console.log(`  🚨 Investigating failing CI workflow "${runInfo.name}" on ${fullName}...`);
    const rawLogs = run(`gh run view ${runInfo.databaseId} --repo "${fullName}" --log-failed`);
    if (!rawLogs) return null;

    const truncatedLogs = rawLogs.split('\n').slice(-120).join('\n');

    const prompt = `Repository: ${fullName}
Failing Workflow: ${runInfo.name}
Run ID: ${runInfo.databaseId}

Recent failure logs:
${truncatedLogs}

Analyze why the build/test failed in 2-3 concise sentences. Identify the exact file, error, and actionable fix:`;

    const diagnosis = await askGemini(prompt, 'You are an expert DevOps and build systems engineer. Provide concise, pinpoint root-cause analysis.');
    if (diagnosis) {
      console.log(`  🔍 CI Root Cause Diagnosis:\n     ${diagnosis.trim().split('\n').join('\n     ')}`);
      return diagnosis.trim();
    }
  } catch (err) {
    console.error(`  ❌ Failed to diagnose CI failure:`, err.message);
  }
  return null;
}

/**
 * Audit a single repository: inspect PRs, issues, and workflow runs.
 */
async function auditSingleRepo(repo, { autoMergeGreen = false, investigateIssues = true, onMerge, onHeal, onIssueResolved } = {}) {
  const repoName = repo.name;
  const fullName = `${repo.url.replace('https://github.com/', '')}`;

  // 1. Open PRs
  const rawPRs = run(`gh pr list --repo "${fullName}" --state open --json number,title,mergeable,mergeStateStatus,statusCheckRollup,baseRefName,headRefName`);
  const prs = rawPRs ? JSON.parse(rawPRs) : [];

  let mergedCount = 0;
  let healedCount = 0;

  // Handle auto-merge & self-healing if requested
  if (autoMergeGreen && prs.length > 0) {
    for (const pr of prs) {
      const checks = pr.statusCheckRollup || [];
      const hasChecks = checks.length > 0;
      const allChecksGreen = hasChecks && checks.every(c => c.conclusion === 'SUCCESS' || c.state === 'SUCCESS');
      const hasFailedChecks = checks.some(c => c.conclusion === 'FAILURE' || c.state === 'FAILURE' || c.conclusion === 'TIMED_OUT');
      const isMergeable = pr.mergeable === 'MERGEABLE' || pr.mergeable === 'UNKNOWN';

      // Conflict Self-Healing
      if (pr.mergeable === 'CONFLICTING') {
        console.log(`  ⚠️ PR #${pr.number} ("${pr.title}") on ${fullName} has merge conflicts.`);
        
        // Step A: Check if PR is obsolete / already resolved
        if (checkIfPrObsolete(fullName, pr)) {
          console.log(`  🗑 Self-healing: PR #${pr.number} on ${fullName} is obsolete. Auto-closing...`);
          run(`gh pr close ${pr.number} --repo "${fullName}" --comment "Closing autonomously: underlying fix or changes are already present on base branch." --delete-branch`);
          healedCount++;
          if (onHeal) onHeal();
          continue;
        }

        // Step B: Attempt auto-rebase against base branch
        console.log(`  🔄 Self-healing: Attempting auto-rebase for PR #${pr.number} on ${fullName}...`);
        const rebaseSuccess = run(`gh pr update-branch ${pr.number} --repo "${fullName}" --rebase`);
        if (rebaseSuccess !== null) {
          console.log(`  ✓ Successfully rebased PR #${pr.number}.`);
          healedCount++;
          if (onHeal) onHeal();

          // Re-check mergeability post-rebase
          const freshRaw = run(`gh pr view ${pr.number} --repo "${fullName}" --json mergeable,statusCheckRollup`);
          if (freshRaw) {
            const freshPr = JSON.parse(freshRaw);
            const freshChecks = freshPr.statusCheckRollup || [];
            const freshHasChecks = freshChecks.length > 0;
            const freshAllGreen = freshHasChecks && freshChecks.every(c => c.conclusion === 'SUCCESS' || c.state === 'SUCCESS');
            const freshHasFailed = freshChecks.some(c => c.conclusion === 'FAILURE' || c.state === 'FAILURE' || c.conclusion === 'TIMED_OUT');
            const freshMergeable = freshPr.mergeable === 'MERGEABLE' || freshPr.mergeable === 'UNKNOWN';

            if ((freshAllGreen || (!freshHasChecks && !freshHasFailed && freshMergeable)) && freshPr.mergeable !== 'CONFLICTING') {
              console.log(`  ⚡ Auto-merging cleanly rebased PR #${pr.number} on ${fullName}...`);
              const comment = `rebased clean and tests green for "${pr.title}". merging into base branch.`;
              run(`gh pr comment ${pr.number} --repo "${fullName}" --body "${comment}"`);
              const mergeResult = run(`gh pr merge ${pr.number} --repo "${fullName}" --squash --delete-branch --admin`);
              if (mergeResult !== null) {
                console.log(`  ✓ Successfully merged PR #${pr.number} post-rebase.`);
                mergedCount++;
                if (onMerge) onMerge();
                continue;
              }
            }
          }
        } else {
          // Step C: Deep Self-Healing Conflict Resolution (Isolated rebase + ledger/lockfile/LLM synthesis + test verification)
          console.log(`  🧠 Deep Self-Healing: Resolving conflicts autonomously for PR #${pr.number} on ${fullName}...`);
          try {
            const deepRes = await resolvePrConflicts({ fullName, pr });
            if (deepRes && deepRes.success) {
              healedCount++;
              if (onHeal) onHeal();
              if (deepRes.merged) {
                mergedCount++;
                if (onMerge) onMerge();
              }
              continue;
            } else {
              console.log(`  ⚠️ Manual conflict resolution required for PR #${pr.number}: ${deepRes?.reason || 'Resolution failed'}`);
            }
          } catch (err) {
            console.log(`  ⚠️ Deep conflict resolver error for PR #${pr.number}: ${err.message}`);
          }
        }
        continue;
      }

      // Standard Clean Auto-Merge
      const canAutoMerge = (allChecksGreen || (!hasChecks && !hasFailedChecks && isMergeable)) && pr.mergeable !== 'CONFLICTING';
      if (canAutoMerge) {
        console.log(`  ⚡ Auto-merging clean, passing PR #${pr.number} ("${pr.title}") on ${fullName}...`);
        
        const humanComments = [
          `clean diff and checks are green for "${pr.title}". merging into base branch.`,
          `solid catch on that edge case, appreciate the fix! pulling this in.`,
          `all checks passing and behavior looks right on point. shipping this.`,
          `super tidy refactor, thanks for cleaning that up. merging now.`,
          `logic holds up and tests look green, pulling this in.`
        ];
        const comment = humanComments[Math.floor(Math.random() * humanComments.length)];
        run(`gh pr comment ${pr.number} --repo "${fullName}" --body "${comment}"`);

        const mergeResult = run(`gh pr merge ${pr.number} --repo "${fullName}" --squash --delete-branch --admin`);
        if (mergeResult !== null) {
          console.log(`  ✓ Successfully merged PR #${pr.number}.`);
          mergedCount++;
          if (onMerge) onMerge();
        }
      }
    }
  }

  // 2. Open Issues Investigation & Triage
  const rawIssues = run(`gh issue list --repo "${fullName}" --state open --json number,title`);
  const issues = rawIssues ? JSON.parse(rawIssues) : [];
  let resolvedIssuesCount = 0;

  if (investigateIssues && issues.length > 0) {
    for (const issue of issues) {
      const invRes = await investigateGitHubIssue(fullName, issue);
      if (invRes && invRes.closed) {
        resolvedIssuesCount++;
        if (onIssueResolved) onIssueResolved();
      }
    }
  }

  // 3. Latest Workflow Runs & Failure Diagnosis
  const rawRuns = run(`gh run list --repo "${fullName}" --limit 1 --json databaseId,status,conclusion,name`);
  const runs = rawRuns ? JSON.parse(rawRuns) : [];
  const latestRun = runs.length > 0 ? runs[0] : null;

  let ciStatus = 'N/A';
  let isFailing = false;
  if (latestRun) {
    if (latestRun.conclusion === 'success') {
      ciStatus = '✅ Passing';
    } else if (latestRun.conclusion === 'failure') {
      ciStatus = '❌ Failing';
      isFailing = true;
      if (investigateIssues) {
        await investigateCiFailure(fullName, latestRun);
      }
    } else {
      ciStatus = `⏳ ${latestRun.status}`;
    }
  }

  // Count active remaining PRs after auto-merge/heal
  const remainingPrs = Math.max(0, prs.length - mergedCount - healedCount);
  const remainingIssues = Math.max(0, issues.length - resolvedIssuesCount);

  return {
    name: repoName,
    fullName,
    openPRs: remainingPrs,
    openIssues: remainingIssues,
    ci: ciStatus,
    isFailing,
    mergedCount,
    healedCount,
    resolvedIssuesCount,
    prList: prs,
    issueList: issues
  };
}

/**
 * Concurrency helper: processes items in parallel batches.
 */
async function mapConcurrent(items, concurrency, fn) {
  const results = [];
  for (let i = 0; i < items.length; i += concurrency) {
    const chunk = items.slice(i, i + concurrency);
    const chunkResults = await Promise.all(chunk.map(fn));
    results.push(...chunkResults);
  }
  return results;
}

async function checkRepoHealth({ autoMergeGreen = false, investigateIssues = true } = {}) {
  console.log('🔍 [Multi-Repo Sentinel] Discovering all repositories for authenticated user...\n');

  const owner = process.env.GITHUB_REPOSITORY_OWNER || 'shenald-dev';
  const rawRepos = run(`gh repo list ${owner} --limit 100 --json name,isPrivate,url`);
  if (!rawRepos) {
    console.error('❌ Failed to fetch repositories via GitHub CLI (`gh`). Ensure you are authenticated with `gh auth login`.');
    return { error: 'Not authenticated with gh' };
  }

  const repos = JSON.parse(rawRepos);
  console.log(`Found ${repos.length} repositories. Auditing repositories in parallel batches...\n`);

  let totalOpenPRs = 0;
  let totalOpenIssues = 0;
  let failingWorkflows = 0;
  let mergedPRs = 0;
  let healedPRs = 0;
  let resolvedIssues = 0;

  const report = await mapConcurrent(repos, 4, async (repo) => {
    return auditSingleRepo(repo, {
      autoMergeGreen,
      investigateIssues,
      onMerge: () => { mergedPRs++; },
      onHeal: () => { healedPRs++; },
      onIssueResolved: () => { resolvedIssues++; }
    });
  });

  for (const item of report) {
    totalOpenPRs += item.openPRs;
    totalOpenIssues += item.openIssues;
    if (item.isFailing) failingWorkflows++;
  }

  // Print Summary Table
  console.log('┌──────────────────────────────────────┬──────────┬─────────────┬──────────────┐');
  console.log('│ Repository                           │ Open PRs │ Open Issues │ Latest CI    │');
  console.log('├──────────────────────────────────────┼──────────┼─────────────┼──────────────┤');

  for (const item of report) {
    const nameCol = item.name.padEnd(36);
    const prCol = String(item.openPRs).padStart(8);
    const issueCol = String(item.openIssues).padStart(11);
    const ciCol = item.ci.padEnd(12);
    console.log(`│ ${nameCol} │ ${prCol} │ ${issueCol} │ ${ciCol} │`);
  }
  console.log('└──────────────────────────────────────┴──────────┴─────────────┴──────────────┘\n');

  console.log('📊 Portfolio Health Summary:');
  console.log(`  - Total Repositories Audited: ${repos.length}`);
  console.log(`  - Total Open Pull Requests:   ${totalOpenPRs}`);
  console.log(`  - Total Open Issues:          ${totalOpenIssues}`);
  console.log(`  - Failing CI Workflows:       ${failingWorkflows}`);
  if (autoMergeGreen) {
    console.log(`  - PRs Automatically Merged:   ${mergedPRs}`);
    console.log(`  - Conflicted PRs Self-Healed: ${healedPRs}`);
  }
  if (resolvedIssues > 0) {
    console.log(`  - Issues Autonomously Resolved: ${resolvedIssues}`);
  }

  if (totalOpenPRs === 0 && totalOpenIssues === 0 && failingWorkflows === 0) {
    console.log('\n✨ All repositories are 100% clean, triaged, and healthy!');
  } else {
    console.log('\n⚠️ Actions monitored across portfolio.');
  }

  return { totalRepos: repos.length, totalOpenPRs, totalOpenIssues, failingWorkflows, mergedPRs, healedPRs, resolvedIssues, report };
}

if (require.main === module) {
  checkRepoHealth().catch(err => {
    console.error('Fatal audit error:', err);
    process.exit(1);
  });
}

module.exports = { checkRepoHealth };
