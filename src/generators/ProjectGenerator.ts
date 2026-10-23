import * as fs from "fs/promises";
import * as path from "path";

export interface GenerateOptions {
    projectName: string;
    idea: string;
    templatePath: string;
    outputPath: string;
}

import type * as Handlebars from "handlebars";

export class ProjectGenerator {
    private handlebarsModulePromise: Promise<typeof Handlebars> | null = null;

    /**
     * Sanitizes input strings to prevent code injection when rendering templates with noEscape: true.
     */
    private sanitize(input: string): string {
        if (!input) return input;
        return input
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#x27;")
            .replace(/\//g, "&#x2F;");
    }

    /**
     * Generates a new project from a template, replacing handlebar tokens concurrently.
     */
    async generate(options: GenerateOptions): Promise<void> {
        const { templatePath, outputPath } = options;

        // Sanitize context variables to prevent template injection vulnerabilities
        const sanitizedContext: GenerateOptions = {
            ...options,
            projectName: this.sanitize(options.projectName),
            idea: this.sanitize(options.idea),
        };

        // 1. Create target output directory
        await fs.mkdir(outputPath, { recursive: true });

        const normalizedBase = path.resolve(outputPath);

        // 2. Recursively copy and parse concurrently
        await this.copyAndParseDir(templatePath, normalizedBase, normalizedBase, sanitizedContext);
    }

    private async copyAndParseDir(sourceDir: string, normalizedDestDir: string, normalizedBase: string, context: GenerateOptions): Promise<void> {
        const entries = await fs.readdir(sourceDir, { withFileTypes: true });

        // Optimization: Process all file and directory entries concurrently
        // instead of sequentially to significantly reduce I/O wait times.
        const operations = entries.map(async (entry) => {
            const srcPath = path.join(sourceDir, entry.name);
            const destName = entry.name.endsWith(".hbs") ? entry.name.slice(0, -4) : entry.name;
            const normalizedDestPath = path.join(normalizedDestDir, destName);

            // Double check file-level traversal
            const relativePath = path.relative(normalizedBase, normalizedDestPath);
            if (relativePath === ".." || relativePath.startsWith(".." + path.sep) || path.isAbsolute(relativePath)) {
                throw new Error(`Security Exception: Path traversal attempt blocked for file ${entry.name}`);
            }

            if (entry.isDirectory()) {
                // Create target directory and recurse
                await fs.mkdir(normalizedDestPath, { recursive: true });
                return this.copyAndParseDir(srcPath, normalizedDestPath, normalizedBase, context);
            } else if (entry.isFile()) {
                if (entry.name.endsWith(".hbs")) {
                    if (!this.handlebarsModulePromise) {
                        this.handlebarsModulePromise = import("handlebars").then(
                            (h: any) => (h.default || h) as typeof Handlebars
                        );
                    }
                    const hbs = await this.handlebarsModulePromise;
                    // Read, compile Handlebars, and write
                    const content = await fs.readFile(srcPath, "utf-8");
                    const template = hbs.compile(content, { noEscape: true });
                    const rendered = template(context);
                    return fs.writeFile(normalizedDestPath, rendered, "utf-8");
                } else {
                    // Standard copy (images, lockfiles, etc)
                    return fs.copyFile(srcPath, normalizedDestPath);
                }
            }
        });

        // Await all file operations concurrently
        await Promise.all(operations);
    }
}
