<template>
  <dialog id="cityPickerDialog" class="city-picker-dialog">
    <div class="city-picker-shell">
      <header class="city-picker-header">
        <div>
          <p class="eyebrow">City Board</p>
          <h2>选择城市</h2>
        </div>
        <div class="picker-head-actions">
          <span id="pickerRemain" class="picker-count">345</span>
          <button id="closePickerButton" class="icon-button" type="button" title="关闭">
            <i data-lucide="x"></i>
          </button>
        </div>
      </header>
      <div class="picker-toolbar">
        <div class="input-wrap compact-input">
          <i data-lucide="search"></i>
          <input id="cityFilter" type="text" inputmode="search" placeholder="筛选城市或省份" />
        </div>
        <button id="clearPickerFilterButton" class="secondary-button" type="button">
          <i data-lucide="eraser"></i>
          <span>清空</span>
        </button>
      </div>
      <div id="cityBoard" class="city-board" aria-label="城市选择列表"></div>
    </div>
  </dialog>
</template>
