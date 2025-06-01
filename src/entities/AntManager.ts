import Phaser from "phaser";
import { SimulationConfig } from "../types";
import { PHYSICS_CONFIG } from "../systems/CollisionSystem";
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
    harvestAnimationDuration: 3000,
    clayPackMaxHitPoints: 30,
    damagePerHit: 5,
  },
};

export class AntManager {
  private ants: Phaser.GameObjects.Sprite[] = [];
  private antData = new Map<Phaser.GameObjects.Sprite, { speed: number }>();

  constructor(private scene: Phaser.Scene) {}

  createAnts(config: SimulationConfig): Phaser.GameObjects.Sprite[] {
    const { numAnts, antSize, antSpeed } = config;

    for (let i = 0; i < numAnts; i++) {
      const position = this.findValidSpawnPosition(antSize);
      const ant = this.scene.physics.add.sprite(position.x, position.y, "ant");

      ant.setDisplaySize(antSize, antSize);

      const body = ant.body as Phaser.Physics.Arcade.Body;
      body.setCollideWorldBounds(true);
      body.setBounce(PHYSICS_CONFIG.antBounce, PHYSICS_CONFIG.antBounce);

      this.antData.set(ant, { speed: antSpeed });
      this.ants.push(ant);
    }

    return this.ants;
  }

  getAnts() {
    return this.ants;
  }

  getAntSpeed(ant: Phaser.GameObjects.Sprite) {
    return this.antData.get(ant)?.speed || 100;
  }

  private findValidSpawnPosition(maxSize: number) {
    const margin = maxSize / 2 + 20;
    const { width, height } = this.scene.scale;
    const centerX = width / 2;
    const centerY = height / 2;

    for (let attempts = 0; attempts < 100; attempts++) {
      const x = Phaser.Math.Between(margin, width - margin);
      const y = Phaser.Math.Between(margin, height - margin);

      if (
        Phaser.Math.Distance.Between(x, y, centerX, centerY) >
        WORLD_CONFIG.minDistance.antSpawnRadius
      ) {
        return { x, y };
      }
    }

    return {
      x: Phaser.Math.Between(margin, width - margin),
      y: Phaser.Math.Between(margin, height - margin),
    };
  }
}
