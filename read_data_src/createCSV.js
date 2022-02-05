'use strict';

const fs = require('fs');
const { median } = require('mathjs');


function readJSON(path) {
    const rawdata = fs.readFileSync(path);
    return JSON.parse(rawdata);
}

function toString(item) {
    return [
        item.name,

        item.one_year.periods,
        item.one_year.average,
        item.one_year.median,

        item.five_years.periods,
        item.five_years.average,
        item.five_years.median,

        item.ten_years.periods,
        item.ten_years.average,
        item.ten_years.median

    ].join(',')
}


const files = fs.readdirSync("output/json");
const funds = files.map(file => readJSON(`output/json/${file}`));
const cleanFunds = funds.filter(value => value.name !== null).map(value => {
    return {
        "id": value.id,
        "name": value.name,
        "avanza_url": value.avanza_url,
        "one_year": {
            "average": value.one_year.average,
            "median": value.one_year.median,
            "periods": value.one_year.periods,
            "std": value.one_year.std,
        },
        "five_years": {
            "average": value.five_years.average,
            "median": value.five_years.median,
            "periods": value.five_years.periods,
            "std": value.five_years.std,
        },
        "ten_years": {
            "average": value.ten_years.average,
            "median": value.ten_years.median,
            "periods": value.ten_years.periods,
            "std": value.ten_years.std,
        }
    }
})
fs.writeFileSync('output/fundDataAll.json', JSON.stringify(cleanFunds));
//fs.writeFileSync('output/fundData.csv', "name, one_years.periods, one_years.average, one_years.median, five_years.periods, five_years.average, five_years.median, ten_years.periods, ten_years.average, ten_years.median\n");
//fs.appendFileSync('output/fundData.csv', funds.map(toString).join('\n'));
