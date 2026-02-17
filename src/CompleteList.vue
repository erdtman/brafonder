<template>
  <div class="container">

    <table class="table table-scroll">

      <thead>
        <col>
        <colgroup span="6"></colgroup>
        <colgroup span="6"></colgroup>
        <tr>
          <td rowspan="3"><input type="input" id="filter" class="filter" placeholder="Sök fond" v-model="filter_string"></td>
          <th colspan="4" scope="colgroup" class="years">10 år</th>
          <th colspan="4" scope="colgroup" class="years">5 år</th>
          <th colspan="4" scope="colgroup" class="years">1 år</th>
        </tr>
        <tr>
          <th rowspan="2" scope="col"><button v-on:click="sort('ten_median')" class="btn" v-bind:class="{ active: active === 'ten_median' }">Median</button></th>
          <th rowspan="2" scope="col"><button v-on:click="sort('ten_average')" class="btn" v-bind:class="{ active: active === 'ten_average' }">Medel</button></th>
          <th rowspan="2" scope="col"><a class="link" v-on:click="open_datapoint_settings()">Data- punkter</a></th>
          <th rowspan="2" scope="col">Standard- avvikelse</th>
          <th rowspan="2" scope="col"><button v-on:click="sort('five_median')" class="btn" v-bind:class="{ active: active === 'five_median' }">Median</button></th>
          <th rowspan="2" scope="col"><button v-on:click="sort('five_average')" class="btn" v-bind:class="{ active: active === 'five_average' }">Medel</button></th>
          <th rowspan="2" scope="col"><a class="link" v-on:click="open_datapoint_settings()">Data- punkter</a></th>
          <th rowspan="2" scope="col">Standard- avvikelse</th>
          <th rowspan="2" scope="col"><button v-on:click="sort('one_median')" class="btn" v-bind:class="{ active: active === 'one_median' }">Median</button></th>
          <th rowspan="2" scope="col"><button v-on:click="sort('one_average')" class="btn" v-bind:class="{ active: active === 'one_average' }">Medel</button></th>
          <th rowspan="2" scope="col"><a class="link" v-on:click="open_datapoint_settings()">Data- punkter</a></th>
          <th rowspan="2" scope="col">Standard- avvikelse</th>

        </tr>
      </thead>
      <tbody>
        <tr v-for="item in data" v-bind:key="item.id">
          <td>
            <a href="#" @click.prevent="openFund(item)" class="fund-link">{{ item.name }}</a>
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

    <div class="modal modal-sm" v-bind:class="{ active: datapoint_settings_open }">
      <div class="modal-overlay"></div>
      <div class="modal-container">
        <div class="modal-header">
          <button class="btn btn-clear float-right close-modal" v-on:click="close_datapoint_settings()"></button>
          <div class="modal-title">Datapunktsfilter</div>
        </div>
        <div class="modal-body">
          <div class="content">
            <form class="form-horizontal">
              <div class="form-group">
                <div class="col-9">
                  <label class="form-label" for="min_periods">Minsta antal datapunkter:</label>
                </div>
                <div class="col-3">
                  <input class="form-input" type="number" v-model="periods" id="min_periods">
                </div>
              </div>
            </form>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-primary close-modal" v-on:click="save_periods()">Spara</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import json from "./data/fundDataAll.json";
const items_to_show = 200;

const one_year_median_sort = (a, b) => b.one_year.median - a.one_year.median;
const five_year_median_sort = (a, b) => b.five_years.median - a.five_years.median;
const ten_year_median_sort = (a, b) => b.ten_years.median - a.ten_years.median;

const one_year_average_sort = (a, b) => b.one_year.average - a.one_year.average;
const five_year_average_sort = (a, b) => b.five_years.average - a.five_years.average;
const ten_year_average_sort = (a, b) => b.ten_years.average - a.ten_years.average;

const one_year_filter = (limit) => { return (value) => value.one_year.periods > limit};
const five_year_filter = (limit) => { return (value) => value.five_years.periods > limit};
const ten_year_filter = (limit) => { return (value) => value.ten_years.periods > limit};


function updateData(filter, sort, filter_string) {
  filter_string = filter_string ? filter_string : "";
  const search_filter = (value) => value.name.toLowerCase().includes(filter_string.toLowerCase())
  const step1 = json.filter(filter);
  const step2 = step1.filter(search_filter);
  const step3 = step2.sort(sort);
  const step4 = step3.slice(0, items_to_show);
  return step4;
}

const updaters = {
  one_median(periods, filter) {
    return updateData(one_year_filter(periods), one_year_median_sort, filter);
  },
  one_average(periods, filter) {
    return updateData(one_year_filter(periods), one_year_average_sort, filter);
  },
  five_median(periods, filter) {
    return updateData(five_year_filter(periods), five_year_median_sort, filter);
  },
  five_average(periods, filter) {
    return updateData(five_year_filter(periods), five_year_average_sort, filter);
  },
  ten_median(periods, filter) {
    return updateData(ten_year_filter(periods), ten_year_median_sort, filter);
  },
  ten_average(periods, filter) {
    return updateData(ten_year_filter(periods), ten_year_average_sort, filter);
  }
}

export default {
  components: {},
  emits: ['open-fund'],
  data() {
    return {
      data: updateData(five_year_filter(0), ten_year_median_sort, ""),
      active: "ten_median",
      periods: 0,
      datapoint_settings_open: false,
      filter_string: ''
    };
  },
  watch: {
    filter_string(val, oldVal){
      if (val !== oldVal) {
        this.data = updaters[this.active](this.periods, this.filter_string);
      }
    }
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
      this.data = updaters[active](this.periods, this.filter_string);
    },
    async close_datapoint_settings() {
      this.datapoint_settings_open = false;
    },
    async open_datapoint_settings() {
      this.datapoint_settings_open = true;
    },
    async save_periods() {
      this.periods = this.periods > 204 ? 204 : this.periods;
      this.periods = this.periods < 0 ? 0 : this.periods;

      this.data = updaters[this.active](this.periods, this.filter_string);

      this.close_datapoint_settings();
    },
    async is_active(label) {
      return label === this.active;
    },
    openFund(fund) {
      this.$emit('open-fund', fund);
    }
  },
};
</script>

<style scoped>
.fund-link {
  cursor: pointer;
  color: #188ab8;
  text-decoration: none;
}

.fund-link:hover {
  text-decoration: underline;
}
</style>
