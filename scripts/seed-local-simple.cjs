const { Pool } = require('pg');
const bcrypt = require('bcrypt');

async function seed() {
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    try {
        await pool.query('CREATE TABLE IF NOT EXISTS users (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id TEXT, email TEXT UNIQUE, name TEXT, password_hash TEXT, role TEXT, active BOOLEAN DEFAULT true)');
        const passwordHash = await bcrypt.hash('admin123', 12);
        await pool.query('INSERT INTO users (tenant_id, email, name, password_hash, role) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (email) DO NOTHING', ['tenant-1', 'admin@example.com', 'Admin User', passwordHash, 'admin']);
        console.log('Local Seed: Success');
    } catch (e) {
        console.error('Local Seed Fail:', e.message);
    } finally {
        await pool.end();
    }
}
seed();
