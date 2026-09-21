# Production Deployment

Required environment:
- DATABASE_URL
- AUTH_SECRET
- DATABASE_SSL=true for managed PostgreSQL where required
- STRIPE_SECRET_KEY and STRIPE_WEBHOOK_SECRET for billing
- POSTHOG_KEY and POSTHOG_HOST for analytics
- AI_API_URL and AI_API_KEY for external AI

Deployment sequence:
1. Provision PostgreSQL.
2. Set environment variables.
3. Run `npm run db:migrate` once against production.
4. Run `npm run build`.
5. Start with `npm start` or deploy to Vercel.
6. Configure Stripe webhook to `/api/stripe/webhook`.
7. Monitor `/api/health`.

Security:
- Never commit `.env` files.
- Use a random AUTH_SECRET of at least 32 bytes.
- Use HTTPS.
- Use managed database backups.
- Rotate provider keys if exposed.
- Restrict database access to the application network.
