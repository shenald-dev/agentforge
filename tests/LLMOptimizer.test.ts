import { LLMOptimizer } from "../src/integrations/LLMOptimizer";
import { ConfigManager } from "../src/utils/config";
<<<<<<< HEAD

// Mock the ConfigManager
jest.mock("../src/utils/config");
=======
import { PromptTemplate } from "@langchain/core/prompts";
>>>>>>> 350a5bbe (fix(audit): resolve merge conflicts and fix broken tests from bad sync)

// Mock the ConfigManager
jest.mock("../src/utils/config");

describe("LLMOptimizer", () => {
    beforeEach(() => {
        // Reset all mocks before each test
        jest.clearAllMocks();
    });

    it("should instantiate without crashing", () => {
        const optimizer = new LLMOptimizer();
        expect(optimizer).toBeDefined();
    });

    it("should return the original README when no API key is present via ConfigManager", async () => {
        // Mock getApiKey to return undefined (no API key)
        (ConfigManager.prototype.getApiKey as jest.Mock).mockResolvedValue(undefined);
<<<<<<< HEAD
=======

        const optimizer = new LLMOptimizer();
        const originalReadme = "# My App\n\nA simple app.";
        
        // This will call await this.init() inside
        const result = await optimizer.enhanceReadme("test idea", originalReadme);
        
        expect(result).toBe(originalReadme);
        expect(ConfigManager.prototype.getApiKey).toHaveBeenCalledTimes(1);
    });

    it("should return the original README if LLM enhancement fails", async () => {
        // Mock getApiKey to return a fake key to bypass the early exit check
        (ConfigManager.prototype.getApiKey as jest.Mock).mockResolvedValue("fake_key");

        // Mock PromptTemplate to return a throwing pipe
        const mockInvoke = jest.fn().mockRejectedValue(new Error("Simulated LLM Failure"));
        const mockPipe = jest.fn().mockReturnValue({ invoke: mockInvoke });
        jest.spyOn(PromptTemplate, "fromTemplate").mockReturnValue({ pipe: mockPipe } as any);
>>>>>>> 350a5bbe (fix(audit): resolve merge conflicts and fix broken tests from bad sync)

        const optimizer = new LLMOptimizer();
        const originalReadme = "# My App\n\nA simple app.";
        
<<<<<<< HEAD
        // This will call await this.init() inside
=======
        // This will call await this.init() inside which sets this.model and grabs API key
>>>>>>> 350a5bbe (fix(audit): resolve merge conflicts and fix broken tests from bad sync)
        const result = await optimizer.enhanceReadme("test idea", originalReadme);
        
        expect(result).toBe(originalReadme);
        expect(ConfigManager.prototype.getApiKey).toHaveBeenCalledTimes(1);
    });
});
