# StarTalk

Astrological translator for MentraOS smart glasses. Set your signs. Tap. Get cosmic perspective.

StarTalk is an AI-powered app that translates real-time social moments through the lens of your astrological chart. Running on MentraOS smart glasses, it gives you cosmic insight into what's happening around you — who you're talking to, how your signs interact, and what the stars have to say about the moment.

## How It Works

1. **Set your chart** in app settings: pick your Sun Sign (core identity) and optionally your Rising Sign (how you come across).
2. **Tap or say "star"** to get a cosmic read on the current moment.
3. **Tap again within 30 seconds** to expand or follow up.
4. **Long press** to dismiss.

StarTalk auto-selects the best interaction mode for each moment:

| Mode | When It Fires | Example |
|---|---|---|
| **Translate** | Understanding someone else's behavior | "That's classic Taurus — they're not ignoring you, they're processing." |
| **Reflect** | Understanding your own behavior | "Your Cancer moon is holding onto that comment. Let it go." |
| **Challenge** | Falling into shadow traits | "You're avoiding the conversation. That's your Libra dodge." |
| **Teach** | Learning the dynamic at play | "Fire signs speak to act. Water signs speak to connect." |
| **Direct** | Need a clear recommendation | "Say it now. Aries energy rewards directness." |

## Features

### World Stacking

StarTalk's core innovation. Your Sun Sign defines *who you are*; your Rising Sign defines *how you present*. StarTalk combines both into a unified personality lens, weighting the sun as dominant and the rising as a modifier. A Cancer with Aries rising gets emotionally deep reads delivered with bold directness.

### People Memory

Tell StarTalk about the people in your life:
- "Sophie is a Cancer with Aries rising"
- "talking to Sophie" (recalls her chart automatically)
- "talking to a Taurus" (anonymous sign-based translation)

People are persisted across sessions via MentraOS SimpleStorage.

### Ambient Context

With explicit opt-in (and bystander acknowledgment), StarTalk can listen to nearby conversation and factor it into reads. The audio buffer is configurable (1, 2, or 5 minutes) and is held in memory only — never persisted or transmitted beyond the AI call.

### AI Provider Choice

StarTalk uses a bring-your-own-key model. Choose between:
- **Anthropic Claude** (Claude Haiku 4.5)
- **OpenAI GPT** (GPT-4o Mini)

No data is retained. Your API key goes directly to your chosen provider.

## Getting Started

### Prerequisites

- Node.js 20+
- A MentraOS app API key
- An Anthropic or OpenAI API key

### Install and Run

```bash
git clone https://github.com/NeuroverseOS/startalk.git
cd startalk
npm install
npm run dev
```

Set the `MENTRA_APP_API_KEY` environment variable before starting.

### Docker

```bash
docker build -t startalk .
docker run -p 3001:3001 -e MENTRA_APP_API_KEY=<your-key> startalk
```

The container runs as a non-root user on port 3001 with a built-in health check at `/health`.

## Project Structure

```
startalk/
  src/
    server.ts             Main MentraOS app server
    sign-loader.ts        Zodiac world parser and prompt builder
    signs/
      aries.nv-world.md   Zodiac sign world definitions (x12)
      taurus.nv-world.md
      ...
  app_config.json         MentraOS settings schema
  mentra.app.json         App metadata and permissions
  Dockerfile              Multi-stage container build
```

### Zodiac World Files

Each sign is defined in a `.nv-world.md` file — the NeuroverseOS world definition format. These structured markdown files contain frontmatter metadata (element, modality, ruling planet, dates) followed by sections for thesis, traits, communication style, the five interaction modes, compatibility, and tone. The sign-loader parses these at startup and caches them for prompt building.

## NeuroverseOS Governance Integration

StarTalk integrates with the [NeuroverseOS governance framework](https://github.com/NeuroverseOS/neuroverseos-governance), which provides three layers of runtime safety:

- **Guard Engine** (`evaluateGuard()`): Checks all AI inputs and outputs against platform content rules before anything is displayed on the glasses.
- **World Simulation** (`simulateWorld()`): Evaluates trust scores based on session behavior (AI call volume, activation patterns). Trust gates adjust response length invisibly to the user — from full 50-word reads at high trust down to glance-only 15-word reads at low trust, with responses disabled entirely if trust drops to revoked levels.
- **Governed Executor** (`MentraGovernedExecutor`): Hooks into the MentraOS app lifecycle with callbacks for blocking or pausing actions that violate rules.

The app declares its AI usage transparently in `mentra.app.json`, including that AI is opt-in only, keys are user-provided, and data retention is none.

## Repository Governance Files

Open-source projects benefit from clear governance — a set of files that define how the project is licensed, how people can contribute, what behavior is expected, and how security issues should be handled. GitHub recognizes these files and surfaces them in the repository's community profile. Here is how StarTalk uses each one:

### LICENSE

The [LICENSE](LICENSE) file contains the full text of the **Apache License 2.0**. This is the legal foundation of the project. It grants users a perpetual, royalty-free right to use, modify, and distribute StarTalk (including for commercial purposes), while requiring attribution and notice of changes. It also includes an explicit patent grant, which provides additional legal protection for contributors and users. The Apache 2.0 license was chosen for its balance of openness and legal clarity.

### CONTRIBUTING.md

The [CONTRIBUTING.md](CONTRIBUTING.md) file is the guide for anyone who wants to help improve StarTalk. It covers how to report bugs, submit pull requests, set up a development environment, and which areas of the codebase welcome contributions (sign definitions, interaction modes, governance integration, people memory, and documentation). Having clear contribution guidelines lowers the barrier to entry and keeps the project's quality consistent.

### CODE_OF_CONDUCT.md

The [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) sets behavioral expectations for everyone participating in the StarTalk community — contributors, maintainers, and users interacting in project spaces. It is adapted from the [Contributor Covenant](https://www.contributor-covenant.org/), the most widely adopted code of conduct in open source. It defines what positive participation looks like, what is not acceptable, and how violations are handled.

### SECURITY.md

The [SECURITY.md](SECURITY.md) file tells security researchers how to responsibly disclose vulnerabilities. Instead of opening public issues (which would expose the vulnerability to everyone), reporters email the team directly. The file also documents StarTalk's security architecture: BYO-key model with no key storage, opt-in ambient listening with bystander acknowledgment, governance-layer content filtering, and non-root Docker deployment.

### Why Governance Files Matter

These four files together form the governance foundation of an open-source project:

- **LICENSE** answers: "Can I use this, and under what terms?"
- **CONTRIBUTING.md** answers: "How do I help?"
- **CODE_OF_CONDUCT.md** answers: "What behavior is expected?"
- **SECURITY.md** answers: "What do I do if I find a vulnerability?"

Without them, potential contributors don't know if they're welcome, users don't know their legal rights, and security researchers don't know how to reach you. GitHub tracks these files as part of your repository's "Community Standards" and will prompt you to add any that are missing.

## Tech Stack

- **Runtime**: Node.js 20+ / TypeScript
- **Framework**: MentraOS SDK (`@mentra/sdk`)
- **AI**: Anthropic Claude SDK, OpenAI SDK (user-selected)
- **Governance**: NeuroverseOS governance framework
- **Deployment**: Docker (multi-stage, non-root)

## License

StarTalk is licensed under the [Apache License 2.0](LICENSE).

```
Copyright 2025 NeuroverseOS

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0
```
