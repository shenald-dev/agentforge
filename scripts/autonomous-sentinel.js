#!/usr/bin/env node

/**
 * Unified Autonomous Sentinel
 * 
 * End-to-end autonomous controller that:
 * 1. Audits all GitHub repositories across the portfolio (PRs, issues, CI pipeline checks).
 * 2. Merges clean, passing pull requests automatically and self-heals conflicts.
 * 3. Scans and manages Google Labs Jules sessions:
 *    - Answers sessions awaiting developer input using LLM-grounded guidance (Gemini).
 *    - Evaluates and approves/adjusts planned changes.
 *    - Monitors active runs.
 *    - Archives completed sessions whose PRs are merged or closed.
 * 4. Generates Markdown summary for GitHub Actions ($GITHUB_STEP_SUMMARY).
 */

const { checkRepoHealth } = require('./audit-all-repos');
const { JulesManager } = require('./jules-manager');
const fs = require('fs');

async function runAutonomousSentinel() {
  console.log('====================================================');
  console.log('⚡ UNIFIED AUTONOMOUS SENTINEL: REPOS & JULES ⚡');
  console.log('====================================================\n');

  // Phase 1: Repository Audit & PR Triage
  console.log('--- PHASE 1: GITHUB PORTFOLIO AUDIT & MERGE ---');
  const repoAudit = await checkRepoHealth({ autoMergeGreen: true });

  // Phase 2: Google Jules Autonomous Management
  console.log('\n--- PHASE 2: GOOGLE JULES SESSION AUDIT & LIFECYCLE ---');
  let julesAudit = null;
  try {
    const jules = new JulesManager();
    julesAudit = await jules.auditAndManageAll({
      autoArchive: true,
      autoReply: true,
      autoApprove: true
    });
  } catch (err) {
    console.error('⚠️ Jules Autonomous Manager encountered an error:', err.message);
  }

  // Phase 3: Export GitHub Actions Step Summary (if running in CI)
  if (process.env.GITHUB_STEP_SUMMARY) {
    let summaryMd = `# 🛡️ Autonomous Sentinel Cycle Report\n\n`;
    summaryMd += `### 📦 GitHub Portfolio Health\n`;
    summaryMd += `- **Total Repositories Audited**: ${repoAudit.totalRepos || 13}\n`;
    summaryMd += `- **Open PRs**: ${repoAudit.totalOpenPRs}\n`;
    summaryMd += `- **Open Issues**: ${repoAudit.totalOpenIssues}\n`;
    summaryMd += `- **Failing CI Workflows**: ${repoAudit.failingWorkflows}\n`;
    if (repoAudit.mergedPRs > 0) {
      summaryMd += `- **PRs Automatically Merged**: ${repoAudit.mergedPRs}\n`;
    }
    if (repoAudit.healedPRs > 0) {
      summaryMd += `- **Conflicted PRs Self-Healed**: ${repoAudit.healedPRs}\n`;
    }
    summaryMd += `\n`;

    if (julesAudit) {
      summaryMd += `### 🤖 Google Jules Coding Sessions\n`;
      summaryMd += `- **Total Sessions Scanned**: ${julesAudit.total}\n`;
      summaryMd += `- **Active (IN_PROGRESS)**: ${julesAudit.inProgress.length}\n`;
      summaryMd += `- **User Inputs Provided**: ${julesAudit.replied.length}\n`;
      summaryMd += `- **Plans Approved**: ${julesAudit.approved.length}\n`;
      summaryMd += `- **Completed Sessions Archived**: ${julesAudit.archived.length}\n`;
    }

    fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, summaryMd, 'utf8');
  }

  console.log('\n====================================================');
  console.log('✅ AUTONOMOUS SENTINEL CYCLE COMPLETE');
  console.log('====================================================\n');
}

if (require.main === module) {
  runAutonomousSentinel().catch(err => {
    console.error('Fatal Sentinel error:', err);
    process.exit(1);
  });
}

module.exports = { runAutonomousSentinel };
