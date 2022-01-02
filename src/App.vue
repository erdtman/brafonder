<template>
  <div>
    <h1>brafonder.se</h1>
    <header class="navbar">
      <section class="navbar-section"></section>
      <section class="navbar-center">
        <a href="..." class="navbar-brand mr-2">Enkel</a>
        <a href="..." class="btn btn-link">Komplett</a>
        <a href="..." class="btn btn-link">Bakgrund</a>
      </section>
      <section class="navbar-section"></section>
    </header>
  </div>
</template>

<script>
export default {
  components: {},
  data() {
    return {
      data: null,
    };
  },
  async mounted() {
    this.update();
  },
  methods: {
    async update() {},
  },
};
</script>
