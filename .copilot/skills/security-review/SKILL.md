---
name: security-review
description: AI-powered codebase security scanner that traces data flows, understands component interactions, and catches vulnerabilities that pattern-matching tools miss. Use when scanning for SQL injection, XSS, command injection, exposed API keys, hardcoded secrets, insecure dependencies, or access control issues.
---

# Security Review

## Scan Steps (in order)

1. **Scope Resolution**: Identify languages/frameworks in use
2. **Dependency Audit**: Check package.json, requirements.txt, pyproject.toml for known CVEs
3. **Secrets Scan**: Scan ALL files including config, env, CI/CD, Dockerfiles for:
   - Hardcoded API keys, tokens, passwords, private keys
   - .env files accidentally committed
   - Secrets in comments or debug logs
4. **Vulnerability Deep Scan**:
   - Injection: SQL, XSS, Command, LDAP, Header, Log
   - Auth & Access Control: Missing auth, BOLA/IDOR, JWT weaknesses, CSRF, privilege escalation
   - Data Handling: Sensitive data in logs, missing encryption, path traversal, SSRF
   - Cryptography: MD5/SHA1/DES for security, hardcoded IVs, weak RNG
   - Business Logic: Race conditions, missing rate limiting, predictable IDs
5. **Cross-File Data Flow Analysis**: Trace user input from entry points to dangerous sinks
6. **Self-Verification Pass**: Re-examine each finding, filter false positives
7. **Security Report**: Findings by severity with file path, line number, vulnerable code
8. **Patches**: For CRITICAL/HIGH findings, show before/after with explanation

## Severity
- 🔴 CRITICAL: SQLi, RCE, auth bypass
- 🟠 HIGH: XSS, IDOR, hardcoded secrets
- 🟡 MEDIUM: CSRF, open redirect, weak crypto
- 🔵 LOW: Best practice violation, missing headers
- ⚪ INFO: Outdated dependency (no CVE)

Never auto-apply patches. Present for human review only.
