import { TemplateManager } from "../templates/TemplateManager";

export class CLIController {
    private templateManager: TemplateManager;

    constructor() {
        this.templateManager = new TemplateManager();
    }

    /**
     * Guides the user through an interactive setup process for generation.
     */
    async promptCreationDetails(defaultIdea: string) {
        const [{ default: pc }, p] = await Promise.all([
            import("picocolors"),
            import("@clack/prompts")
        ]);

        console.clear();
        p.intro(`${pc.bgCyan(pc.black(" ✨ AgentForge Interactive Scaffolding "))}`);

        const templates = await this.templateManager.listTemplates();

        const project = await p.group(
            {
                projectName: () => p.text({
                    message: "What is the name of your new application?",
                    placeholder: "my-vibe-app",
                    defaultValue: "my-vibe-app",
                    validate: (value?: string) => {
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
