/**
 * Generates Swedish natural-language descriptions for a fund based on its
 * rolling period data. Each rule fires independently; a fund may get several.
 *
 * @param {Object} data - { '1-year': [{value}], '5-year': [...], '10-year': [...] }
 * @returns {string[]} Array of description sentences in Swedish
 */

const MIN_PERIODS = 40; // Don't describe periods with too little data
const TREND_WINDOW = 24; // Months to use for recent trend calculation
const RECENT_STREAK_WINDOW = 12;

function linearSlope(values) {
    const n = values.length;
    if (n < 4) return null;
    const meanX = (n - 1) / 2;
    const meanY = values.reduce((s, v) => s + v, 0) / n;
    let num = 0, den = 0;
    for (let i = 0; i < n; i++) {
        num += (i - meanX) * (values[i] - meanY);
        den += (i - meanX) ** 2;
    }
    return den === 0 ? 0 : num / den;
}

function approxOneInX(negCount, total) {
    if (negCount === 0) return null;
    const ratio = total / negCount;
    // Round to nearest sensible integer
    return Math.round(ratio);
}

function fmt(value) {
    return Math.round(value);
}

function describePeriod(values, periodLabel) {
    const descriptions = [];
    const n = values.length;
    if (n < MIN_PERIODS) return descriptions;

    const min = Math.min(...values);
    const max = Math.max(...values);
    const avg = values.reduce((s, v) => s + v, 0) / n;
    const negCount = values.filter(v => v < 0).length;
    const negPct = negCount / n;
    const oneInX = approxOneInX(negCount, n);

    const recentValues = values.slice(-TREND_WINDOW);
    const recentSlope = linearSlope(recentValues);

    // --- Rule: Never negative ---
    if (negCount === 0) {
        descriptions.push(
            `Under varje ${periodLabel}-årsperiod i fondens historia har avkastningen varit positiv — som lägst ${fmt(min)}%.`
        );
    }

    // --- Rule: Consistent (narrow band, always positive, 5-year only) ---
    if (periodLabel === '5' && negCount === 0) {
        const std = Math.sqrt(values.reduce((s, v) => s + (v - avg) ** 2, 0) / n);
        const cv = std / avg;
        if (cv < 0.2) {
            descriptions.push(
                `Femårsavkastningen har alltid hamnat mellan ${fmt(min)}% och ${fmt(max)}% — samtliga ${n} perioder inom detta spann.`
            );
        }
    }

    // --- Rule: Inconsistent (wide spread with meaningful loss frequency) ---
    if (negCount >= 5 && negPct >= 0.05) {
        const spread = max - min;
        const std = Math.sqrt(values.reduce((s, v) => s + (v - avg) ** 2, 0) / n);
        const cv = std / Math.abs(avg);
        if (cv > 0.6 || spread > 150) {
            descriptions.push(
                `Utfallen varierar kraftigt — från ${fmt(min)}% till +${fmt(max)}%. 1 av ${oneInX} ${periodLabel}-årsperioder har gett förlust.`
            );
        }
    }

    // --- Rule: Fading trend (always positive but slope falling sharply) ---
    if (negCount === 0 && recentSlope !== null && recentSlope < -2.0) {
        descriptions.push(
            `Ingen ${periodLabel}-årsperiod har gett förlust, men de senaste ${periodLabel}-årsavkastningarna har trendat tydligt nedåt.`
        );
    }

    // --- Rule: Improving trend ---
    if (recentSlope !== null && recentSlope > 2.0) {
        const lossPart = negCount === 0
            ? 'Ingen period har gett förlust'
            : `1 av ${oneInX} perioder har gett förlust`;
        descriptions.push(
            `${periodLabel}-årsavkastningen har trendat uppåt de senaste åren. ${lossPart}.`
        );
    }

    return descriptions;
}

function describeStreakVsHistory(oneYearValues) {
    const n = oneYearValues.length;
    if (n < 60) return null;

    const recent = oneYearValues.slice(-RECENT_STREAK_WINDOW);
    const allPositiveRecently = recent.every(v => v > 0);
    if (!allPositiveRecently) return null;

    const negCount = oneYearValues.filter(v => v < 0).length;
    const negPct = negCount / n;
    if (negPct < 0.3) return null; // Only interesting if historically unreliable

    const recentAvg = recent.reduce((s, v) => s + v, 0) / recent.length;
    const oneInX = approxOneInX(negCount, n);

    return `De senaste 12 ettårsperioderna har alla gett positiv avkastning, i snitt +${fmt(recentAvg)}%. Historiskt sett har dock 1 av ${oneInX} ettårsperioder gett förlust.`;
}

function describeFund(data) {
    const descriptions = [];

    const periodMap = [
        ['1-year', '1'],
        ['5-year', '5'],
        ['10-year', '10'],
    ];

    for (const [key, label] of periodMap) {
        if (!data[key] || data[key].length < MIN_PERIODS) continue;
        const values = data[key].map(p => p.value);
        descriptions.push(...describePeriod(values, label));
    }

    // Streak vs history check on 1-year data
    if (data['1-year'] && data['1-year'].length >= 60) {
        const values1yr = data['1-year'].map(p => p.value);
        const streak = describeStreakVsHistory(values1yr);
        if (streak) descriptions.push(streak);
    }

    return descriptions;
}

module.exports = { describeFund };
