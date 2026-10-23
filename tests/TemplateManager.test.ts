import { TemplateManager } from "../src/templates/TemplateManager";
import * as fs from "fs/promises";

jest.mock("fs/promises", () => {
    return {
        __esModule: true,
        ...jest.requireActual("fs/promises"),
        stat: jest.fn(),
    };
});

describe("TemplateManager", () => {
    let manager: TemplateManager;

    beforeEach(() => {
        manager = new TemplateManager();
        const actualStat = jest.requireActual("fs/promises").stat;
        (fs.stat as jest.Mock).mockImplementation(actualStat);
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

    it("should throw if the template is not a directory", async () => {
        const actualStat = jest.requireActual("fs/promises").stat;
        (fs.stat as jest.Mock).mockResolvedValueOnce({
            isDirectory: () => false,
        } as any);

        await expect(manager.getTemplatePath("saas")).rejects.toThrow(
            "Template 'saas' does not exist."
        );

        (fs.stat as jest.Mock).mockImplementation(actualStat);
    });

    it("should block path traversal attempts", async () => {
        await expect(manager.getTemplatePath("../src")).rejects.toThrow(
            "Security Exception: Path traversal attempt blocked for template '../src'"
        );
        await expect(manager.getTemplatePath("../../package.json")).rejects.toThrow(
            "Security Exception: Path traversal attempt blocked for template '../../package.json'"
        );
    });
});
