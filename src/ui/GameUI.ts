import Phaser from "phaser";
import { CastleData } from "../types";
import { AntManager } from "../entities/AntManager";
import { ClayPackManager } from "../entities/ClayPackManager";
import { BehaviorSystem } from "../systems/BehaviorSystem";
import { AntState } from "../systems/AntStateMachine";

export const UI_CONFIG = {
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

  public create(): void {
    this.debugText = this.scene.add.text(
      UI_CONFIG.position.x,
      UI_CONFIG.position.y,
      "",
      UI_CONFIG.debugTextStyle
    );
    this.debugText.setDepth(UI_CONFIG.depth);
  }

  public setBehaviorSystem(behaviorSystem: BehaviorSystem): void {
    this.behaviorSystem = behaviorSystem;
  }

  public updateDebugText(castleData: CastleData): void {
    const ants = this.antManager.getAnts();
    const clayPacks = this.clayPackManager.getClayPacks();

    const antStates = ants.map((ant, i) => {
      if (this.behaviorSystem) {
        const state = this.behaviorSystem.getCurrentState(ant);
        const stateDisplay = this.getStateDisplay(state);
        return `Ant ${i + 1}: ${stateDisplay}`;
      } else {
        return `Ant ${i + 1}: ⚙️ Loading...`;
      }
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
    switch (state) {
      case AntState.SEEKING:
        return "🔍 Seeking";
      case AntState.MOVING_TO_TARGET:
        return "🚶 Moving";
      case AntState.ATTACKING:
        return "⚡ Attacking";
      case AntState.KNOCKBACK:
        return "💥 Knockback";
      case AntState.STUNNED:
        return "😵 Stunned";
      case AntState.COOLDOWN:
        return "⏳ Cooldown";
      case AntState.CARRYING:
        return "🏗️ Carrying";
      case AntState.RETURNING_TO_CASTLE:
        return "🏰 Returning";
      default:
        return "❓ Unknown";
    }
  }

  public resize(gameSize: { width: number; height: number }): void {
    // UI elements are positioned relative to top-left, so they don't need repositioning
    // The debug text stays in the same position regardless of screen size
    // This method is here for future UI elements that might need repositioning
  }
}
