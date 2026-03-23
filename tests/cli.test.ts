import { CLIController } from "../src/cli/CLIController";

// Capture the validate function locally
let capturedValidate: any;

// Mock @clack/prompts to avoid interactive prompts during testing
jest.mock("@clack/prompts", () => ({
    text: jest.fn().mockImplementation(async (opts: any) => {
        if (opts.message.includes("name")) {
            capturedValidate = opts.validate;
        }
        return "test-app";
    }),
    select: jest.fn().mockImplementation(async (opts: any) => {
        return opts.options[0].value;
    }),
    isCancel: jest.fn().mockReturnValue(false),
    intro: jest.fn(),
    outro: jest.fn(),
    group: jest.fn().mockImplementation(async (config: any) => {
        // Trigger the internal p.text calls which will set capturedValidate
        if (typeof config.projectName === 'function') config.projectName();
        if (typeof config.idea === 'function') config.idea();
        if (typeof config.template === 'function') config.template();
        return { projectName: "test-app", idea: "idea", template: "saas" };
    }),
    spinner: () => ({ start: jest.fn(), stop: jest.fn() }),
    log: { message: jest.fn(), error: jest.fn(), step: jest.fn(), success: jest.fn() },
    cancel: jest.fn()
}));

describe("CLIController", () => {
    it("should instantiate without errors", () => {
        const cli = new CLIController();
        expect(cli).toBeDefined();
    });

    it("should expose a promptCreationDetails method", () => {
        const cli = new CLIController();
        expect(typeof cli.promptCreationDetails).toBe("function");
    });
<<<<<<< HEAD
=======

    it("should validate the project name correctly", async () => {
        const cli = new CLIController();
        
        await cli.promptCreationDetails("test idea");
        expect(capturedValidate).toBeDefined();

        // Valid cases
        expect(capturedValidate("my-vibe-app")).toBeUndefined();
        expect(capturedValidate("valid-name-123")).toBeUndefined();
        expect(capturedValidate("app")).toBeUndefined();

        // Invalid cases
        const errorMsg = "Project name may only include lowercase letters, numbers, and dashes.";
        expect(capturedValidate("InvalidName")).toBe(errorMsg);
        expect(capturedValidate("invalid_name")).toBe(errorMsg);
        expect(capturedValidate("invalid name")).toBe(errorMsg);
        expect(capturedValidate("invalid.name")).toBe(errorMsg);
        expect(capturedValidate("invalid@name")).toBe(errorMsg);
    });
>>>>>>> 350a5bbe (fix(audit): resolve merge conflicts and fix broken tests from bad sync)
});
