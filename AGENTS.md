# Agent rules
1. Never access tenant-owned data without tenant scope.
2. Every mutation requires authorization and validation.
3. Every schema change requires a migration.
4. Never expose server secrets to client components.
5. Stripe state is synchronized only through verified webhooks.
6. Add audit log entries for sensitive mutations.
7. Add automated tests for business-critical flows.
8. Keep Arabic RTL UI accessible and responsive.
