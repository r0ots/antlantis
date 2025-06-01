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
  constructor(
    private antManager: AntManager,
    private clayPackManager: ClayPackManager,
    private castle: Phaser.GameObjects.Sprite,
    private castleData: CastleData,
    private config: SimulationConfig
  ) {}

  // Simplified collision handlers - state machine handles the complex logic
  public handleAntClayPackOverlap = (ant: any, clayPack: any): void => {
    // Basic overlap detection is still useful for physics
    // But state machine handles harvesting logic
  };

  public handleAntCastleOverlap = (ant: any, castle: any): void => {
    // State machine handles clay delivery logic
    // This could be used for additional effects or validation
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
    // State machine handles all the complex update logic now
  }
}
