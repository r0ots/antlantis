import Phaser from "phaser";
import { AnimationConfig } from "../types";
import { AntManager } from "../entities/AntManager";
import { ClayPackManager } from "../entities/ClayPackManager";
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
  private clayPackManager: ClayPackManager;
  private animationConfig: AnimationConfig;
  private scene: Phaser.Scene;
  private damagePerHit: number;

  constructor(
    antManager: AntManager,
    clayPackManager: ClayPackManager,
    animationConfig: AnimationConfig,
    scene: Phaser.Scene,
    damagePerHit: number = 1
  ) {
    this.antManager = antManager;
    this.clayPackManager = clayPackManager;
    this.animationConfig = animationConfig;
    this.scene = scene;
    this.damagePerHit = damagePerHit;
  }

  public updateAntAnimation(ant: Phaser.GameObjects.Sprite): void {
    const antData = this.antManager.getAntData(ant);
    if (!antData) return;

    const body = ant.body as Phaser.Physics.Arcade.Body;

    // Handle harvest animation state
    if (antData.isHarvesting && antData.harvestTarget) {
      // Stop ant movement during harvest
      body.setVelocity(0, 0);

      // Face the harvest target (fixed direction)
      ant.setFlipX(antData.harvestTarget.x > ant.x);

      // Store original position if not already stored
      if (!antData.originalHarvestX || !antData.originalHarvestY) {
        antData.originalHarvestX = ant.x;
        antData.originalHarvestY = ant.y;
      }

      // Check for cooldown period (1 second = 1000ms)
      const currentTime = this.scene.time.now;
      const cooldownDuration = 1000; // 1 second cooldown
      const knockbackDuration = 200; // 200ms knockback duration
      const stunDuration = 1000; // 1 second stun duration

      // Handle stun effect - takes priority over everything else
      if (antData.isStunned && antData.stunStartTime) {
        const timeSinceStun = currentTime - antData.stunStartTime;
        if (timeSinceStun < stunDuration) {
          // During stun - completely immobilize the ant at knocked-back position
          body.setVelocity(0, 0); // Stop all movement
          ant.setRotation(0); // Reset rotation

          // Keep ant locked at their stunned position
          if (antData.originalHarvestX && antData.originalHarvestY) {
            body.x = antData.originalHarvestX - body.halfWidth;
            body.y = antData.originalHarvestY - body.halfHeight;
          }

          // Optional: Add visual stun effect (slight trembling or different tint)
          const stunTremble = Math.sin(currentTime * 0.02) * 0.5; // Slight trembling
          ant.y += stunTremble;

          // Update previous position to current position
          antData.previousX = ant.x;
          antData.previousY = ant.y;
          return; // Skip all other animations during stun
        } else {
          // Stun finished, clear stun state
          antData.isStunned = false;
          antData.stunStartTime = undefined;
        }
      }

      // Handle knockback effect - happens instantly, not over time
      if (antData.knockbackStartTime && antData.knockbackDistance) {
        // Calculate knockback direction (opposite of target direction)
        const directionX = antData.harvestTarget.x - antData.originalHarvestX!;
        const directionY = antData.harvestTarget.y - antData.originalHarvestY!;
        const distance = Math.sqrt(
          directionX * directionX + directionY * directionY
        );
        const normalizedX = directionX / distance;
        const normalizedY = directionY / distance;

        // Calculate final knockback position
        const knockbackX =
          antData.originalHarvestX! - normalizedX * antData.knockbackDistance!;
        const knockbackY =
          antData.originalHarvestY! - normalizedY * antData.knockbackDistance!;

        // Instantly move the physics body to knocked-back position
        body.x = knockbackX - body.halfWidth;
        body.y = knockbackY - body.halfHeight;

        // Update the original harvest position to the knocked-back position
        antData.originalHarvestX = knockbackX;
        antData.originalHarvestY = knockbackY;

        // Clear knockback state and start stun immediately
        antData.knockbackStartTime = undefined;
        antData.knockbackDistance = undefined;
        antData.isStunned = true;
        antData.stunStartTime = currentTime;

        // Update previous position
        antData.previousX = ant.x;
        antData.previousY = ant.y;
        return;
      }

      // After handling stun and knockback, check if ant is close enough to attack
      const distanceToTarget = Math.sqrt(
        Math.pow(antData.harvestTarget.x - ant.x, 2) +
          Math.pow(antData.harvestTarget.y - ant.y, 2)
      );
      const attackRange = 50; // Increased range to ensure ants can attack when close

      // If ant is too far from target, let them move normally (no headbutt animation)
      if (distanceToTarget > attackRange) {
        // Reset rotation and let normal movement/pathfinding take over
        ant.setRotation(0);
        antData.previousX = ant.x;
        antData.previousY = ant.y;
        return; // Skip headbutt animation, let ant walk closer
      }

      if (antData.isInCooldown && antData.lastHitTime) {
        const timeSinceHit = currentTime - antData.lastHitTime;
        if (timeSinceHit < cooldownDuration) {
          // During cooldown - don't lock position, let ant move freely
          // This allows the ant to walk back to the target after knockback
          ant.setRotation(0); // Reset rotation only

          // Update previous position to current position
          antData.previousX = ant.x;
          antData.previousY = ant.y;

          // Return here to skip headbutt animation but allow normal movement
          return;
        } else {
          // Cooldown finished, reset for next attack
          antData.isInCooldown = false;
          antData.harvestAnimationPhase = 0; // Reset animation phase for clean start
          // Update original harvest position to current position for next attack
          antData.originalHarvestX = ant.x;
          antData.originalHarvestY = ant.y;
        }
      }

      // Update harvest animation phase
      this.antManager.updateHarvestAnimation(
        ant,
        this.animationConfig.harvestRotationSpeed
      );

      // Headbutt animation - move forward and backward towards target
      const headbuttCycle = Math.sin(antData.harvestAnimationPhase * 2); // Faster cycle for headbutt
      const headbuttDistance = 8; // Distance to move forward during headbutt

      // Calculate direction towards target
      const directionX = antData.harvestTarget.x - ant.x;
      const directionY = antData.harvestTarget.y - ant.y;
      const distance = Math.sqrt(
        directionX * directionX + directionY * directionY
      );

      // Normalize direction
      const normalizedX = directionX / distance;
      const normalizedY = directionY / distance;

      // Apply headbutt motion - move forward when headbuttCycle is positive
      const headbuttIntensity = Math.max(0, headbuttCycle) * headbuttDistance;

      // Apply headbutt movement - use non-null assertion since we just ensured they exist
      ant.x = antData.originalHarvestX! + normalizedX * headbuttIntensity;
      ant.y = antData.originalHarvestY! + normalizedY * headbuttIntensity;

      // Add slight up-down head movement for more realistic headbutt
      const headBobbing = Math.sin(antData.harvestAnimationPhase * 3) * 1.5;
      ant.y += headBobbing;

      // Diving headbutt rotation - tilt forward during the attack
      const diveRotation =
        headbuttIntensity > 0
          ? (headbuttIntensity / headbuttDistance) * 0.4
          : 0; // Tilt forward up to 0.4 radians (~23 degrees)
      const flipMultiplier = ant.flipX ? 1 : -1; // Adjust rotation direction based on flip
      ant.setRotation(diveRotation * flipMultiplier);

      // Spawn hit effect when at maximum forward position
      const currentHitPhase = Math.floor(
        (antData.harvestAnimationPhase * 2) / (Math.PI * 2)
      );
      if (
        currentHitPhase > antData.lastHitPhase &&
        headbuttCycle > 0.9 && // At the peak of the forward motion
        !antData.isInCooldown && // Only hit if not in cooldown
        !antData.knockbackStartTime && // Only hit if not in knockback
        !antData.isStunned // Only hit if not stunned
      ) {
        this.spawnHitEffect(ant, antData.harvestTarget);
        antData.lastHitPhase = currentHitPhase;
        antData.lastHitTime = currentTime;
        antData.isInCooldown = true;

        // Damage the clay pack
        const isDestroyed = this.clayPackManager.damageClayPack(
          antData.harvestTarget,
          this.damagePerHit
        );

        // If clay pack is destroyed, stop harvesting and let ant carry clay
        if (isDestroyed) {
          this.antManager.setCarrying(ant, true);
          this.antManager.stopHarvesting(ant);
          this.clayPackManager.removeClayPack(antData.harvestTarget);
          // Clear persistent target since this clay pack is destroyed
          antData.persistentTarget = null;
        }

        // Start knockback effect (stun will start after knockback ends)
        antData.knockbackStartTime = currentTime;
        antData.knockbackDistance = 35; // Increased distance to force walking back
      }

      // Update previous position to current position to prevent drift detection
      antData.previousX = ant.x;
      antData.previousY = ant.y;

      return;
    } else {
      // Reset original harvest position and cooldown state when not harvesting
      const antData = this.antManager.getAntData(ant);
      if (antData) {
        antData.originalHarvestX = undefined;
        antData.originalHarvestY = undefined;
        antData.isInCooldown = false;
        antData.lastHitTime = undefined;
        antData.knockbackStartTime = undefined;
        antData.knockbackDistance = undefined;
        antData.isStunned = false;
        antData.stunStartTime = undefined;
        // Don't clear persistent target here - let behavior system handle it
      }
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
