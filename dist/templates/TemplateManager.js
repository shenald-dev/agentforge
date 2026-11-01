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
exports.TemplateManager = exports.KNOWN_TEMPLATES = void 0;
const fs = __importStar(require("fs/promises"));
const path = __importStar(require("path"));
exports.KNOWN_TEMPLATES = {
    saas: {
        name: "saas",
        displayName: "Full-Stack SaaS Platform",
        description: "Next.js 14 TypeScript frontend, FastAPI Python backend, and containerized Docker setup.",
        category: "Enterprise SaaS",
        stack: ["Next.js 14", "FastAPI", "Python 3.11", "Tailwind CSS", "Docker Compose"],
        ports: { frontend: 3000, backend: 8000 },
        icon: "🏢",
    },
    "landing-api": {
        name: "landing-api",
        displayName: "Landing Page + Node.js API",
        description: "High-performance Next.js 14 landing page paired with an Express/TypeScript REST service.",
        category: "Web & API",
        stack: ["Next.js 14", "Express", "TypeScript", "Tailwind CSS", "Docker Compose"],
        ports: { frontend: 3000, backend: 8000 },
        icon: "🚀",
    },
    realtime: {
        name: "realtime",
        displayName: "Real-Time Collaborative App",
        description: "Next.js 14 frontend with Socket.io real-time WebSocket backend for live updates.",
        category: "Real-Time & Sync",
        stack: ["Next.js 14", "Socket.io", "TypeScript", "Node.js", "Tailwind CSS", "Docker Compose"],
        ports: { frontend: 3000, backend: 8000 },
        icon: "💬",
    },
};
/**
 * Validates, retrieves, and provides metadata for scaffold templates.
 */
class TemplateManager {
    templatesDir;
    constructor(customTemplatesDir) {
        this.templatesDir = customTemplatesDir || path.resolve(__dirname, "../../templates");
    }
    /**
     * Returns list of template directory names.
     */
    async listTemplates() {
        try {
            const dirents = await fs.readdir(this.templatesDir, {
                withFileTypes: true,
            });
            return dirents.reduce((acc, dirent) => {
                if (dirent.isDirectory())
                    acc.push(dirent.name);
                return acc;
            }, []);
        }
        catch (err) {
            throw new Error(`Failed to read templates directory: ${err instanceof Error ? err.message : String(err)}`);
        }
    }
    /**
     * Returns detailed metadata for all available templates.
     */
    async listTemplatesWithMetadata() {
        const names = await this.listTemplates();
        return names.map((name) => this.getMetadataForTemplate(name));
    }
    /**
     * Retrieves metadata for a specific template name.
     */
    async getTemplateMetadata(templateName) {
        const templates = await this.listTemplates();
        if (!templates.includes(templateName)) {
            return null;
        }
        return this.getMetadataForTemplate(templateName);
    }
    getMetadataForTemplate(name) {
        if (exports.KNOWN_TEMPLATES[name]) {
            return exports.KNOWN_TEMPLATES[name];
        }
        return {
            name,
            displayName: name.charAt(0).toUpperCase() + name.slice(1),
            description: `Custom ${name} application template.`,
            category: "Custom",
            stack: ["Next.js", "Docker Compose"],
            ports: { frontend: 3000, backend: 8000 },
            icon: "📦",
        };
    }
    /**
     * Resolves and validates the absolute path of a requested template.
     */
    async getTemplatePath(templateName) {
        if (!templateName || !templateName.trim()) {
            throw new Error(`Template '${templateName}' does not exist.`);
        }
        const templatePath = path.resolve(this.templatesDir, templateName);
        // Prevent path traversal
        const relativePath = path.relative(this.templatesDir, templatePath);
        if (relativePath === ".." ||
            relativePath.startsWith(".." + path.sep) ||
            path.isAbsolute(relativePath)) {
            throw new Error(`Security Exception: Path traversal attempt blocked for template '${templateName}'`);
        }
        if (relativePath === "" || relativePath === ".") {
            throw new Error(`Template '${templateName}' does not exist.`);
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
