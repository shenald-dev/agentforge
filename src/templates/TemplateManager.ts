import * as fs from "fs/promises";
import * as path from "path";

export interface TemplateMetadata {
  name: string;
  displayName: string;
  description: string;
  category: string;
  stack: string[];
  ports: { frontend: number; backend: number };
  icon: string;
}

export const KNOWN_TEMPLATES: Record<string, TemplateMetadata> = {
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
export class TemplateManager {
  private templatesDir: string;

  constructor(customTemplatesDir?: string) {
    this.templatesDir = customTemplatesDir || path.resolve(__dirname, "../../templates");
  }

  /**
   * Returns list of template directory names.
   */
  async listTemplates(): Promise<string[]> {
    try {
      const dirents = await fs.readdir(this.templatesDir, {
        withFileTypes: true,
      });
      return dirents.reduce((acc, dirent) => {
        if (dirent.isDirectory()) acc.push(dirent.name);
        return acc;
      }, [] as string[]);
    } catch (err: unknown) {
      throw new Error(
        `Failed to read templates directory: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  /**
   * Returns detailed metadata for all available templates.
   */
  async listTemplatesWithMetadata(): Promise<TemplateMetadata[]> {
    const names = await this.listTemplates();
    return names.map((name) => this.getMetadataForTemplate(name));
  }

  /**
   * Retrieves metadata for a specific template name.
   */
  async getTemplateMetadata(templateName: string): Promise<TemplateMetadata | null> {
    const templates = await this.listTemplates();
    if (!templates.includes(templateName)) {
      return null;
    }
    return this.getMetadataForTemplate(templateName);
  }

  private getMetadataForTemplate(name: string): TemplateMetadata {
    if (KNOWN_TEMPLATES[name]) {
      return KNOWN_TEMPLATES[name];
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
  async getTemplatePath(templateName: string): Promise<string> {
    if (!templateName || !templateName.trim()) {
      throw new Error(`Template '${templateName}' does not exist.`);
    }

    const templatePath = path.resolve(this.templatesDir, templateName);

    // Prevent path traversal
    const relativePath = path.relative(this.templatesDir, templatePath);
    if (
      relativePath === ".." ||
      relativePath.startsWith(".." + path.sep) ||
      path.isAbsolute(relativePath)
    ) {
      throw new Error(
        `Security Exception: Path traversal attempt blocked for template '${templateName}'`,
      );
    }

    if (relativePath === "" || relativePath === ".") {
      throw new Error(`Template '${templateName}' does not exist.`);
    }

    try {
      const stats = await fs.stat(templatePath);
      if (!stats.isDirectory()) throw new Error();
      return templatePath;
    } catch (err: unknown) {
      throw new Error(`Template '${templateName}' does not exist.`);
    }
  }
}
