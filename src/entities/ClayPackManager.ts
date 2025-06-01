import Phaser from "phaser";
import { SimulationConfig, ClayPackData } from "../types";
import { WORLD_CONFIG } from "../scenes/AntSimulationScene";

export class ClayPackManager {
  private clayPacks: Phaser.GameObjects.Sprite[] = [];
  private clayPackData: Map<Phaser.GameObjects.Sprite, ClayPackData> =
    new Map();
  private scene: Phaser.Scene;
  private castle: Phaser.GameObjects.Sprite;

  constructor(scene: Phaser.Scene, castle: Phaser.GameObjects.Sprite) {
    this.scene = scene;
    this.castle = castle;
  }

  public createClayPacks(
    config: SimulationConfig
  ): Phaser.GameObjects.Sprite[] {
    const { clayPackCount, clayPackSize, harvesting } = config;

    for (let i = 0; i < clayPackCount; i++) {
      const position = this.findValidPosition(
        clayPackSize.width,
        clayPackSize.height
      );

      const clayPack = this.scene.physics.add.sprite(
        position.x,
        position.y,
        "clayPack"
      );
      clayPack.setDisplaySize(clayPackSize.width, clayPackSize.height);

      const body = clayPack.body as Phaser.Physics.Arcade.Body;
      body.setImmovable(true);

      // Initialize hit points for this clay pack
      const clayData: ClayPackData = {
        hitPoints: harvesting.clayPackMaxHitPoints,
        maxHitPoints: harvesting.clayPackMaxHitPoints,
      };
      this.clayPackData.set(clayPack, clayData);

      this.clayPacks.push(clayPack);
    }

    return this.clayPacks;
  }

  public getClayPacks(): Phaser.GameObjects.Sprite[] {
    return this.clayPacks;
  }

  public getClayPackData(
    clayPack: Phaser.GameObjects.Sprite
  ): ClayPackData | undefined {
    return this.clayPackData.get(clayPack);
  }

  public damageClayPack(
    clayPack: Phaser.GameObjects.Sprite,
    damage: number
  ): boolean {
    const clayData = this.clayPackData.get(clayPack);
    if (!clayData) return false;

    clayData.hitPoints = Math.max(0, clayData.hitPoints - damage);

    // Update visual to show damage (make it more transparent/darker as it takes damage)
    const healthPercentage = clayData.hitPoints / clayData.maxHitPoints;
    clayPack.setAlpha(0.3 + healthPercentage * 0.7); // Alpha from 0.3 to 1.0
    clayPack.setTint(
      0xffffff * healthPercentage + 0x666666 * (1 - healthPercentage)
    ); // Darker as damaged

    return clayData.hitPoints <= 0;
  }

  public removeClayPack(clayPack: Phaser.GameObjects.Sprite): void {
    // Add null check for defensive programming
    if (!clayPack) {
      return;
    }

    this.clayPackData.delete(clayPack);
    clayPack.destroy();
    this.clayPacks = this.clayPacks.filter((pack) => pack !== clayPack);
  }

  public findNearestClayPack(
    ant: Phaser.GameObjects.Sprite
  ): Phaser.GameObjects.Sprite | null {
    if (this.clayPacks.length === 0) return null;

    return this.clayPacks.reduce((closest, current) => {
      const distToCurrent = Phaser.Math.Distance.Between(
        ant.x,
        ant.y,
        current.x,
        current.y
      );
      const distToClosest = Phaser.Math.Distance.Between(
        ant.x,
        ant.y,
        closest.x,
        closest.y
      );
      return distToCurrent < distToClosest ? current : closest;
    });
  }

  private findValidPosition(
    width: number,
    height: number
  ): { x: number; y: number } {
    const margin = Math.max(width, height) / 2 + 20;

    for (let attempts = 0; attempts < 100; attempts++) {
      const x = Phaser.Math.Between(margin, this.scene.scale.width - margin);
      const y = Phaser.Math.Between(margin, this.scene.scale.height - margin);

      // Check distance from castle
      const distanceToCastle = Phaser.Math.Distance.Between(
        x,
        y,
        this.castle.x,
        this.castle.y
      );
      if (distanceToCastle < WORLD_CONFIG.minDistance.castleToClayPack)
        continue;

      // Check distance from existing clay packs
      const tooCloseToOthers = this.clayPacks.some(
        (pack) =>
          Phaser.Math.Distance.Between(x, y, pack.x, pack.y) <
          WORLD_CONFIG.minDistance.clayPackToClayPack
      );

      if (!tooCloseToOthers) {
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
