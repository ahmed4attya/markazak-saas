# مركزك — Training Center SaaS

Multi-tenant training-center management platform built with Next.js, TypeScript and PostgreSQL.

## Features
Dashboard, students, teachers, courses, groups, attendance, invoices/payments, certificates, reports, RBAC-ready users, subscriptions/plans, AI assistant, audit schema, responsive RTL UI and integration environment for Stripe/PostHog/AI.

## Local
```bash
cp .env.example .env.local
docker compose up -d
npm install
npm run db:migrate
npm run db:seed
npm run dev
```
Demo: `admin@center.sa` / `admin123`

## Production
Use managed PostgreSQL, set a strong `AUTH_SECRET`, database SSL, and provider keys. Run `npm run db:migrate`, `npm run build`, then `npm start` or deploy to Vercel.
