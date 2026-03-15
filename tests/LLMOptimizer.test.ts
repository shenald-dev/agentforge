import { LLMOptimizer } from "../src/integrations/LLMOptimizer";
import { PromptTemplate } from "@langchain/core/prompts";

describe("LLMOptimizer", () => {
    const originalEnv = process.env;

    beforeEach(() => {
        jest.resetModules();
        process.env = { ...originalEnv };
    });

    afterAll(() => {
        process.env = originalEnv;
    });

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

    it("should return the original README if LLM enhancement fails", async () => {
        process.env.OPENROUTER_API_KEY = "test_api_key";

        // Mock PromptTemplate to throw an error when invoked
        const mockInvoke = jest.fn().mockRejectedValue(new Error("Simulated LLM Failure"));
        const mockPipe = jest.fn().mockReturnValue({ invoke: mockInvoke });
        jest.spyOn(PromptTemplate, "fromTemplate").mockReturnValue({ pipe: mockPipe } as any);

        const optimizer = new LLMOptimizer();
        const originalReadme = "# My App\n\nA simple app.";
        const result = await optimizer.enhanceReadme("test idea", originalReadme);

        expect(result).toBe(originalReadme);
        expect(mockInvoke).toHaveBeenCalled();

        jest.restoreAllMocks();
    });
});
