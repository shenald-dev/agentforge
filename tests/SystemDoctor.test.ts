import { SystemDoctor } from "../src/diagnostics/SystemDoctor";
import * as net from "net";

jest.mock("child_process", () => {
  const util = require("util");

  const mockedExec: any = jest.fn((cmd, options, callback) => {
    if (typeof options === "function") {
      callback = options;
    }
    if (cmd.includes("git --version")) return callback(null, "git version 2.39.2\n", "");
    if (cmd.includes("docker --version")) return callback(null, "Docker version 24.0.2\n", "");
    if (cmd.includes("docker info")) return callback(null, "Server Version: 24.0.2\n", "");
    if (cmd.includes("docker compose version")) return callback(null, "Docker Compose version v2.18.1\n", "");
    return callback(new Error("Command failed"), "", "Command failed");
  });

  mockedExec[util.promisify.custom] = async (cmd: any) => {
    if (cmd.includes("git --version")) return { stdout: "git version 2.39.2\n", stderr: "" };
    if (cmd.includes("docker --version")) return { stdout: "Docker version 24.0.2\n", stderr: "" };
    if (cmd.includes("docker info")) return { stdout: "Server Version: 24.0.2\n", stderr: "" };
    if (cmd.includes("docker compose version")) return { stdout: "Docker Compose version v2.18.1\n", stderr: "" };
    throw new Error("Command failed");
  };

  return { exec: mockedExec };
});

jest.mock("../src/utils/config", () => ({
  ConfigManager: jest.fn().mockImplementation(() => ({
    getApiKey: jest.fn().mockResolvedValue("sk-or-v1-abcdef1234567890"),
    getBaseUrl: jest.fn().mockResolvedValue(undefined),
  })),
}));

describe("SystemDoctor", () => {
  let doctor: SystemDoctor;

  beforeEach(() => {
    doctor = new SystemDoctor();
  });

  it("should instantiate without error", () => {
    expect(doctor).toBeDefined();
  });

  it("should check Node.js version and succeed on modern Node", () => {
    const item = (doctor as any).checkNodeVersion();
    expect(item.id).toBe("node");
    expect(item.status).toBe("ok");
    expect(item.message).toContain("v18+ requirement met");
  });

  it("should check port availability correctly when port is free", async () => {
    // Choose a high port unlikely to be bound in testing
    const testPort = 19876;
    const item = await doctor.checkPortAvailable(testPort, "Test Port");
    expect(item.id).toBe(`port-${testPort}`);
    expect(item.status).toBe("ok");
    expect(item.message).toBe("Available");
  });

  it("should detect port conflicts when port is bound", async () => {
    const testPort = 19877;
    const blockerServer = net.createServer();

    await new Promise<void>((resolve) => {
      blockerServer.listen(testPort, "127.0.0.1", () => resolve());
    });

    try {
      const item = await doctor.checkPortAvailable(testPort, "Test Port");
      expect(item.id).toBe(`port-${testPort}`);
      expect(item.status).toBe("warn");
      expect(item.message).toContain("currently in use");
    } finally {
      await new Promise<void>((resolve) => blockerServer.close(() => resolve()));
    }
  });

  it("should run full diagnostics and produce a valid report", async () => {
    const report = await doctor.runDiagnostics();
    expect(report).toBeDefined();
    expect(report.items.length).toBeGreaterThanOrEqual(6);
    expect(typeof report.allHealthy).toBe("boolean");

    const formatted = doctor.formatReport(report);
    expect(formatted).toContain("AgentForge System Diagnostics Report");
    expect(formatted).toContain("Node.js Environment");
  });
});
