# brafonder.se

Source code repository for [brafonder.se](https://www.brafonder.se) - a Swedish mutual fund analysis website.

## About

Brafonder analyzes historical performance data for Swedish mutual funds available through Avanza. The site helps investors identify funds with strong and stable historical returns by calculating:

- Rolling 10-year, 5-year, and 1-year return periods
- Median, average, and standard deviation for each period
- Data point filtering to account for survivorship bias

## Technologies

- **Frontend**: Vue 3, Vue Router, Chart.js
- **Build**: Webpack
- **Styling**: Spectre CSS
- **Data Processing**: Node.js, Axios, Math.js

## Getting Started

### Installation

```bash
npm install
```

### Development

```bash
npm run watch
```

### Production Build

```bash
npm run build
```

## Data Processing

The fund data is collected from Avanza's API using scripts in `read_data_src/`:

```bash
# 1. Fetch list of all available funds
node read_data_src/readFundList.js

# 2. Scrape historical data for each fund
node read_data_src/readFunds.js

# 3. Aggregate data into final JSON file
node read_data_src/packageData.js
```

## Project Structure

```
brafonder/
├── src/                    # Vue frontend source
│   ├── App.vue            # Root component with navigation
│   ├── SimpleList.vue     # Top 100 funds view
│   ├── CompleteList.vue   # Top 200 funds with detailed stats
│   ├── Background.vue     # FAQ and methodology
│   └── data/              # Compiled fund data
├── read_data_src/         # Data collection scripts
├── dist/                  # Production build output
└── webpack.config.js      # Build configuration
```

## Deployment

The `dist/` directory is deployed to GitHub Pages:

```bash
git subtree push --prefix dist origin gh-pages
```

## Contributing

Report issues or contribute code via pull requests.