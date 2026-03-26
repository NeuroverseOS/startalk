# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | Yes                |

## Reporting a Vulnerability

If you discover a security vulnerability in StarTalk, please report it responsibly.

**Do not open a public GitHub issue for security vulnerabilities.**

Instead, email **team@neuroverseos.com** with:

- A description of the vulnerability
- Steps to reproduce it
- The potential impact
- Any suggested fixes (if applicable)

We will acknowledge receipt within 48 hours and aim to provide an initial assessment within 5 business days.

## Security Considerations

### AI Provider API Keys

- StarTalk uses a BYO-key model. User API keys are passed directly to the configured AI provider (Anthropic or OpenAI) and are never stored, logged, or transmitted elsewhere.
- Keys are configured via the MentraOS app settings interface using the `secret` field type.

### Ambient Listening

- Ambient audio capture is opt-in only and disabled by default.
- Users must explicitly enable ambient mode **and** acknowledge the bystander notice before any audio processing occurs.
- Audio buffers are held in memory only and are not persisted to disk or transmitted beyond the AI provider call.

### Governance and Content Safety

- All AI inputs and outputs are checked through the NeuroverseOS governance framework (`evaluateGuard()`) before being displayed.
- Trust scoring (`simulateWorld()`) provides behavioral degradation if anomalous usage patterns are detected.
- The app declares `"data_retention": "none"` in its MentraOS manifest.

### Docker Deployment

- The container runs as a non-root user (`startalk`, uid 1001).
- The Dockerfile uses a multi-stage build to minimize the attack surface of the runtime image.
