const regression = require('regression');
const math = require('mathjs');

exports.average = function average(data) {
    if(data.length === 0) {
        return -99999;
    }
    const sum = data.reduce((previous, current) => current += previous);
    return sum / data.length;
}

exports.median = function median(data) {
    if(data.length === 0) {
        return -99999;
    }
    const d = Array.from(data)
    d.sort((a, b) => a - b);
    const lowMiddle = Math.floor((d.length - 1) / 2);
    const highMiddle = Math.ceil((d.length - 1) / 2);
    return (d[lowMiddle] + d[highMiddle]) / 2;
}

exports.padWithZero = function padWithZero(value){
    return value<10 ? `0${value}` : `${value}`;
}

exports.regress = function regress(values) {
    if(values.length === 0) {
        return -99999;
    }
    const xy_values = values.map((y, index) => [index,y]);
    const mc = regression.linear(xy_values);
    return {
        m: mc.equation[0],
        r2: mc.r2
    }
}

exports.std = function std(values) {
    if(values.length === 0) {
        return -99999;
    }
    return math.std(values);

}