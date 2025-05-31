import Phaser from "phaser";

export default class BootScene extends Phaser.Scene {
  constructor() {
    super("BootScene");
  }

  preload(): void {
    // Preload any assets needed for the boot sequence or global assets
    // For example, a loading bar image, or a logo
    // this.load.image('logo', 'assets/logo.png');
    console.log("BootScene: preload");
  }

  create(): void {
    console.log("BootScene: create - Game starting...");

    // Example: Start the next scene (e.g., MainMenuScene or GameScene)
    // this.scene.start('MainMenuScene');
    // For now, let's just add a simple text to indicate the game has started
    this.add
      .text(
        this.cameras.main.width / 2,
        this.cameras.main.height / 2,
        "Game Started!",
        {
          fontFamily: "Arial",
          fontSize: "32px",
          color: "#ffffff",
        }
      )
      .setOrigin(0.5);
  }

  update(): void {
    // console.log('BootScene: update');
  }
}
