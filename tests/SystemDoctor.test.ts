import { SystemDoctor } from "../src/diagnostics/SystemDoctor";
import * as net from "net";

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
