const { getDb } = require('./db.js');
const { average, median, std } = require('./utils.js');
const { describeFund } = require('./describeFund.js');
const fs = require('fs');
const path = require('path');

function computeTerciles(db) {
    const rows = db.prepare(`
        SELECT fund_id, value FROM data_points WHERE period_type = '5-year'
        ORDER BY fund_id, start_date ASC
    `).all();

    // Group values by fund, compute per-fund std, collect all stds
    const byFund = {};
    for (const row of rows) {
        if (!byFund[row.fund_id]) byFund[row.fund_id] = [];
        byFund[row.fund_id].push(row.value);
    }

    const stds = [];
    for (const values of Object.values(byFund)) {
        if (values.length < 40) continue;
        const avg = values.reduce((s, v) => s + v, 0) / values.length;
        const variance = values.reduce((s, v) => s + (v - avg) ** 2, 0) / values.length;
        stds.push(Math.sqrt(variance));
    }

    stds.sort((a, b) => a - b);
    const p33 = stds[Math.floor(stds.length * 0.333)];
    const p66 = stds[Math.floor(stds.length * 0.666)];
    return { p33, p66 };
}

function exportFundList() {
    const db = getDb();

    const terciles = computeTerciles(db);
    console.log(`Terciles — stabil: <${terciles.p33.toFixed(1)}, måttlig: ${terciles.p33.toFixed(1)}–${terciles.p66.toFixed(1)}, volatil: ≥${terciles.p66.toFixed(1)}`);

    const funds = db.prepare('SELECT id, name, avanza_url FROM funds ORDER BY id').all();
    const result = [];

    for (const fund of funds) {
        const entry = {
            id: String(fund.id),
            name: fund.name,
            avanza_url: fund.avanza_url
        };

        for (const [periodType, key] of [['1-year', 'one_year'], ['5-year', 'five_years'], ['10-year', 'ten_years']]) {
            const values = db.prepare(`
                SELECT value FROM data_points
                WHERE fund_id = ? AND period_type = ?
                ORDER BY start_date ASC
            `).all(fund.id, periodType).map(r => r.value);

            if (values.length === 0) {
                entry[key] = { average: -99999, median: -99999, periods: 0, std: -99999 };
            } else {
                entry[key] = {
                    average: Math.round(average(values) * 100) / 100,
                    median: Math.round(median(values) * 100) / 100,
                    periods: values.length,
                    std: Math.round(std(values) * 100) / 100
                };
            }
        }

        // Only include funds with at least some data
        if (entry.one_year.periods > 0 || entry.five_years.periods > 0 || entry.ten_years.periods > 0) {
            const dataForDescriptions = {};
            for (const periodType of ['1-year', '5-year', '10-year']) {
                const points = db.prepare(`
                    SELECT value FROM data_points
                    WHERE fund_id = ? AND period_type = ?
                    ORDER BY start_date ASC
                `).all(fund.id, periodType);
                dataForDescriptions[periodType] = points.map(p => ({ value: p.value }));
            }
            entry.description = describeFund(dataForDescriptions, terciles, String(fund.id));

            result.push(entry);
        }
    }

    db.close();

    const outputPath = path.join(__dirname, '..', 'src', 'data', 'fundDataAll.json');
    fs.writeFileSync(outputPath, JSON.stringify(result));

    console.log(`Exported ${result.length} funds to ${outputPath}`);
}

exportFundList();
