import { CLIController } from "../src/cli/CLIController";

// Capture the validate function locally
let capturedProjectNameValidate: any;
let capturedIdeaValidate: any;

// Mock @clack/prompts to avoid interactive prompts during testing
jest.mock("@clack/prompts", () => ({
    text: jest.fn().mockImplementation(async (opts: any) => {
        if (opts.message.includes("name")) {
            capturedProjectNameValidate = opts.validate;
        } else if (opts.message.includes("idea")) {
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

    it("should validate the idea correctly to prevent injections", async () => {
        const cli = new CLIController();

        await cli.promptCreationDetails("test idea");
        expect(capturedIdeaValidate).toBeDefined();

        // Valid cases
        expect(capturedIdeaValidate("A stunning new web app.")).toBeUndefined();
        expect(capturedIdeaValidate("Simple app with basic features")).toBeUndefined();
        expect(capturedIdeaValidate("App!@#$%^&*()_+=")).toBeUndefined(); // Some symbols allowed

        // Invalid cases (empty)
        expect(capturedIdeaValidate("")).toBe("Please enter an idea.");
        expect(capturedIdeaValidate("   ")).toBe("Please enter an idea.");
        expect(capturedIdeaValidate(undefined)).toBe("Please enter an idea.");

        // Invalid cases (injection chars)
        const errorMsg = "Idea contains invalid characters. Please avoid using <, >, {, }, \", or \\.";
        expect(capturedIdeaValidate("An idea with <script>")).toBe(errorMsg);
        expect(capturedIdeaValidate("An idea with <html>")).toBe(errorMsg);
        expect(capturedIdeaValidate("An idea with {x: 1}")).toBe(errorMsg);
        expect(capturedIdeaValidate("An idea with \"quotes\"")).toBe(errorMsg);
        expect(capturedIdeaValidate("An idea with \\slash")).toBe(errorMsg);
    });
});
