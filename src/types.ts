export interface Circle {
  x: number;
  y: number;
  radius: number;
  vx: number;
  vy: number;
  facingRight: boolean;
  animationPhase: number; // For walking animation
  prevX: number; // Previous x position
  prevY: number; // Previous y position
  // Individual characteristics
  speed: number; // Individual speed for this ant
  maxSpeed: number; // Maximum speed this ant can achieve
  // Harvesting state
  isCarrying: boolean; // Whether the ant is carrying clay
  targetClayPackIndex: number | null; // Index of target clay pack (-1 if going to castle)
}

export interface Castle {
  x: number;
  y: number;
  width: number;
  height: number;
  clayInventory: number; // Number of clay pieces stored
}

export interface ClayPack {
  x: number;
  y: number;
  width: number;
  height: number;
  id: number; // Unique identifier for tracking
}

export interface AnimationConfig {
  bobbleSpeed: number;
  rotationAmplitude: number;
  movementThreshold: number;
}

export interface SimulationConfig {
  numAnts: number;
  antSpeed: {
    min: number;
    max: number;
  };
  antSize: {
    min: number;
    max: number;
  };
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

export interface AntCharacteristics {
  radius: number;
  speed: number;
  maxSpeed: number;
}
