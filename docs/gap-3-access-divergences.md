# GAP-3 closure record: /api/quick-contact divergence (M1-p4)

Status: DOCUMENTED DIVERGENCE, zero code change. Ratified via owner
non-override of the p4 defaults declared in C2-M1-p4-c2 (defaults applied
through p4-w2 attendance ownership and this p4-w3 register flip).

## Decision

/api/quick-contact intentionally stays STAFF-ONLY (owner/manager/admin) and
diverges from the public marketing pattern used by /api/leads:

- /api/leads POST is public by design (public site contact form) and is
  rate-limited by middleware (RL_LIMITS).
- /api/quick-contact is an in-app quick channel. Anonymous callers get 401 at
  middleware (no session cookie), and any authenticated non-staff role gets
  403 from the in-route isAdmin guard on both GET and POST.

## Enforcement reality (verified in the p4-c2 harvest @655a634)

- Middleware: /api/quick-contact is NOT in the public exemption list, so every
  request requires a session cookie first.
- Route handler: GET and POST both self-guard with isAdmin (lib/auth), so
  teachers and learner roles are rejected with 403 even with a valid session.
- No route change ships: the existing guards already match the decision.

## Related read-scope divergence (recorded here, no code in M1)

- GET /api/attendance is session-only + tenant-scoped (limit 1000): any
  authenticated principal in the tenant can read attendance tenant-wide.
  Learner reads go through /api/learner/attendance (own rows only).
- Attendance writes are ownership-gated as of dcf667f: POST /api/attendance
  and PATCH /api/attendance/[id] require admin, or a teacher with a
  course_teachers assignment for the target group.
- Accepted for M1; revisit read scoping in the M2 RBAC pass.
