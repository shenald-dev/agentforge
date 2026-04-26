import { PreviewServer } from "../src/preview-server/PreviewServer";
import { spawn } from "child_process";
import * as path from "path";

jest.mock("child_process", () => ({
    spawn: jest.fn(),
}));

jest.mock("ora", () => {
    return {
        __esModule: true,
        default: jest.fn().mockImplementation(() => ({
            start: jest.fn().mockReturnThis(),
            succeed: jest.fn(),
            fail: jest.fn(),
        })),
    };
});

describe("PreviewServer", () => {
    let mockSpawn: jest.Mock;

    beforeEach(() => {
        mockSpawn = spawn as jest.Mock;
        mockSpawn.mockClear();
    });

    it("should spawn docker-compose with correct arguments and handle success", async () => {
        const mockOn = jest.fn();
        const mockResume = jest.fn();
        const mockStdoutOn = jest.fn((event, callback) => {
            if (event === "data") {
                // Simulate successful startup message
                setTimeout(() => callback("Application startup complete"), 10);
            }
        });

        mockSpawn.mockReturnValue({
            stdout: { on: mockStdoutOn },
            stderr: { resume: mockResume },
            on: mockOn,
        });

        const previewServer = new PreviewServer();
        const testPath = "./test-dir";

        await Promise.race([
            previewServer.start(testPath),
            new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), 100)),
        ]);

        expect(mockSpawn).toHaveBeenCalledWith("docker-compose", ["up", "--build"], {
            cwd: path.resolve(testPath),
            stdio: "pipe",
        });

        expect(mockStdoutOn).toHaveBeenCalledWith("data", expect.any(Function));
        expect(mockResume).toHaveBeenCalled();
        expect(mockOn).toHaveBeenCalledWith("error", expect.any(Function));
        expect(mockOn).toHaveBeenCalledWith("close", expect.any(Function));
    });

    it("should handle spawn errors gracefully", async () => {
        const mockOn = jest.fn((event, callback) => {
            if (event === "error") {
                 setTimeout(() => callback(new Error("Spawn Failed")), 10);
            }
        });
        const mockResume = jest.fn();
        const mockStdoutOn = jest.fn();

        mockSpawn.mockReturnValue({
            stdout: { on: mockStdoutOn },
            stderr: { resume: mockResume },
            on: mockOn,
        });

        const previewServer = new PreviewServer();

        await expect(
            Promise.race([
                previewServer.start("./test-dir"),
                new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), 100))
            ])
        ).rejects.toThrow("Spawn Failed");
    });
});
