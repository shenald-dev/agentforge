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
exports.TemplateManager = void 0;
const fs = __importStar(require("fs/promises"));
const path = __importStar(require("path"));
/**
 * Validates and retrieves the absolute path of a requested template.
 */
class TemplateManager {
    templatesDir;
    constructor() {
        this.templatesDir = path.resolve(__dirname, "../../templates");
    }
    async listTemplates() {
        try {
            const dirents = await fs.readdir(this.templatesDir, { withFileTypes: true });
            return dirents.filter(dirent => dirent.isDirectory()).map(dirent => dirent.name);
        }
        catch (err) {
            throw new Error(`Failed to read templates directory: ${err instanceof Error ? err.message : String(err)}`);
        }
    }
    async getTemplatePath(templateName) {
        const templatePath = path.resolve(this.templatesDir, templateName);
        // Prevent path traversal
        const relativePath = path.relative(this.templatesDir, templatePath);
        if (relativePath === ".." || relativePath.startsWith(".." + path.sep) || path.isAbsolute(relativePath)) {
            throw new Error(`Security Exception: Path traversal attempt blocked for template '${templateName}'`);
        }
        try {
            const stats = await fs.stat(templatePath);
            if (!stats.isDirectory())
                throw new Error();
            return templatePath;
        }
        catch (err) {
            throw new Error(`Template '${templateName}' does not exist.`);
        }
    }
}
exports.TemplateManager = TemplateManager;