import * as fs from "fs/promises";
import * as path from "path";

/**
 * Validates and retrieves the absolute path of a requested template.
 */
export class TemplateManager {
    private templatesDir: string;

    constructor() {
        this.templatesDir = path.resolve(__dirname, "../../templates");
    }

    async listTemplates(): Promise<string[]> {
        try {
            const dirents = await fs.readdir(this.templatesDir, { withFileTypes: true });
            return dirents.filter(dirent => dirent.isDirectory()).map(dirent => dirent.name);
        } catch (err) {
            throw new Error(`Failed to read templates directory: ${err}`);
        }
    }

    async getTemplatePath(templateName: string): Promise<string> {
        const templatePath = path.join(this.templatesDir, templateName);
        try {
            const stats = await fs.stat(templatePath);
            if (!stats.isDirectory()) throw new Error();
            return templatePath;
        } catch {
            throw new Error(`Template '${templateName}' does not exist.`);
        }
    }
}
