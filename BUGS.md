 # BUGS.md

## BUG-001 (MEDIUM)
Title: CSRF protection partial via SameSite=Lax only
Impact: GET requests from top-level navigations may bypass protection.
Status: Deferred to v2
Fix: Add double-submit CSRF token in v2.

