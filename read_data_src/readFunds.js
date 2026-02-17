const axios = require('axios');
const moment = require('moment');
const fs = require('fs');
const { padWithZero } = require('./utils.js');
const { getDb, initDb, upsertFund, insertDataPoint, getExistingStartDates } = require('./db.js');

// Configuration
const PARALLEL_WORKERS = 1;          // Single worker to minimize rate limiting
const REQUEST_DELAY_MS = 10;         // Delay between API requests
const FUND_DELAY_MS = 100;           // Delay between funds
const MAX_RETRIES = 3;               // Max retries per request
const INITIAL_RETRY_DELAY_MS = 5000; // Initial retry delay (exponential backoff)
const START_YEAR = 1998;
const END_DATE = "2026-01-31";
const FUNDS_FILE = process.argv[2] || 'output/funds.json';
const LOG_FILE = 'output/download.log';

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function fetchWithRetry(url, retries = MAX_RETRIES) {
    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            const response = await axios.get(url);
            return response;
        } catch (error) {
            const isRateLimited = error.code === 'ETIMEDOUT' ||
                                  error.code === 'ECONNRESET' ||
                                  error.response?.status === 429 ||
                                  error.response?.status === 503;

            if (isRateLimited && attempt < retries) {
                const delay = INITIAL_RETRY_DELAY_MS * Math.pow(2, attempt - 1);
                log(`RETRY [attempt ${attempt}/${retries}] - Waiting ${delay/1000}s before retry...`);
                await sleep(delay);
            } else {
                throw error;
            }
        }
    }
}

// State for UI
const workerState = {};
let completedFunds = 0;
let skippedFunds = 0;
let updatedFunds = 0;
let errorFunds = 0;
let totalFunds = 0;
let newDataPoints = 0;
let startTime = null;
let logStream = null;

function log(message) {
    const timestamp = new Date().toISOString();
    const line = `[${timestamp}] ${message}\n`;
    if (logStream) {
        logStream.write(line);
    }
}

function initLog() {
    const logPath = `${__dirname}/${LOG_FILE}`;
    const logDir = require('path').dirname(logPath);
    if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
    }
    logStream = fs.createWriteStream(logPath, { flags: 'a' });
    log('='.repeat(70));
    log('Download started');
    log(`END_DATE: ${END_DATE}`);
}

function progressBar(current, total, width = 20) {
    if (total === 0) return '░'.repeat(width);
    const percent = Math.min(current / total, 1);
    const filled = Math.round(width * percent);
    const empty = width - filled;
    return '█'.repeat(filled) + '░'.repeat(empty);
}

function formatTime(ms) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
}

function renderUI() {
    const processedTotal = completedFunds + skippedFunds + updatedFunds + errorFunds;
    const overallPercent = totalFunds > 0 ? Math.round((processedTotal / totalFunds) * 100) : 0;
    const elapsed = startTime ? formatTime(Date.now() - startTime) : '0s';

    // Calculate ETA based on actual work done (not skipped)
    let eta = '--';
    const actualWork = completedFunds + updatedFunds;
    if (actualWork > 0 && startTime) {
        const elapsedMs = Date.now() - startTime;
        const msPerFund = elapsedMs / actualWork;
        const remainingWork = totalFunds - processedTotal;
        // Estimate how many will need work vs skip
        const workRatio = actualWork / Math.max(processedTotal, 1);
        eta = formatTime(msPerFund * remainingWork * workRatio);
    }

    // Build output
    let output = '\x1B[2J\x1B[H'; // Clear screen and move to top

    output += '\n  ┌─────────────────────────────────────────────────────────────────┐\n';
    output += '  │              FUND DATA DOWNLOADER (SQLite)                      │\n';
    output += '  └─────────────────────────────────────────────────────────────────┘\n\n';

    output += `  Overall Progress: [${progressBar(processedTotal, totalFunds, 30)}] ${overallPercent}%\n`;
    output += `  Funds: ${processedTotal}/${totalFunds}  |  New: ${completedFunds}  |  Updated: ${updatedFunds}  |  Skipped: ${skippedFunds}  |  Errors: ${errorFunds}\n`;
    output += `  New data points: ${newDataPoints}  |  Elapsed: ${elapsed}  |  ETA: ${eta}\n\n`;

    output += '  ─────────────────────────────────────────────────────────────────\n';
    output += '  Workers:\n\n';

    for (let i = 1; i <= PARALLEL_WORKERS; i++) {
        const state = workerState[i];
        if (!state || state.status === 'idle') {
            output += `  [${i}] Idle\n\n`;
        } else if (state.status === 'working') {
            const fundName = state.fundName ? state.fundName.substring(0, 30).padEnd(30) : 'Loading...'.padEnd(30);
            const phase = state.phase || 'init';
            const phaseProgress = state.phaseProgress || 0;
            const phaseTotal = state.phaseTotal || 1;
            const phasePercent = phaseTotal > 0 ? Math.round((phaseProgress / phaseTotal) * 100) : 0;
            const status = state.isUpdate ? '(updating)' : '(new)';

            output += `  [${i}] ${fundName} ${status}\n`;
            output += `      ${phase.padEnd(8)} [${progressBar(phaseProgress, phaseTotal, 15)}] ${phasePercent}% (${phaseProgress}/${phaseTotal})\n\n`;
        }
    }

    output += '  ─────────────────────────────────────────────────────────────────\n';

    process.stdout.write(output);
}

function getFirstInYear(dataSerie, year, month = 0) {
    for (let index = 0; index < dataSerie.length; index++) {
        const raw_time = dataSerie[index];
        if (raw_time.y === null || raw_time.y === 0) continue;
        const time = moment(raw_time.x);
        if (time.year() === year && time.month() === month) {
            return raw_time;
        }
    }
    return { y: -1 };
}

function getFirstYearAndMonth(dataSerie) {
    for (let index = 0; index < dataSerie.length; index++) {
        const raw_time = dataSerie[index];
        if (raw_time.y === null || raw_time.y === 0) continue;
        const time = moment(raw_time.x);
        return { firstYear: time.year(), firstMonth: time.month() };
    }
    return null;
}

// Get all available periods as {startDate, endDate} objects
function getAllPeriods(dataSerie, period, _startYear) {
    const result = getFirstYearAndMonth(dataSerie);
    if (!result) return [];

    const { firstYear, firstMonth } = result;
    const startYear = firstYear > _startYear ? firstYear : _startYear;
    const startMonth = firstYear > startYear ? (firstMonth + 1) : 1;
    let cursor = moment(`${startYear}-${startMonth}-01`);
    const periods = [];

    while (getFirstInYear(dataSerie, cursor.year() + period, cursor.month()).y !== -1) {
        const month = padWithZero(cursor.month() + 1);
        const startDate = `${cursor.year()}-${month}-01`;
        const endDate = `${cursor.year() + period}-${month}-01`;
        periods.push({ startDate, endDate });
        cursor.add(1, "month");
    }

    return periods;
}

async function fetchMissingPeriods(db, fundId, periodType, missingPeriods, onProgress) {
    let fetched = 0;

    for (const { startDate, endDate } of missingPeriods) {
        const url = `https://www.avanza.se/_api/fund-guide/chart/${fundId}/${startDate}/${endDate}`;
        const response = await fetchWithRetry(url);
        const last = response.data.dataSerie.pop();

        insertDataPoint(db, fundId, periodType, startDate, endDate, last.y);

        fetched++;
        if (onProgress) onProgress(fetched);

        await sleep(REQUEST_DELAY_MS);
    }

    return fetched;
}

async function processFund(db, fundId, workerId, onProgress) {
    // Fetch initial fund data
    const response = await fetchWithRetry(
        `https://www.avanza.se/_api/fund-guide/chart/${fundId}/${START_YEAR}-01-01/${END_DATE}`
    );
    await sleep(REQUEST_DELAY_MS);

    const dataSerie = response.data.dataSerie;
    const fundName = response.data.name;

    // Upsert fund info
    upsertFund(db, {
        id: fundId,
        name: fundName,
        avanza_url: `https://www.avanza.se/fonder/om-fonden.html/${fundId}`
    });

    // Get all possible periods and existing data from DB
    const periodConfigs = [
        { period: 1, type: '1-year' },
        { period: 5, type: '5-year' },
        { period: 10, type: '10-year' },
    ];

    const missingByType = {};
    let totalExisting = 0;

    for (const { period, type } of periodConfigs) {
        const allPeriods = getAllPeriods(dataSerie, period, START_YEAR);
        const existingDates = getExistingStartDates(db, fundId, type);
        totalExisting += existingDates.size;
        missingByType[type] = allPeriods.filter(p => !existingDates.has(p.startDate));
    }

    const isUpdate = totalExisting > 0;
    const totalNeeded = Object.values(missingByType).reduce((sum, arr) => sum + arr.length, 0);

    if (totalNeeded === 0) {
        const allEmpty = periodConfigs.every(({ period }) => getAllPeriods(dataSerie, period, START_YEAR).length === 0);
        const reason = allEmpty
            ? 'No historical data available (fund too new or no valid data points)'
            : `Already complete - no missing periods`;
        log(`SKIP [${fundId}] "${fundName}" - ${reason}`);
        return { fundName, isUpdate, newPoints: 0, skipped: true };
    }

    log(`FETCH [${fundId}] "${fundName}" - Missing: 1yr=${missingByType['1-year'].length}, 5yr=${missingByType['5-year'].length}, 10yr=${missingByType['10-year'].length}`);

    let totalNewPoints = 0;

    for (const { type } of periodConfigs) {
        const missing = missingByType[type];
        if (missing.length === 0) continue;

        onProgress({
            phase: type,
            phaseProgress: 0,
            phaseTotal: missing.length,
            fundName,
            isUpdate
        });

        const fetched = await fetchMissingPeriods(db, fundId, type, missing, (progress) => {
            onProgress({
                phase: type,
                phaseProgress: progress,
                phaseTotal: missing.length,
                fundName,
                isUpdate
            });
        });
        totalNewPoints += fetched;
    }

    log(`DONE [${fundId}] "${fundName}" - Added ${totalNewPoints} data points`);
    return { fundName, isUpdate, newPoints: totalNewPoints, skipped: false };
}

async function worker(workerId, funds, getNextIndex) {
    const db = getDb();

    while (true) {
        const index = getNextIndex();
        if (index === null) {
            workerState[workerId] = { status: 'idle' };
            renderUI();
            break;
        }

        workerState[workerId] = {
            status: 'working',
            fundName: null,
            phase: 'init',
            phaseProgress: 0,
            phaseTotal: 1,
            isUpdate: false
        };
        renderUI();

        const fundId = funds[index];
        try {
            const result = await processFund(db, fundId, workerId, (progress) => {
                workerState[workerId] = { status: 'working', ...progress };
                renderUI();
            });

            if (result.skipped) {
                skippedFunds++;
            } else if (result.isUpdate) {
                updatedFunds++;
                newDataPoints += result.newPoints;
            } else {
                completedFunds++;
                newDataPoints += result.newPoints;
            }
        } catch (error) {
            errorFunds++;
            const errorMsg = error.response?.status
                ? `HTTP ${error.response.status}: ${error.response.statusText}`
                : error.message;
            log(`ERROR [${fundId}] - ${errorMsg}`);
        }

        renderUI();

        // Delay between funds to avoid rate limiting
        await sleep(FUND_DELAY_MS);
    }

    db.close();
}

async function main() {
    // Initialize logging
    initLog();

    // Initialize database
    initDb();

    // Read funds list
    const fundsPath = `${__dirname}/${FUNDS_FILE}`;
    if (!fs.existsSync(fundsPath)) {
        console.error(`Funds file not found: ${fundsPath}`);
        console.error('Run readFundList.js first to fetch the list of funds.');
        process.exit(1);
    }

    const funds = JSON.parse(fs.readFileSync(fundsPath, 'utf8'));
    totalFunds = funds.length;
    startTime = Date.now();

    // Index counter for work distribution
    let currentIndex = 0;
    const getNextIndex = () => {
        if (currentIndex >= funds.length) return null;
        return currentIndex++;
    };

    renderUI();

    // Start workers
    const workers = [];
    for (let i = 1; i <= PARALLEL_WORKERS; i++) {
        workerState[i] = { status: 'idle' };
        workers.push(worker(i, funds, getNextIndex));
    }

    await Promise.all(workers);

    // Final report
    const elapsed = formatTime(Date.now() - startTime);

    // Get DB stats
    const db = getDb();
    const fundCount = db.prepare('SELECT COUNT(*) as count FROM funds').get().count;
    const dataPointCount = db.prepare('SELECT COUNT(*) as count FROM data_points').get().count;
    db.close();

    console.log('\n');
    console.log('  ┌─────────────────────────────────────────────────────────────────┐');
    console.log('  │                      DOWNLOAD COMPLETE                          │');
    console.log('  ├─────────────────────────────────────────────────────────────────┤');
    console.log(`  │  Total funds:      ${String(totalFunds).padStart(6)}                                    │`);
    console.log(`  │  New funds:        ${String(completedFunds).padStart(6)}                                    │`);
    console.log(`  │  Updated funds:    ${String(updatedFunds).padStart(6)}                                    │`);
    console.log(`  │  Skipped:          ${String(skippedFunds).padStart(6)}                                    │`);
    console.log(`  │  Errors:           ${String(errorFunds).padStart(6)}                                    │`);
    console.log(`  │  New data points:  ${String(newDataPoints).padStart(6)}                                    │`);
    console.log(`  │  Time elapsed:     ${elapsed.padStart(6)}                                    │`);
    console.log('  ├─────────────────────────────────────────────────────────────────┤');
    console.log(`  │  DB total funds:   ${String(fundCount).padStart(6)}                                    │`);
    console.log(`  │  DB data points:   ${String(dataPointCount).padStart(6)}                                    │`);
    console.log('  └─────────────────────────────────────────────────────────────────┘\n');

    // Log summary
    log(`COMPLETE - New: ${completedFunds}, Updated: ${updatedFunds}, Skipped: ${skippedFunds}, Errors: ${errorFunds}, New points: ${newDataPoints}`);
    log('='.repeat(70));
    if (logStream) {
        logStream.end();
    }
    console.log(`  Log file: ${__dirname}/${LOG_FILE}\n`);
}

main().catch(console.error);
