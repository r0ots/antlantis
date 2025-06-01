import Phaser from "phaser";
import { AntManager } from "../entities/AntManager";
import { ClayPackManager } from "../entities/ClayPackManager";
import { AntStateMachineManager } from "./AntStateMachineManager";
import { CastleData } from "../types";

export class BehaviorSystem {
  private stateMachine: AntStateMachineManager;

  constructor(
    private antManager: AntManager,
    clayPackManager: ClayPackManager,
    castle: Phaser.GameObjects.Sprite,
    scene: Phaser.Scene,
    damagePerHit: number = 5,
    castleData?: CastleData
  ) {
    this.stateMachine = new AntStateMachineManager(
      clayPackManager,
      castle,
      scene,
      damagePerHit,
      castleData
    );

    // Register all existing ants with the state machine
    this.antManager.getAnts().forEach((ant) => {
      const speed = this.antManager.getAntSpeed(ant);
      this.stateMachine.registerAnt(ant, speed);
    });
  }

  public updateAntBehavior(ant: Phaser.GameObjects.Sprite): void {
    this.stateMachine.updateAnt(ant, 16); // Assuming ~60fps (16ms delta)
  }

  public getCurrentState(ant: Phaser.GameObjects.Sprite) {
    return this.stateMachine.getCurrentState(ant);
  }

  public getContext(ant: Phaser.GameObjects.Sprite) {
    return this.stateMachine.getContext(ant);
  }
}
