import "leaflet/dist/leaflet.css";
import "../styles.css";

import L from "leaflet";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  BadgeCheck,
  CircleAlert,
  Copy,
  CopyCheck,
  Crosshair,
  Eraser,
  Flag,
  LayoutGrid,
  Map as MapIcon,
  MapPin,
  Monitor,
  Moon,
  Radar,
  Repeat2,
  RotateCcw,
  Satellite,
  Search,
  Shuffle,
  Sprout,
  Sun,
  TriangleAlert,
  X,
  createIcons,
} from "lucide";
import { pinyin } from "pinyin-pro";
import { createApp, nextTick } from "vue";

import App from "./App.vue";
import { initChinaleApp } from "./core/game-core.js";
import { CITY_DATA } from "./data/cities.js";
import { boundaryGame } from "./games/boundary.js";
import { cabbageGame } from "./games/cabbage.js";
import { skyeyeGame } from "./games/skyeye.js";
import { initTheme } from "./theme.js";

const icons = {
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  BadgeCheck,
  CircleAlert,
  Copy,
  CopyCheck,
  Crosshair,
  Eraser,
  Flag,
  LayoutGrid,
  Map: MapIcon,
  MapPin,
  Monitor,
  Moon,
  Radar,
  Repeat2,
  RotateCcw,
  Satellite,
  Search,
  Shuffle,
  Sprout,
  Sun,
  TriangleAlert,
  X,
};

window.L = L;
window.lucide = {
  createIcons: (options = {}) => createIcons({ icons, ...options }),
};
window.pinyinPro = { pinyin };

bootstrap();

async function bootstrap() {
  initTheme();

  const app = createApp(App);
  app.mount("#app");

  await nextTick();

  initChinaleApp([skyeyeGame, boundaryGame, cabbageGame], {
    cities: CITY_DATA,
    defaultGameId: "skyeye",
  });
}
