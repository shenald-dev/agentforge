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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProjectGenerator = void 0;
const fs = __importStar(require("fs/promises"));
const path = __importStar(require("path"));
const handlebars_1 = __importDefault(require("handlebars"));
class ProjectGenerator {
    /**
     * Generates a new project from a template, replacing handlebar tokens concurrently.
     */
    async generate(options) {
        const { templatePath, outputPath } = options;
        // 1. Create target output directory
        await fs.mkdir(outputPath, { recursive: true });
        // 2. Recursively copy and parse concurrently
        await this.copyAndParseDir(templatePath, outputPath, outputPath, options);
    }
    async copyAndParseDir(sourceDir, destDir, baseOutputDir, context) {
        // Strict path traversal prevention
        const normalizedDestDir = path.resolve(destDir);
        const normalizedBase = path.resolve(baseOutputDir);
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
                return this.copyAndParseDir(srcPath, destPath, baseOutputDir, context);
            }
            else if (entry.isFile()) {
                if (entry.name.endsWith(".hbs")) {
                    // Read, compile Handlebars, and write
                    const content = await fs.readFile(srcPath, "utf-8");
                    const template = handlebars_1.default.compile(content);
                    const rendered = template(context);
                    return fs.writeFile(destPath, rendered, "utf-8");
                }
                else {
                    // Standard copy (images, lockfiles, etc)
                    return fs.copyFile(srcPath, destPath);
                }
            }
        });
        // Await all file operations concurrently
        await Promise.all(operations);
    }
}
exports.ProjectGenerator = ProjectGenerator;
