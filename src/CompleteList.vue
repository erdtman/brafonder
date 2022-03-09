<template>
  <div class="container">
    <form class="form-horizontal">
      <div class="form-group">
        <div class="col-3 col-sm-12"></div>
        <div class="col-2">
          <label class="form-label" for="min_periods">Minsta antal datapunkter:</label>
        </div>
        <div class="col-3 col-sm-12">
          <input class="form-input" type="number" v-model="periods" id="min_periods" v-on:change="periods_change">
        </div>
      </div>
    </form>
    <table class="table table-scroll">

      <thead>
        <col>
        <colgroup span="6"></colgroup>
        <colgroup span="6"></colgroup>
        <tr>
          <td rowspan="3"></td>
          <th colspan="4" scope="colgroup" class="years">10 år</th>
          <th colspan="4" scope="colgroup" class="years">5 år</th>
          <th colspan="4" scope="colgroup" class="years">1 år</th>
        </tr>
        <tr>
          <th rowspan="2" scope="col"><button v-on:click="sort('ten_median')" class="btn" v-bind:class="{ active: active === 'ten_median' }">Median </button></th>
          <th rowspan="2" scope="col"><button v-on:click="sort('ten_average')" class="btn" v-bind:class="{ active: active === 'ten_average' }">Medel</button></th>
          <th rowspan="2" scope="col">Data- punkter</th>
          <th rowspan="2" scope="col">Standard- avvikelse</th>
          <th rowspan="2" scope="col"><button v-on:click="sort('five_median')" class="btn" v-bind:class="{ active: active === 'five_median' }">Median</button></th>
          <th rowspan="2" scope="col"><button v-on:click="sort('five_average')" class="btn" v-bind:class="{ active: active === 'five_average' }">Medel</button></th>
          <th rowspan="2" scope="col">Data- punkter</th>
          <th rowspan="2" scope="col">Standard- avvikelse</th>
          <th rowspan="2" scope="col"><button v-on:click="sort('one_median')" class="btn" v-bind:class="{ active: active === 'one_median' }">Median</button></th>
          <th rowspan="2" scope="col"><button v-on:click="sort('one_average')" class="btn" v-bind:class="{ active: active === 'one_average' }">Medel</button></th>
          <th rowspan="2" scope="col">Data- punkter</th>
          <th rowspan="2" scope="col">Standard- avvikelse</th>

        </tr>
      </thead>
      <tbody>
        <tr v-for="item in data" v-bind:key="item.id">
          <td>
            <a :href="item.avanza_url" target="_blank">{{ item.name }}</a>
          </td>

          <td>{{ getValueToDisplay(item.ten_years.median, '%') }}</td>
          <td>{{ getValueToDisplay(item.ten_years.average, '%') }}</td>
          <td>{{ item.ten_years.periods }}</td>
          <td>{{ getValueToDisplay(item.ten_years.std) }}</td>

          <td>{{ getValueToDisplay(item.five_years.median, '%') }}</td>
          <td>{{ getValueToDisplay(item.five_years.average, '%') }}</td>
          <td>{{ item.five_years.periods }}</td>
          <td>{{ getValueToDisplay(item.five_years.std) }}</td>

          <td>{{ getValueToDisplay(item.one_year.median, '%') }}</td>
          <td>{{ getValueToDisplay(item.one_year.average, '%') }}</td>
          <td>{{ item.one_year.periods }}</td>
          <td>{{ getValueToDisplay(item.one_year.std) }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script>
import json from "./data/fundDataAll.json";
const items_to_show = 100;

const one_year_median_sort = (a, b) => b.one_year.median - a.one_year.median;
const five_year_median_sort = (a, b) => b.five_years.median - a.five_years.median;
const ten_year_median_sort = (a, b) => b.ten_years.median - a.ten_years.median;

const one_year_average_sort = (a, b) => b.one_year.average - a.one_year.average;
const five_year_average_sort = (a, b) => b.five_years.average - a.five_years.average;
const ten_year_average_sort = (a, b) => b.ten_years.average - a.ten_years.average;

const one_year_filter = (limit) => { return (value) => value.one_year.periods > limit};
const five_year_filter = (limit) => { return (value) => value.five_years.periods > limit};
const ten_year_filter = (limit) => { return (value) => value.ten_years.periods > limit};

function updateData(filter, sort) {
  return json
        .filter(filter)
        .sort(sort)
        .slice(0, items_to_show);
}

const updaters = {
  one_median(periods) {
    return updateData(one_year_filter(periods), one_year_median_sort);
  },
  one_average(periods) {
    return updateData(one_year_filter(periods), one_year_average_sort);
  },
  five_median(periods) {
    return updateData(five_year_filter(periods), five_year_median_sort);
  },
  five_average(periods) {
    return updateData(five_year_filter(periods), five_year_average_sort);
  },
  ten_median(periods) {
    return updateData(ten_year_filter(periods), ten_year_median_sort);
  },
  ten_average(periods) {
    return updateData(ten_year_filter(periods), ten_year_average_sort);
  }
}

export default {
  components: {},
  data() {
    return {
      data: updateData(five_year_filter(0), ten_year_median_sort),
      active: "ten_median",
      periods: 0
    };
  },

  methods: {
    getValueToDisplay(value, postfix) {
      if (value === undefined || value === -99999) {
        return "data saknas"
      }
      postfix = postfix ? postfix : ''
      return `${value.toFixed(0)} ${postfix}`;
    },
    async sort(active) {
      this.active = active;
      this.data = updaters[active](this.periods);
    },
    async periods_change() {
      this.periods = this.periods > 167 ? 167 : this.periods;
      this.periods = this.periods < 0 ? 0 : this.periods;

      this.data = updaters[this.active](this.periods);
    },
    async is_active(label) {
      return label === this.active;
    },
  },
};
</script>
