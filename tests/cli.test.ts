import { CLIController } from "../src/cli/CLIController";

// Mock inquirer to avoid interactive prompts during testing
jest.mock("inquirer", () => ({
    prompt: jest.fn().mockResolvedValue({
        projectName: "test-app",
        idea: "A test idea",
        template: "saas",
    }),
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
});
