// Configuration types for Phaser-based ant simulation

export interface SimulationConfig {
  numAnts: number;
  antSpeed: number;
  antSize: number;
  clayPackCount: number;
  clayPackSize: {
    width: number;
    height: number;
  };
  castleSize: {
    width: number;
    height: number;
  };
  harvesting: {
    harvestDistance: number;
    dropOffDistance: number;
  };
}

export interface AnimationConfig {
  bobbleSpeed: number;
  rotationAmplitude: number;
  movementThreshold: number;
}

// Runtime data types
export interface AntData {
  isCarrying: boolean;
  speed: number;
  animationPhase: number;
  previousX: number;
  previousY: number;
}

export interface CastleData {
  clayInventory: number;
}
