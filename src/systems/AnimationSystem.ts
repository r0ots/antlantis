import Phaser from "phaser";
import { AnimationConfig } from "../types";
import { AntManager } from "../entities/AntManager";
import { VISUAL_CONFIG } from "./CollisionSystem";

export const DEFAULT_ANIMATION_CONFIG: AnimationConfig = {
  bobbleSpeed: 0.4,
  rotationAmplitude: 0.06,
  movementThreshold: 0.8,
};

export class AnimationSystem {
  private antManager: AntManager;
  private animationConfig: AnimationConfig;

  constructor(antManager: AntManager, animationConfig: AnimationConfig) {
    this.antManager = antManager;
    this.animationConfig = animationConfig;
  }

  public updateAntAnimation(ant: Phaser.GameObjects.Sprite): void {
    const antData = this.antManager.getAntData(ant);
    if (!antData) return;

    const body = ant.body as Phaser.Physics.Arcade.Body;
    ant.setFlipX(body.velocity.x > 0);

    // Check actual movement by comparing current position to previous position
    const actualMovement = Math.sqrt(
      Math.pow(ant.x - antData.previousX, 2) +
        Math.pow(ant.y - antData.previousY, 2)
    );
    const isMoving = actualMovement > this.animationConfig.movementThreshold;

    if (isMoving) {
      this.antManager.updateAnimationPhase(
        ant,
        this.animationConfig.bobbleSpeed
      );

      // Hopping animation - creates small discrete jumps
      const hopCycle = Math.sin(antData.animationPhase);
      const hop = hopCycle > 0 ? Math.pow(hopCycle, 2) * 2.3 : 0; // Slightly bigger hops
      const wiggle =
        Math.sin(antData.animationPhase * 0.7) *
        this.animationConfig.rotationAmplitude;

      ant.y += hop * -0.8; // Negative to hop upward
      ant.setRotation(wiggle);
    } else {
      ant.setRotation(ant.rotation * VISUAL_CONFIG.animationDamping);
    }

    // Update previous position for next frame
    antData.previousX = ant.x;
    antData.previousY = ant.y;
  }

  public setAnimationConfig(config: AnimationConfig): void {
    this.animationConfig = config;
  }
}
