<template>
  <div class="container">
    <table class="table">
      <thead>
        <tr>
          <th></th>

          <th>
            <button v-on:click="ten_year_sort" class="btn" v-bind:class="{ active: active === 'ten' }">
              10 år
            </button>
          </th>
          <th>
            <button v-on:click="five_year_sort" class="btn" v-bind:class="{ active: active === 'five' }">
              5 år
            </button>
          </th>
          <th>
            <button v-on:click="one_year_sort" class="btn" v-bind:class="{ active: active === 'one' }">
              1 år
            </button>
          </th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="item in data" v-bind:key="item.id">
          <td><a :href=item.avanza_url target="_blank">{{item.name}}</a></td>
          <td>{{ getValueToDisplay(item.ten_years.median, '%')}}</td>
          <td>{{ getValueToDisplay(item.five_years.median, '%')}}</td>
          <td>{{ getValueToDisplay(item.one_year.median, '%')}}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script>
import json from './data/fundDataAll.json'
const items_to_show = 100;
const one_year_sort = (a, b) => b.one_year.median - a.one_year.median;
const five_year_sort = (a, b) => b.five_years.median - a.five_years.median;
const ten_year_sort = (a, b) => b.ten_years.median - a.ten_years.median;
const one_year_filter = (value) => value.one_year.periods > 50;
const five_year_filter = (value) => value.five_years.periods > 50;
const ten_year_filter = (value) => value.ten_years.periods > 50;

export default {
  components: {},
  data() {
    return {
      data: json.filter(ten_year_filter).sort(ten_year_sort).slice(0, items_to_show),
      active: "ten"
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
    async one_year_sort() {
      this.data = json.filter(one_year_filter).sort(one_year_sort).slice(0, items_to_show);
      this.active = "one"
    },
    async five_year_sort() {
      this.data = json.filter(five_year_filter).sort(five_year_sort).slice(0, items_to_show);
      this.active = "five"
    },
    async ten_year_sort() {
      this.data = json.filter(ten_year_filter).sort(ten_year_sort).slice(0, items_to_show);
      this.active = "ten"
    },

    async is_active(label) {
      console.log(label);
      return label === this.active;
    }
  },
};
</script>