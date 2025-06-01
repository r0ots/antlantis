import Phaser from "phaser";
import { SimulationConfig, ClayPackData } from "../types";
import { WORLD_CONFIG } from "../scenes/AntSimulationScene";

export class ClayPackManager {
  private clayPacks: Phaser.GameObjects.Sprite[] = [];
  private clayPackData = new Map<Phaser.GameObjects.Sprite, ClayPackData>();

  constructor(
    private scene: Phaser.Scene,
    private castle: Phaser.GameObjects.Sprite
  ) {}

  createClayPacks(config: SimulationConfig): Phaser.GameObjects.Sprite[] {
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
      (clayPack.body as Phaser.Physics.Arcade.Body).setImmovable(true);

      this.clayPackData.set(clayPack, {
        hitPoints: harvesting.clayPackMaxHitPoints,
        maxHitPoints: harvesting.clayPackMaxHitPoints,
      });

      this.clayPacks.push(clayPack);
    }

    return this.clayPacks;
  }

  getClayPacks() {
    return this.clayPacks;
  }

  getClayPackData(clayPack: Phaser.GameObjects.Sprite) {
    return this.clayPackData.get(clayPack);
  }

  damageClayPack(clayPack: Phaser.GameObjects.Sprite, damage: number): boolean {
    const clayData = this.clayPackData.get(clayPack);
    if (!clayData) return false;

    clayData.hitPoints = Math.max(0, clayData.hitPoints - damage);
    const healthPercentage = clayData.hitPoints / clayData.maxHitPoints;

    clayPack.setAlpha(0.3 + healthPercentage * 0.7);
    clayPack.setTint(
      0xffffff * healthPercentage + 0x666666 * (1 - healthPercentage)
    );

    return clayData.hitPoints <= 0;
  }

  removeClayPack(clayPack: Phaser.GameObjects.Sprite): void {
    if (!clayPack) return;

    this.clayPackData.delete(clayPack);
    clayPack.destroy();
    this.clayPacks = this.clayPacks.filter((pack) => pack !== clayPack);
  }

  findNearestClayPack(
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

  private findValidPosition(width: number, height: number) {
    const margin = Math.max(width, height) / 2 + 20;
    const { width: sceneWidth, height: sceneHeight } = this.scene.scale;

    for (let attempts = 0; attempts < 100; attempts++) {
      const x = Phaser.Math.Between(margin, sceneWidth - margin);
      const y = Phaser.Math.Between(margin, sceneHeight - margin);

      const distanceToCastle = Phaser.Math.Distance.Between(
        x,
        y,
        this.castle.x,
        this.castle.y
      );
      if (distanceToCastle < WORLD_CONFIG.minDistance.castleToClayPack)
        continue;

      const tooCloseToOthers = this.clayPacks.some(
        (pack) =>
          Phaser.Math.Distance.Between(x, y, pack.x, pack.y) <
          WORLD_CONFIG.minDistance.clayPackToClayPack
      );

      if (!tooCloseToOthers) return { x, y };
    }

    return {
      x: Phaser.Math.Between(margin, sceneWidth - margin),
      y: Phaser.Math.Between(margin, sceneHeight - margin),
    };
  }
}
