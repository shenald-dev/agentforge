import { TemplateManager } from "../templates/TemplateManager";
import pc from "picocolors";
import * as p from "@clack/prompts";

export class CLIController {
    private templateManager: TemplateManager;

    constructor() {
        this.templateManager = new TemplateManager();
    }

    /**
     * Guides the user through an interactive setup process for generation.
     */
    async promptCreationDetails(defaultIdea: string) {
        console.clear();
        p.intro(`${pc.bgCyan(pc.black(" ✨ AgentForge Interactive Scaffolding "))}`);

        const templates = await this.templateManager.listTemplates();

        const project = await p.group(
            {
                projectName: () => p.text({
                    message: "What is the name of your new application?",
                    placeholder: "my-vibe-app",
                    defaultValue: "my-vibe-app",
                    validate: (value) => {
                        if (!value) return "Please enter a name.";
                        if (!/^[a-z0-9-]+$/.test(value)) return "Project name may only include lowercase letters, numbers, and dashes.";
                    }
                }),
                idea: () => p.text({
                    message: "Describe your idea in one sentence:",
                    placeholder: defaultIdea || "A stunning new web app.",
                    defaultValue: defaultIdea || "A stunning new web app.",
                }),
                template: () => p.select({
                    message: "Which scaffold template best fits your architecture?",
                    options: templates.map(t => ({ value: t, label: t })),
                })
            },
            {
                onCancel: () => {
                    p.cancel("Operation cancelled.");
                    process.exit(0);
                }
            }
        );

        return project;
    }
}
