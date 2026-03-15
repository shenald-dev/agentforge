import * as fs from "fs/promises";
import { TemplateManager } from "../src/templates/TemplateManager";

jest.mock("fs/promises");

describe("TemplateManager", () => {
    let manager: TemplateManager;

    beforeEach(() => {
        manager = new TemplateManager();
        jest.clearAllMocks();
    });

    it("should list available templates", async () => {
        (fs.readdir as jest.Mock).mockResolvedValue([
            { name: "saas", isDirectory: () => true },
            { name: "landing-api", isDirectory: () => true },
            { name: "realtime", isDirectory: () => true },
            { name: "file.txt", isDirectory: () => false },
        ]);

        const templates = await manager.listTemplates();
        expect(templates).toContain("saas");
        expect(templates).toContain("landing-api");
        expect(templates).toContain("realtime");
        expect(templates).not.toContain("file.txt");
    });

    it("should return at least 3 templates", async () => {
        (fs.readdir as jest.Mock).mockResolvedValue([
            { name: "t1", isDirectory: () => true },
            { name: "t2", isDirectory: () => true },
            { name: "t3", isDirectory: () => true },
        ]);
        const templates = await manager.listTemplates();
        expect(templates.length).toBeGreaterThanOrEqual(3);
    });

    it("should resolve a valid template path", async () => {
        (fs.stat as jest.Mock).mockResolvedValue({ isDirectory: () => true });
        const templatePath = await manager.getTemplatePath("saas");
        expect(templatePath).toContain("saas");
    });

    it("should throw for an invalid template name", async () => {
        (fs.stat as jest.Mock).mockRejectedValue(new Error("Not found"));
        await expect(manager.getTemplatePath("nonexistent-template")).rejects.toThrow(
            "Template 'nonexistent-template' does not exist."
        );
    });

    it("should throw an error if listTemplates fails", async () => {
        (fs.readdir as jest.Mock).mockRejectedValue(new Error("Disk error"));
        await expect(manager.listTemplates()).rejects.toThrow(
            "Failed to read templates directory: Error: Disk error"
        );
    });
});
