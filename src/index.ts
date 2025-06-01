import Phaser from "phaser";
import AntSimulationScene, { WORLD_CONFIG } from "./scenes/AntSimulationScene";
import { DEFAULT_SIMULATION_CONFIG } from "./entities/AntManager";

// Phaser game configuration
const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: WORLD_CONFIG.width,
  height: WORLD_CONFIG.height,
  parent: "game-container",
  backgroundColor: WORLD_CONFIG.backgroundColor,
  physics: {
    default: "arcade",
    arcade: {
      debug: false,
      gravity: { x: 0, y: 0 },
    },
  },
  scene: [AntSimulationScene],
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: "100%",
    height: "100%",
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
  }
}

// Start the game when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", startGame);
} else {
  startGame();
}
