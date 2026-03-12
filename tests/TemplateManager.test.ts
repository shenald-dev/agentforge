import { TemplateManager } from "../src/templates/TemplateManager";

describe("TemplateManager", () => {
    let manager: TemplateManager;

    beforeEach(() => {
        manager = new TemplateManager();
    });

    it("should list available templates", async () => {
        const templates = await manager.listTemplates();
        expect(templates).toContain("saas");
        expect(templates).toContain("landing-api");
        expect(templates).toContain("realtime");
    });

    it("should return at least 3 templates", async () => {
        const templates = await manager.listTemplates();
        expect(templates.length).toBeGreaterThanOrEqual(3);
    });

    it("should resolve a valid template path", async () => {
        const templatePath = await manager.getTemplatePath("saas");
        expect(templatePath).toContain("saas");
    });

    it("should throw for an invalid template name", async () => {
        await expect(manager.getTemplatePath("nonexistent-template")).rejects.toThrow(
            "Template 'nonexistent-template' does not exist."
        );
    });
});
