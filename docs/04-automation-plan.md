# 04 — Automation Plan

This document explains what was learned, common mistakes, and how to automate the setup fully.

## What I learned

### 1. DNS is only routing

The DNS provider does not run the HPB. It only points the HPB subdomain to the VPS IP.

Example:

```text
hpb.example.com → 203.0.113.10
```

### 2. HPB has different network parts

| Endpoint | Purpose |
|---|---|
| `https://hpb.example.com/api/v1/welcome` | HTTPS API check |
| `wss://hpb.example.com/spreed` | WebSocket signaling |
| `hpb.example.com:3478` | TURN server |

### 3. Nginx WebSocket proxying is special

Normal HTTP reverse proxy is not enough. WebSocket needs:

```nginx
proxy_http_version 1.1;
proxy_set_header Upgrade $http_upgrade;
proxy_set_header Connection $connection_upgrade;
```

### 4. Docker environment changes need recreation

When `.env` changes, use:

```bash
docker compose up -d --force-recreate
```

not only:

```bash
docker compose restart
```

### 5. Manual testing is important

Useful tests:

```bash
curl https://hpb.example.com/api/v1/welcome
```

and:

```bash
curl --http1.1 -i -N \
  -H "Connection: Upgrade" \
  -H "Upgrade: websocket" \
  -H "Sec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==" \
  -H "Sec-WebSocket-Version: 13" \
  https://hpb.example.com/spreed
```

## Common mistakes

### Mistake 1: Wrong DNS IP

The HPB subdomain must point to the real HPB server IP.

### Mistake 2: Wrong HPB URL path

For this Docker setup, use:

```text
https://hpb.example.com
```

Do not use a custom path unless your container/reverse proxy requires it.

### Mistake 3: Missing Nginx WebSocket map

Error:

```text
unknown "connection_upgrade" variable
```

Fix:

```nginx
map $http_upgrade $connection_upgrade {
    default upgrade;
    ''      close;
}
```

### Mistake 4: Restart vs recreate

If `.env` changes, `restart` is not enough. Recreate the container.

### Mistake 5: Testing with one user is not enough

A manual browser test proves the UI works. For confidence, run a small fake participant test with Playwright.

## Next step: full automation

### Phase 1 — Bash automation

Create one bash script:

```text
install-hpb.sh
```

It should:

1. Install Docker, Nginx, Certbot
2. Create `/opt/nextcloud-talk-hpb`
3. Generate `.env`
4. Create `docker-compose.yml`
5. Start container
6. Create Nginx config
7. Request Let’s Encrypt certificate
8. Run validation checks

### Phase 2 — Ansible automation

Create Ansible roles:

```text
roles/
├── docker
├── nginx
├── certbot
├── nextcloud-talk-hpb
└── firewall
```

Important variables:

```yaml
nextcloud_domain: nextcloud.example.com
hpb_domain: hpb.example.com
hpb_public_ip: 203.0.113.10
talk_port: 3478
```

Secrets should be stored in:

```text
Ansible Vault
```

not plain YAML.

### Phase 3 — Terraform / cloud automation

If using a cloud provider:

1. Create VPS
2. Create firewall rules
3. Create DNS records
4. Run Ansible automatically
5. Output HPB URL and secret names

### Phase 4 — CI/CD validation

GitHub Actions or GitLab CI can run:

```bash
yamllint docker-compose.yml
nginx -t
shellcheck scripts/*.sh
```

Do not run production deployment from public CI unless secrets are handled correctly.

## Target architecture after automation

```text
GitHub/GitLab repo
        │
        ▼
Terraform creates server + firewall + DNS
        │
        ▼
Ansible installs Docker/Nginx/Certbot/HPB
        │
        ▼
Validation script checks API + WebSocket + TURN
        │
        ▼
Nextcloud Talk admin config
```

## CV summary

This project demonstrates:

- Linux server administration
- DNS and firewall configuration
- Docker Compose deployment
- Nginx reverse proxy with WebSocket support
- TLS with Let’s Encrypt
- TURN/WebRTC basics
- Nextcloud Talk HPB production setup
- Real-world troubleshooting
- Load testing with Playwright
- Foundation for Ansible/Terraform automation
