<template>
  <dialog id="resultDialog" class="result-dialog">
    <div class="result-shell">
      <button id="closeDialogButton" class="icon-button close-dialog" type="button" title="关闭">
        <i data-lucide="x"></i>
      </button>
      <p id="resultEyebrow" class="eyebrow">命中目标</p>
      <h2 id="resultTitle">答案是</h2>
      <p id="resultText"></p>
      <div class="result-actions">
        <button id="dialogNewRoundButton" class="primary-button" type="button">
          <i data-lucide="shuffle"></i>
          <span>下一题</span>
        </button>
        <button id="dialogShareButton" class="secondary-button" type="button">
          <i data-lucide="copy"></i>
          <span>复制战绩</span>
        </button>
      </div>
    </div>
  </dialog>
</template>
