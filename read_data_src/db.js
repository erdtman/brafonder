const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = path.join(__dirname, 'output', 'funds.db');

function getDb() {
    const db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    return db;
}

function initDb() {
    const dir = path.dirname(DB_PATH);
    if (!require('fs').existsSync(dir)) {
        require('fs').mkdirSync(dir, { recursive: true });
    }
    const db = getDb();

    // Funds table - basic fund info
    db.exec(`
        CREATE TABLE IF NOT EXISTS funds (
            id INTEGER PRIMARY KEY,
            name TEXT,
            avanza_url TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

    // Data points table - individual period returns
    db.exec(`
        CREATE TABLE IF NOT EXISTS data_points (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            fund_id INTEGER NOT NULL,
            period_type TEXT NOT NULL,
            start_date TEXT NOT NULL,
            end_date TEXT NOT NULL,
            value REAL NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (fund_id) REFERENCES funds(id),
            UNIQUE(fund_id, period_type, start_date)
        )
    `);

    // Create index for faster lookups
    db.exec(`
        CREATE INDEX IF NOT EXISTS idx_data_points_fund_period
        ON data_points(fund_id, period_type)
    `);

    db.exec(`
        CREATE INDEX IF NOT EXISTS idx_data_points_start_date
        ON data_points(fund_id, period_type, start_date)
    `);

    console.log('Database initialized at:', DB_PATH);
    db.close();
}

// Helper functions for fund operations
function getFund(db, fundId) {
    return db.prepare('SELECT * FROM funds WHERE id = ?').get(fundId);
}

function upsertFund(db, fund) {
    const stmt = db.prepare(`
        INSERT INTO funds (id, name, avanza_url, updated_at)
        VALUES (?, ?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(id) DO UPDATE SET
            name = excluded.name,
            avanza_url = excluded.avanza_url,
            updated_at = CURRENT_TIMESTAMP
    `);
    return stmt.run(fund.id, fund.name, fund.avanza_url);
}

// Helper functions for data points
function getLatestDataPoint(db, fundId, periodType) {
    return db.prepare(`
        SELECT * FROM data_points
        WHERE fund_id = ? AND period_type = ?
        ORDER BY start_date DESC
        LIMIT 1
    `).get(fundId, periodType);
}

function getDataPoints(db, fundId, periodType) {
    return db.prepare(`
        SELECT * FROM data_points
        WHERE fund_id = ? AND period_type = ?
        ORDER BY start_date ASC
    `).all(fundId, periodType);
}

function insertDataPoint(db, fundId, periodType, startDate, endDate, value) {
    const stmt = db.prepare(`
        INSERT OR IGNORE INTO data_points (fund_id, period_type, start_date, end_date, value)
        VALUES (?, ?, ?, ?, ?)
    `);
    return stmt.run(fundId, periodType, startDate, endDate, value);
}

function insertDataPointsBatch(db, dataPoints) {
    const stmt = db.prepare(`
        INSERT OR IGNORE INTO data_points (fund_id, period_type, start_date, end_date, value)
        VALUES (?, ?, ?, ?, ?)
    `);

    const insertMany = db.transaction((points) => {
        for (const point of points) {
            stmt.run(point.fundId, point.periodType, point.startDate, point.endDate, point.value);
        }
    });

    insertMany(dataPoints);
}

function getExistingStartDates(db, fundId, periodType) {
    const rows = db.prepare(`
        SELECT start_date FROM data_points
        WHERE fund_id = ? AND period_type = ?
    `).all(fundId, periodType);
    return new Set(rows.map(r => r.start_date));
}

function getDataPointCount(db, fundId, periodType) {
    const result = db.prepare(`
        SELECT COUNT(*) as count FROM data_points
        WHERE fund_id = ? AND period_type = ?
    `).get(fundId, periodType);
    return result ? result.count : 0;
}

function getTotalFundsWithData(db) {
    const result = db.prepare(`
        SELECT COUNT(DISTINCT fund_id) as count FROM data_points
    `).get();
    return result ? result.count : 0;
}

function getAllFundIds(db) {
    return db.prepare('SELECT id FROM funds ORDER BY id').all().map(r => r.id);
}

module.exports = {
    DB_PATH,
    getDb,
    initDb,
    getFund,
    upsertFund,
    getLatestDataPoint,
    getDataPoints,
    insertDataPoint,
    insertDataPointsBatch,
    getExistingStartDates,
    getDataPointCount,
    getTotalFundsWithData,
    getAllFundIds
};

// Run init if called directly
if (require.main === module) {
    initDb();
}
