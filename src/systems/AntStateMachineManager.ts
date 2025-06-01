import Phaser from "phaser";
import {
  AntState,
  AntStateContext,
  AntState_Base,
  SeekingState,
  MovingToTargetState,
  AttackingState,
  KnockbackState,
  StunnedState,
  CooldownState,
  CarryingState,
  ReturningToCastleState,
} from "./AntStateMachine";
import { ClayPackManager } from "../entities/ClayPackManager";
import { CastleData } from "../types";

export class AntStateMachineManager {
  private states = new Map<AntState, AntState_Base>();
  private antStates = new Map<Phaser.GameObjects.Sprite, AntState>();
  private antContexts = new Map<Phaser.GameObjects.Sprite, AntStateContext>();

  constructor(
    private clayPackManager: ClayPackManager,
    private castle: Phaser.GameObjects.Sprite,
    private scene: Phaser.Scene,
    private damagePerHit = 5,
    private castleData?: CastleData
  ) {
    this.initializeStates();
  }

  private initializeStates(): void {
    this.states.set(AntState.SEEKING, new SeekingState());
    this.states.set(AntState.MOVING_TO_TARGET, new MovingToTargetState());
    this.states.set(AntState.ATTACKING, new AttackingState());
    this.states.set(AntState.KNOCKBACK, new KnockbackState());
    this.states.set(AntState.STUNNED, new StunnedState());
    this.states.set(AntState.COOLDOWN, new CooldownState());
    this.states.set(AntState.CARRYING, new CarryingState());
    this.states.set(AntState.RETURNING_TO_CASTLE, new ReturningToCastleState());
  }

  registerAnt(ant: Phaser.GameObjects.Sprite, speed: number): void {
    const context: AntStateContext = {
      speed,
      animationPhase: Math.random() * Math.PI * 2,
      previousX: ant.x,
      previousY: ant.y,
      target: null,
      persistentTarget: null,
      harvestAnimationPhase: 0,
      lastHitPhase: 0,
      stateStartTime: Date.now(),
    };

    this.antContexts.set(ant, context);
    this.transitionTo(ant, AntState.SEEKING);
  }

  updateAnt(ant: Phaser.GameObjects.Sprite, deltaTime: number): void {
    const currentState = this.antStates.get(ant);
    const context = this.antContexts.get(ant);

    if (!currentState || !context) return;

    this.checkTransitions(ant, currentState, context);

    const stateHandler = this.states.get(currentState);
    stateHandler?.update(ant, context, deltaTime);

    if (
      [
        AntState.MOVING_TO_TARGET,
        AntState.SEEKING,
        AntState.RETURNING_TO_CASTLE,
      ].includes(currentState)
    ) {
      this.updateMovementAnimation(ant, context);
    }
  }

  private checkTransitions(
    ant: Phaser.GameObjects.Sprite,
    currentState: AntState,
    context: AntStateContext
  ): void {
    const now = Date.now();
    const timeSinceStateStart = now - context.stateStartTime;

    switch (currentState) {
      case AntState.SEEKING:
        if (!context.target) {
          const nearestClayPack = this.clayPackManager.findNearestClayPack(ant);
          if (nearestClayPack) {
            context.target = nearestClayPack;
            context.persistentTarget = nearestClayPack;
            this.transitionTo(ant, AntState.MOVING_TO_TARGET);
          }
        }
        break;

      case AntState.MOVING_TO_TARGET:
        if (!context.target?.active) {
          context.target = null;
          context.persistentTarget = null;
          this.transitionTo(ant, AntState.SEEKING);
          return;
        }

        const distance = Phaser.Math.Distance.Between(
          ant.x,
          ant.y,
          context.target.x,
          context.target.y
        );

        if (distance <= 50 && context.target !== this.castle) {
          this.transitionTo(ant, AntState.ATTACKING);
        } else if (distance <= 100 && context.target === this.castle) {
          this.dropOffClay(ant, context);
          this.transitionTo(ant, AntState.SEEKING);
        }
        break;

      case AntState.ATTACKING:
        if (!context.target?.active) {
          this.transitionTo(ant, AntState.SEEKING);
          return;
        }

        const headbuttCycle = Math.sin(context.harvestAnimationPhase * 2);
        const currentHitPhase = Math.floor(
          (context.harvestAnimationPhase * 2) / (Math.PI * 2)
        );

        if (currentHitPhase > context.lastHitPhase && headbuttCycle > 0.9) {
          this.performHit(ant, context);
          context.lastHitPhase = currentHitPhase;
          context.lastHitTime = now;
          this.transitionTo(ant, AntState.KNOCKBACK);
        }
        break;

      case AntState.KNOCKBACK:
        if (timeSinceStateStart >= 300)
          this.transitionTo(ant, AntState.STUNNED);
        break;

      case AntState.STUNNED:
        if (timeSinceStateStart >= 1000)
          this.transitionTo(ant, AntState.COOLDOWN);
        break;

      case AntState.COOLDOWN:
        if (timeSinceStateStart >= 1000) {
          this.transitionTo(
            ant,
            context.target?.active
              ? AntState.MOVING_TO_TARGET
              : AntState.SEEKING
          );
        }
        break;

      case AntState.CARRYING:
        context.target = this.castle;
        this.transitionTo(ant, AntState.RETURNING_TO_CASTLE);
        break;

      case AntState.RETURNING_TO_CASTLE:
        const castleDistance = Phaser.Math.Distance.Between(
          ant.x,
          ant.y,
          this.castle.x,
          this.castle.y
        );
        if (castleDistance <= 100) {
          this.dropOffClay(ant, context);
          this.transitionTo(ant, AntState.SEEKING);
        }
        break;
    }
  }

  private transitionTo(
    ant: Phaser.GameObjects.Sprite,
    newState: AntState
  ): void {
    const currentState = this.antStates.get(ant);
    const context = this.antContexts.get(ant);

    if (!context) return;

    if (currentState) {
      this.states.get(currentState)?.exit(ant, context);
    }

    this.antStates.set(ant, newState);
    this.states.get(newState)?.enter(ant, context);
  }

  private performHit(
    ant: Phaser.GameObjects.Sprite,
    context: AntStateContext
  ): void {
    if (!context.target) return;

    this.spawnHitEffect(ant, context.target);

    const isDestroyed = this.clayPackManager.damageClayPack(
      context.target,
      this.damagePerHit
    );

    if (isDestroyed) {
      this.clayPackManager.removeClayPack(context.target);
      context.persistentTarget = null;
      this.transitionTo(ant, AntState.CARRYING);
    }
  }

  private dropOffClay(
    ant: Phaser.GameObjects.Sprite,
    context: AntStateContext
  ): void {
    ant.clearTint();
    context.target = null;
    context.persistentTarget = null;

    if (this.castleData) {
      this.castleData.clayInventory++;
    }
  }

  private updateMovementAnimation(
    ant: Phaser.GameObjects.Sprite,
    context: AntStateContext
  ): void {
    const body = ant.body as Phaser.Physics.Arcade.Body;
    ant.setFlipX(body.velocity.x > 0);

    const actualMovement = Math.sqrt(
      Math.pow(ant.x - context.previousX, 2) +
        Math.pow(ant.y - context.previousY, 2)
    );
    const isMoving = actualMovement > 0.8;

    if (isMoving) {
      context.animationPhase += 0.4;

      const hopCycle = Math.sin(context.animationPhase);
      const hop = hopCycle > 0 ? Math.pow(hopCycle, 2) * 2.3 : 0;
      const wiggle = Math.sin(context.animationPhase * 0.7) * 0.06;

      ant.y += hop * -0.8;
      ant.setRotation(wiggle);
    } else {
      ant.setRotation(ant.rotation * 0.95);
    }

    context.previousX = ant.x;
    context.previousY = ant.y;
  }

  private spawnHitEffect(
    ant: Phaser.GameObjects.Sprite,
    target: Phaser.GameObjects.Sprite
  ): void {
    const midX = (ant.x + target.x) / 2;
    const midY = (ant.y + target.y) / 2;
    const sparkCount = Phaser.Math.Between(4, 7);

    for (let i = 0; i < sparkCount; i++) {
      const offsetX = Phaser.Math.Between(-6, 6);
      const offsetY = Phaser.Math.Between(-6, 6);

      const spark = this.scene.add.sprite(
        midX + offsetX,
        midY + offsetY,
        "hit"
      );
      spark.setScale(Phaser.Math.FloatBetween(0.03, 0.05));
      spark.setAlpha(0.9);

      const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
      const distance = Phaser.Math.FloatBetween(20, 40);
      const endX = spark.x + Math.cos(angle) * distance;
      const endY = spark.y + Math.sin(angle) * distance;

      this.scene.tweens.add({
        targets: spark,
        x: endX,
        y: endY,
        scaleX: 0.01,
        scaleY: 0.01,
        alpha: 0,
        duration: Phaser.Math.Between(300, 500),
        ease: "Quad.easeOut",
        onComplete: () => spark.destroy(),
      });

      this.scene.tweens.add({
        targets: spark,
        rotation: Phaser.Math.FloatBetween(-Math.PI, Math.PI),
        duration: Phaser.Math.Between(300, 500),
        ease: "Linear",
      });
    }
  }

  getCurrentState(ant: Phaser.GameObjects.Sprite) {
    return this.antStates.get(ant);
  }

  getContext(ant: Phaser.GameObjects.Sprite) {
    return this.antContexts.get(ant);
  }
}
