import { CLIController } from "../src/cli/CLIController";
import { TemplateManager } from "../src/templates/TemplateManager";

jest.mock("../src/templates/TemplateManager");

describe("CLIController", () => {
    it("should initialize the template manager", () => {
        const cli = new CLIController();
        expect(TemplateManager).toHaveBeenCalledTimes(1);
    });
});
