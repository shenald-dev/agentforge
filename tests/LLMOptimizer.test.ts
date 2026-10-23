import { LLMOptimizer } from "../src/integrations/LLMOptimizer";
import { ConfigManager } from "../src/utils/config";
import { ChatPromptTemplate } from "@langchain/core/prompts";

// Mock the ConfigManager
jest.mock("../src/utils/config");
jest.mock("@clack/prompts", () => ({
    spinner: () => ({ start: jest.fn(), stop: jest.fn() }),
    log: { warn: jest.fn(), gray: jest.fn() }
}));

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

        // Mock ChatPromptTemplate to return a throwing pipe
        const mockInvoke = jest.fn().mockRejectedValue(new Error("Simulated LLM Failure"));
        const mockPipe = jest.fn().mockReturnValue({ invoke: mockInvoke });
        jest.spyOn(ChatPromptTemplate, "fromMessages").mockReturnValue({ pipe: mockPipe } as any);

        const optimizer = new LLMOptimizer();
        const originalReadme = "# My App\n\nA simple app.";
        
        // This will call await this.init() inside which sets this.model and grabs API key
        const result = await optimizer.enhanceReadme("test idea", originalReadme);
        
        expect(result).toBe(originalReadme);
        expect(ConfigManager.prototype.getApiKey).toHaveBeenCalledTimes(1);
    }, 10000);

    it("should return the enhanced README if LLM enhancement succeeds", async () => {
        (ConfigManager.prototype.getApiKey as jest.Mock).mockResolvedValue("fake_key");

        const mockInvoke = jest.fn().mockResolvedValue({ content: "# Enhanced README\n\nVibe coded." });
        const mockPipe = jest.fn().mockReturnValue({ invoke: mockInvoke });
        jest.spyOn(ChatPromptTemplate, "fromMessages").mockReturnValue({ pipe: mockPipe } as any);

        const optimizer = new LLMOptimizer();
        const originalReadme = "# My App\n\nA simple app.";

        const result = await optimizer.enhanceReadme("test idea", originalReadme);

        expect(result).toBe("# Enhanced README\n\nVibe coded.");
        expect(ConfigManager.prototype.getApiKey).toHaveBeenCalledTimes(1);
    });
});
