# README.md
<div align="center">
  <img src="assets/logo.png" alt="AgentForge Logo" width="250" />
  
  <br />

  <h1>✨ AgentForge</h1>
  <p><b>Autonomous Full-Stack App Builder</b></p>
  <i>Scaffold premium, containerized full-stack applications at the speed of thought.</i>

  <br />
  <br />

  [![TypeScript](https://badgen.net/badge/icon/typescript?icon=typescript&label)](https://typescriptlang.org)
  [![Vibe](https://badgen.net/badge/vibe/coding/magenta)](https://github.com/shenald-dev)
  [![Docker](https://badgen.net/badge/icon/docker?icon=docker&label)](https://docker.com)
  [![OpenRouter](https://badgen.net/badge/AI/Enabled/cyan)](https://openrouter.ai)
  [![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
  
  <br />

  <a href="https://frontend-sooty-xi-69.vercel.app"><b>Check out a live generated Next.js App Demo</b></a>
</div>

---

## 📑 Table of Contents
- [🌊 Flow State Initiated](#-flow-state-initiated)
- [🚀 Enterprise Features](#-enterprise-features)
- [🏗️ System Architecture](#️-system-architecture)
- [🛠️ Installation & Setup](#️-installation--setup)
- [💻 Comprehensive Usage](#-comprehensive-usage)
- [🧩 The Templates](#-the-templates)
- [⌨️ Advanced LLM Integration](#️-advanced-llm-integration)
- [⚠️ Troubleshooting & FAQ](#️-troubleshooting--faq)
- [🤝 Contributing](#-contributing)

---

## 🌊 Flow State Initiated

**AgentForge** is an advanced CLI orchestrator explicitly designed for Senior Engineers, Vibe Coders, and architectural designers. Rather than spending hours manually wiring up Next.js to FastAPI, debugging Docker Compose networking, and fighting with GitHub Actions boilerplate—AgentForge handles it entirely in seconds.

Simply provide a short natural language idea, and AgentForge will instantly scaffold a complete web application—complete with strict TypeScript frontends, high-performance backends, full CI/CD deployment pipelines, and optional LLM-refined documentation.

---

## 🚀 Enterprise Features

- **⚡ Instant Scaffolding**: Generate premium, production-ready `SaaS`, `Landing+API`, or `Realtime` project templates instantly.
- **🐳 Zero-Config Previews**: The built-in `agentforge preview .` command cleanly manages background `docker-compose` orchestration locally.
- **🧠 Optional LLM Vibe Pass**: If an `OPENROUTER_API_KEY` is present, AgentForge automatically refines the generated project docs and internal configuration using powerful free models to strictly match your unique idea.
- **🛡️ Clean Architecture**: Emitting only modern, strict-typed boilerplate (`Next.js 14`, `FastAPI`, `Zod`, `Socket.io`, `Express`).
- **🌐 Vercel-Ready**: Native `vercel.json` edge routing injected automatically to prevent 404 deployment drops.
- **🔄 CI/CD Automated**: Ships with pre-configured GitHub Action pipelines for testing and deployment.

---

## 🏗️ System Architecture

AgentForge uses a dynamic, modular **Template Manager** hooked into **Handlebars** compilation and AI generation.
---

## 🛠️ Installation & Setup

### Prerequisites

Before you begin, ensure you have the following installed on your system:

- **Node.js** (v18 or higher)
- **Docker** and **Docker Compose**
  - **⚠️ Windows Requirement**: Windows users must explicitly install `docker-compose.exe` and ensure it is available in their system's `PATH`. The `agentforge preview` command relies on the `docker-compose` binary to orchestrate local containers. If you are using Docker Desktop for Windows, `docker-compose.exe` is typically included, but you must verify it is accessible via your terminal by running `docker-compose --version`.
- **Git**

### Install AgentForge

You can install AgentForge globally via npm:
Or run it directly using `npx`:
---

## 💻 Comprehensive Usage

### 1. Scaffold a New Project

Run the CLI and follow the interactive prompts:
You will be asked to provide:
- A natural language description of your app idea.
- The project name.
- The template type (`SaaS`, `Landing+API`, or `Realtime`).

### 2. Local Development & Preview

Once your project is scaffolded, navigate into the project directory:
To start the local development environment with all services (frontend, backend, database) running in containers:
This command automatically handles the `docker-compose` orchestration, building the images and spinning up the containers in detached mode.

### 3. Production Deployment

AgentForge generates Vercel-ready configurations and GitHub Actions workflows out of the box. Simply push your code to GitHub, and the CI/CD pipeline will handle testing and deployment.

---

## 🧩 The Templates

AgentForge currently supports three premium templates:

1. **SaaS**: Complete with authentication, Stripe integration, and a dashboard.
2. **Landing+API**: A high-converting landing page paired with a robust REST API backend.
3. **Realtime**: Features Socket.io for live updates, perfect for chat apps or collaborative tools.

---

## ⌨️ Advanced LLM Integration

To enable the optional LLM Vibe Pass, set your OpenRouter API key in your environment variables:
When this key is detected, AgentForge will automatically use powerful free models to refine your generated project documentation, README files, and internal configurations to strictly match your unique idea.

---

## ⚠️ Troubleshooting & FAQ

### `docker-compose: command not found` on Windows

If you encounter this error when running `agentforge preview`, it means `docker-compose.exe` is not in your system's `PATH`. 
- Ensure Docker Desktop is installed and running.
- Verify the installation by running `docker-compose --version` in your terminal.
- If missing, you may need to manually add the Docker Desktop installation directory (e.g., `C:\Program Files\Docker\Docker\resources\bin`) to your Windows Environment Variables `PATH`.

### Port Conflicts

If ports 3000 (Frontend) or 8000 (Backend) are already in use, the `docker-compose` setup will fail. Stop any local services using these ports or modify the `docker-compose.yml` file in your generated project to map to different ports.

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request or open an Issue on GitHub.

1. Fork the repository.
2. Create your feature branch (`git checkout -b feature/AmazingFeature`).
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`).
4. Push to the branch (`git push origin feature/AmazingFeature`).
5. Open a Pull Request.

---

<div align="center">
  <p>Built with ❤️ by <a href="https://github.com/shenald-dev">shenald-dev</a></p>
</div>
