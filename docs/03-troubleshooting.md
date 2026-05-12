# 03 — Troubleshooting

## Problem: `unknown "connection_upgrade" variable`

Cause:

```nginx
proxy_set_header Connection $connection_upgrade;
```

was used, but the Nginx `map` was missing.

Fix:

```bash
sudo tee /etc/nginx/conf.d/00-websocket-map.conf > /dev/null <<'EOF'
map $http_upgrade $connection_upgrade {
    default upgrade;
    ''      close;
}
EOF

nginx -t
sudo systemctl reload nginx
```

## Problem: `/api/v1/welcome` works, but WebSocket fails

Test WebSocket:

```bash
curl --http1.1 -i -N \
  -H "Connection: Upgrade" \
  -H "Upgrade: websocket" \
  -H "Sec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==" \
  -H "Sec-WebSocket-Version: 13" \
  https://hpb.example.com/spreed
```

Good:

```text
HTTP/1.1 101 Switching Protocols
```

If not good, check Nginx headers:

```nginx
proxy_http_version 1.1;
proxy_set_header Upgrade $http_upgrade;
proxy_set_header Connection $connection_upgrade;
```

## Problem: Nextcloud says WebSocket failed, but curl works

Likely causes:

1. Wrong `SIGNALING_SECRET`
2. Container still running old `.env`
3. Wrong `NC_DOMAIN`
4. Browser-side cache / stale page

Fix:

```bash
cd /opt/nextcloud-talk-hpb
docker compose up -d --force-recreate
```

Then re-copy:

```bash
grep SIGNALING_SECRET .env
```

Paste only the value after `=` into Nextcloud.

## Problem: Environment changes do not apply

`docker compose restart` does not apply changed environment variables.

Use:

```bash
docker compose up -d --force-recreate
```

## Problem: TURN fails

Check:

```bash
ss -tulpen | grep ':3478'
docker logs nextcloud-talk-hpb --tail=100
```

Check firewall:

```text
3478/tcp open
3478/udp open
```

Check Nextcloud TURN settings:

```text
TURN server: hpb.example.com:3478
Secret: TURN_SECRET
Protocol: UDP and TCP
```

## Problem: DNS points to old IP

Check:

```bash
dig +short A hpb.example.com
curl -4 ifconfig.me
```

The DNS result should match the HPB server public IP.

## Problem: Test script opens browsers but does not join

Run visible mode:

```cmd
set HEADLESS=0&& set PARTICIPANTS=2&& node scripts\talk-load-test.js
```

Then watch what button text appears. Add that text to the script if needed.
