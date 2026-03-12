const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

const db = new Database(path.join(dataDir, 'blindpay.db'));

// WAL mode for better concurrent read performance
db.pragma('journal_mode = WAL');

db.exec(`
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

module.exports = db;
