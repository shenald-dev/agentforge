"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProjectGenerator = void 0;
const fs = __importStar(require("fs/promises"));
const path = __importStar(require("path"));
class ProjectGenerator {
    handlebarsModulePromise = null;
    /**
     * Sanitizes input strings to prevent code injection when rendering templates with noEscape: true.
     */
    sanitize(input) {
        if (!input)
            return input;
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
    async generate(options) {
        const { templatePath, outputPath, dryRun = false } = options;
        // Sanitize context variables to prevent template injection vulnerabilities
        const sanitizedContext = {
            ...options,
            projectName: this.sanitize(options.projectName),
            idea: this.sanitize(options.idea),
        };
        const normalizedBase = path.resolve(outputPath);
        if (!dryRun) {
            await fs.mkdir(outputPath, { recursive: true });
        }
        const generatedFiles = [];
        // Recursively copy and parse concurrently
        await this.copyAndParseDir(templatePath, normalizedBase, normalizedBase, sanitizedContext, dryRun, generatedFiles);
        return {
            outputPath: normalizedBase,
            files: generatedFiles,
            totalFiles: generatedFiles.length,
            dryRun,
        };
    }
    async copyAndParseDir(sourceDir, normalizedDestDir, normalizedBase, context, dryRun, generatedFiles) {
        const entries = await fs.readdir(sourceDir, { withFileTypes: true });
        const operations = entries.map(async (entry) => {
            const srcPath = path.join(sourceDir, entry.name);
            const isHbs = entry.name.endsWith(".hbs") && entry.name.length > 4;
            const destName = isHbs ? entry.name.slice(0, -4) : entry.name;
            const normalizedDestPath = path.join(normalizedDestDir, destName);
            // Path traversal security verification
            const relativePath = path.relative(normalizedBase, normalizedDestPath);
            if (relativePath === ".." ||
                relativePath.startsWith(".." + path.sep) ||
                path.isAbsolute(relativePath)) {
                throw new Error(`Security Exception: Path traversal attempt blocked for file ${entry.name}`);
            }
            if (entry.isDirectory()) {
                if (!dryRun) {
                    await fs.mkdir(normalizedDestPath, { recursive: true });
                }
                return this.copyAndParseDir(srcPath, normalizedDestPath, normalizedBase, context, dryRun, generatedFiles);
            }
            else if (entry.isFile()) {
                if (isHbs) {
                    if (!this.handlebarsModulePromise) {
                        this.handlebarsModulePromise = Promise.resolve().then(() => __importStar(require("handlebars"))).then((h) => (h.default || h));
                    }
                    const hbs = await this.handlebarsModulePromise;
                    const content = await fs.readFile(srcPath, "utf-8");
                    const template = hbs.compile(content, { noEscape: true });
                    const rendered = template(context);
                    generatedFiles.push({
                        relativePath: relativePath.replace(/\\/g, "/"),
                        isTemplate: true,
                        size: Buffer.byteLength(rendered, "utf-8"),
                    });
                    if (!dryRun) {
                        await fs.writeFile(normalizedDestPath, rendered, "utf-8");
                    }
                }
                else {
                    let size;
                    try {
                        const stats = await fs.stat(srcPath);
                        size = stats?.size;
                    }
                    catch {
                        // Optional telemetry in mock or test environments
                    }
                    generatedFiles.push({
                        relativePath: relativePath.replace(/\\/g, "/"),
                        isTemplate: false,
                        size,
                    });
                    if (!dryRun) {
                        await fs.copyFile(srcPath, normalizedDestPath);
                    }
                }
            }
        });
        await Promise.all(operations);
    }
}
exports.ProjectGenerator = ProjectGenerator;
