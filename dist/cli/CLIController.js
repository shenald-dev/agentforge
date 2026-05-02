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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CLIController = void 0;
const TemplateManager_1 = require("../templates/TemplateManager");
const picocolors_1 = __importDefault(require("picocolors"));
const p = __importStar(require("@clack/prompts"));
class CLIController {
    templateManager;
    constructor() {
        this.templateManager = new TemplateManager_1.TemplateManager();
    }
    /**
     * Guides the user through an interactive setup process for generation.
     */
    async promptCreationDetails(defaultIdea) {
        console.clear();
        p.intro(`${picocolors_1.default.bgCyan(picocolors_1.default.black(" ✨ AgentForge Interactive Scaffolding "))}`);
        const templates = await this.templateManager.listTemplates();
        const project = await p.group({
            projectName: () => p.text({
                message: "What is the name of your new application?",
                placeholder: "my-vibe-app",
                defaultValue: "my-vibe-app",
                validate: (value) => {
                    if (!value)
                        return "Please enter a name.";
                    if (!/^[a-z0-9-]+$/.test(value))
                        return "Project name may only include lowercase letters, numbers, and dashes.";
                }
            }),
            idea: () => p.text({
                message: "Describe your idea in one sentence:",
                placeholder: defaultIdea || "A stunning new web app.",
                defaultValue: defaultIdea || "A stunning new web app.",
            }),
            template: () => p.select({
                message: "Which scaffold template best fits your architecture?",
                options: templates.map(t => ({ value: t, label: t })),
            })
        }, {
            onCancel: () => {
                p.cancel("Operation cancelled.");
                process.exit(0);
            }
        });
        return project;
    }
}
exports.CLIController = CLIController;