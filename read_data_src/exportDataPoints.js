const { getDb } = require('./db.js');
const fs = require('fs');
const path = require('path');

function exportDataPoints() {
    const db = getDb();

    const funds = db.prepare('SELECT id, name FROM funds ORDER BY id').all();

    const outputDir = path.join(__dirname, '..', 'dist', 'data', 'funds');
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    let fundCount = 0;
    let totalPoints = 0;

    for (const fund of funds) {
        const dataPoints = {
            '1-year': [],
            '5-year': [],
            '10-year': []
        };

        for (const periodType of ['1-year', '5-year', '10-year']) {
            const points = db.prepare(`
                SELECT start_date, end_date, value
                FROM data_points
                WHERE fund_id = ? AND period_type = ?
                ORDER BY start_date ASC
            `).all(fund.id, periodType);

            dataPoints[periodType] = points.map(p => ({
                start: p.start_date.substring(0, 7),
                end: p.end_date.substring(0, 7),
                value: p.value
            }));

            totalPoints += points.length;
        }

        if (dataPoints['1-year'].length > 0 ||
            dataPoints['5-year'].length > 0 ||
            dataPoints['10-year'].length > 0) {
            const filePath = path.join(outputDir, `${fund.id}.json`);
            fs.writeFileSync(filePath, JSON.stringify(dataPoints));
            fundCount++;
        }
    }

    db.close();

    console.log(`Exported ${fundCount} fund files to ${outputDir}`);
    console.log(`Total data points: ${totalPoints}`);
}

exportDataPoints();
