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
}

export interface AnimationConfig {
  bobbleAmplitude: number;
  bobbleSpeed: number;
  rotationAmplitude: number;
  movementThreshold: number;
}

export interface SimulationConfig {
  numCircles: number;
  circleRadius: {
    min: number;
    max: number;
  };
  speed: {
    min: number;
    max: number;
  };
}

export interface AntCharacteristics {
  radius: number;
  speed: number;
  maxSpeed: number;
}
