import { ProjectGenerator } from "../src/generators/ProjectGenerator";
import * as fs from "fs/promises";
import * as path from "path";
import * as os from "os";

describe("ProjectGenerator", () => {
    let generator: ProjectGenerator;
    let tempDir: string;

    beforeEach(async () => {
        generator = new ProjectGenerator();
        tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "agentforge-test-"));
    });

    afterEach(async () => {
        await fs.rm(tempDir, { recursive: true, force: true });
    });

    it("should create the output directory", async () => {
        const outputPath = path.join(tempDir, "test-project");
        const templatePath = path.resolve(__dirname, "../templates/saas");

        await generator.generate({
            projectName: "test-project",
            idea: "A test application",
            templatePath,
            outputPath,
        });

        const stats = await fs.stat(outputPath);
        expect(stats.isDirectory()).toBe(true);
    });

    it("should strip .hbs extensions from generated files", async () => {
        const outputPath = path.join(tempDir, "test-project");
        const templatePath = path.resolve(__dirname, "../templates/saas");

        await generator.generate({
            projectName: "test-project",
            idea: "Test idea",
            templatePath,
            outputPath,
        });

        // The template has README.md.hbs, so the output should have README.md
        const readmePath = path.join(outputPath, "README.md");
        const readmeExists = await fs.stat(readmePath).then(() => true).catch(() => false);
        expect(readmeExists).toBe(true);
    });

    it("should replace Handlebars tokens in generated files", async () => {
        const outputPath = path.join(tempDir, "test-project");
        const templatePath = path.resolve(__dirname, "../templates/saas");

        await generator.generate({
            projectName: "my-cool-app",
            idea: "A cool dashboard",
            templatePath,
            outputPath,
        });

        const readmeContent = await fs.readFile(path.join(outputPath, "README.md"), "utf-8");
        expect(readmeContent).toContain("my-cool-app");
    });

    it("should recursively create subdirectories", async () => {
        const outputPath = path.join(tempDir, "test-project");
        const templatePath = path.resolve(__dirname, "../templates/saas");

        await generator.generate({
            projectName: "test-project",
            idea: "Test",
            templatePath,
            outputPath,
        });

        const frontendDir = path.join(outputPath, "frontend");
        const frontendExists = await fs.stat(frontendDir).then(() => true).catch(() => false);
        expect(frontendExists).toBe(true);
    });

    it("should cache the handlebars module across multiple invocations", async () => {
        const outputPath1 = path.join(tempDir, "test-project-1");
        const outputPath2 = path.join(tempDir, "test-project-2");
        const templatePath = path.resolve(__dirname, "../templates/saas");

        await generator.generate({
            projectName: "test-project-1",
            idea: "First idea",
            templatePath,
            outputPath: outputPath1,
        });

        const cachedModule1 = (generator as any).handlebarsModule;
        expect(cachedModule1).toBeDefined();
        expect(cachedModule1).not.toBeNull();

        await generator.generate({
            projectName: "test-project-2",
            idea: "Second idea",
            templatePath,
            outputPath: outputPath2,
        });

        const cachedModule2 = (generator as any).handlebarsModule;
        expect(cachedModule2).toBe(cachedModule1);
    });
});
