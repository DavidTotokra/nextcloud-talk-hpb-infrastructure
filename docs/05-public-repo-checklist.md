# 05 — Public Repo Checklist

Run this checklist before pushing to GitHub or GitLab.

## 1. Search for real domains

```bash
grep -RniE "your-real-domain|your-real-subdomain" .
```

## 2. Search for real IPs

```bash
grep -RniE "([0-9]{1,3}\.){3}[0-9]{1,3}" .
```

Only documentation IPs such as these should remain:

```text
192.0.2.0/24
198.51.100.0/24
203.0.113.0/24
```

## 3. Search for secrets

```bash
grep -RniE "password|secret|token|key|credential|TURN_SECRET|SIGNALING_SECRET|INTERNAL_SECRET" .
```

Only placeholders should appear.

## 4. Check `.env`

```bash
git status --ignored
```

`.env` must not be staged or committed.

## 5. Check call links

```bash
grep -RniE "/call/[A-Za-z0-9_-]+" .
```

Only dummy tokens such as `EXAMPLE_TOKEN` should appear.

## 6. Check screenshots

Do not commit screenshots that show:

- admin panel URLs
- real domains
- real IPs
- usernames
- passwords
- secret fields
- room tokens

## 7. Commit safely

```bash
git add .
git status
git commit -m "Add public Nextcloud Talk HPB setup template"
```
