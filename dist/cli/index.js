#!/usr/bin/env node
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = require("commander");
const chalk_1 = __importDefault(require("chalk"));
const program = new commander_1.Command();
program
    .name("agentforge")
    .description("✨ Autonomous Full-Stack App Builder CLI")
    .version("1.0.0");
program
    .command("create <idea>")
    .description("Scaffold a new application from a short natural language idea.")
    .action((idea) => {
    console.log(chalk_1.default.cyanBright(`\n✨ AgentForge initiating creation sequence for idea: `) + chalk_1.default.yellow(`"${idea}"`));
    // TODO: Implement generation logic
});
program
    .command("preview <path>")
    .description("Spin up the generated application locally using Docker Compose.")
    .action((path) => {
    console.log(chalk_1.default.magentaBright(`\n🐳 Preparing preview container from path: `) + chalk_1.default.white(`${path}`));
    // TODO: Implement preview logic
});
program.parse();
