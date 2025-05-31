import { Game } from "./game";
import { SimulationConfig, AnimationConfig } from "./types";

// Configuration
const simulationConfig: SimulationConfig = {
  numCircles: 5,
  circleRadius: {
    min: 15, // Smallest ant
    max: 30, // Largest ant
  },
  speed: {
    min: 1, // Slowest ant
    max: 4, // Fastest ant
  },
};

const animationConfig: AnimationConfig = {
  bobbleAmplitude: 2, // This will be overridden per ant based on size
  bobbleSpeed: 0.3,
  rotationAmplitude: 0.1,
  movementThreshold: 0.1,
};

// Initialize and start the game
const game = new Game(
  "simulationCanvas",
  simulationConfig,
  animationConfig,
  "assets/fourmi.png"
);

game.start().catch((error) => {
  console.error("Failed to start game:", error);
});
