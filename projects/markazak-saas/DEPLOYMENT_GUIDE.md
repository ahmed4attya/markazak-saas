# DEPLOYMENT_GUIDE.md

## Manual Deployment Guide for markazak-saas (v1.0-beta)

### Part A: Create Production Database (Neon)
1. Go to https://neon.tech
2. Sign up with GitHub
3. Create project: `markazak-saas-prod`, region: Frankfurt (closest to KSA)
4. Copy the connection string (starts with `postgresql://`)
5. Save it as: `DATABASE_URL_PROD`

### Part B: Create GitHub Repository
1. Go to https://github.com/new
2. Name: `markazak-saas`
3. Visibility: Private
4. Do NOT initialize with README
5. Copy the repository URL

Run these commands in the project folder:
```bash
git init
git add .
git commit -m "v1.0.0-beta: initial commit"
git branch -M main
git remote add origin <REPO_URL>
git push -u origin main
```

### Part C: Run Migrations on Production DB
In PowerShell:
```powershell
$env:DATABASE_URL="<PROD_URL>"
npm run db:migrate
npm run db:seed
```
Verify with: connect to Neon dashboard $\rightarrow$ tables should exist.

### Part D: Deploy on Vercel
1. Go to https://vercel.com/new
2. Import the GitHub repo (`markazak-saas`)
3. Framework: Next.js (auto-detected)
4. Add environment variables:
   - `AUTH_SECRET`: <generate new with: `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`>
   - `DATABASE_URL`: <PROD_URL>
   - `NODE_ENV`: `production`
5. Click Deploy
6. Wait 2-3 min for build
7. Copy the deployment URL (e.g., `markazak-saas.vercel.app`)

### Part E: Post-Deploy Verification
1. Open the URL
2. Test: login $\rightarrow$ attendance $\rightarrow$ reports
3. If any error: check Vercel $\rightarrow$ Logs
4. Update `BETA_GUIDE.md` with the real URL and credentials.
