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
     * Generates a new project from a template, replacing handlebar tokens concurrently.
     */
    async generate(options: GenerateOptions): Promise<void> {
        const { templatePath, outputPath } = options;

        // 1. Create target output directory
        await fs.mkdir(outputPath, { recursive: true });

        const normalizedBase = path.resolve(outputPath);

        // 2. Recursively copy and parse concurrently
        await this.copyAndParseDir(templatePath, outputPath, normalizedBase, options);
    }

    private async copyAndParseDir(sourceDir: string, destDir: string, normalizedBase: string, context: GenerateOptions): Promise<void> {
        // Strict path traversal prevention
        const normalizedDestDir = path.resolve(destDir);
        
        const relativeDest = path.relative(normalizedBase, normalizedDestDir);
        if (relativeDest === ".." || relativeDest.startsWith(".." + path.sep) || path.isAbsolute(relativeDest)) {
            throw new Error(`Security Exception: Path traversal attempt blocked. Target path ${normalizedDestDir} escapes the base directory ${normalizedBase}`);
        }

        const entries = await fs.readdir(sourceDir, { withFileTypes: true });

        // Optimization: Process all file and directory entries concurrently
        // instead of sequentially to significantly reduce I/O wait times.
        const operations = entries.map(async (entry) => {
            const srcPath = path.join(sourceDir, entry.name);
            const destName = entry.name.endsWith(".hbs") ? entry.name.slice(0, -4) : entry.name;
            const destPath = path.join(destDir, destName);

            // Double check file-level traversal
            const normalizedDestPath = path.resolve(destPath);
            const relativePath = path.relative(normalizedBase, normalizedDestPath);
            if (relativePath === ".." || relativePath.startsWith(".." + path.sep) || path.isAbsolute(relativePath)) {
                throw new Error(`Security Exception: Path traversal attempt blocked for file ${entry.name}`);
            }

            if (entry.isDirectory()) {
                // Create target directory and recurse
                await fs.mkdir(destPath, { recursive: true });
                return this.copyAndParseDir(srcPath, destPath, normalizedBase, context);
            } else if (entry.isFile()) {
                if (entry.name.endsWith(".hbs")) {
                    // Read, compile Handlebars, and write
                    const content = await fs.readFile(srcPath, "utf-8");
                    const template = Handlebars.compile(content, { noEscape: true });
                    const rendered = template(context);
                    return fs.writeFile(destPath, rendered, "utf-8");
                } else {
                    // Standard copy (images, lockfiles, etc)
                    return fs.copyFile(srcPath, destPath);
                }
            }
        });

        // Await all file operations concurrently
        await Promise.all(operations);
    }
}
