import { ProjectGenerator } from "./src/generators/ProjectGenerator";
import * as path from "path";

async function run() {
    const generator = new ProjectGenerator();
    await generator.generate({
        projectName: "agentforge-live-demo",
        idea: "The official AgentForge generated showcase app. A powerful autonomous builder.",
        templatePath: path.resolve(__dirname, "./templates/landing-api"),
        outputPath: path.resolve(__dirname, "./agentforge-live-demo")
    });
    console.log("Successfully generated agentforge-live-demo!");
}

run();
