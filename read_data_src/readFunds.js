const axios = require('axios');
const jsonfile = require('jsonfile');
const moment = require('moment');
const {average, median, regress, padWithZero, std} = require('./utils.js');
const fs = require('fs');


function getFirstInYear(dataSerie, year, month=0) {
    //console.log(`  looking for ${year} ${month}`);
    for (let index = 0; index < dataSerie.length; index++) {
        const raw_time = dataSerie[index];

        if (raw_time.y === null || raw_time.y === 0) {
            continue;
        }

        const time = moment(raw_time.x);

        if (time.year() === year && time.month() === month) {
            // console.log(`SUCCESS ${time.format()} - ${raw_time.y}, ${raw_time.x}`);
            return raw_time;
        }
    }
    // console.log(`ERROR`);
    return {y:-1};
}

function getFirstYearAndMonth(dataSerie) {
    for (let index = 0; index < dataSerie.length; index++) {
        const raw_time = dataSerie[index];

        if(raw_time.y === null || raw_time.y === 0) {
            continue;
        }
        const time = moment(raw_time.x);
        return {
            firstYear: time.year(),
            firstMonth: time.month()};
    }
}

async function  getOverPeriod(dataSerie, id, period, _startYear) {
    console.log(`Get id: ${id}, period: ${period}`);
    const values = [];
    let periods = 0;

    const {firstYear, firstMonth} = getFirstYearAndMonth(dataSerie)

    const startYear = firstYear > _startYear ? firstYear : _startYear;
    const startMonth = firstYear > startYear ? (firstMonth + 1) : 1;
    let startMoment = moment(`${startYear}-${startMonth}-01`);
    while(getFirstInYear(dataSerie, startMoment.year() + period, startMoment.month()).y !== -1) {
        const year = startMoment.year();
        const month = padWithZero( startMoment.month() + 1);
        const endYear = startMoment.year() + period;

        const url = `https://www.avanza.se/_api/fund-guide/chart/${id}/${year}-${month}-01/${endYear}-${month}-01`
        const response = await axios.get(url);
        const last = response.data.dataSerie.pop();

        console.log(`${periods} - ${startMoment.format()} - value:${last.y},url ${url}`);

        values.push(last.y);
        periods++;

        startMoment.add(1, "month");
    }

    return {
        periods: periods,
        average: average(values),
        median: median(values),
        std: std(values),
        reg: regress(values),
        values: values,
    }
}

async function get(id) {
    const startYear = 1998; // TODO adjust start year
    const endDate = "2024-06-30"; // TODO adjust end date
    const response = await axios.get(`https://www.avanza.se/_api/fund-guide/chart/${id}/${startYear}-01-01/${endDate}`);

    const dataSerie = response.data.dataSerie;
    return {
        name: response.data.name,
        id: id,
        avanza_url: `https://www.avanza.se/fonder/om-fonden.html/${id}`,
        one_year: await getOverPeriod(dataSerie, id, 1, startYear),
        five_years: await getOverPeriod(dataSerie, id, 5, startYear),
        ten_years: await getOverPeriod(dataSerie, id, 10, startYear)
    }
}

function toString(item) {
    return [
        item.name,

        item.one_years.periods,
        item.one_years.average,
        item.one_years.median,

        item.five_years.periods,
        item.five_years.average,
        item.five_years.median,

        item.ten_years.periods,
        item.ten_years.average,
        item.ten_years.median

    ].join(',')
}

jsonfile.readFile('output/funds.json', async (err, funds) => { // TODO runs from current dir
    const result = []
    console.log("start");
    for (let index = 650; index < funds.length; index++) { // TODO change start index here when running multiple instances in paralell
        try {
            const filename = `output/json/${index}.json`
            if(fs.existsSync(filename)) {
                console.log("Early exit");
                return // exit someone is working on the next up funds
            }
            const id = funds[index];
            const fund = await get(id);
            console.log(fund);
            fs.writeFileSync(filename, JSON.stringify(fund, null, 1));
        } catch (error) {
            console.log("ERROR");
            console.log(error);
        }
    }
});
