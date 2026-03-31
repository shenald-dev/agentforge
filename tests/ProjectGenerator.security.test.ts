import { ProjectGenerator } from "../src/generators/ProjectGenerator";
import * as fs from "fs/promises";
import * as path from "path";

jest.mock("fs/promises");

describe("ProjectGenerator Security", () => {
    let generator: ProjectGenerator;
    const baseOutputDir = path.resolve("/tmp/project");

    beforeEach(() => {
        generator = new ProjectGenerator();
        jest.clearAllMocks();
    });

    it("should throw Security Exception if a file entry attempts to escape the base directory", async () => {
        const maliciousEntry = {
            name: "../../../etc/passwd",
            isDirectory: () => false,
            isFile: () => true,
        };

        (fs.readdir as jest.Mock).mockResolvedValue([maliciousEntry]);
        (fs.mkdir as jest.Mock).mockResolvedValue(undefined);

        await expect(generator.generate({
            projectName: "test",
            idea: "test",
            templatePath: "/templates/saas",
            outputPath: baseOutputDir,
        })).rejects.toThrow(/Security Exception: Path traversal attempt blocked/);
    });

    it("should throw Security Exception if a directory entry attempts to escape the base directory", async () => {
        const maliciousDirEntry = {
            name: "../evil-dir",
            isDirectory: () => true,
            isFile: () => false,
        };

        (fs.readdir as jest.Mock).mockResolvedValue([maliciousDirEntry]);
        (fs.mkdir as jest.Mock).mockResolvedValue(undefined);

        await expect(generator.generate({
            projectName: "test",
            idea: "test",
            templatePath: "/templates/saas",
            outputPath: baseOutputDir,
        })).rejects.toThrow(/Security Exception: Path traversal attempt blocked/);
    });

    it("should throw Security Exception if a file entry attempts a partial path traversal", async () => {
        // e.g., if base is /tmp/project, and entry is ../project-extra/file.txt
        // normalized path would be /tmp/project-extra/file.txt
        // which starts with /tmp/project but IS NOT inside it.
        const base = path.resolve("/tmp/project");
        const maliciousEntry = {
            name: "../project-extra/file.txt",
            isDirectory: () => false,
            isFile: () => true,
        };

        (fs.readdir as jest.Mock).mockResolvedValue([maliciousEntry]);
        (fs.mkdir as jest.Mock).mockResolvedValue(undefined);

        await expect(generator.generate({
            projectName: "test",
            idea: "test",
            templatePath: "/templates/saas",
            outputPath: base,
        })).rejects.toThrow(/Security Exception: Path traversal attempt blocked/);
    });

    it("should allow files starting with .. but not escaping directory", async () => {
        const maliciousEntry = {
            name: "..env",
            isDirectory: () => false,
            isFile: () => true,
        };

        (fs.readdir as jest.Mock).mockResolvedValue([maliciousEntry]);
        (fs.mkdir as jest.Mock).mockResolvedValue(undefined);
        (fs.copyFile as jest.Mock).mockResolvedValue(undefined);

        await expect(generator.generate({
            projectName: "test",
            idea: "test",
            templatePath: "/templates/saas",
            outputPath: baseOutputDir,
        })).resolves.not.toThrow();
    });
});
