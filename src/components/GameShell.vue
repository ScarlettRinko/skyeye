<script setup>
import ConsolePanel from "./ConsolePanel.vue";
import MapStage from "./MapStage.vue";
</script>

<template>
  <main id="gameShell" class="shell" hidden>
    <MapStage />
    <ConsolePanel />
  </main>
</template>
