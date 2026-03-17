import { PreviewServer } from "../src/preview-server/PreviewServer";
import { spawn } from "child_process";
import { EventEmitter } from "events";
import ora from "ora";
import * as path from "path";

jest.mock("child_process", () => ({
    spawn: jest.fn()
}));

jest.mock("ora", () => {
    const spinner = {
        start: jest.fn().mockReturnThis(),
        succeed: jest.fn(),
        fail: jest.fn()
    };
    return jest.fn(() => spinner);
});

describe("PreviewServer", () => {
    let server: PreviewServer;
    let originalConsoleLog: any;
    let mockProcessOn: jest.SpyInstance;
    let mockProcessExit: jest.SpyInstance;

    beforeEach(() => {
        server = new PreviewServer();
        originalConsoleLog = console.log;
        console.log = jest.fn();

        mockProcessOn = jest.spyOn(process, "on").mockImplementation((event: string | symbol, listener: any) => {
            return process;
        });
        mockProcessExit = jest.spyOn(process, "exit").mockImplementation((code?: string | number | null) => {
            return undefined as never;
        });

        (spawn as jest.Mock).mockClear();
        const oraInstance = (ora as unknown as jest.Mock)();
        if (oraInstance) {
            oraInstance.start.mockClear();
            oraInstance.succeed.mockClear();
            oraInstance.fail.mockClear();
        }
        (ora as unknown as jest.Mock).mockClear();
    });

    afterEach(() => {
        console.log = originalConsoleLog;
        mockProcessOn.mockRestore();
        mockProcessExit.mockRestore();
    });

    it("should start docker-compose and resolve when backend is ready", async () => {
        const mockComposeProcess = new EventEmitter() as any;
        mockComposeProcess.stdout = new EventEmitter();
        mockComposeProcess.stderr = new EventEmitter();

        (spawn as jest.Mock).mockReturnValue(mockComposeProcess);

        const startPromise = server.start("/test/path");

        // Simulate successful startup log
        mockComposeProcess.stdout.emit("data", Buffer.from("Application startup complete"));

        await startPromise;

        expect(spawn).toHaveBeenCalledWith("docker-compose", ["up", "--build"], expect.objectContaining({
            cwd: path.resolve("/test/path")
        }));

        // Ensure ora succeed was called
        const oraInstance = (ora as unknown as jest.Mock)();
        expect(oraInstance.succeed).toHaveBeenCalled();
    });

    it("should resolve when frontend is ready", async () => {
        const mockComposeProcess = new EventEmitter() as any;
        mockComposeProcess.stdout = new EventEmitter();
        mockComposeProcess.stderr = new EventEmitter();

        (spawn as jest.Mock).mockReturnValue(mockComposeProcess);

        const startPromise = server.start("/test/path");

        // Simulate successful startup log
        mockComposeProcess.stdout.emit("data", Buffer.from("ready started server on"));

        await startPromise;

        const oraInstance = (ora as unknown as jest.Mock)();
        expect(oraInstance.succeed).toHaveBeenCalled();
    });

    it("should reject if docker-compose exits with non-zero code", async () => {
        const mockComposeProcess = new EventEmitter() as any;
        mockComposeProcess.stdout = new EventEmitter();
        mockComposeProcess.stderr = new EventEmitter();

        (spawn as jest.Mock).mockReturnValue(mockComposeProcess);

        const startPromise = server.start("/test/path");

        // Simulate process crash
        mockComposeProcess.emit("close", 1);

        await expect(startPromise).rejects.toThrow("Docker compose failed");

        const oraInstance = (ora as unknown as jest.Mock)();
        expect(oraInstance.fail).toHaveBeenCalled();
    });

    it("should handle stderr without throwing", async () => {
        const mockComposeProcess = new EventEmitter() as any;
        mockComposeProcess.stdout = new EventEmitter();
        mockComposeProcess.stderr = new EventEmitter();

        (spawn as jest.Mock).mockReturnValue(mockComposeProcess);

        const startPromise = server.start("/test/path");

        // Simulate stderr output
        mockComposeProcess.stderr.emit("data", Buffer.from("Some warning"));

        // Then succeed
        mockComposeProcess.stdout.emit("data", Buffer.from("Application startup complete"));

        await startPromise;
        // If it reaches here, no error was thrown from stderr
    });

    it("should handle SIGINT for graceful shutdown", async () => {
        let sigintCallback: Function | undefined;
        mockProcessOn.mockImplementation((event: string | symbol, listener: any) => {
            if (event === "SIGINT") {
                sigintCallback = listener;
            }
            return process;
        });

        const mockComposeProcess = new EventEmitter() as any;
        mockComposeProcess.stdout = new EventEmitter();
        mockComposeProcess.stderr = new EventEmitter();

        (spawn as jest.Mock).mockReturnValue(mockComposeProcess);

        const startPromise = server.start("/test/path");

        // The listener is attached synchronously before returning the promise
        expect(sigintCallback).toBeDefined();

        const mockDownProcess = new EventEmitter() as any;
        (spawn as jest.Mock).mockReturnValue(mockDownProcess);

        // Call the SIGINT callback
        sigintCallback!();

        expect(spawn).toHaveBeenCalledWith("docker-compose", ["down"], expect.any(Object));

        // Simulate docker-compose down close
        mockDownProcess.emit("close");

        expect(mockProcessExit).toHaveBeenCalledWith(0);

        // Resolve the original promise so test completes nicely
        mockComposeProcess.stdout.emit("data", Buffer.from("Application startup complete"));
        await startPromise;
    });
});
