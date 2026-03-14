const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
});

async function initDB() {
    const client = await pool.connect();
    try {
        await client.query(`
            CREATE TABLE IF NOT EXISTS invoices (
                invoice_hash TEXT PRIMARY KEY,
                merchant_address TEXT,
                status TEXT NOT NULL DEFAULT 'PENDING',
                block_height INTEGER,
                block_settled INTEGER,
                invoice_transaction_id TEXT,
                payment_tx_ids TEXT,
                salt TEXT,
                invoice_type INTEGER DEFAULT 0,
                token_type INTEGER DEFAULT 0,
                created_at TEXT,
                updated_at TEXT
            )
        `);

        // Create indexes if they don't exist
        await client.query(`CREATE INDEX IF NOT EXISTS idx_status ON invoices (status)`);
        await client.query(`CREATE INDEX IF NOT EXISTS idx_merchant_address ON invoices (merchant_address)`);
        await client.query(`CREATE INDEX IF NOT EXISTS idx_created_at ON invoices (created_at DESC)`);
        await client.query(`CREATE INDEX IF NOT EXISTS idx_invoice_transaction_id ON invoices (invoice_transaction_id)`);

        console.log('Database initialized successfully');
    } finally {
        client.release();
    }
}

module.exports = { pool, initDB };
