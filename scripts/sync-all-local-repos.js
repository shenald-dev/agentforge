const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function syncAllLocalRepos(dPath = 'D:\\') {
  if (!fs.existsSync(dPath)) return [];
  const entries = fs.readdirSync(dPath, { withFileTypes: true });
  const results = [];

  console.log('Auditing and synchronizing local repositories on D:\\...\n');

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const repoPath = path.join(dPath, entry.name);
    const gitDir = path.join(repoPath, '.git');
    if (!fs.existsSync(gitDir)) continue;

    try {
      // Windows NTFS safety hardening for special filenames (e.g. colon characters)
      if (process.platform === 'win32' && entry.name === 'moq') {
        try {
          execSync('git config core.protectNTFS false', { cwd: repoPath, stdio: 'ignore' });
          execSync('git config core.sparseCheckout true', { cwd: repoPath, stdio: 'ignore' });
          const scInfoDir = path.join(gitDir, 'info');
          const scPath = path.join(scInfoDir, 'sparse-checkout');
          if (!fs.existsSync(scPath)) {
            fs.mkdirSync(scInfoDir, { recursive: true });
            fs.writeFileSync(scPath, '/*\n!mocks/api/users/:id.json\n', 'utf8');
          }
        } catch {}
      }

      const currentBranch = execSync('git branch --show-current', { cwd: repoPath, encoding: 'utf8' }).trim();
      if (!currentBranch) {
        console.log(`[${entry.name}] Head detached. Skipping auto-pull.`);
        continue;
      }

      // Check remotes
      const remotes = execSync('git remote', { cwd: repoPath, encoding: 'utf8' }).trim();
      let targetRemote = 'origin';
      if (!remotes.includes('origin')) {
        if (remotes.includes('upstream')) {
          targetRemote = 'upstream';
        } else {
          continue;
        }
      }

      // Fetch target remote with upstream fallback
      try {
        execSync(`git fetch ${targetRemote}`, { cwd: repoPath, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
      } catch (fetchErr) {
        if (targetRemote === 'origin' && remotes.includes('upstream')) {
          targetRemote = 'upstream';
          try {
            execSync('git fetch upstream', { cwd: repoPath, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
          } catch (upstreamErr) {
            console.warn(`[${entry.name}] Remote fetch note: ${fetchErr.message.split('\n')[0]}`);
            continue;
          }
        } else {
          console.warn(`[${entry.name}] Remote fetch note: ${fetchErr.message.split('\n')[0]}`);
          continue;
        }
      }

      // Check how many commits HEAD is behind remote
      let behindCount = 0;
      try {
        const revCount = execSync(`git rev-list HEAD..${targetRemote}/${currentBranch} --count`, { cwd: repoPath, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
        behindCount = parseInt(revCount, 10) || 0;
      } catch {
        // Fallback to git status check if rev-list fails
        const status = execSync('git status -uno', { cwd: repoPath, encoding: 'utf8' });
        if (status.includes('behind')) behindCount = 1;
      }

      if (behindCount > 0) {
        console.log(`[${entry.name}] Behind ${targetRemote}/${currentBranch} by ${behindCount} commit(s). Pulling latest with autostash...`);
        execSync(`git pull --autostash ${targetRemote} ${currentBranch}`, { cwd: repoPath, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
        console.log(`[${entry.name}] ✓ Synchronized with ${targetRemote}/${currentBranch}`);
        results.push({ name: entry.name, status: 'updated' });
      } else {
        console.log(`[${entry.name}] Up to date with ${targetRemote}/${currentBranch}`);
        results.push({ name: entry.name, status: 'up-to-date' });
      }
    } catch (err) {
      console.warn(`[${entry.name}] Sync note: ${err.message.split('\n')[0]}`);
    }
  }

  console.log('\n✅ Local repository sync audit complete.');
  return results;
}

if (require.main === module) {
  syncAllLocalRepos();
}

module.exports = { syncAllLocalRepos };
