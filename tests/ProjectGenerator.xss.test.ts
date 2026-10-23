import { ProjectGenerator } from "../src/generators/ProjectGenerator";
import * as fs from "fs/promises";
import * as path from "path";
import * as os from "os";

describe("ProjectGenerator XSS Prevention", () => {
    let generator: ProjectGenerator;
    let tempDir: string;

    beforeEach(async () => {
        generator = new ProjectGenerator();
        tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "agentforge-xss-test-"));
    });

    afterEach(async () => {
        await fs.rm(tempDir, { recursive: true, force: true });
    });

    it("should sanitize the idea context variable to prevent XSS", async () => {
        const outputPath = path.join(tempDir, "xss-project");
        // Create a dummy template dir
        const templatePath = path.join(tempDir, "dummy-template");
        await fs.mkdir(templatePath);
        await fs.writeFile(path.join(templatePath, "test.hbs"), "Idea: {{idea}}", "utf-8");

        await generator.generate({
            projectName: "test",
            idea: "<script>alert(1)</script>",
            templatePath,
            outputPath,
        });

        const outputContent = await fs.readFile(path.join(outputPath, "test"), "utf-8");
        expect(outputContent).not.toContain("<script>");
        expect(outputContent).toContain("&lt;script&gt;alert(1)&lt;&#x2F;script&gt;");
    });
});
