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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConfigManager = void 0;
const fs = __importStar(require("fs/promises"));
const path = __importStar(require("path"));
const os = __importStar(require("os"));
class ConfigManager {
    configDir;
    configPath;
    constructor() {
        this.configDir = path.join(os.homedir(), ".agentforge");
        this.configPath = path.join(this.configDir, "config.json");
    }
    /**
     * Retrieves the current configuration.
     */
    async getConfig() {
        try {
            const data = await fs.readFile(this.configPath, "utf-8");
            return JSON.parse(data);
        }
        catch {
            return {};
        }
    }
    /**
     * Saves configuration securely with restricted file permissions (600).
     */
    async setConfig(newConfig) {
        const current = await this.getConfig();
        const merged = { ...current, ...newConfig };
        await fs.mkdir(this.configDir, { recursive: true });
        await fs.writeFile(this.configPath, JSON.stringify(merged, null, 2), {
            encoding: "utf-8",
            mode: 0o600 // Secure permissions: read/write for owner only
        });
    }
    /**
     * Gets the API key, falling back to process.env if available (for CI/CD or legacy).
     */
    async getApiKey() {
        if (process.env.OPENROUTER_API_KEY) {
            return process.env.OPENROUTER_API_KEY;
        }
        const config = await this.getConfig();
        return config.OPENROUTER_API_KEY;
    }
}
exports.ConfigManager = ConfigManager;
