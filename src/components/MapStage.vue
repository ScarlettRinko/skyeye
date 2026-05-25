<template>
  <section class="map-stage" aria-label="卫星影像区域">
    <div id="map" class="map"></div>
    <div id="terrainStaticStage" class="terrain-static-stage" hidden></div>
    <div class="map-vignette" aria-hidden="true"></div>
    <div class="scanline" aria-hidden="true"></div>
    <button id="homeButton" class="map-back-button" type="button" title="返回关卡选择">
      <i data-lucide="arrow-left"></i>
      <span>返回</span>
    </button>
    <div class="map-badge">
      <i data-lucide="satellite"></i>
      <span id="targetMode">今日挑战</span>
    </div>
    <div id="zoomStack" class="zoom-stack" aria-label="当前视野进度"></div>
  </section>
</template>
