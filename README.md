# ✨ AgentForge: Autonomous Full-Stack App Builder

> Scaffold premium, containerized full-stack applications at the speed of thought.

![AgentForge Hero](./docs/demo.gif)

**AgentForge** is an CLI orchestrator designed for Senior Engineers and Vibe Coders. Provide a short natural language idea, and AgentForge will instantly scaffold a complete web application—complete with strict TypeScript frontends, high-performance backends, Docker-Compose configurations, GitHub Actions pipelines, and optional LLM-refined documentation.

## Features
- **🚀 Instant Scaffolding**: Generate `SaaS`, `Landing+API`, or `Realtime` project templates instantly.
- **🐳 Zero-Config Previews**: Built-in `agentforge preview .` command cleanly manages background `docker-compose` orchestration locally.
- **🧠 Optional LLM Vibe Pass**: If an `OPENAI_API_KEY` is present, it will automatically refine the project docs to strictly match your unique idea.
- **🌊 Clean Architecture**: Emitting only modern, strict-typed boilerplate (`Next.js`, `FastAPI`, `Zod`).

## Architecture
AgentForge uses a modular Template Manager hooked into Handlebars compilation.
<p align="center">
  <img src="./docs/architecture.svg" alt="AgentForge Architecture" width="800">
</p>

## Quick Start
```bash
npm install -g agentforge
agentforge create "A high conversion real estate landing page"
```
And to spin up the result locally:
```bash
cd my-vibe-app
agentforge preview .
```

## 🤝 Contributing
Want to add a brilliant new Template to the Forge? Let's flow!
- 🐛 **Found a bug?** Open an issue to let us know.
- ✨ **Have a feature idea?** We are open to PRs! Just make sure to run `npm run test` and `npm run lint`.
- 🎨 **Documentation tweaks?** Always welcome!

*Built by a Vibe Coder. Forget the config, just build.*
