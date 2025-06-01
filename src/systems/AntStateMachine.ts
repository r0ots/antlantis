import Phaser from "phaser";

export enum AntState {
  SEEKING = "SEEKING",
  MOVING_TO_TARGET = "MOVING_TO_TARGET",
  ATTACKING = "ATTACKING",
  KNOCKBACK = "KNOCKBACK",
  STUNNED = "STUNNED",
  COOLDOWN = "COOLDOWN",
  CARRYING = "CARRYING",
  RETURNING_TO_CASTLE = "RETURNING_TO_CASTLE",
}

export interface AntStateContext {
  speed: number;
  animationPhase: number;
  previousX: number;
  previousY: number;
  target: Phaser.GameObjects.Sprite | null;
  persistentTarget: Phaser.GameObjects.Sprite | null;
  harvestAnimationPhase: number;
  lastHitPhase: number;
  originalX?: number;
  originalY?: number;
  stateStartTime: number;
  lastHitTime?: number;
  knockbackDistance?: number;
  knockbackDirection?: { x: number; y: number };
}

export abstract class AntState_Base {
  constructor(public readonly name: AntState) {}

  abstract enter(
    ant: Phaser.GameObjects.Sprite,
    context: AntStateContext
  ): void;
  abstract update(
    ant: Phaser.GameObjects.Sprite,
    context: AntStateContext,
    deltaTime: number
  ): void;
  abstract exit(ant: Phaser.GameObjects.Sprite, context: AntStateContext): void;
}

export class SeekingState extends AntState_Base {
  constructor() {
    super(AntState.SEEKING);
  }

  enter(ant: Phaser.GameObjects.Sprite, context: AntStateContext): void {
    context.target = null;
    context.stateStartTime = Date.now();
  }

  update(ant: Phaser.GameObjects.Sprite, context: AntStateContext): void {
    (ant.body as Phaser.Physics.Arcade.Body).setVelocity(0, 0);
  }

  exit(): void {}
}

export class MovingToTargetState extends AntState_Base {
  constructor() {
    super(AntState.MOVING_TO_TARGET);
  }

  enter(ant: Phaser.GameObjects.Sprite, context: AntStateContext): void {
    context.stateStartTime = Date.now();
  }

  update(ant: Phaser.GameObjects.Sprite, context: AntStateContext): void {
    if (!context.target) return;

    const distance = Phaser.Math.Distance.Between(
      ant.x,
      ant.y,
      context.target.x,
      context.target.y
    );
    const body = ant.body as Phaser.Physics.Arcade.Body;

    if (distance > 8) {
      const angle = Phaser.Math.Angle.Between(
        ant.x,
        ant.y,
        context.target.x,
        context.target.y
      );
      body.setVelocity(
        Math.cos(angle) * context.speed,
        Math.sin(angle) * context.speed
      );
      ant.setFlipX(context.target.x < ant.x);
    } else {
      body.setVelocity(0, 0);
    }
  }

  exit(): void {}
}

export class AttackingState extends AntState_Base {
  constructor() {
    super(AntState.ATTACKING);
  }

  enter(ant: Phaser.GameObjects.Sprite, context: AntStateContext): void {
    context.stateStartTime = Date.now();
    context.harvestAnimationPhase = 0;
    context.lastHitPhase = 0;
    context.originalX = ant.x;
    context.originalY = ant.y;

    (ant.body as Phaser.Physics.Arcade.Body).setVelocity(0, 0);
    if (context.target) ant.setFlipX(context.target.x > ant.x);
  }

  update(ant: Phaser.GameObjects.Sprite, context: AntStateContext): void {
    if (!context.target || !context.originalX || !context.originalY) return;

    context.harvestAnimationPhase += 0.15;

    const headbuttCycle = Math.sin(context.harvestAnimationPhase * 2);
    const headbuttDistance = 8;
    const headbuttIntensity = Math.max(0, headbuttCycle) * headbuttDistance;

    const directionX = context.target.x - ant.x;
    const directionY = context.target.y - ant.y;
    const distance = Math.sqrt(
      directionX * directionX + directionY * directionY
    );
    const normalizedX = directionX / distance;
    const normalizedY = directionY / distance;

    ant.x = context.originalX + normalizedX * headbuttIntensity;
    ant.y = context.originalY + normalizedY * headbuttIntensity;

    const headBobbing = Math.sin(context.harvestAnimationPhase * 3) * 1.5;
    ant.y += headBobbing;

    const diveRotation =
      headbuttIntensity > 0 ? (headbuttIntensity / headbuttDistance) * 0.4 : 0;
    const flipMultiplier = ant.flipX ? 1 : -1;
    ant.setRotation(diveRotation * flipMultiplier);

    context.previousX = ant.x;
    context.previousY = ant.y;
  }

  exit(): void {}
}

export class KnockbackState extends AntState_Base {
  constructor() {
    super(AntState.KNOCKBACK);
  }

  enter(ant: Phaser.GameObjects.Sprite, context: AntStateContext): void {
    context.stateStartTime = Date.now();
    context.knockbackDistance = 35;

    if (context.target && context.originalX && context.originalY) {
      const directionX = context.target.x - context.originalX;
      const directionY = context.target.y - context.originalY;
      const distance = Math.sqrt(
        directionX * directionX + directionY * directionY
      );
      context.knockbackDirection = {
        x: -directionX / distance,
        y: -directionY / distance,
      };
    }
  }

  update(ant: Phaser.GameObjects.Sprite, context: AntStateContext): void {
    if (!context.knockbackDirection || !context.knockbackDistance) return;

    const progress = (Date.now() - context.stateStartTime) / 300;
    const easedProgress = 1 - Math.pow(1 - progress, 3);
    const currentDistance = context.knockbackDistance * easedProgress;

    if (context.originalX && context.originalY) {
      ant.x =
        context.originalX + context.knockbackDirection.x * currentDistance;
      ant.y =
        context.originalY + context.knockbackDirection.y * currentDistance;
    }

    const rotationEase = Math.sin(progress * Math.PI);
    ant.setRotation(rotationEase * 0.8 * (ant.flipX ? 1 : -1));
  }

  exit(ant: Phaser.GameObjects.Sprite, context: AntStateContext): void {
    ant.setRotation(0);
    context.originalX = ant.x;
    context.originalY = ant.y;
  }
}

export class StunnedState extends AntState_Base {
  constructor() {
    super(AntState.STUNNED);
  }

  enter(ant: Phaser.GameObjects.Sprite, context: AntStateContext): void {
    context.stateStartTime = Date.now();
    ant.setTint(0x888888);
  }

  update(ant: Phaser.GameObjects.Sprite, context: AntStateContext): void {
    const stunProgress = (Date.now() - context.stateStartTime) / 1000;
    const tintIntensity = 0.5 + 0.5 * Math.sin(stunProgress * Math.PI * 6);
    const tintValue = Math.floor(0x88 + (0xff - 0x88) * tintIntensity);
    ant.setTint((tintValue << 16) | (tintValue << 8) | tintValue);

    const wobbleX = Math.sin(Date.now() / 100) * 2;
    const wobbleY = Math.cos(Date.now() / 100) * 1;
    ant.x = context.originalX! + wobbleX;
    ant.y = context.originalY! + wobbleY;
  }

  exit(): void {}
}

export class CooldownState extends AntState_Base {
  constructor() {
    super(AntState.COOLDOWN);
  }

  enter(ant: Phaser.GameObjects.Sprite, context: AntStateContext): void {
    context.stateStartTime = Date.now();
    ant.clearTint();
  }

  update(ant: Phaser.GameObjects.Sprite, context: AntStateContext): void {
    (ant.body as Phaser.Physics.Arcade.Body).setVelocity(0, 0);
  }

  exit(): void {}
}

export class CarryingState extends AntState_Base {
  constructor() {
    super(AntState.CARRYING);
  }

  enter(ant: Phaser.GameObjects.Sprite, context: AntStateContext): void {
    context.stateStartTime = Date.now();
    ant.setTint(0x8b4513);
  }

  update(): void {}

  exit(ant: Phaser.GameObjects.Sprite): void {
    ant.clearTint();
  }
}

export class ReturningToCastleState extends AntState_Base {
  constructor() {
    super(AntState.RETURNING_TO_CASTLE);
  }

  enter(ant: Phaser.GameObjects.Sprite, context: AntStateContext): void {
    context.stateStartTime = Date.now();
  }

  update(): void {}

  exit(): void {}
}
