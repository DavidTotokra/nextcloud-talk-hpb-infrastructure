# 02 — Validation Checklist

Use this after installation.

## DNS

```bash
dig +short A hpb.example.com
dig +short AAAA hpb.example.com
```

Expected:

```text
203.0.113.10
```

AAAA should be empty unless IPv6 is configured.

## Container

```bash
docker ps
docker logs nextcloud-talk-hpb --tail=100
```

## Ports

```bash
ss -tulpen | grep -E ':443|:3478|:8081'
```

Expected:

```text
443  → nginx
3478 → docker / TURN
8081 → 127.0.0.1 only
```

## Public HTTPS API

```bash
curl https://hpb.example.com/api/v1/welcome
```

Expected:

```json
{"nextcloud-spreed-signaling":"Welcome","version":"..."}
```

## Public WebSocket

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

## Nextcloud UI

Expected:

```text
High-performance backend: OK
TURN server: green check
```

## Load test from laptop

```cmd
set HEADLESS=1&& set PARTICIPANTS=20&& set TALK_URL=https://nextcloud.example.com/index.php/call/EXAMPLE_TOKEN&& node scripts\talk-load-test.js
```

Monitor server:

```bash
docker stats nextcloud-talk-hpb
docker logs -f nextcloud-talk-hpb
tail -f /var/log/nginx/hpb.access.log
```
