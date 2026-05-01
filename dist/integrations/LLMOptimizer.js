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
exports.LLMOptimizer = void 0;
const config_1 = require("../utils/config");
const picocolors_1 = __importDefault(require("picocolors"));
const p = __importStar(require("@clack/prompts"));
class LLMOptimizer {
    model = null;
    configManager;
    constructor() {
        this.configManager = new config_1.ConfigManager();
    }
    async init() {
        const openRouterKey = await this.configManager.getApiKey();
        const openRouterBaseUrl = await this.configManager.getBaseUrl();
        if (openRouterKey) {
            const { ChatOpenAI } = await Promise.resolve().then(() => __importStar(require("@langchain/openai")));
            this.model = new ChatOpenAI({
                modelName: "arcee-ai/trinity-large-preview:free",
                temperature: 0.7,
                openAIApiKey: openRouterKey,
                configuration: {
                    baseURL: openRouterBaseUrl || "https://openrouter.ai/api/v1",
                }
            });
        }
    }
    /**
     * Executes an API call with exponential backoff and retries.
     */
    async withRetries(operation, maxRetries = 3) {
        let attempt = 0;
        while (attempt < maxRetries) {
            try {
                return await operation();
            }
            catch (error) {
                attempt++;
                p.log.warn(picocolors_1.default.yellow(`[LLM] API call failed. Attempt ${attempt}/${maxRetries}. Retrying...`));
                if (attempt === maxRetries) {
                    throw error;
                }
                // Exponential backoff: 1s, 2s, 4s
                const delayMs = Math.pow(2, attempt - 1) * 1000;
                await new Promise(resolve => setTimeout(resolve, delayMs));
            }
        }
        throw new Error("Max retries exceeded.");
    }
    /**
     * Enhances a generated application's README using the user's idea string.
     */
    async enhanceReadme(idea, currentReadme, showSpinner = true) {
        await this.init();
        if (!this.model) {
            if (showSpinner)
                p.log.warn(picocolors_1.default.gray(`[LLM] API key not found. Skipping README refinement.`));
            return currentReadme;
        }
        const spinner = p.spinner();
        if (showSpinner)
            spinner.start("Refining project documentation via LLM...");
        try {
            const { PromptTemplate } = await Promise.resolve().then(() => __importStar(require("@langchain/core/prompts")));
            const prompt = PromptTemplate.fromTemplate(`
You are a Senior Vibe Coder. I have scaffolded a new web application based on the following idea:
"{idea}"

Here is the current base README for the project:
{currentReadme}

Please enhance this README to be more engaging, professional, and descriptive based on the idea.
Maintain the existing setup instructions but improve the introduction, features, and vibe.
Return ONLY the raw markdown content. No conversational text.
          `);
            const chain = prompt.pipe(this.model);
            // Execute with retries
            const response = await this.withRetries(async () => {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 60000);
                try {
                    return await chain.invoke({
                        idea: idea,
                        currentReadme: currentReadme
                    }, { signal: controller.signal });
                }
                finally {
                    clearTimeout(timeoutId);
                }
            });
            if (showSpinner)
                spinner.stop(picocolors_1.default.green("✨ README enhanced via LLM!"));
            return String(response.content);
        }
        catch (err) {
            if (showSpinner)
                spinner.stop(picocolors_1.default.yellow(`LLM enhancement failed: ${err instanceof Error ? err.message : String(err)}. Falling back to default.`));
            return currentReadme;
        }
    }
}
exports.LLMOptimizer = LLMOptimizer;
