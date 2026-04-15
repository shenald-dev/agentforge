import * as fs from "fs/promises";
import * as path from "path";
import * as os from "os";
import { ConfigManager } from "../src/utils/config";

jest.mock("fs/promises");
jest.mock("os");

describe("ConfigManager", () => {
    let configManager: ConfigManager;
    const mockHomedir = "/mock/home";
    const mockConfigDir = path.join(mockHomedir, ".agentforge");
    const mockConfigPath = path.join(mockConfigDir, "config.json");

    beforeEach(() => {
        jest.clearAllMocks();
        (os.homedir as jest.Mock).mockReturnValue(mockHomedir);
        configManager = new ConfigManager();
    });

    describe("getConfig", () => {
        it("should return parsed config when file exists", async () => {
            const mockConfig = { OPENROUTER_API_KEY: "test-key" };
            (fs.readFile as jest.Mock).mockResolvedValue(JSON.stringify(mockConfig));

            const config = await configManager.getConfig();

            expect(config).toEqual(mockConfig);
            expect(fs.readFile).toHaveBeenCalledWith(mockConfigPath, "utf-8");
        });

        it("should return empty object when file does not exist", async () => {
            (fs.readFile as jest.Mock).mockRejectedValue(new Error("File not found"));

            const config = await configManager.getConfig();

            expect(config).toEqual({});
        });
    });

    describe("setConfig", () => {
        it("should create directory and write file with correct permissions", async () => {
            (fs.readFile as jest.Mock).mockRejectedValue(new Error("File not found"));
            (fs.mkdir as jest.Mock).mockResolvedValue(undefined);
            (fs.writeFile as jest.Mock).mockResolvedValue(undefined);

            const newConfig = { OPENROUTER_API_KEY: "new-key" };
            await configManager.setConfig(newConfig);

            expect(fs.mkdir).toHaveBeenCalledWith(mockConfigDir, { recursive: true, mode: 0o700 });
            expect(fs.writeFile).toHaveBeenCalledWith(
                mockConfigPath,
                JSON.stringify(newConfig, null, 2),
                {
                    encoding: "utf-8",
                    mode: 0o600
                }
            );
        });

        it("should merge with existing config", async () => {
            const existingConfig = { OTHER_KEY: "other-value" };
            (fs.readFile as jest.Mock).mockResolvedValue(JSON.stringify(existingConfig));
            (fs.mkdir as jest.Mock).mockResolvedValue(undefined);
            (fs.writeFile as jest.Mock).mockResolvedValue(undefined);

            const newConfig = { OPENROUTER_API_KEY: "new-key" };
            await configManager.setConfig(newConfig);

            expect(fs.mkdir).toHaveBeenCalledWith(mockConfigDir, { recursive: true, mode: 0o700 });
            const expectedMerged = { ...existingConfig, ...newConfig };
            expect(fs.writeFile).toHaveBeenCalledWith(
                mockConfigPath,
                JSON.stringify(expectedMerged, null, 2),
                expect.any(Object)
            );
        });

        it("should not fail silently if mkdir fails (after fix)", async () => {
            (fs.readFile as jest.Mock).mockRejectedValue(new Error("File not found"));
            const mkdirError = new Error("Permission denied");
            (fs.mkdir as jest.Mock).mockRejectedValue(mkdirError);

            await expect(configManager.setConfig({ OPENROUTER_API_KEY: "key" }))
                .rejects.toThrow("Permission denied");
        });
    });

    describe("getApiKey", () => {
        const originalEnv = process.env;

        beforeEach(() => {
            jest.resetModules();
            process.env = { ...originalEnv };
        });

        afterAll(() => {
            process.env = originalEnv;
        });

        it("should return API key from process.env if present", async () => {
            process.env.OPENROUTER_API_KEY = "env-key";
            const apiKey = await configManager.getApiKey();
            expect(apiKey).toBe("env-key");
        });

        it("should return API key from config file if not in env", async () => {
            delete process.env.OPENROUTER_API_KEY;
            const mockConfig = { OPENROUTER_API_KEY: "config-key" };
            (fs.readFile as jest.Mock).mockResolvedValue(JSON.stringify(mockConfig));

            const apiKey = await configManager.getApiKey();
            expect(apiKey).toBe("config-key");
        });

        it("should return undefined if not in env or config", async () => {
            delete process.env.OPENROUTER_API_KEY;
            (fs.readFile as jest.Mock).mockRejectedValue(new Error("File not found"));

            const apiKey = await configManager.getApiKey();
            expect(apiKey).toBeUndefined();
        });
    });
});
