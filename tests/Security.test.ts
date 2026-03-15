import { TemplateManager } from "../src/templates/TemplateManager";

describe("TemplateManager Security", () => {
    let manager: TemplateManager;

    beforeEach(() => {
        manager = new TemplateManager();
    });

    it("should throw for path traversal attempts with ../", async () => {
        await expect(manager.getTemplatePath("../src")).rejects.toThrow(
            "Template '../src' does not exist."
        );
    });

    it("should throw for absolute path attempts", async () => {
        await expect(manager.getTemplatePath("/etc/passwd")).rejects.toThrow(
            "Template '/etc/passwd' does not exist."
        );
    });

    it("should throw for empty or current directory attempts", async () => {
        // path.relative('dir', 'dir') returns '' which we check as falsy
        await expect(manager.getTemplatePath(".")).rejects.toThrow(
            "Template '.' does not exist."
        );
        await expect(manager.getTemplatePath("")).rejects.toThrow(
            "Template '' does not exist."
        );
    });

    it("should prevent partial path traversal (sibling directory bypass)", async () => {
        // If templatesDir is /app/templates
        // And there is a folder /app/templates_secret
        // getTemplatePath("../templates_secret") should be blocked
        await expect(manager.getTemplatePath("../templates_secret")).rejects.toThrow(
            "Template '../templates_secret' does not exist."
        );
    });
});
