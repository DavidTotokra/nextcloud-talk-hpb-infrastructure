# Security Policy

## Public repository warning

This repository is designed to be public.

Before pushing, verify that the repo does **not** contain:

- real `.env` files
- passwords
- tokens
- API keys
- TURN secrets
- signaling secrets
- real production room links
- real customer/user data
- screenshots with admin UI data
- real server IPs, unless you intentionally want them public

## Secret handling

Use environment variables or a secret manager.

Never hardcode secrets in:

- JavaScript files
- Python files
- YAML files
- Markdown files
- GitHub Actions workflows
- Docker Compose files

## If a secret was committed

1. Rotate/revoke the secret immediately.
2. Remove it from Git history.
3. Force-push the cleaned history if needed.
4. Ask collaborators to re-clone the repository.
5. Enable secret scanning where available.
