#!/usr/bin/env node
import { Command } from "commander";
import chalk from "chalk";

const program = new Command();

program
    .name("agentforge")
    .description("✨ Autonomous Full-Stack App Builder CLI")
    .version("1.0.0");

program
    .command("create <idea>")
    .description("Scaffold a new application from a short natural language idea.")
    .action((idea) => {
        console.log(chalk.cyanBright(`\n✨ AgentForge initiating creation sequence for idea: `) + chalk.yellow(`"${idea}"`));
        // TODO: Implement generation logic
    });

program
    .command("preview <path>")
    .description("Spin up the generated application locally using Docker Compose.")
    .action((path) => {
        console.log(chalk.magentaBright(`\n🐳 Preparing preview container from path: `) + chalk.white(`${path}`));
        // TODO: Implement preview logic
    });

program.parse();
