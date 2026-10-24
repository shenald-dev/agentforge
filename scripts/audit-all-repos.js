#!/usr/bin/env node

/**
 * Multi-Repository Sentinel Automation
 * Scans all repositories owned by the user, auditing open PRs, issues, and CI health.
 * Optionally auto-merges clean, green pull requests.
 */

const { execSync } = require('child_process');

function run(command) {
  try {
    return execSync(command, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  } catch {
    return null;
  }
}

function checkRepoHealth({ autoMergeGreen = false } = {}) {
  console.log('🔍 [Multi-Repo Sentinel] Discovering all repositories for authenticated user...\n');

  const owner = process.env.GITHUB_REPOSITORY_OWNER || 'shenald-dev';
  const rawRepos = run(`gh repo list ${owner} --limit 100 --json name,isPrivate,url`);
  if (!rawRepos) {
    console.error('❌ Failed to fetch repositories via GitHub CLI (`gh`). Ensure you are authenticated with `gh auth login`.');
    return { error: 'Not authenticated with gh' };
  }

  const repos = JSON.parse(rawRepos);
  console.log(`Found ${repos.length} repositories. Auditing each repository...\n`);

  const report = [];
  let totalOpenPRs = 0;
  let totalOpenIssues = 0;
  let failingWorkflows = 0;
  let mergedPRs = 0;

  for (const repo of repos) {
    const repoName = repo.name;
    const fullName = `${repo.url.replace('https://github.com/', '')}`;

    // 1. Open PRs
    const rawPRs = run(`gh pr list --repo "${fullName}" --state open --json number,title,mergeable,mergeStateStatus,statusCheckRollup`);
    const prs = rawPRs ? JSON.parse(rawPRs) : [];
    totalOpenPRs += prs.length;

    // Handle auto-merge if requested
    if (autoMergeGreen && prs.length > 0) {
      for (const pr of prs) {
        const checks = pr.statusCheckRollup || [];
        const isAllGreen = checks.length > 0 && checks.every(c => c.conclusion === 'SUCCESS' || c.state === 'SUCCESS');
        if (isAllGreen && pr.mergeable !== 'CONFLICTING') {
          console.log(`  ⚡ Auto-merging clean, passing PR #${pr.number} ("${pr.title}") on ${fullName}...`);
          const mergeResult = run(`gh pr merge ${pr.number} --repo "${fullName}" --squash --delete-branch --admin`);
          if (mergeResult !== null) {
            console.log(`  ✓ Successfully merged PR #${pr.number}.`);
            mergedPRs++;
          }
        }
      }
    }

    // 2. Open Issues
    const rawIssues = run(`gh issue list --repo "${fullName}" --state open --json number,title`);
    const issues = rawIssues ? JSON.parse(rawIssues) : [];
    totalOpenIssues += issues.length;

    // 3. Latest Workflow Runs
    const rawRuns = run(`gh run list --repo "${fullName}" --limit 1 --json status,conclusion,name`);
    const runs = rawRuns ? JSON.parse(rawRuns) : [];
    const latestRun = runs.length > 0 ? runs[0] : null;

    let ciStatus = 'N/A';
    if (latestRun) {
      if (latestRun.conclusion === 'success') {
        ciStatus = '✅ Passing';
      } else if (latestRun.conclusion === 'failure') {
        ciStatus = '❌ Failing';
        failingWorkflows++;
      } else {
        ciStatus = `⏳ ${latestRun.status}`;
      }
    }

    report.push({
      name: repoName,
      openPRs: prs.length,
      openIssues: issues.length,
      ci: ciStatus,
      prList: prs,
      issueList: issues
    });
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
  }

  if (totalOpenPRs === 0 && totalOpenIssues === 0 && failingWorkflows === 0) {
    console.log('\n✨ All repositories are 100% clean, triaged, and healthy!');
  } else {
    console.log('\n⚠️ Actions monitored across portfolio.');
  }

  return { totalRepos: repos.length, totalOpenPRs, totalOpenIssues, failingWorkflows, mergedPRs, report };
}

if (require.main === module) {
  checkRepoHealth();
}

module.exports = { checkRepoHealth };
