import Phaser from "phaser";
import { AnimationConfig } from "../types";
import { AntManager } from "../entities/AntManager";
import { VISUAL_CONFIG } from "./CollisionSystem";

export const DEFAULT_ANIMATION_CONFIG: AnimationConfig = {
  bobbleSpeed: 0.5,
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

    const isMoving =
      body.velocity.length() > this.animationConfig.movementThreshold;

    if (isMoving) {
      this.antManager.updateAnimationPhase(
        ant,
        this.animationConfig.bobbleSpeed * 0.3 // Slower hopping
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
      // Gradually return to neutral position when not moving
      ant.setRotation(ant.rotation * VISUAL_CONFIG.animationDamping);
    }
  }

  public setAnimationConfig(config: AnimationConfig): void {
    this.animationConfig = config;
  }
}
