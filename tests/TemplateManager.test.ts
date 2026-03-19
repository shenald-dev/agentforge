import { TemplateManager } from "../src/templates/TemplateManager";
import * as fs from "fs/promises";

jest.mock("fs/promises", () => {
    const actual = jest.requireActual("fs/promises");
    return {
        ...actual,
        readdir: jest.fn().mockImplementation(actual.readdir),
        stat: jest.fn().mockImplementation(actual.stat),
    };
});

describe("TemplateManager", () => {
    let manager: TemplateManager;

    beforeEach(() => {
        manager = new TemplateManager();
        jest.clearAllMocks();
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

    it("should prevent directory traversal attacks", async () => {
        await expect(manager.getTemplatePath("../../etc/passwd")).rejects.toThrow(
            "Template '../../etc/passwd' does not exist."
        );

        await expect(manager.getTemplatePath("../src")).rejects.toThrow(
            "Template '../src' does not exist."
        );
    });

    it("should throw an error when reading templates directory fails", async () => {
        const mockError = new Error("Simulated permission denied");
        (fs.readdir as jest.Mock).mockRejectedValueOnce(mockError);

        await expect(manager.listTemplates()).rejects.toThrow(
            `Failed to read templates directory: ${mockError}`
        );
    });
});
