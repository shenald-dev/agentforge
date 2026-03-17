import inquirer from "inquirer";
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

    it("should validate the project name correctly", async () => {
        const cli = new CLIController();
        await cli.promptCreationDetails("test idea");

        const promptCall = (inquirer.prompt as unknown as jest.Mock).mock.calls[0][0];
        const projectNamePrompt = promptCall.find((p: any) => p.name === "projectName");

        expect(projectNamePrompt).toBeDefined();
        expect(projectNamePrompt.validate).toBeDefined();

        const validate = projectNamePrompt.validate;

        // Valid cases
        expect(validate("my-vibe-app")).toBe(true);
        expect(validate("valid-name-123")).toBe(true);
        expect(validate("app")).toBe(true);

        // Invalid cases
        const errorMsg = "Project name may only include lowercase letters, numbers, and dashes.";
        expect(validate("InvalidName")).toBe(errorMsg);
        expect(validate("invalid_name")).toBe(errorMsg);
        expect(validate("invalid name")).toBe(errorMsg);
        expect(validate("invalid.name")).toBe(errorMsg);
        expect(validate("invalid@name")).toBe(errorMsg);
    });
});
