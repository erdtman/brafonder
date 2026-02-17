const { getDb } = require('./db.js');
const fs = require('fs');
const path = require('path');

function createSlug(name, id) {
    const slug = name
        .toLowerCase()
        .replace(/[åä]/g, 'a')
        .replace(/ö/g, 'o')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
    return `${slug}-${id}`;
}

function exportSitemap() {
    const db = getDb();
    const funds = db.prepare(`
        SELECT f.id, f.name FROM funds f
        WHERE EXISTS (SELECT 1 FROM data_points WHERE fund_id = f.id)
        ORDER BY f.id
    `).all();
    db.close();

    const baseUrl = 'https://brafonder.se';
    const today = new Date().toISOString().substring(0, 10);

    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

    // Static pages
    for (const loc of ['/', '/komplett', '/bakgrund']) {
        xml += `  <url>\n    <loc>${baseUrl}${loc}</loc>\n    <lastmod>${today}</lastmod>\n  </url>\n`;
    }

    // Fund pages
    for (const fund of funds) {
        const slug = createSlug(fund.name, fund.id);
        xml += `  <url>\n    <loc>${baseUrl}/fond/${slug}</loc>\n    <lastmod>${today}</lastmod>\n  </url>\n`;
    }

    xml += '</urlset>\n';

    const outputPath = path.join(__dirname, '..', 'dist', 'sitemap.xml');
    fs.writeFileSync(outputPath, xml);
    console.log(`Exported sitemap with ${funds.length + 3} URLs to ${outputPath}`);
}

exportSitemap();
