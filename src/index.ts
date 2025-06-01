import Phaser from "phaser";
import AntSimulationScene from "./scenes/AntSimulationScene";
import {
  DEFAULT_SIMULATION_CONFIG,
  DEFAULT_ANIMATION_CONFIG,
  GAME_CONFIG,
} from "./config/GameConfig";

// Phaser game configuration
const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: GAME_CONFIG.world.width,
  height: GAME_CONFIG.world.height,
  parent: "game-container",
  backgroundColor: GAME_CONFIG.world.backgroundColor,
  physics: {
    default: "arcade",
    arcade: {
      debug: false,
      gravity: { x: 0, y: 0 },
    },
  },
  scene: [AntSimulationScene],
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    min: { width: 800, height: 600 },
    max: { width: 1600, height: 1200 },
  },
};

// Initialize the game
function startGame(): void {
  // Create game container if it doesn't exist
  if (!document.getElementById("game-container")) {
    const gameContainer = document.createElement("div");
    gameContainer.id = "game-container";
    document.body.appendChild(gameContainer);
  }

  const game = new Phaser.Game(config);

  // Configure the scene once it's created
  game.scene.start("AntSimulationScene");
  const scene = game.scene.getScene("AntSimulationScene") as AntSimulationScene;

  if (scene) {
    scene.setConfig(DEFAULT_SIMULATION_CONFIG);
    scene.setAnimationConfig(DEFAULT_ANIMATION_CONFIG);
  }
}

// Start the game when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", startGame);
} else {
  startGame();
}
