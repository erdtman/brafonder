/**
 * Generates a single flowing Swedish paragraph describing a fund's performance.
 * Templates are selected based on: loss frequency (5yr), 10yr data availability,
 * and stability tier (std bucketed into terciles across all funds).
 *
 * @param {Object} data      - { '1-year': [{value}], '5-year': [{value}], '10-year': [{value}] }
 * @param {Object} terciles  - { p33, p66 } cutpoints for 5yr std (computed across all funds)
 * @param {string} fundId    - used to deterministically pick a template variant
 * @returns {string}         - one flowing paragraph, or empty string if insufficient data
 */

const MIN_PERIODS = 40;

function stats(values) {
    const n = values.length;
    const neg = values.filter(v => v < 0).length;
    const pos = n - neg;
    const avg = values.reduce((s, v) => s + v, 0) / n;
    const min = Math.min(...values);
    const max = Math.max(...values);
    const variance = values.reduce((s, v) => s + (v - avg) ** 2, 0) / n;
    const std = Math.sqrt(variance);
    return { n, neg, pos, avg, min, max, std };
}

function fmt(v) {
    return Math.round(v);
}

// Express positive 1yr rate as a natural Swedish fraction
function pos1yrText(posCount, total) {
    const ratio = posCount / total;
    if (ratio >= 0.92) return 'Nästan samtliga ettårsperioder';
    if (ratio >= 0.87) return '9 av 10 ettårsperioder';
    if (ratio >= 0.77) return '4 av 5 ettårsperioder';
    if (ratio >= 0.70) return '3 av 4 ettårsperioder';
    if (ratio >= 0.62) return '2 av 3 ettårsperioder';
    if (ratio >= 0.45) return 'Ungefär varannan ettårsperiod';
    if (ratio >= 0.37) return 'Ungefär 1 av 3 ettårsperioder';
    return 'Färre än 1 av 3 ettårsperioder';
}

// Stability label based on tercile bucket
function stabilityLabel(std5, terciles) {
    if (std5 < terciles.p33) return 'stabil';
    if (std5 < terciles.p66) return 'måttlig';
    return 'volatil';
}

// Stability closing sentence based on tier, with 3 variants
function stabilityText(tier, variant) {
    const texts = {
        stabil: [
            'Avkastningen är jämn och varierar lite över tid.',
            'Sammantaget är detta en stabil fond med förutsägbar avkastning.',
            'Avkastningen präglas av stabilitet och låg variation.',
        ],
        måttlig: [
            'Avkastningen varierar en del men är relativt stabil över tid.',
            'Variationen i avkastning är måttlig.',
            'Resultaten varierar en del men tenderar att hamna på plus på längre sikt.',
        ],
        volatil: [
            'Avkastningen varierar kraftigt och kan ge negativa resultat även på medellång sikt.',
            'Fonden är volatil och svängningarna kan vara stora.',
            'Avkastningen är volatil och negativa perioder ingår i det historiska mönstret.',
        ],
    };
    return texts[tier][variant];
}

// Pick variant 0–2 deterministically from fund id
function pickVariant(fundId) {
    const n = parseInt(fundId, 10) || 0;
    return n % 3;
}

function describeFund(data, terciles, fundId) {
    const v = pickVariant(fundId);

    const y1vals = (data['1-year'] || []).map(p => p.value);
    const y5vals = (data['5-year'] || []).map(p => p.value);
    const y10vals = (data['10-year'] || []).map(p => p.value);

    if (y5vals.length < MIN_PERIODS) return '';

    const y1 = y1vals.length >= 20 ? stats(y1vals) : null;
    const y5 = stats(y5vals);
    const y10 = y10vals.length >= MIN_PERIODS ? stats(y10vals) : null;

    const tier = stabilityLabel(y5.std, terciles);
    const stab = stabilityText(tier, v);

    const oneInX5 = y5.neg > 0 ? Math.round(y5.n / y5.neg) : null;
    const pos1yr = y1 ? pos1yrText(y1.pos, y1.n) : null;
    const pos1yrSuffix = pos1yr ? ` ${pos1yr} har gett positiv avkastning.` : '';

    const avg5str = `${fmt(y5.avg)}%`;
    const avg10str = y10 ? `${fmt(y10.avg)}%` : null;
    const min5str = `${fmt(y5.min)}%`;

    const has10 = y10 !== null;
    const neverNeg5 = y5.neg === 0;
    const neverNeg10 = has10 && y10.neg === 0;

    // ── Case A/B/C: Never negative 5yr AND 10yr ──────────────────────────────
    if (neverNeg5 && neverNeg10) {
        const templates = [
            `Fonden har aldrig gett förlust under någon 5- eller 10-årsperiod — som lägst ${min5str} på 5 år. I snitt har avkastningen uppgått till ${avg5str} för 5-årsperioder och ${avg10str} för 10-årsperioder.${pos1yrSuffix} ${stab}`,
            `Varken någon 5-årsperiod eller 10-årsperiod har gett förlust i fondens historia. Genomsnittlig avkastning ligger på ${avg5str} för 5 år och ${avg10str} för 10 år, som lägst ${min5str} för en femårsperiod.${pos1yrSuffix} ${stab}`,
            `Fonden har historiskt aldrig backat under en 5- eller 10-årsperiod. Genomsnittsavkastningen är ${avg5str} på 5 år och ${avg10str} på 10 år.${pos1yrSuffix} ${stab}`,
        ];
        return templates[v];
    }

    // ── Case D/E: Never negative 5yr, no/insufficient 10yr data ─────────────
    if (neverNeg5 && !has10) {
        const templates = [
            `Fonden har aldrig gett förlust under någon 5-årsperiod — som lägst ${min5str}. I snitt uppgår 5-årsavkastningen till ${avg5str}.${pos1yrSuffix} ${stab}`,
            `Ingen 5-årsperiod i fondens historia har gett förlust. Genomsnittlig 5-årsavkastning är ${avg5str}, som lägst ${min5str}.${pos1yrSuffix} ${stab}`,
            `Fonden har historiskt aldrig backat under en 5-årsperiod. Genomsnittsavkastningen är ${avg5str} på 5 år.${pos1yrSuffix} ${stab}`,
        ];
        return templates[v];
    }

    // ── Case D/E: Never negative 5yr, but some 10yr losses ──────────────────
    if (neverNeg5 && has10) {
        const oneInX10 = y10.neg > 0 ? Math.round(y10.n / y10.neg) : null;
        const lossNote10 = oneInX10
            ? ` 1 av ${oneInX10} tioårsperioder har gett förlust.`
            : '';
        const templates = [
            `Fonden har aldrig gett förlust under någon 5-årsperiod — som lägst ${min5str}. I snitt uppgår avkastningen till ${avg5str} för 5-årsperioder och ${avg10str} för 10-årsperioder.${lossNote10}${pos1yrSuffix} ${stab}`,
            `Ingen 5-årsperiod i fondens historia har gett förlust. Genomsnittlig avkastning är ${avg5str} på 5 år och ${avg10str} på 10 år.${lossNote10}${pos1yrSuffix} ${stab}`,
            `Fonden har historiskt aldrig backat under en 5-årsperiod. Snittet är ${avg5str} på 5 år och ${avg10str} på 10 år.${lossNote10}${pos1yrSuffix} ${stab}`,
        ];
        return templates[v];
    }

    // From here: some 5yr losses exist
    const lossLine5 = oneInX5 <= 2
        ? 'Varannan femårsperiod har historiskt gett förlust.'
        : `1 av ${oneInX5} femårsperioder har historiskt gett förlust.`;

    const returns10part = has10
        ? ` och ${avg10str} för 10-årsperioder`
        : '';

    // ── Case F/G: Rarely negative 5yr (1 in 8+) ─────────────────────────────
    if (oneInX5 >= 8) {
        const templates = [
            `${lossLine5} I snitt har avkastningen uppgått till ${avg5str} för 5-årsperioder${returns10part}.${pos1yrSuffix} ${stab}`,
            `Historiskt sett har 1 av ${oneInX5} femårsperioder gett förlust. Genomsnittlig avkastning är ${avg5str} på 5 år${returns10part}.${pos1yrSuffix} ${stab}`,
            `Ungefär 1 av ${oneInX5} femårsperioder har gett förlust. Snittet landar på ${avg5str} för 5-årsperioder${returns10part}.${pos1yrSuffix} ${stab}`,
        ];
        return templates[v];
    }

    // ── Case H: Sometimes negative 5yr (1 in 3–7) ───────────────────────────
    if (oneInX5 >= 3) {
        const templates = [
            `${lossLine5} I snitt avkastar fonden ${avg5str} på 5 år${returns10part}.${pos1yrSuffix} ${stab}`,
            `Historiskt sett har 1 av ${oneInX5} femårsperioder gett förlust. Genomsnittlig avkastning är ${avg5str} på 5 år${returns10part}.${pos1yrSuffix} ${stab}`,
            `Ungefär 1 av ${oneInX5} femårsperioder har gett förlust. Snittet är ${avg5str} på 5 år${returns10part}.${pos1yrSuffix} ${stab}`,
        ];
        return templates[v];
    }

    // ── Case I: Often negative 5yr (1 in 2 or worse) ────────────────────────
    const templates = [
        `${lossLine5} I snitt avkastar fonden ${avg5str} på 5 år${returns10part}.${pos1yrSuffix} ${stab}`,
        `1 av ${oneInX5 || 2} femårsperioder har gett förlust. Genomsnittlig 5-årsavkastning är ${avg5str}${returns10part}.${pos1yrSuffix} ${stab}`,
        `Historiskt sett har nästan varannan femårsperiod gett förlust. Snittet är ${avg5str} på 5 år${returns10part}.${pos1yrSuffix} ${stab}`,
    ];
    return templates[v];
}

module.exports = { describeFund };
