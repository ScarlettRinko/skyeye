<script setup>
import ThemeToggle from "./ThemeToggle.vue";
</script>

<template>
  <aside class="console" aria-label="游戏控制台">
    <header class="brand">
      <div class="brand-copy">
        <p id="gameEyebrow" class="eyebrow">Chinale 345</p>
        <h1 id="gameTitle">天眼 345</h1>
      </div>
      <div class="brand-actions">
        <ThemeToggle />
      </div>
    </header>

    <div class="round-actions">
      <button id="newRoundButton" class="secondary-button new-round-button" type="button" title="随机开局">
        <i data-lucide="shuffle"></i>
        <span>随机开局</span>
      </button>
    </div>

    <form id="guessForm" class="guess-form" autocomplete="off">
      <label for="cityInput">城市</label>
      <div class="input-wrap">
        <i data-lucide="search"></i>
        <input
          id="cityInput"
          type="text"
          inputmode="search"
          placeholder="输入城市名或拼音"
          aria-controls="suggestions"
          aria-expanded="false"
        />
      </div>
      <div id="suggestions" class="suggestions" role="listbox"></div>
      <div class="guess-actions">
        <button class="primary-button" type="submit" title="猜一下">
          <i data-lucide="crosshair"></i>
          <span>猜一下</span>
        </button>
        <button id="openPickerButton" class="secondary-button" type="button" title="选城市">
          <i data-lucide="layout-grid"></i>
          <span>选城市</span>
        </button>
      </div>
    </form>

    <section class="feedback" aria-live="polite">
      <div id="feedbackIcon" class="feedback-icon">
        <i data-lucide="radar"></i>
      </div>
      <div>
        <p id="feedbackTitle">正在接收卫星影像</p>
        <span id="feedbackText">观察城市肌理、河流、海岸和山地轮廓。</span>
      </div>
    </section>

    <section class="history-section">
      <div class="section-title">
        <span>猜测记录</span>
        <button id="giveUpButton" class="text-button" type="button">
          <i data-lucide="flag"></i>
          <span>揭晓</span>
        </button>
      </div>
      <div id="history" class="history"></div>
    </section>

    <div class="footer-panel">
      <div class="actions">
        <button id="resetButton" class="secondary-button" type="button" title="重开本题">
          <i data-lucide="rotate-ccw"></i>
          <span>重开本题</span>
        </button>
        <button id="shareButton" class="secondary-button" type="button" title="复制战绩" disabled>
          <i data-lucide="copy"></i>
          <span>复制战绩</span>
        </button>
      </div>

      <div class="status-grid">
        <div class="metric">
          <span>轮次</span>
          <strong id="roundLabel">1 / 6</strong>
        </div>
        <div class="metric">
          <span>题库</span>
          <strong id="cityCount">345</strong>
        </div>
        <div class="metric">
          <span>连胜</span>
          <strong id="streakCount">0</strong>
        </div>
      </div>
    </div>
  </aside>
</template>
