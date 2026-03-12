import { LLMOptimizer } from "../src/integrations/LLMOptimizer";

describe("LLMOptimizer", () => {
    it("should instantiate without crashing when no API key is set", () => {
        delete process.env.OPENROUTER_API_KEY;
        const optimizer = new LLMOptimizer();
        expect(optimizer).toBeDefined();
    });

    it("should return the original README when no API key is present", async () => {
        delete process.env.OPENROUTER_API_KEY;
        const optimizer = new LLMOptimizer();
        const originalReadme = "# My App\n\nA simple app.";
        const result = await optimizer.enhanceReadme("test idea", originalReadme);
        expect(result).toBe(originalReadme);
    });
});
