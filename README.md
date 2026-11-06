# مركزك — Training Center SaaS

Multi-tenant training-center management platform built with Next.js, TypeScript and PostgreSQL.

## Features
- **18,996+ Questions Bank**: Integrated live in PostgreSQL/Neon (10,224 Quant, 4,562 Achievement, 4,210 Verbal including 300 full verbal sections with passages and 100% official verified keys).
- **Smart Exam & Assignment Generator**: One-click generation by course/domain/subject with automatic and manual modes, algorithm-based recommendations, and auto-exclusion of previously used questions.
- **Zero-Lag UI & Silent Letter Grid**: Ultra-fast next-question preloading with ergonomic thumb-friendly letter grids (أ، ب، ج، د) for questions with diagrams.
- **Training Center Core**: Multi-tenant dashboard, students, teachers, courses, groups, attendance, invoices/payments, certificates, reports, RBAC-ready users, subscriptions/plans, AI assistant, audit schema, responsive RTL UI (Night Luxe theme) and integration environment.

## Upcoming High-Impact Roadmap (Top of Implementation on Demand)
1. **Printable Branded PDF Exam & Assignment Exporter**: 1-click export of generated tests/homework into high-end center-branded PDFs (Student version with answer sheet + Teacher version with full answer keys and explanations).
2. **Spaced Repetition Mistakes Bank (Leitner System)**: Smart auto-review intervals (48h -> 1w -> 1m) to guarantee 100% question mastery.
3. **Knowledge Gap Heatmap & AI Score Predictor (IRT Model)**: Deep skill breakdown showing exact student weak points with targeted remedy drills.
4. **1v1 PvP Live Challenge Arena**: Real-time peer-to-peer quizzes and leaderboard system.
5. **Real Qiyas Computerized Exam Simulator**: 100% faithful replication of the actual Saudi Qiyas testing center interface.

## Local
```bash
cp .env.example .env.local
docker compose up -d
npm install
npm run db:migrate
npm run db:seed
npm run dev
```

## Production
Use managed PostgreSQL, set a strong `AUTH_SECRET`, database SSL, and provider keys. Run `npm run db:migrate`, `npm run build`, then `npm start` or deploy to Vercel.
