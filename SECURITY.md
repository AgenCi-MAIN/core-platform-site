# Source privacy and security

This repository implements a private operating portal. Operational records,
membership data, and deployment runbooks are internal material, even when the
application has public routes. The starter README and `package.json`'s
`private` field do not control GitHub repository visibility.

Keep the repository private until a complete source and history review approves
publication. Deleting or replacing a file in a new commit does not remove prior
versions. Repository privacy does not recall existing clones, forks, or caches.

Report sensitive findings through the repository's private vulnerability
reporting channel, if enabled, or an established private owner channel. Do not
paste identities, credentials, account identifiers, or internal records into
public issues, PR descriptions, screenshots, or third-party scanners.

## Local source inventory

Run `node scripts/audit-source-privacy.mjs` for counts without values or filenames.
The optional `--check` flag returns a failing exit code when candidates exist.
The scanner reads tracked working-tree text only; it does not scan Git history,
binary artifacts, untracked files, or prove that credentials are absent.
Identifier candidates include hashes; personal email candidates require review.

## Preserve the access model during cleanup

- Keep operational backups and new roster exports in restricted storage.
- Do not replace production allowlist identities with examples or broaden access
  based on roles. Session identity and active database membership must remain
  independent, server-side checks.
- Move identity configuration to server-side bindings only with a tested rollout
  that preserves existing founder and command permissions and fails closed.
- Do not rewrite applied database migrations as a substitute for removing data
  from public history. Fresh provisioning and authorization tests use them.
- Do not publish this repository while historical operational records remain
  available. A publication project needs a separate sanitized source export and
  history review, with private backups preserved before any destructive action.
