#!/usr/bin/env node
import { Command } from "commander";
import * as fs from "fs";
import * as path from "path";

const program = new Command();

let pkgVersion = "unknown";
try {
  const pkgPath = path.join(__dirname, "../../package.json");
  pkgVersion = JSON.parse(fs.readFileSync(pkgPath, "utf8")).version;
} catch (error) {
  console.warn("Failed to load package version:", error);
}

program
  .name("agentforge")
  .description("✨ Autonomous Full-Stack App Builder CLI (Major v3)")
  .version(pkgVersion);

async function handleCliError(commandName: string, err: unknown) {
  let errorFormatter = (msg: string) => msg;
  try {
    const pc = (await import("picocolors")).default;
    errorFormatter = pc.red;
  } catch (_) {
    /* ignore */
  }
  console.error(
    errorFormatter(
      `\n✖ Failed to execute ${commandName} command: ${err instanceof Error ? err.message : String(err)}`,
    ),
  );
  process.exit(1);
}

// ─────────────────────────────────────
// agentforge auth
// ─────────────────────────────────────
program
  .command("auth")
  .description("Set your OpenRouter API key for LLM enchantments securely.")
  .action(async () => {
    try {
      const [[{ default: pc }, p], { ConfigManager }] = await Promise.all([
        Promise.all([import("picocolors"), import("@clack/prompts")]),
        import("../utils/config"),
      ]);
      const configManager = new ConfigManager();

      p.intro(pc.bgCyan(pc.black(" AgentForge Configuration ")));

      const apiKey = await p.password({
        message: "Enter your OpenRouter API key:",
        validate: (value) => {
          if (!value) return "API key cannot be empty.";
        },
      });

      if (p.isCancel(apiKey)) {
        p.cancel("Operation cancelled.");
        process.exit(0);
      }

      const s = p.spinner();
      s.start("Saving API key securely...");
      try {
        await configManager.setConfig({ OPENROUTER_API_KEY: apiKey as string });
        s.stop(pc.green("API key saved securely to ~/.agentforge/config.json"));

        p.outro(pc.cyan("You're ready to forge!"));
      } catch (error: unknown) {
        s.stop(pc.red(`Failed to save API key: ${error instanceof Error ? error.message : String(error)}`));
        process.exit(1);
      }
    } catch (err: unknown) {
      await handleCliError("auth", err);
    }
  });

// ─────────────────────────────────────
// agentforge create
// ─────────────────────────────────────
program
  .command("create [idea]")
  .description("Scaffold a new full-stack application from a natural language idea.")
  .option("-n, --name <name>", "Project name (kebab-case, e.g. my-vibe-app)")
  .option("-t, --template <template>", "Template type (saas, landing-api, realtime)")
  .option("-o, --output <dir>", "Custom output directory destination")
  .option("--no-llm", "Skip LLM-based README enhancement even if API key is set")
  .option("--no-plan", "Skip ARCHITECTURE.md architectural blueprint generation")
  .option("--skip-install", "Skip automatic npm install in generated project")
  .option("--dry-run", "Preview file generation simulation without writing to disk")
  .option("-f, --force", "Overwrite destination directory if it already exists")
  .action(async (idea, options) => {
    try {
      const { CLIController } = await import("./CLIController");
      const cli = new CLIController();
      await cli.handleCreateCommand(idea, options);
    } catch (err: unknown) {
      await handleCliError("create", err);
    }
  });

// ─────────────────────────────────────
// agentforge list
// ─────────────────────────────────────
program
  .command("list")
  .description("List all available project templates.")
  .option("-d, --details", "Display in-depth tech stack and port mappings for each template")
  .action(async (options) => {
    try {
      const [{ default: pc }, { TemplateManager }] = await Promise.all([
        import("picocolors"),
        import("../templates/TemplateManager"),
      ]);
      const templateManager = new TemplateManager();

      if (options.details) {
        const templates = await templateManager.listTemplatesWithMetadata();
        console.log(pc.bold(pc.cyan(`\n✨ Available AgentForge Templates:\n`)));
        templates.forEach((t) => {
          console.log(`  ${t.icon} ${pc.bold(pc.white(t.displayName))} (${pc.cyan(t.name)})`);
          console.log(`     ${pc.dim("Description:")} ${t.description}`);
          console.log(`     ${pc.dim("Tech Stack:")}  ${t.stack.join(", ")}`);
          console.log(`     ${pc.dim("Ports:")}       Frontend: ${t.ports.frontend} | Backend: ${t.ports.backend}\n`);
        });
      } else {
        const templates = await templateManager.listTemplates();
        console.log(pc.cyan(`\n✨ Available Templates:\n`));
        templates.forEach((t) => {
          const icons: Record<string, string> = {
            saas: "🏢",
            "landing-api": "🚀",
            realtime: "💬",
          };
          console.log(pc.white(`  ${icons[t] || "📦"}  ${pc.bold(t)}`));
        });
        console.log(pc.dim(`\nTip: Run 'agentforge list --details' or 'agentforge info <template>' for stack specs.\n`));
      }
    } catch (err: unknown) {
      await handleCliError("list templates", err);
    }
  });

// ─────────────────────────────────────
// agentforge info
// ─────────────────────────────────────
program
  .command("info <template>")
  .description("View architectural specifications and tech stack for a specific template.")
  .action(async (template) => {
    try {
      const { CLIController } = await import("./CLIController");
      const cli = new CLIController();
      await cli.handleInfoCommand(template);
    } catch (err: unknown) {
      await handleCliError("info", err);
    }
  });

// ─────────────────────────────────────
// agentforge doctor
// ─────────────────────────────────────
program
  .command("doctor")
  .description("Run developer environment health checks (Node, Git, Docker, Compose, Ports).")
  .action(async () => {
    try {
      const { CLIController } = await import("./CLIController");
      const cli = new CLIController();
      await cli.handleDoctorCommand();
    } catch (err: unknown) {
      await handleCliError("doctor", err);
    }
  });

// ─────────────────────────────────────
// agentforge preview
// ─────────────────────────────────────
program
  .command("preview <targetPath>")
  .description("Spin up the generated application locally using Docker Compose.")
  .action(async (targetPath) => {
    try {
      const [{ PreviewServer }] = await Promise.all([
        import("../preview-server/PreviewServer"),
      ]);
      const preview = new PreviewServer();
      await preview.start(targetPath);
    } catch (err: unknown) {
      await handleCliError("preview", err);
    }
  });

program.parse();
