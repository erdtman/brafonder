<template>
  <div>
    <h1>brafonder.se</h1>
    <header class="navbar">
      <section class="navbar-section"></section>
      <section class="navbar-center">
        <button v-on:click="goto_simple" class="btn" v-bind:class="{ active: active === 'simple' }" style="margin: 10px; width: 100px;">
          Enkel
        </button>
        <button v-on:click="goto_complete" class="btn" v-bind:class="{ active: active === 'complete' }" style="margin: 10px; width: 100px;">
          Komplett
        </button>
        <button v-on:click="goto_background" class="btn" v-bind:class="{ active: active === 'backgroud' }" style="margin: 10px; width: 100px;">
          Bakgrund
        </button>
      </section>
      <section class="navbar-section"></section>
    </header>
    <SimpleList v-if="active === 'simple'" />
    <CompleteList v-if="active === 'complete'" />
    <Background v-if="active === 'background'" />
  </div>
</template>

<script>
import SimpleList from "./SimpleList.vue";
import CompleteList from "./CompleteList.vue";
import Background from "./Background.vue";

function getActive(hash) {
  switch(hash) {
    case "#simple":
      return "simple";
    case "#complete":
      return "complete";
    case "#simple":
      return "background";
    default:
      return "background";
  }
}


export default {
  components: {
    SimpleList,
    CompleteList,
    Background
  },
  data() {
    return {
      data: null,
      active: getActive( window.location.hash)
    };
  },
  methods: {
    async goto_simple() {
      this.active = "simple";
      window.location.hash = "simple";
    },
    async goto_complete() {
      this.active = "complete"
      window.location.hash = "complete";
    },
    async goto_background() {
      this.active = "background"
      window.location.hash = "background";
    },
  },
};
</script>
