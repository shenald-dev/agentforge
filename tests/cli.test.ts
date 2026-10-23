import { CLIController } from "../src/cli/CLIController";

// Capture the validate function locally
let capturedProjectNameValidate: any;
let capturedIdeaValidate: any;

// Mock @clack/prompts to avoid interactive prompts during testing
jest.mock("@clack/prompts", () => ({
    text: jest.fn().mockImplementation(async (opts: any) => {
        if (opts.message.includes("name")) {
            capturedProjectNameValidate = opts.validate;
        }
        if (opts.message.includes("idea")) {
            capturedIdeaValidate = opts.validate;
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

    it("should validate the project name correctly", async () => {
        const cli = new CLIController();
        
        await cli.promptCreationDetails("test idea");
        expect(capturedProjectNameValidate).toBeDefined();

        // Valid cases
        expect(capturedProjectNameValidate("my-vibe-app")).toBeUndefined();
        expect(capturedProjectNameValidate("valid-name-123")).toBeUndefined();
        expect(capturedProjectNameValidate("app")).toBeUndefined();

        // Invalid cases
        const errorMsg = "Project name may only include lowercase letters, numbers, and dashes.";
        expect(capturedProjectNameValidate("InvalidName")).toBe(errorMsg);
        expect(capturedProjectNameValidate("invalid_name")).toBe(errorMsg);
        expect(capturedProjectNameValidate("invalid name")).toBe(errorMsg);
        expect(capturedProjectNameValidate("invalid.name")).toBe(errorMsg);
        expect(capturedProjectNameValidate("invalid@name")).toBe(errorMsg);
    });

    it("should validate the idea correctly", async () => {
        const cli = new CLIController();

        await cli.promptCreationDetails("test idea");
        expect(capturedIdeaValidate).toBeDefined();

        // Valid cases
        expect(capturedIdeaValidate("A great new app.")).toBeUndefined();
        expect(capturedIdeaValidate("Simple ideas, complex solutions!")).toBeUndefined();
        expect(capturedIdeaValidate("Wait-What's this?")).toBeUndefined();

        // Invalid cases
        expect(capturedIdeaValidate("")).toBe("Please enter an idea.");
        expect(capturedIdeaValidate("   ")).toBe("Please enter an idea.");
        expect(capturedIdeaValidate("a".repeat(201))).toBe("Idea is too long (maximum 200 characters).");
        expect(capturedIdeaValidate("<script>alert(1)</script>")).toBe("Idea may only include letters, numbers, spaces, and basic punctuation.");
        const invalidCharError = "Idea may only include letters, numbers, spaces, and basic punctuation.";
        expect(capturedIdeaValidate("echo $PATH")).toBe(invalidCharError);
        expect(capturedIdeaValidate("Idea with $ sign")).toBe(invalidCharError);
        expect(capturedIdeaValidate("Idea with < angle >")).toBe(invalidCharError);
        expect(capturedIdeaValidate("Idea with * star")).toBe(invalidCharError);
    });
});
