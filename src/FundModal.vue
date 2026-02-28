<template>
    <div class="fund-modal-overlay" @click.self="close">
        <div class="fund-modal-container">
            <div class="fund-modal-header">
                <span class="fund-modal-title">{{ fund.name }}</span>
                <div class="fund-modal-actions">
                    <a :href="fund.avanza_url" target="_blank" class="avanza-link" title="Visa på Avanza">
                        <img src="/img/avanza-logo.png" alt="Avanza" />
                    </a>
                    <button class="fund-modal-close" @click="close">&times;</button>
                </div>
            </div>
            <div class="fund-modal-body">
                <p v-if="fund.description" class="fund-descriptions">{{ fund.description }}</p>

                <table class="table fund-details">
                    <thead>
                        <tr>
                            <th></th>
                            <th>Median</th>
                            <th>Medel</th>
                            <th>Std</th>
                            <th>Datapunkter</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td><strong>1 år</strong></td>
                            <td>{{ formatValue(fund.one_year?.median) }}%</td>
                            <td>{{ formatValue(fund.one_year?.average) }}%</td>
                            <td>{{ formatValue(fund.one_year?.std) }}</td>
                            <td>{{ fund.one_year?.periods || '-' }}</td>
                        </tr>
                        <tr>
                            <td><strong>5 år</strong></td>
                            <td>{{ formatValue(fund.five_years?.median) }}%</td>
                            <td>{{ formatValue(fund.five_years?.average) }}%</td>
                            <td>{{ formatValue(fund.five_years?.std) }}</td>
                            <td>{{ fund.five_years?.periods || '-' }}</td>
                        </tr>
                        <tr>
                            <td><strong>10 år</strong></td>
                            <td>{{ formatValue(fund.ten_years?.median) }}%</td>
                            <td>{{ formatValue(fund.ten_years?.average) }}%</td>
                            <td>{{ formatValue(fund.ten_years?.std) }}</td>
                            <td>{{ fund.ten_years?.periods || '-' }}</td>
                        </tr>
                    </tbody>
                </table>

                <div class="charts-grid">
                    <div class="chart-section" v-if="hasDataPoints('1-year')">
                        <h4>1 år avkastning</h4>
                        <div class="chart-container">
                            <canvas ref="chart1Year"></canvas>
                        </div>
                    </div>
                    <div class="chart-section" v-if="hasDataPoints('5-year')">
                        <h4>5 år avkastning</h4>
                        <div class="chart-container">
                            <canvas ref="chart5Year"></canvas>
                        </div>
                    </div>
                    <div class="chart-section" v-if="hasDataPoints('10-year')">
                        <h4>10 år avkastning</h4>
                        <div class="chart-container">
                            <canvas ref="chart10Year"></canvas>
                        </div>
                    </div>
                </div>

                <div class="no-data-message" v-if="loading">
                    <p>Laddar data...</p>
                </div>
                <div class="no-data-message" v-else-if="!hasAnyDataPoints">
                    <p>Ingen historisk data tillgänglig för denna fond.</p>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

export default {
    props: {
        fund: {
            type: Object,
            required: true
        }
    },
    emits: ['close'],
    data() {
        return {
            charts: [],
            fundDataPoints: null,
            loading: true
        };
    },
    computed: {
        hasAnyDataPoints() {
            return this.hasDataPoints('1-year') ||
                   this.hasDataPoints('5-year') ||
                   this.hasDataPoints('10-year');
        }
    },
    methods: {
        close() {
            this.$emit('close');
        },
        formatValue(value) {
            if (value === undefined || value === null || value === -99999) {
                return '-';
            }
            return value.toFixed(0);
        },
        hasDataPoints(periodType) {
            return this.fundDataPoints &&
                   this.fundDataPoints[periodType] &&
                   this.fundDataPoints[periodType].length > 0;
        },
        createChart(canvas, periodType, color) {
            if (!canvas || !this.hasDataPoints(periodType)) return null;

            const points = this.fundDataPoints[periodType];
            const periodYears = periodType === '10-year' ? 10 : periodType === '5-year' ? 5 : 1;

            const labels = points.map(p => `${p.start.substring(0, 4)}+${periodYears}`);
            const values = points.map(p => p.value);

            const ctx = canvas.getContext('2d');
            return new Chart(ctx, {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'Avkastning (%)',
                        data: values,
                        borderColor: color,
                        backgroundColor: color.replace('1)', '0.1)'),
                        fill: true,
                        tension: 0.1,
                        borderWidth: 1,
                        pointRadius: 0,
                        pointHoverRadius: 4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: false
                        },
                        tooltip: {
                            callbacks: {
                                title: function(context) {
                                    const index = context[0].dataIndex;
                                    const point = points[index];
                                    return `${point.start} → ${point.end}`;
                                },
                                label: function(context) {
                                    return 'Avkastning: ' + context.parsed.y.toFixed(1) + '%';
                                }
                            }
                        }
                    },
                    scales: {
                        x: {
                            ticks: {
                                maxTicksLimit: 8,
                                maxRotation: 45
                            }
                        },
                        y: {
                            ticks: {
                                callback: function(value) {
                                    return value + '%';
                                }
                            }
                        }
                    }
                }
            });
        },
        createCharts() {
            this.$nextTick(() => {
                if (this.$refs.chart10Year) {
                    const chart = this.createChart(this.$refs.chart10Year, '10-year', 'rgba(24, 138, 184, 1)');
                    if (chart) this.charts.push(chart);
                }
                if (this.$refs.chart5Year) {
                    const chart = this.createChart(this.$refs.chart5Year, '5-year', 'rgba(130, 201, 30, 1)');
                    if (chart) this.charts.push(chart);
                }
                if (this.$refs.chart1Year) {
                    const chart = this.createChart(this.$refs.chart1Year, '1-year', 'rgba(250, 176, 5, 1)');
                    if (chart) this.charts.push(chart);
                }
            });
        }
    },
    async mounted() {
        document.body.style.overflow = 'hidden';
        document.addEventListener('keydown', this.handleKeydown);
        try {
            const response = await fetch(`/data/funds/${this.fund.id}.json`);
            if (response.ok) {
                this.fundDataPoints = await response.json();
            }
        } catch (e) {
            // Fund has no data points
        }
        this.loading = false;
        this.createCharts();
    },
    beforeUnmount() {
        document.body.style.overflow = '';
        document.removeEventListener('keydown', this.handleKeydown);
        this.charts.forEach(chart => chart.destroy());
    },
    setup() {
        return {
            handleKeydown: null
        };
    },
    created() {
        this.handleKeydown = (e) => {
            if (e.key === 'Escape') {
                this.close();
            }
        };
    }
};
</script>

<style scoped>
.fund-modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: flex-start;
    justify-content: center;
    padding: 5%;
    z-index: 1000;
}

.fund-modal-container {
    background: #fff;
    border-radius: 12px;
    box-shadow: 0 8px 30px rgba(0, 0, 0, 0.3);
    display: flex;
    flex-direction: column;
    max-height: 100%;
    overflow: hidden;
    width: 100%;
    max-width: 800px;
}

.fund-modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem;
    border-bottom: 1px solid #eee;
}

.fund-modal-actions {
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.avanza-link,
.fund-modal-close {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    border: 1px solid #ddd;
    border-radius: 6px;
    background: #fff;
    cursor: pointer;
    transition: border-color 0.2s, box-shadow 0.2s;
}

.avanza-link:hover {
    border-color: #00c281;
    box-shadow: 0 0 0 2px rgba(0, 194, 129, 0.2);
}

.avanza-link img {
    height: 20px;
    width: auto;
}

.fund-modal-title {
    font-size: 1.2rem;
    font-weight: bold;
}

.fund-modal-close {
    font-size: 1.3rem;
    padding: 0;
    line-height: 1;
}

.fund-modal-close:hover {
    border-color: #999;
    box-shadow: 0 0 0 2px rgba(0, 0, 0, 0.1);
}

.fund-modal-body {
    padding: 1rem;
    overflow-y: auto;
}

.charts-grid {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    margin-bottom: 1rem;
}

.chart-section h4 {
    margin: 0 0 0.5rem 0;
    font-size: 0.9rem;
    color: #666;
}

.chart-container {
    height: 150px;
}

.no-data-message {
    text-align: center;
    padding: 2rem;
    color: #666;
}

.fund-descriptions {
    padding: 0.5rem 0.75rem;
    margin: 0 0 1rem 0;
    background: #f7f9fb;
    border-left: 3px solid #188ab8;
    border-radius: 0 4px 4px 0;
    font-size: 0.9rem;
    color: #333;
    line-height: 1.6;
}

.fund-details {
    margin-bottom: 1rem;
}

.fund-details td,
.fund-details th {
    text-align: right;
    padding: 0.5rem;
}

.fund-details td:first-child,
.fund-details th:first-child {
    text-align: left;
}

</style>
