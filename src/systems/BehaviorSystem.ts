import Phaser from "phaser";
import { AntManager } from "../entities/AntManager";
import { ClayPackManager } from "../entities/ClayPackManager";

export class BehaviorSystem {
  private antManager: AntManager;
  private clayPackManager: ClayPackManager;
  private castle: Phaser.GameObjects.Sprite;

  constructor(
    antManager: AntManager,
    clayPackManager: ClayPackManager,
    castle: Phaser.GameObjects.Sprite
  ) {
    this.antManager = antManager;
    this.clayPackManager = clayPackManager;
    this.castle = castle;
  }

  public updateAntBehavior(ant: Phaser.GameObjects.Sprite): void {
    const antData = this.antManager.getAntData(ant);
    if (!antData) return;

    let target: { x: number; y: number } | null = null;

    if (!antData.isCarrying) {
      // Find nearest clay pack
      target = this.clayPackManager.findNearestClayPack(ant);
    } else {
      // Go to castle
      target = this.castle;
    }

    // Move towards target
    if (target) {
      this.moveTowardsTarget(ant, target, antData.speed);
    }
  }

  private moveTowardsTarget(
    ant: Phaser.GameObjects.Sprite,
    target: { x: number; y: number },
    speed: number
  ): void {
    const distance = Phaser.Math.Distance.Between(
      ant.x,
      ant.y,
      target.x,
      target.y
    );
    const body = ant.body as Phaser.Physics.Arcade.Body;

    if (distance > 8) {
      const angle = Phaser.Math.Angle.Between(ant.x, ant.y, target.x, target.y);
      body.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);

      // Update facing direction
      ant.setFlipX(target.x < ant.x);
    } else {
      body.setVelocity(0, 0);
    }
  }
}
