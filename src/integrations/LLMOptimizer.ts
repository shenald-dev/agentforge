import type { ChatOpenAI } from "@langchain/openai";
import { ConfigManager } from "../utils/config";
import pc from "picocolors";
import * as p from "@clack/prompts";

export class LLMOptimizer {
    private model: ChatOpenAI | null = null;
    private configManager: ConfigManager;

    constructor() {
        this.configManager = new ConfigManager();
    }

    async init() {
        const openRouterKey = await this.configManager.getApiKey();
        const openRouterBaseUrl = await this.configManager.getBaseUrl();

        if (openRouterKey) {
            const { ChatOpenAI } = await import("@langchain/openai");
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
    private async withRetries<T>(operation: () => Promise<T>, maxRetries = 3): Promise<T> {
        let attempt = 0;
        while (attempt < maxRetries) {
            try {
                return await operation();
            } catch (error: unknown) {
                attempt++;
                p.log.warn(pc.yellow(`[LLM] API call failed. Attempt ${attempt}/${maxRetries}. Retrying...`));
                
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
    async enhanceReadme(idea: string, currentReadme: string): Promise<string> {
        await this.init();

        if (!this.model) {
            p.log.warn(pc.gray(`[LLM] API key not found. Skipping README refinement.`));
            return currentReadme;
        }

        const spinner = p.spinner();
        spinner.start("Refining project documentation via LLM...");

        try {
            const { PromptTemplate } = await import("@langchain/core/prompts");
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
                } finally {
                    clearTimeout(timeoutId);
                }
            });

            spinner.stop(pc.green("✨ README enhanced via LLM!"));
            return String(response.content);
        } catch (err: unknown) {
            spinner.stop(pc.yellow(`LLM enhancement failed: ${err instanceof Error ? err.message : String(err)}. Falling back to default.`));
            return currentReadme;
        }
    }
}
