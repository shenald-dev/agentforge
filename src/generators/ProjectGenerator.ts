import * as fs from "fs/promises";
import * as path from "path";
import Handlebars from "handlebars";

export interface GenerateOptions {
    projectName: string;
    idea: string;
    templatePath: string;
    outputPath: string;
}

export class ProjectGenerator {

    /**
     * Generates a new project from a template, replacing handlebar tokens.
     */
    async generate(options: GenerateOptions): Promise<void> {
        const { templatePath, outputPath } = options;

        // 1. Create target output directory
        await fs.mkdir(outputPath, { recursive: true });

        // 2. Recursively copy and parse
        await this.copyAndParseDir(templatePath, outputPath, options);
    }

    private async copyAndParseDir(sourceDir: string, destDir: string, context: GenerateOptions): Promise<void> {
        const entries = await fs.readdir(sourceDir, { withFileTypes: true });

        // Optimization: Process all file and directory entries concurrently
        // instead of sequentially to significantly reduce I/O wait times.
        await Promise.all(entries.map(async (entry) => {
            const srcPath = path.join(sourceDir, entry.name);
            // Remove trailing .hbs if present during copy
            const destName = entry.name.endsWith(".hbs") ? entry.name.slice(0, -4) : entry.name;
            const destPath = path.join(destDir, destName);

            if (entry.isDirectory()) {
                // Create target directory and recurse
                await fs.mkdir(destPath, { recursive: true });
                await this.copyAndParseDir(srcPath, destPath, context);
            } else if (entry.isFile()) {
                if (entry.name.endsWith(".hbs")) {
                    // Read, compile Handlebars, and write
                    const content = await fs.readFile(srcPath, "utf-8");
                    const template = Handlebars.compile(content);
                    const rendered = template(context);
                    await fs.writeFile(destPath, rendered, "utf-8");
                } else {
                    // Standard copy (images, lockfiles, etc)
                    await fs.copyFile(srcPath, destPath);
                }
            }
        }));
    }
}
