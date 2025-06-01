import Phaser from "phaser";
import { CastleData } from "../types";
import { AntManager } from "../entities/AntManager";
import { ClayPackManager } from "../entities/ClayPackManager";

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
  private scene: Phaser.Scene;
  private antManager: AntManager;
  private clayPackManager: ClayPackManager;

  constructor(
    scene: Phaser.Scene,
    antManager: AntManager,
    clayPackManager: ClayPackManager
  ) {
    this.scene = scene;
    this.antManager = antManager;
    this.clayPackManager = clayPackManager;
  }

  public create(): void {
    this.debugText = this.scene.add.text(
      UI_CONFIG.position.x,
      UI_CONFIG.position.y,
      "",
      UI_CONFIG.debugTextStyle
    );
    this.debugText.setDepth(UI_CONFIG.depth);
  }

  public updateDebugText(castleData: CastleData): void {
    const ants = this.antManager.getAnts();
    const clayPacks = this.clayPackManager.getClayPacks();

    const antStates = ants.map((ant, i) => {
      const data = this.antManager.getAntData(ant);
      return `Ant ${i + 1}: ${
        data?.isCarrying ? "🏗️ Carrying" : "🔍 Searching"
      }`;
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

  public resize(gameSize: { width: number; height: number }): void {
    // UI elements are positioned relative to top-left, so they don't need repositioning
    // The debug text stays in the same position regardless of screen size
    // This method is here for future UI elements that might need repositioning
  }
}
