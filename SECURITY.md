# Security & Secret-Rotation Runbook

> **STATUS: ACTION REQUIRED.** `.project-config.json` containing **live production
> credentials** was bundled into a shared review zip and exists in working trees /
> git history. Treat every value in it as compromised and rotate now. The file is
> gitignored (`.gitignore` line ~114), which prevents *new* commits — it does **not**
> undo prior exposure.

## 1. Rotate every credential (do this first, in this order)

| Secret | Where | Action |
|---|---|---|
| `DATABASE_URL` / `DRIZZLE_DATABASE_URL` | TiDB Cloud console | Create a new DB user + password, update platform env, then **drop the old user**. |
| `JWT_SECRET` | Platform env | Rotate. Invalidates all existing sessions (users re-login — acceptable). Confirm `jose` verification reads from env, never a constant. |
| AWS `access_key_id` / `secret_access_key` | IAM | **Deactivate then delete** the leaked key; issue a new one. The `session_token` is short-lived but the access/secret pair is not. |
| `RESEND_API_KEY` | Resend dashboard | Roll the key, update env. |
| `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` | Stripe dashboard | Roll (these are `sk_test` — lower urgency, but rotate on principle). **Verify no `sk_live_*` key was ever committed.** |
| `BUILT_IN_FORGE_API_KEY` / `VITE_FRONTEND_FORGE_API_KEY` | Manus/Forge console | Roll if the console allows; otherwise notify the platform. |

> Rotation is mandatory **regardless** of history scrubbing, because anyone who
> received the zip already has the old values.

## 2. Stop the bleed in the repo

```bash
git rm --cached .project-config.json          # keep the local file, untrack it
git add .gitignore .project-config.example.json .gitleaks.toml SECURITY.md
git commit -m "chore(security): untrack secrets, add example config + gitleaks gate"
```

`.project-config.example.json` (committed) documents the shape with `REDACTED`
placeholders so a new dev knows what env to provide.

## 3. Scrub git history

The values live in past commits. After **Step 1 (rotation)** is done:

```bash
# Option A — git-filter-repo (recommended; install via pip/brew)
git filter-repo --path .project-config.json --invert-paths --force

# Option B — BFG
bfg --delete-files .project-config.json

# then, for any remaining string literals:
git filter-repo --replace-text <(printf '%s\n' \
  'HI39WL604tUewM4Etocn==>REDACTED' \
  'ASIAZV3A2ECZBJ6MSKLT==>REDACTED')

git push --force --all
git push --force --tags
```

Anyone with an existing clone must re-clone. Old forks/clones still hold the
secrets — which is, again, why Step 1 is the real fix.

## 4. Prevent recurrence

**Pre-commit hook** (`.git/hooks/pre-commit`, `chmod +x`):

```sh
#!/bin/sh
if command -v gitleaks >/dev/null 2>&1; then
  gitleaks protect --staged --config .gitleaks.toml --redact || {
    echo "✖ gitleaks blocked a secret. Fix before committing."; exit 1; }
fi
```

**CI gate** (GitHub Actions — `.github/workflows/secret-scan.yml`):

```yaml
name: secret-scan
on: [push, pull_request]
jobs:
  gitleaks:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with: { fetch-depth: 0 }
      - uses: gitleaks/gitleaks-action@v2
        env: { GITLEAKS_CONFIG: .gitleaks.toml }
```

## 5. Verify

```bash
gitleaks detect --source . --config .gitleaks.toml --log-opts="--all" --verbose
# expect: "no leaks found"
```
