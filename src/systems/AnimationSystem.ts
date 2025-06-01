import Phaser from "phaser";
import { AnimationConfig } from "../types";
import { AntManager } from "../entities/AntManager";
import { VISUAL_CONFIG } from "./CollisionSystem";

export const DEFAULT_ANIMATION_CONFIG: AnimationConfig = {
  bobbleSpeed: 0.4,
  rotationAmplitude: 0.06,
  movementThreshold: 0.8,
  harvestRotationSpeed: 0.15, // Faster rotation during harvest
  harvestRotationAmplitude: 0.3, // More pronounced rotation for harvest
};

export class AnimationSystem {
  private antManager: AntManager;
  private animationConfig: AnimationConfig;
  private scene: Phaser.Scene;

  constructor(
    antManager: AntManager,
    animationConfig: AnimationConfig,
    scene: Phaser.Scene
  ) {
    this.antManager = antManager;
    this.animationConfig = animationConfig;
    this.scene = scene;
  }

  public updateAntAnimation(ant: Phaser.GameObjects.Sprite): void {
    const antData = this.antManager.getAntData(ant);
    if (!antData) return;

    const body = ant.body as Phaser.Physics.Arcade.Body;

    // Handle harvest animation state
    if (antData.isHarvesting && antData.harvestTarget) {
      // Stop ant movement during harvest
      body.setVelocity(0, 0);

      // Face the harvest target
      ant.setFlipX(antData.harvestTarget.x < ant.x);

      // Update harvest animation phase
      this.antManager.updateHarvestAnimation(
        ant,
        this.animationConfig.harvestRotationSpeed
      );

      // Create hitting/rotating animation - only rotation, no position changes
      const hitCycle = Math.sin(antData.harvestAnimationPhase);
      const hitRotation =
        hitCycle * this.animationConfig.harvestRotationAmplitude;

      // Add rapid back-and-forth motion to simulate hitting
      const rapidHit = Math.sin(antData.harvestAnimationPhase * 4) * 0.1;

      ant.setRotation(hitRotation + rapidHit);

      // Spawn hit effect when hitting (at the peak of the rapid hit cycle)
      const currentHitPhase = Math.floor(
        (antData.harvestAnimationPhase * 4) / (Math.PI * 2)
      );
      if (
        currentHitPhase > antData.lastHitPhase &&
        Math.sin(antData.harvestAnimationPhase * 4) > 0.999
      ) {
        this.spawnHitEffect(ant, antData.harvestTarget);
        antData.lastHitPhase = currentHitPhase;
      }

      // Keep ant position fixed - no movement during harvest
      // Update previous position to current position to prevent drift detection
      antData.previousX = ant.x;
      antData.previousY = ant.y;

      return;
    }

    // Normal animation (existing code)
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

  private spawnHitEffect(
    ant: Phaser.GameObjects.Sprite,
    target: Phaser.GameObjects.Sprite
  ): void {
    // Calculate position between ant and target
    const midX = (ant.x + target.x) / 2;
    const midY = (ant.y + target.y) / 2;

    // Create multiple small sparks
    const sparkCount = Phaser.Math.Between(3, 6);

    for (let i = 0; i < sparkCount; i++) {
      // Add randomness to spawn position
      const offsetX = Phaser.Math.Between(-8, 8);
      const offsetY = Phaser.Math.Between(-8, 8);

      // Create very tiny hit effect sprite
      const spark = this.scene.add.sprite(
        midX + offsetX,
        midY + offsetY,
        "hit"
      );
      spark.setScale(Phaser.Math.FloatBetween(0.02, 0.02)); // Even smaller
      spark.setAlpha(0.9); // Start almost fully visible

      // Random trajectory - more upward focused
      const angle = Phaser.Math.FloatBetween(-Math.PI / 6, (-Math.PI * 5) / 6); // More upward angles (-30° to -150°)
      const speed = Phaser.Math.FloatBetween(30, 60);
      const gravity = Phaser.Math.FloatBetween(40, 60); // Reduced gravity for more upward motion

      // Calculate end position for curved trajectory
      const distance = Phaser.Math.FloatBetween(15, 30); // Shorter distance
      const endX =
        spark.x +
        Math.cos(angle) * distance +
        Phaser.Math.FloatBetween(-10, 10);
      const endY = spark.y + Math.sin(angle) * distance + gravity * 0.1; // Less gravity effect

      // Animate the spark with curved trajectory and fade out
      this.scene.tweens.add({
        targets: spark,
        x: endX,
        y: endY,
        scaleX: 0.01, // Shrink to almost nothing
        scaleY: 0.01,
        alpha: 0, // Fade to completely transparent
        duration: Phaser.Math.Between(300, 500), // Shorter duration
        ease: "Quad.easeOut",
        onComplete: () => {
          spark.destroy();
        },
      });

      // Add slight rotation for more dynamic look
      this.scene.tweens.add({
        targets: spark,
        rotation: Phaser.Math.FloatBetween(-Math.PI, Math.PI),
        duration: Phaser.Math.Between(300, 500),
        ease: "Linear",
      });
    }
  }
}
