import Phaser from "phaser";
import { SimulationConfig, CastleData } from "../types";
import { AntManager } from "../entities/AntManager";
import { ClayPackManager } from "../entities/ClayPackManager";

export const PHYSICS_CONFIG = {
  antBounce: 0.3,
  collisionRandomness: 5,
};

export const VISUAL_CONFIG = {
  carryingTint: 0x8b4513, // Brown color when carrying clay
  animationDamping: 0.9,
};

export class CollisionSystem {
  private antManager: AntManager;
  private clayPackManager: ClayPackManager;
  private castle: Phaser.GameObjects.Sprite;
  private castleData: CastleData;
  private config: SimulationConfig;

  constructor(
    antManager: AntManager,
    clayPackManager: ClayPackManager,
    castle: Phaser.GameObjects.Sprite,
    castleData: CastleData,
    config: SimulationConfig
  ) {
    this.antManager = antManager;
    this.clayPackManager = clayPackManager;
    this.castle = castle;
    this.castleData = castleData;
    this.config = config;
  }

  public handleAntClayPackOverlap = (ant: any, clayPack: any): void => {
    const antSprite = ant as Phaser.GameObjects.Sprite;
    const clayPackSprite = clayPack as Phaser.GameObjects.Sprite;
    const antData = this.antManager.getAntData(antSprite);

    if (!antData || antData.isCarrying) return;

    const distance = Phaser.Math.Distance.Between(
      antSprite.x,
      antSprite.y,
      clayPackSprite.x,
      clayPackSprite.y
    );

    if (distance <= this.config.harvesting.harvestDistance) {
      if (!antData.isHarvesting) {
        // Start harvest animation - either first time or resuming after knockback
        this.antManager.startHarvesting(antSprite, clayPackSprite);
      }
      // Removed old time-based clay pack removal - now handled by hit-based system in AnimationSystem
    }
  };

  public handleAntCastleOverlap = (ant: any, castle: any): void => {
    const antSprite = ant as Phaser.GameObjects.Sprite;
    const antData = this.antManager.getAntData(antSprite);

    if (
      antData &&
      antData.isCarrying &&
      Phaser.Math.Distance.Between(
        antSprite.x,
        antSprite.y,
        castle.x,
        castle.y
      ) <= this.config.harvesting.dropOffDistance
    ) {
      this.antManager.setCarrying(antSprite, false);
      this.castleData.clayInventory++;
    }
  };

  public handleAntCollision = (ant1: any, ant2: any): void => {
    // Add slight randomness to prevent ants getting stuck together
    const ant1Body = (ant1 as Phaser.GameObjects.Sprite)
      .body as Phaser.Physics.Arcade.Body;
    const ant2Body = (ant2 as Phaser.GameObjects.Sprite)
      .body as Phaser.Physics.Arcade.Body;

    const randomness = PHYSICS_CONFIG.collisionRandomness;
    ant1Body.velocity.x += Phaser.Math.Between(-randomness, randomness);
    ant1Body.velocity.y += Phaser.Math.Between(-randomness, randomness);
    ant2Body.velocity.x += Phaser.Math.Between(-randomness, randomness);
    ant2Body.velocity.y += Phaser.Math.Between(-randomness, randomness);
  };

  public getCastleData(): CastleData {
    return this.castleData;
  }

  public update(): void {
    // Removed old time-based harvest completion logic
    // Clay pack destruction is now handled by the hit-based system in AnimationSystem
  }
}
