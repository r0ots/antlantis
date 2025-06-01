// Configuration types for Phaser-based ant simulation

export interface SimulationConfig {
  numAnts: number;
  antSpeed: number;
  antSize: number;
  clayPackCount: number;
  clayPackSize: { width: number; height: number };
  castleSize: { width: number; height: number };
  harvesting: {
    harvestDistance: number;
    dropOffDistance: number;
    harvestAnimationDuration: number;
    clayPackMaxHitPoints: number;
    damagePerHit: number;
  };
}

export interface AnimationConfig {
  bobbleSpeed: number;
  rotationAmplitude: number;
  movementThreshold: number;
  harvestRotationSpeed: number;
  harvestRotationAmplitude: number;
}

// Runtime data types
export interface CastleData {
  clayInventory: number;
}

export interface ClayPackData {
  hitPoints: number;
  maxHitPoints: number;
}
