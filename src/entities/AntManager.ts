import Phaser from "phaser";
import { AntData, SimulationConfig } from "../types";
import { PHYSICS_CONFIG, VISUAL_CONFIG } from "../systems/CollisionSystem";
import { WORLD_CONFIG } from "../scenes/AntSimulationScene";

export const DEFAULT_SIMULATION_CONFIG: SimulationConfig = {
  numAnts: 10,
  antSpeed: 100,
  antSize: 30,
  clayPackCount: 8,
  clayPackSize: { width: 45, height: 45 },
  castleSize: { width: 120, height: 120 },
  harvesting: {
    harvestDistance: 40,
    dropOffDistance: 100,
    harvestAnimationDuration: 3000, // 3 seconds in milliseconds
  },
};

export class AntManager {
  private ants: Phaser.GameObjects.Sprite[] = [];
  private antData = new Map<Phaser.GameObjects.Sprite, AntData>();
  private scene: Phaser.Scene;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  public createAnts(config: SimulationConfig): Phaser.GameObjects.Sprite[] {
    const { numAnts, antSize, antSpeed } = config;

    for (let i = 0; i < numAnts; i++) {
      const position = this.findValidSpawnPosition(antSize);
      const ant = this.scene.physics.add.sprite(position.x, position.y, "ant");

      ant.setDisplaySize(antSize, antSize);

      // Set physics properties
      const body = ant.body as Phaser.Physics.Arcade.Body;
      body.setCollideWorldBounds(true);
      body.setBounce(PHYSICS_CONFIG.antBounce, PHYSICS_CONFIG.antBounce);

      // Store ant data
      this.antData.set(ant, {
        isCarrying: false,
        speed: antSpeed,
        animationPhase: Math.random() * Math.PI * 2,
        previousX: position.x,
        previousY: position.y,
        // Initialize harvest animation properties
        isHarvesting: false,
        harvestStartTime: 0,
        harvestTarget: null,
        harvestAnimationPhase: 0,
        lastHitPhase: 0,
      });

      this.ants.push(ant);
    }

    return this.ants;
  }

  public getAnts(): Phaser.GameObjects.Sprite[] {
    return this.ants;
  }

  public getAntData(ant: Phaser.GameObjects.Sprite): AntData | undefined {
    return this.antData.get(ant);
  }

  public setCarrying(ant: Phaser.GameObjects.Sprite, carrying: boolean): void {
    const data = this.antData.get(ant);
    if (data) {
      data.isCarrying = carrying;

      // Visual feedback
      if (carrying) {
        ant.setTint(VISUAL_CONFIG.carryingTint);
      } else {
        ant.clearTint();
      }
    }
  }

  public updateAnimationPhase(
    ant: Phaser.GameObjects.Sprite,
    increment: number
  ): void {
    const data = this.antData.get(ant);
    if (data) {
      data.animationPhase += increment;
    }
  }

  public startHarvesting(
    ant: Phaser.GameObjects.Sprite,
    target: Phaser.GameObjects.Sprite
  ): void {
    const data = this.antData.get(ant);
    if (data) {
      data.isHarvesting = true;
      data.harvestStartTime = Date.now();
      data.harvestTarget = target;
      data.harvestAnimationPhase = 0;
      data.lastHitPhase = 0;
    }
  }

  public updateHarvestAnimation(
    ant: Phaser.GameObjects.Sprite,
    increment: number
  ): void {
    const data = this.antData.get(ant);
    if (data && data.isHarvesting) {
      data.harvestAnimationPhase += increment;
    }
  }

  public stopHarvesting(ant: Phaser.GameObjects.Sprite): void {
    const data = this.antData.get(ant);
    if (data) {
      data.isHarvesting = false;
      data.harvestTarget = null;
      data.harvestAnimationPhase = 0;
    }
  }

  public isHarvestComplete(
    ant: Phaser.GameObjects.Sprite,
    duration: number
  ): boolean {
    const data = this.antData.get(ant);
    if (data && data.isHarvesting) {
      return Date.now() - data.harvestStartTime >= duration;
    }
    return false;
  }

  private findValidSpawnPosition(maxSize: number): { x: number; y: number } {
    const margin = maxSize / 2 + 20;
    const centerX = this.scene.scale.width / 2;
    const centerY = this.scene.scale.height / 2;

    for (let attempts = 0; attempts < 100; attempts++) {
      const x = Phaser.Math.Between(margin, this.scene.scale.width - margin);
      const y = Phaser.Math.Between(margin, this.scene.scale.height - margin);

      // Avoid spawning too close to center (where castle is)
      const distanceFromCenter = Phaser.Math.Distance.Between(
        x,
        y,
        centerX,
        centerY
      );
      if (distanceFromCenter > WORLD_CONFIG.minDistance.antSpawnRadius) {
        return { x, y };
      }
    }

    // Fallback position
    return {
      x: Phaser.Math.Between(margin, this.scene.scale.width - margin),
      y: Phaser.Math.Between(margin, this.scene.scale.height - margin),
    };
  }
}
