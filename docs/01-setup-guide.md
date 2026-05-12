# 01 — Setup Guide

This guide shows a generic setup for Nextcloud Talk HPB.

All values are examples. Replace them with your own.

## Example values

| Variable | Example |
|---|---|
| Nextcloud domain | `nextcloud.example.com` |
| HPB domain | `hpb.example.com` |
| Server public IP | `203.0.113.10` |
| TURN port | `3478` |
| Local HPB API port | `127.0.0.1:8081` |

## 1. DNS

Create an A record:

```text
Type: A
Host: hpb
Points to: 203.0.113.10
```

Verify:

```bash
dig +short A hpb.example.com
dig +short AAAA hpb.example.com
```

Expected:

```text
203.0.113.10
```

`AAAA` can be empty if the server has no IPv6.

## 2. Firewall

Open these incoming ports:

| Port | Protocol | Source | Purpose |
|---|---|---|---|
| 22 | TCP | Your IP only | SSH |
| 80 | TCP | Public | HTTP / Certbot |
| 443 | TCP | Public | HTTPS / HPB |
| 3478 | TCP | Public | TURN TCP |
| 3478 | UDP | Public | TURN UDP |

## 3. Server folder

```bash
sudo mkdir -p /opt/nextcloud-talk-hpb
cd /opt/nextcloud-talk-hpb
```

## 4. Generate `.env`

```bash
umask 077

cat > .env <<EOF
NC_DOMAIN=nextcloud.example.com
TALK_HOST=hpb.example.com
TALK_PORT=3478

TURN_SECRET=$(openssl rand -hex 32)
SIGNALING_SECRET=$(openssl rand -hex 32)
INTERNAL_SECRET=$(openssl rand -hex 32)
EOF

chmod 600 .env
```

Do not publish this file.

## 5. Docker Compose

Create:

```bash
nano docker-compose.yml
```

Paste:

```yaml
services:
  nextcloud-talk-hpb:
    image: ghcr.io/nextcloud-releases/aio-talk:latest
    container_name: nextcloud-talk-hpb
    restart: always
    init: true
    env_file:
      - .env
    ports:
      - "127.0.0.1:8081:8081/tcp"
      - "3478:3478/tcp"
      - "3478:3478/udp"
```

Start:

```bash
docker compose up -d
```

Check:

```bash
docker ps
docker logs nextcloud-talk-hpb --tail=100
ss -tulpen | grep -E ':3478|:8081'
```

Expected:

```text
127.0.0.1:8081
0.0.0.0:3478
```

## 6. Nginx WebSocket map

Create:

```bash
sudo tee /etc/nginx/conf.d/00-websocket-map.conf > /dev/null <<'EOF'
map $http_upgrade $connection_upgrade {
    default upgrade;
    ''      close;
}
EOF
```

Test:

```bash
nginx -t
```

## 7. Nginx reverse proxy

Use the template from:

```text
nginx/hpb.example.com.conf
```

Install:

```bash
sudo cp nginx/hpb.example.com.conf /etc/nginx/sites-available/hpb.example.com
sudo ln -s /etc/nginx/sites-available/hpb.example.com /etc/nginx/sites-enabled/
nginx -t
sudo systemctl reload nginx
```

## 8. Let’s Encrypt HTTPS

```bash
sudo apt update
sudo apt install -y certbot python3-certbot-nginx

sudo certbot --nginx -d hpb.example.com --redirect

nginx -t
sudo systemctl reload nginx
```

Test:

```bash
curl https://hpb.example.com/api/v1/welcome
```

Expected:

```json
{"nextcloud-spreed-signaling":"Welcome","version":"..."}
```

## 9. WebSocket test

```bash
curl --http1.1 -i -N \
  -H "Connection: Upgrade" \
  -H "Upgrade: websocket" \
  -H "Sec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==" \
  -H "Sec-WebSocket-Version: 13" \
  https://hpb.example.com/spreed
```

Good result:

```text
HTTP/1.1 101 Switching Protocols
```

A later `hello_timeout` is normal with curl because curl does not send a real Talk hello message.

## 10. Nextcloud Talk settings

Go to:

```text
Administration settings → Talk
```

High-performance backend:

```text
URL:
https://hpb.example.com

Shared secret:
SIGNALING_SECRET
```

TURN:

```text
Type:
turn: only

TURN server:
hpb.example.com:3478

Secret:
TURN_SECRET

Protocol:
UDP and TCP
```

Expected result:

```text
OK: Running version: ...
```
