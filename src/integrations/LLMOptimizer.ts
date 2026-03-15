import { ChatOpenAI } from "@langchain/openai";
import { PromptTemplate } from "@langchain/core/prompts";
import chalk from "chalk";
import ora from "ora";

export class LLMOptimizer {
    private model: ChatOpenAI | null = null;

    constructor() {
        const openRouterKey = process.env.OPENROUTER_API_KEY;

        if (openRouterKey) {
            this.model = new ChatOpenAI({
                modelName: "arcee-ai/trinity-large-preview:free",
                temperature: 0.7,
                openAIApiKey: openRouterKey,
                configuration: {
                    baseURL: "https://openrouter.ai/api/v1",
                }
            });
        }
    }

    /**
     * Enhances a generated application's README using the user's idea string.
     */
    async enhanceReadme(idea: string, currentReadme: string): Promise<string> {
        if (!this.model) {
            console.log(chalk.gray(`\n[LLM] OPENAI_API_KEY not found. Skipping README refinement.`));
            return currentReadme;
        }

        const spinner = ora("Refining project documentation via LLM...").start();

        try {
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
            const response = await chain.invoke({
                idea: idea,
                currentReadme: currentReadme
            });

            spinner.succeed(chalk.green("✨ README enhanced via LLM!"));
            return String(response.content);
        } catch (err: any) {
            spinner.fail(chalk.yellow(`LLM enhancement failed: ${err.message}. Falling back to default.`));
            return currentReadme;
        }
    }
}
