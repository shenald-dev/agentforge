#!/usr/bin/env node
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = require("commander");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const program = new commander_1.Command();
let pkgVersion = "unknown";
try {
    const pkgPath = path.join(__dirname, "../../package.json");
    pkgVersion = JSON.parse(fs.readFileSync(pkgPath, "utf8")).version;
}
catch (error) {
    console.warn("Failed to load package version:", error);
}
program
    .name("agentforge")
    .description("✨ Autonomous Full-Stack App Builder CLI")
    .version(pkgVersion);
// ─────────────────────────────────────
// agentforge auth
// ─────────────────────────────────────
program
    .command("auth")
    .description("Set your OpenRouter API key for LLM enchantments securely.")
    .action(async () => {
    const [[{ default: pc }, p], { ConfigManager }] = await Promise.all([
        Promise.all([Promise.resolve().then(() => __importStar(require("picocolors"))), Promise.resolve().then(() => __importStar(require("@clack/prompts")))]),
        Promise.resolve().then(() => __importStar(require("../utils/config")))
    ]);
    const configManager = new ConfigManager();
    p.intro(pc.bgCyan(pc.black(" AgentForge Configuration ")));
    const apiKey = await p.password({
        message: "Enter your OpenRouter API key:",
        validate: (value) => {
            if (!value)
                return "API key cannot be empty.";
        }
    });
    if (p.isCancel(apiKey)) {
        p.cancel("Operation cancelled.");
        process.exit(0);
    }
    const s = p.spinner();
    s.start("Saving API key securely...");
    try {
        await configManager.setConfig({ OPENROUTER_API_KEY: apiKey });
        s.stop(pc.green("API key saved securely to ~/.agentforge/config.json"));
        p.outro(pc.cyan("You're ready to forge!"));
    }
    catch (error) {
        s.stop(pc.red(`Failed to save API key: ${error instanceof Error ? error.message : String(error)}`));
        process.exit(1);
    }
});
// ─────────────────────────────────────
// agentforge create
// ─────────────────────────────────────
program
    .command("create [idea]")
    .description("Scaffold a new application from a natural language idea.")
    .option("--no-llm", "Skip LLM-based README enhancement even if API key is set")
    .action(async (idea, options) => {
    try {
        const { CLIController } = await Promise.resolve().then(() => __importStar(require("./CLIController")));
        const cli = new CLIController();
        await cli.handleCreateCommand(idea, options);
    }
    catch (err) {
        const pc = (await Promise.resolve().then(() => __importStar(require("picocolors")))).default;
        console.error(pc.red(`\n✖ Failed to execute create command: ${err instanceof Error ? err.message : String(err)}`));
        process.exit(1);
    }
});
// ─────────────────────────────────────
// agentforge list
// ─────────────────────────────────────
program
    .command("list")
    .description("List all available project templates.")
    .action(async () => {
    const [{ default: pc }, { TemplateManager }] = await Promise.all([
        Promise.resolve().then(() => __importStar(require("picocolors"))),
        Promise.resolve().then(() => __importStar(require("../templates/TemplateManager")))
    ]);
    const templateManager = new TemplateManager();
    try {
        const templates = await templateManager.listTemplates();
        console.log(pc.cyan(`\n✨ Available Templates:\n`));
        templates.forEach((t) => {
            const icons = {
                "saas": "🏢",
                "landing-api": "🚀",
                "realtime": "💬",
            };
            console.log(pc.white(`  ${icons[t] || "📦"}  ${pc.bold(t)}`));
        });
        console.log();
    }
    catch (err) {
        console.error(pc.red(`\n✖ Failed to list templates: ${err instanceof Error ? err.message : String(err)}`));
        process.exit(1);
    }
});
// ─────────────────────────────────────
// agentforge preview
// ─────────────────────────────────────
program
    .command("preview <targetPath>")
    .description("Spin up the generated application locally using Docker Compose.")
    .action(async (targetPath) => {
    const [{ default: pc }, { PreviewServer }] = await Promise.all([
        Promise.resolve().then(() => __importStar(require("picocolors"))),
        Promise.resolve().then(() => __importStar(require("../preview-server/PreviewServer")))
    ]);
    const preview = new PreviewServer();
    try {
        await preview.start(targetPath);
    }
    catch (err) {
        console.error(pc.red(`\n✖ Preview server failed: ${err instanceof Error ? err.message : String(err)}`));
        process.exit(1);
    }
});
program.parse();
