<script setup>
import ThemeToggle from "./ThemeToggle.vue";
</script>

<template>
  <main id="gameSelect" class="game-select" aria-label="游戏选择">
    <section class="game-select-panel">
      <div class="game-select-card">
        <header class="game-select-header">
          <div class="game-select-header-top">
            <div>
              <p class="eyebrow">Chinale 345</p>
              <h1>猜城 345</h1>
            </div>
            <ThemeToggle />
          </div>
          <p>选择一个关卡开始挑战。</p>
        </header>
        <div id="gameChoiceGrid" class="game-choice-grid"></div>
      </div>
    </section>
  </main>
</template>
