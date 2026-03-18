import * as fs from "fs/promises";
import * as path from "path";
import * as os from "os";

export interface AgentForgeConfig {
    OPENROUTER_API_KEY?: string;
}

export class ConfigManager {
    private readonly configDir: string;
    private readonly configPath: string;

    constructor() {
        this.configDir = path.join(os.homedir(), ".agentforge");
        this.configPath = path.join(this.configDir, "config.json");
    }

    /**
     * Retrieves the current configuration.
     */
    async getConfig(): Promise<AgentForgeConfig> {
        try {
            const data = await fs.readFile(this.configPath, "utf-8");
            return JSON.parse(data);
        } catch {
            return {};
        }
    }

    /**
     * Saves configuration securely with restricted file permissions (600).
     */
    async setConfig(newConfig: Partial<AgentForgeConfig>): Promise<void> {
        const current = await this.getConfig();
        const merged = { ...current, ...newConfig };

        try {
            await fs.mkdir(this.configDir, { recursive: true });
        } catch {}

        await fs.writeFile(this.configPath, JSON.stringify(merged, null, 2), {
            encoding: "utf-8",
            mode: 0o600 // Secure permissions: read/write for owner only
        });
    }

    /**
     * Gets the API key, falling back to process.env if available (for CI/CD or legacy).
     */
    async getApiKey(): Promise<string | undefined> {
        if (process.env.OPENROUTER_API_KEY) {
            return process.env.OPENROUTER_API_KEY;
        }
        const config = await this.getConfig();
        return config.OPENROUTER_API_KEY;
    }
}
