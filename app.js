import { initChinaleApp } from "./src/core/game-core.js";
import { skyeyeGame } from "./src/games/skyeye.js";
import { boundaryGame } from "./src/games/boundary.js";

initChinaleApp([skyeyeGame, boundaryGame], {
  defaultGameId: "skyeye",
});
