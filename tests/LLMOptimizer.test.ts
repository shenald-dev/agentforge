import { LLMOptimizer } from "../src/integrations/LLMOptimizer";
import { ConfigManager } from "../src/utils/config";

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

        const optimizer = new LLMOptimizer();
        const originalReadme = "# My App\n\nA simple app.";
        
        // This will call await this.init() inside
        const result = await optimizer.enhanceReadme("test idea", originalReadme);
        
        expect(result).toBe(originalReadme);
        expect(ConfigManager.prototype.getApiKey).toHaveBeenCalledTimes(1);
    });
});
