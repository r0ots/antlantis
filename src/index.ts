import Phaser from "phaser";
import AntSimulationScene from "./scenes/AntSimulationScene";
import { SimulationConfig, AnimationConfig } from "./types";

// Game configuration
const simulationConfig: SimulationConfig = {
  numAnts: 10,
  antSpeed: { min: 70, max: 130 },
  antSize: { min: 20, max: 40 },
  clayPackCount: 8,
  clayPackSize: { width: 45, height: 45 },
  castleSize: { width: 120, height: 120 },
  harvesting: {
    harvestDistance: 30,
    dropOffDistance: 40,
  },
};

const animationConfig: AnimationConfig = {
  bobbleSpeed: 0.12,
  rotationAmplitude: 0.06,
  movementThreshold: 0.8,
};

// Phaser game configuration
const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 1400,
  height: 900,
  parent: "game-container",
  backgroundColor: "#2d5016", // Forest green background
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
    scene.setConfig(simulationConfig);
    scene.setAnimationConfig(animationConfig);
  }
}

// Start the game when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", startGame);
} else {
  startGame();
}
