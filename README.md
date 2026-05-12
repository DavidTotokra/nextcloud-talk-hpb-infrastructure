# Nextcloud Talk High-Performance Backend (HPB) — Public Setup Template

Public, sanitized documentation for deploying a **Nextcloud Talk High-Performance Backend** with:

- DNS for a dedicated HPB subdomain
- VPS firewall rules
- Docker Compose
- Nextcloud AIO Talk HPB container
- Nginx reverse proxy
- Let’s Encrypt HTTPS
- WebSocket forwarding
- TURN on port `3478`
- Optional Playwright load test with fake browser participants

This repository intentionally uses **dummy domains, dummy IPs, and placeholder secrets**.

## Example architecture

| Component | Example value |
|---|---|
| Nextcloud base URL | `https://nextcloud.example.com` |
| HPB / signaling URL | `https://hpb.example.com` |
| WebSocket URL | `wss://hpb.example.com/spreed` |
| TURN server | `hpb.example.com:3478` |
| TURN protocol | UDP and TCP |
| HPB container | `ghcr.io/nextcloud-releases/aio-talk:latest` |
| Local signaling port | `127.0.0.1:8081` |
| Public TURN port | `3478/tcp` and `3478/udp` |
| Example public IP | `203.0.113.10` |

`203.0.113.10` is an example-only documentation IP. Replace it with your own server IP.

## Repository structure

```text
.
├── README.md
├── docker-compose.yml
├── .env.example
├── .gitignore
├── SECURITY.md
├── docs
│   ├── 01-setup-guide.md
│   ├── 02-validation-checklist.md
│   ├── 03-troubleshooting.md
│   ├── 04-automation-plan.md
│   └── 05-public-repo-checklist.md
├── firewall
│   └── firewall-rules-template.json
├── nginx
│   └── hpb.example.com.conf
└── scripts
    ├── talk-load-test.js
    └── ws-smoke-test.py
```

## Security rules for this public repo

Do not commit:

- real `.env`
- real domains if you do not want them public
- real public IPs
- real user credentials
- real call links / room tokens
- real TURN or signaling secrets
- provider account identifiers
- screenshots showing admin panels or private configuration

Use:

```text
.env.example
```

with placeholders only.

## Quick start on the server

```bash
sudo mkdir -p /opt/nextcloud-talk-hpb
cd /opt/nextcloud-talk-hpb

cp .env.example .env
nano .env

docker compose up -d
```

## Generate secrets

```bash
openssl rand -hex 32
openssl rand -hex 32
openssl rand -hex 32
```

Add them to `.env` as:

```env
TURN_SECRET=<generated-secret>
SIGNALING_SECRET=<generated-secret>
INTERNAL_SECRET=<generated-secret>
```

## Validation

```bash
curl https://hpb.example.com/api/v1/welcome
```

Expected:

```json
{"nextcloud-spreed-signaling":"Welcome","version":"..."}
```

WebSocket test:

```bash
curl --http1.1 -i -N \
  -H "Connection: Upgrade" \
  -H "Upgrade: websocket" \
  -H "Sec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==" \
  -H "Sec-WebSocket-Version: 13" \
  https://hpb.example.com/spreed
```

Expected:

```text
HTTP/1.1 101 Switching Protocols
```

## Load test

On a laptop or separate test machine:

```cmd
set HEADLESS=1&& set PARTICIPANTS=20&& set TALK_URL=https://nextcloud.example.com/index.php/call/EXAMPLE_TOKEN&& node scripts\talk-load-test.js
```

With login credentials, use environment variables only:

```cmd
set LOGIN_USER=test-user&& set LOGIN_PASSWORD=test-password&& set HEADLESS=1&& set PARTICIPANTS=20&& set TALK_URL=https://nextcloud.example.com/index.php/call/EXAMPLE_TOKEN&& node scripts\talk-load-test.js
```

Do not hardcode credentials into the script.
