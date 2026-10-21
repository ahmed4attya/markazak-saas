const { Pool } = require('pg');
const bcrypt = require('bcrypt');

async function seed() {
    const pool = new Pool({ connectionString: 'postgresql://postgres:postgres@localhost:5432/training_center' });
    try {
        // 1. Schema setup
        await pool.query('CREATE TABLE IF NOT EXISTS users (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id TEXT, email TEXT UNIQUE, name TEXT, password_hash TEXT, role TEXT, active BOOLEAN DEFAULT true)');
        
        const pwd = await bcrypt.hash('password123', 12);
        const roles = [
            { email: 'admin@local.test', role: 'admin', name: 'Local Admin' },
            { email: 'teacher@local.test', role: 'teacher', name: 'Local Teacher' },
            { email: 'student@local.test', role: 'student', name: 'Local Student' },
            { email: 'guardian@local.test', role: 'guardian', name: 'Local Guardian' },
            { email: 'manager@local.test', role: 'manager', name: 'Local Manager' },
        ];

        for (const user of roles) {
            await pool.query('INSERT INTO users (tenant_id, email, name, password_hash, role) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (email) DO NOTHING', ['local-tenant', user.email, user.name, pwd, user.role]);
        }
        console.log('Local Seeding: Success');
    } catch (e) {
        console.error('Local Seeding Fail:', e.message);
    } finally {
        await pool.end();
    }
}
seed();
