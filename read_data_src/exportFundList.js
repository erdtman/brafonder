const { getDb } = require('./db.js');
const { average, median, std } = require('./utils.js');
const { describeFund } = require('./describeFund.js');
const fs = require('fs');
const path = require('path');

function exportFundList() {
    const db = getDb();

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
            // Build descriptions from full data point arrays
            const dataForDescriptions = {};
            for (const periodType of ['1-year', '5-year', '10-year']) {
                const points = db.prepare(`
                    SELECT start_date, end_date, value FROM data_points
                    WHERE fund_id = ? AND period_type = ?
                    ORDER BY start_date ASC
                `).all(fund.id, periodType);
                dataForDescriptions[periodType] = points.map(p => ({ value: p.value }));
            }
            entry.descriptions = describeFund(dataForDescriptions);

            result.push(entry);
        }
    }

    db.close();

    const outputPath = path.join(__dirname, '..', 'src', 'data', 'fundDataAll.json');
    fs.writeFileSync(outputPath, JSON.stringify(result));

    console.log(`Exported ${result.length} funds to ${outputPath}`);
}

exportFundList();
