<script setup>
import { nextTick, onBeforeUnmount, onMounted, ref } from "vue";

import { getThemeState, setThemePreference, subscribeTheme } from "../theme.js";

const themeState = ref(getThemeState());
let unsubscribeTheme = null;

const choices = [
  { value: "system", label: "系统", icon: "monitor", title: "跟随系统颜色模式" },
  { value: "light", label: "亮", icon: "sun", title: "切换到明亮模式" },
  { value: "dark", label: "暗", icon: "moon", title: "切换到黑暗模式" },
];

function chooseTheme(value) {
  setThemePreference(value);
  refreshIcons();
}

function handleThemeChange(event) {
  themeState.value = event.detail || getThemeState();
  refreshIcons();
}

function refreshIcons() {
  nextTick(() => window.lucide?.createIcons());
}

onMounted(() => {
  themeState.value = getThemeState();
  unsubscribeTheme = subscribeTheme(handleThemeChange);
  refreshIcons();
});

onBeforeUnmount(() => {
  unsubscribeTheme?.();
});
</script>

<template>
  <div class="theme-toggle" role="group" aria-label="颜色模式">
    <button
      v-for="choice in choices"
      :key="choice.value"
      class="theme-toggle-button"
      type="button"
      :class="{ 'is-active': themeState.preference === choice.value }"
      :aria-pressed="themeState.preference === choice.value"
      :title="choice.title"
      @click="chooseTheme(choice.value)"
    >
      <i :data-lucide="choice.icon"></i>
      <span>{{ choice.label }}</span>
    </button>
  </div>
</template>
