# Contributing to StarTalk

Thank you for your interest in contributing to StarTalk! This document provides guidelines and information for contributors.

## How to Contribute

### Reporting Issues

- Use [GitHub Issues](https://github.com/NeuroverseOS/startalk/issues) to report bugs or suggest features.
- Include steps to reproduce any bug, along with your environment details (Node version, OS, AI provider).
- Check existing issues before opening a new one to avoid duplicates.

### Submitting Changes

1. Fork the repository.
2. Create a feature branch from `main` (`git checkout -b feature/your-feature`).
3. Make your changes and test them locally with `npm run dev`.
4. Commit with clear, descriptive messages.
5. Push to your fork and open a pull request against `main`.

### Pull Request Guidelines

- Keep PRs focused on a single change.
- Describe what the PR does and why.
- Reference any related issues.
- Ensure your code follows the existing TypeScript style in the project.

## Development Setup

```bash
git clone https://github.com/NeuroverseOS/startalk.git
cd startalk
npm install
npm run dev
```

**Requirements:**
- Node.js 20+
- A MentraOS app API key (`MENTRA_APP_API_KEY` environment variable)
- An AI provider API key (Anthropic or OpenAI, configured in app settings)

## Areas of Contribution

- **Zodiac sign definitions** (`src/signs/*.nv-world.md`): Refine traits, communication styles, compatibility, and mode directives.
- **Interaction modes**: Improve mode selection logic and response quality.
- **Governance integration**: Enhance trust scoring and guard evaluation.
- **People memory**: Improve the persistent people chart system.
- **Documentation**: Improve the README, guides, and inline comments.

## Zodiac World File Format

If you are contributing to sign definitions, each `.nv-world.md` file follows a structured format with frontmatter metadata and markdown sections for thesis, traits, communication, modes, compatibility, and tone. See any existing sign file in `src/signs/` as a reference.

## Code of Conduct

All contributors are expected to follow our [Code of Conduct](CODE_OF_CONDUCT.md). Please be respectful and constructive.

## License

By contributing to StarTalk, you agree that your contributions will be licensed under the [Apache License 2.0](LICENSE).
