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
exports.ArchitecturePlanner = void 0;
const fs = __importStar(require("fs/promises"));
const path = __importStar(require("path"));
const openai_1 = require("@langchain/openai");
const prompts_1 = require("@langchain/core/prompts");
const config_1 = require("../utils/config");
/**
 * Autonomous Full-Stack Architecture Planner.
 * Generates comprehensive ARCHITECTURE.md specifications for generated applications.
 */
class ArchitecturePlanner {
    configManager;
    constructor() {
        this.configManager = new config_1.ConfigManager();
    }
    /**
     * Synthesizes and writes an ARCHITECTURE.md file for the scaffolded application.
     */
    async generateArchitecturePlan(options) {
        const defaultPlan = this.synthesizeLocalPlan(options);
        let finalPlan = defaultPlan;
        if (options.enableLLM !== false) {
            try {
                finalPlan = await this.enrichWithLLM(options, defaultPlan);
            }
            catch {
                finalPlan = defaultPlan;
            }
        }
        const targetPath = path.join(options.outputPath, "ARCHITECTURE.md");
        await fs.writeFile(targetPath, finalPlan, "utf-8");
        return finalPlan;
    }
    /**
     * Generates a deterministic, production-grade architectural specification.
     */
    synthesizeLocalPlan(options) {
        const { projectName, idea, template } = options;
        const isPython = template === "saas";
        const isRealtime = template === "realtime";
        const backendTech = isPython
            ? "FastAPI (Python 3.11, Pydantic v2, Uvicorn)"
            : isRealtime
                ? "Node.js (Express, Socket.io, TypeScript)"
                : "Express (Node.js, TypeScript)";
        const backendPort = 8000;
        const frontendPort = 3000;
        return `# ${projectName} — System Architecture & Specification

> **Mission:** ${idea}
> **Template Architecture:** \`${template}\`
> **Specification Version:** 1.0.0

---

## 1. High-Level Architectural Topology

\`${projectName}\` is architected as a decoupled, containerized multi-tier application:

\`\`\`mermaid
flowchart TD
    Client["User Browser / Client"] -->|HTTP/HTTPS Port ${frontendPort}| Frontend["Next.js 14 App Router (React, Tailwind CSS)"]
    Client -->|API Requests Port ${backendPort}| Backend["${backendTech}"]
    ${isRealtime ? 'Client <-->|WebSocket wss://| Backend' : ''}
    Frontend -.->|Server-Side Fetch| Backend
    Backend -->|Data Layer| DB[("Containerized Storage / DB")]
\`\`\`

---

## 2. Core Service Contracts

### 2.1 Frontend Tier (\`frontend/\`)
- **Framework:** Next.js 14 (App Router, React 18, Strict TypeScript)
- **Styling & Design System:** Tailwind CSS with responsive layout tokens and dark/light system adaptation.
- **State Management & Data Fetching:** React Server Components (RSC) for initial page loads + React Client Hooks for interactive controls.
- **Port:** \`http://localhost:${frontendPort}\`

### 2.2 Backend API Tier (\`${isPython ? "backend" : template === "landing-api" ? "api" : "backend"}/\`)
- **Runtime:** ${backendTech}
- **Port:** \`http://localhost:${backendPort}\`
- **CORS Policy:** Restricted to frontend origin (\`http://localhost:${frontendPort}\` in dev, production domain in deploy).

#### Standard Health & Telemetry Endpoints
- \`GET /\`: Service identification & welcome payload.
- \`GET /api/health\`: Automated container liveness/readiness probe (\`{"status": "healthy"}\`).

${isRealtime
            ? `#### WebSocket Channels
- \`connection\`: Client initiates real-time handshake.
- \`message\`: Broadcast payload channel for instant bidirectional sync.
- \`disconnect\`: Graceful teardown of client session.
`
            : `#### REST Endpoints
- \`GET /api/v1/items\`: Paginated list of resources.
- \`POST /api/v1/items\`: Resource creation with input validation.
- \`GET /api/v1/items/:id\`: Resource detail lookup.
`}

---

## 3. Containerization & Orchestration

The application ships with unified **Docker Compose** configurations (\`docker-compose.yml\`):
- **Frontend Service:** Multi-stage Node.js build with standalone output.
- **Backend Service:** Multi-stage optimized container with non-root user execution.
- **Bridge Network:** Isolated Docker network allowing internal DNS resolution (\`http://backend:${backendPort}\`).

---

## 4. Security & Compliance Posture

1. **Input Sanitization:** All request payloads are strictly validated using ${isPython ? "Pydantic models" : "Zod/TypeScript interfaces"}.
2. **Environment Variable Isolation:** Production secrets are injected at runtime via environment variables; zero hardcoded secrets.
3. **Container Security:** Runs on slim Linux base images with non-essential tools stripped.

---

## 5. Deployment & Production Roadmap

- **Vercel Frontend:** Zero-config deploy via the pre-configured \`vercel.json\`.
- **Cloud Containers:** Backend deployable to AWS ECS, Google Cloud Run, Railway, or Fly.io.
- **CI/CD:** Pre-configured GitHub Actions workflow runs linting and test verification on every push.

---
*Generated by AgentForge Autonomous Full-Stack App Builder.*
`;
    }
    /**
     * Optionally enriches the specification via OpenRouter if configured.
     */
    async enrichWithLLM(options, basePlan) {
        const key = await this.configManager.getApiKey();
        if (!key || !key.trim()) {
            return basePlan;
        }
        const baseUrl = await this.configManager.getBaseUrl();
        const model = new openai_1.ChatOpenAI({
            modelName: "arcee-ai/trinity-large-preview:free",
            temperature: 0.5,
            openAIApiKey: key.trim(),
            configuration: {
                baseURL: baseUrl?.trim() || "https://openrouter.ai/api/v1",
            },
        });
        const prompt = prompts_1.ChatPromptTemplate.fromMessages([
            [
                "system",
                `You are a Principal Software Architect. Enhance this system architecture specification to deeply tailor it to the user's project idea.
Add domain-specific data models, detailed API endpoints, and architectural considerations relevant to the idea.
Keep the existing markdown structure, Mermaid diagram, and deployment instructions intact.
Return ONLY raw markdown. No conversational commentary.`,
            ],
            [
                "user",
                `Project Name: {projectName}
Template: {template}
Project Idea: {idea}

Base Architecture Plan:
{basePlan}`,
            ],
        ]);
        const chain = prompt.pipe(model);
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 45000);
        try {
            const response = await chain.invoke({
                projectName: options.projectName,
                template: options.template,
                idea: options.idea,
                basePlan: basePlan,
            }, { signal: controller.signal });
            const content = response.content;
            if (typeof content === "string" && content.includes("# ")) {
                return content;
            }
            return basePlan;
        }
        finally {
            clearTimeout(timeoutId);
        }
    }
}
exports.ArchitecturePlanner = ArchitecturePlanner;
