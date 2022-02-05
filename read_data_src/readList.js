const fs = require('fs');
const axios = require('axios');

async function get(startIndex) {
    const response = await axios.post('https://www.avanza.se/_api/fund-guide/list',{
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

    return response.data.fundListViews.map(fund => fund.orderbookId);
}

async function all(er, password) {
    let allFunds = [];
    for(let i=0; i<1335; i+=20) {
        console.log(`Reading: ${i} - ${i+20}`);
        const list = await get(i)
        allFunds = allFunds.concat(list);
    }

    fs.writeFileSync('output/funds.json', JSON.stringify(allFunds, null, 1));
    console.log("total fund count: " + allFunds.length);
}


all();