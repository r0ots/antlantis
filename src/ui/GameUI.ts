import Phaser from "phaser";
import { CastleData } from "../types";
import { AntManager } from "../entities/AntManager";
import { ClayPackManager } from "../entities/ClayPackManager";
import { BehaviorSystem } from "../systems/BehaviorSystem";
import { AntState } from "../systems/AntStateMachine";

const UI_CONFIG = {
  debugTextStyle: {
    fontSize: "14px",
    color: "#ffffff",
    backgroundColor: "#000000aa",
    padding: { x: 10, y: 8 },
  },
  position: { x: 15, y: 15 },
  depth: 1000,
};

export class GameUI {
  private debugText!: Phaser.GameObjects.Text;

  constructor(
    private scene: Phaser.Scene,
    private antManager: AntManager,
    private clayPackManager: ClayPackManager,
    private behaviorSystem?: BehaviorSystem
  ) {}

  create(): void {
    this.debugText = this.scene.add.text(
      UI_CONFIG.position.x,
      UI_CONFIG.position.y,
      "",
      UI_CONFIG.debugTextStyle
    );
    this.debugText.setDepth(UI_CONFIG.depth);
  }

  setBehaviorSystem(behaviorSystem: BehaviorSystem): void {
    this.behaviorSystem = behaviorSystem;
  }

  updateDebugText(castleData: CastleData): void {
    const ants = this.antManager.getAnts();
    const clayPacks = this.clayPackManager.getClayPacks();

    const antStates = ants.map((ant, i) => {
      const state = this.behaviorSystem?.getCurrentState(ant);
      const stateDisplay = this.getStateDisplay(state);
      return `Ant ${i + 1}: ${stateDisplay}`;
    });

    const progress =
      clayPacks.length === 0
        ? "🎉 Complete!"
        : `${clayPacks.length} clay packs remaining`;

    this.debugText.setText([
      `🏰 Castle Inventory: ${castleData.clayInventory}`,
      `📦 ${progress}`,
      "",
      ...antStates,
    ]);
  }

  private getStateDisplay(state?: AntState): string {
    const stateMap = {
      [AntState.SEEKING]: "🔍 Seeking",
      [AntState.MOVING_TO_TARGET]: "🚶 Moving",
      [AntState.ATTACKING]: "⚡ Attacking",
      [AntState.KNOCKBACK]: "💥 Knockback",
      [AntState.STUNNED]: "😵 Stunned",
      [AntState.COOLDOWN]: "⏳ Cooldown",
      [AntState.CARRYING]: "🏗️ Carrying",
      [AntState.RETURNING_TO_CASTLE]: "🏰 Returning",
    };
    return stateMap[state!] || "❓ Unknown";
  }

  resize(gameSize: { width: number; height: number }): void {
    // UI elements positioned relative to top-left don't need repositioning
  }
}
