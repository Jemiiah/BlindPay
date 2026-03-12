const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const { encrypt, decrypt } = require('./encryption');
const db = require('./db');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Prepared statements
const stmts = {
    getAllInvoices: db.prepare('SELECT * FROM invoices ORDER BY created_at DESC LIMIT ?'),
    getByStatus: db.prepare('SELECT * FROM invoices WHERE status = ? ORDER BY created_at DESC LIMIT ?'),
    getByHash: db.prepare('SELECT * FROM invoices WHERE invoice_hash = ?'),
    upsert: db.prepare(`
        INSERT INTO invoices (invoice_hash, merchant_address, status, invoice_transaction_id, salt, invoice_type, created_at, updated_at)
        VALUES (@invoice_hash, @merchant_address, @status, @invoice_transaction_id, @salt, @invoice_type, @created_at, @updated_at)
        ON CONFLICT(invoice_hash) DO UPDATE SET
            merchant_address = @merchant_address,
            status = @status,
            invoice_transaction_id = @invoice_transaction_id,
            salt = @salt,
            invoice_type = @invoice_type,
            updated_at = @updated_at
    `),
    update: db.prepare(`
        UPDATE invoices SET
            status = COALESCE(@status, status),
            payment_tx_ids = COALESCE(@payment_tx_ids, payment_tx_ids),
            block_settled = COALESCE(@block_settled, block_settled),
            updated_at = @updated_at
        WHERE invoice_hash = @invoice_hash
    `),
};

function decryptRow(row) {
    if (!row) return null;
    return {
        ...row,
        merchant_address: decrypt(row.merchant_address),
        payment_tx_ids: row.payment_tx_ids ? JSON.parse(row.payment_tx_ids) : [],
    };
}

app.get('/', (req, res) => {
    res.send('BlindPay Backend is running');
});

app.get('/api/invoices', (req, res) => {
    const { status, limit = 50, merchant } = req.query;

    try {
        let rows;
        if (status) {
            rows = stmts.getByStatus.all(status, Number(limit));
        } else {
            rows = stmts.getAllInvoices.all(Number(limit));
        }

        let decrypted = rows.map(decryptRow);

        if (merchant) {
            decrypted = decrypted.filter(inv => inv.merchant_address === merchant);
        }

        res.json(decrypted);
    } catch (err) {
        console.error('Error fetching invoices:', err);
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/invoices/merchant/:address', (req, res) => {
    const { address } = req.params;

    try {
        const rows = stmts.getAllInvoices.all(100);
        const merchantInvoices = rows
            .map(decryptRow)
            .filter(inv => inv.merchant_address === address);

        res.json(merchantInvoices);
    } catch (err) {
        console.error('Error fetching invoices:', err);
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/invoices/recent', (req, res) => {
    const { limit = 10 } = req.query;

    try {
        const rows = stmts.getAllInvoices.all(Number(limit));
        res.json(rows.map(decryptRow));
    } catch (err) {
        console.error('Error fetching recent invoices:', err);
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/invoice/:hash', (req, res) => {
    const { hash } = req.params;

    try {
        const row = stmts.getByHash.get(hash);
        if (!row) {
            return res.status(404).json({ error: 'Invoice not found' });
        }
        res.json(decryptRow(row));
    } catch (err) {
        console.error('Error fetching invoice:', err);
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/invoices', (req, res) => {
    const { invoice_hash, merchant_address, status, invoice_transaction_id, salt, invoice_type } = req.body;

    if (!invoice_hash || !merchant_address) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
        const now = new Date().toISOString();
        const encryptedMerchant = encrypt(merchant_address);

        stmts.upsert.run({
            invoice_hash,
            merchant_address: encryptedMerchant,
            status: status || 'PENDING',
            invoice_transaction_id: invoice_transaction_id || null,
            salt: salt || null,
            invoice_type: invoice_type !== undefined ? invoice_type : 0,
            created_at: now,
            updated_at: now,
        });

        const row = stmts.getByHash.get(invoice_hash);
        const result = decryptRow(row);
        res.json(result);
    } catch (err) {
        console.error('Error creating invoice:', err);
        res.status(500).json({ error: err.message });
    }
});

app.patch('/api/invoices/:hash', (req, res) => {
    const { hash } = req.params;
    const { status, payment_tx_ids, block_settled } = req.body;

    try {
        const current = stmts.getByHash.get(hash);
        if (!current) {
            return res.status(404).json({ error: 'Invoice not found' });
        }

        let mergedTxIds = current.payment_tx_ids ? JSON.parse(current.payment_tx_ids) : [];
        if (payment_tx_ids && !mergedTxIds.includes(payment_tx_ids)) {
            mergedTxIds.push(payment_tx_ids);
        }

        stmts.update.run({
            invoice_hash: hash,
            status: status || null,
            payment_tx_ids: mergedTxIds.length > 0 ? JSON.stringify(mergedTxIds) : null,
            block_settled: block_settled || null,
            updated_at: new Date().toISOString(),
        });

        const updated = stmts.getByHash.get(hash);
        res.json(decryptRow(updated));
    } catch (err) {
        console.error('Error updating invoice:', err);
        res.status(500).json({ error: err.message });
    }
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
