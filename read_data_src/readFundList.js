const fs = require('fs');
const path = require('path');
const axios = require('axios');

const BATCH_SIZE = 20;

function progressBar(current, total, width = 30) {
    const percent = current / total;
    const filled = Math.round(width * percent);
    const empty = width - filled;
    const bar = '█'.repeat(filled) + '░'.repeat(empty);
    return `[${bar}] ${Math.round(percent * 100)}%`;
}

async function fetchBatch(startIndex) {
    const response = await axios.post('https://www.avanza.se/_api/fund-guide/list', {
        "startIndex": startIndex,
        "indexFund": false,
        "lowCo2": false,
        "regionFilter": [],
        "countryFilter": [],
        "alignmentFilter": [],
        "industryFilter": [],
        "fundTypeFilter": [],
        "interestTypeFilter": [],
        "sortField": "name",
        "sortDirection": "DESCENDING",
        "name": "",
        "recommendedHoldingPeriodFilter": [],
        "companyFilter": [],
        "productInvolvementsFilter": []
    });

    return {
        funds: response.data.fundListViews.map(fund => fund.orderbookId),
        totalCount: response.data.totalNoFunds
    };
}

async function all() {
    const startTime = Date.now();

    console.log('\n  Downloading fund list from Avanza\n');

    // First request to get total count
    console.log('  Fetching total fund count...');
    const firstBatch = await fetchBatch(0);
    const totalFunds = firstBatch.totalCount;
    const totalBatches = Math.ceil(totalFunds / BATCH_SIZE);

    console.log(`  Found ${totalFunds} funds on Avanza\n`);

    let allFunds = [...firstBatch.funds];

    // Fetch remaining batches
    for (let i = BATCH_SIZE; i < totalFunds; i += BATCH_SIZE) {
        const batchNum = Math.floor(i / BATCH_SIZE) + 1;
        const progress = progressBar(batchNum, totalBatches);

        process.stdout.write(`\r  ${progress}  Batch ${batchNum}/${totalBatches} (funds ${i + 1}-${Math.min(i + BATCH_SIZE, totalFunds)})`);

        const batch = await fetchBatch(i);
        allFunds = allFunds.concat(batch.funds);
    }

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

    // Clear progress line and show report
    process.stdout.write('\r' + ' '.repeat(80) + '\r');

    console.log('  ┌─────────────────────────────────────┐');
    console.log('  │         DOWNLOAD COMPLETE           │');
    console.log('  ├─────────────────────────────────────┤');
    console.log(`  │  Funds found:    ${String(allFunds.length).padStart(6)}            │`);
    console.log(`  │  Time elapsed:   ${String(elapsed + 's').padStart(6)}            │`);
    console.log('  └─────────────────────────────────────┘\n');

    const outDir = path.join(__dirname, 'output');
    if (!fs.existsSync(outDir)) {
        fs.mkdirSync(outDir, { recursive: true });
    }
    const outPath = path.join(outDir, 'funds.json');
    fs.writeFileSync(outPath, JSON.stringify(allFunds, null, 1));
    console.log(`  Saved to: ${outPath}\n`);
}

all();
