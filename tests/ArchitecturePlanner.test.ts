import { ArchitecturePlanner } from "../src/generators/ArchitecturePlanner";
import * as fs from "fs/promises";
import * as path from "path";
import * as os from "os";

jest.mock("../src/utils/config", () => ({
  ConfigManager: jest.fn().mockImplementation(() => ({
    getApiKey: jest.fn().mockResolvedValue(undefined),
    getBaseUrl: jest.fn().mockResolvedValue(undefined),
  })),
}));

describe("ArchitecturePlanner", () => {
  let planner: ArchitecturePlanner;
  let tempDir: string;

  beforeEach(async () => {
    planner = new ArchitecturePlanner();
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "agentforge-arch-test-"));
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it("should synthesize a local architecture plan for saas template", () => {
    const plan = planner.synthesizeLocalPlan({
      projectName: "vibe-saas",
      idea: "A micro-SaaS for developers",
      template: "saas",
      outputPath: tempDir,
    });

    expect(plan).toContain("# vibe-saas — System Architecture & Specification");
    expect(plan).toContain("FastAPI");
    expect(plan).toContain("Next.js 14");
    expect(plan).toContain("flowchart TD");
    expect(plan).toContain("docker-compose.yml");
  });

  it("should synthesize a local architecture plan for realtime template", () => {
    const plan = planner.synthesizeLocalPlan({
      projectName: "chat-sync",
      idea: "Realtime collaborative canvas",
      template: "realtime",
      outputPath: tempDir,
    });

    expect(plan).toContain("# chat-sync");
    expect(plan).toContain("Socket.io");
    expect(plan).toContain("WebSocket");
  });

  it("should write ARCHITECTURE.md file to the output directory", async () => {
    const plan = await planner.generateArchitecturePlan({
      projectName: "test-app",
      idea: "An automated builder",
      template: "landing-api",
      outputPath: tempDir,
      enableLLM: false,
    });

    const filePath = path.join(tempDir, "ARCHITECTURE.md");
    const exists = await fs.stat(filePath).then(() => true).catch(() => false);
    expect(exists).toBe(true);

    const content = await fs.readFile(filePath, "utf-8");
    expect(content).toBe(plan);
    expect(content).toContain("Express");
  });
});
