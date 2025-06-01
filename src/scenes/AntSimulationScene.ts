import Phaser from "phaser";
import { SimulationConfig, CastleData } from "../types";
import { AntManager, DEFAULT_SIMULATION_CONFIG } from "../entities/AntManager";
import { ClayPackManager } from "../entities/ClayPackManager";
import { BehaviorSystem } from "../systems/BehaviorSystem";
import { CollisionSystem } from "../systems/CollisionSystem";
import { GameUI } from "../ui/GameUI";

export const WORLD_CONFIG = {
  width: window.innerWidth || 1400,
  height: window.innerHeight || 900,
  backgroundColor: "#2d5016", // Forest green
  minDistance: {
    castleToClayPack: 120,
    clayPackToClayPack: 100,
    antSpawnRadius: 80,
  },
};

export default class AntSimulationScene extends Phaser.Scene {
  private castle!: Phaser.GameObjects.Sprite;
  private castleData: CastleData = { clayInventory: 0 };

  private antManager!: AntManager;
  private clayPackManager!: ClayPackManager;

  private behaviorSystem!: BehaviorSystem;
  private collisionSystem!: CollisionSystem;
  private gameUI!: GameUI;

  private simulationConfig: SimulationConfig = DEFAULT_SIMULATION_CONFIG;

  constructor() {
    super({ key: "AntSimulationScene" });
  }

  setConfig(config: Partial<SimulationConfig>): void {
    this.simulationConfig = { ...this.simulationConfig, ...config };
  }

  preload(): void {
    this.load.image("ant", "assets/fourmi.png");
    this.load.image("castle", "assets/chateau.png");
    this.load.image("clayPack", "assets/grospackargile.png");
    this.load.image("hit", "assets/hit.png");
  }

  create(): void {
    this.createCastle();
    this.initializeManagers();
    this.createEntities();
    this.initializeSystems();
    this.setupPhysics();
    this.createUI();
    this.updateUI();
  }

  private createCastle(): void {
    const centerX = this.scale.width / 2;
    const centerY = this.scale.height / 2;

    this.castle = this.physics.add.sprite(centerX, centerY, "castle");
    this.castle.setDisplaySize(
      this.simulationConfig.castleSize.width,
      this.simulationConfig.castleSize.height
    );
    (this.castle.body as Phaser.Physics.Arcade.Body).setImmovable(true);
  }

  private initializeManagers(): void {
    this.antManager = new AntManager(this);
    this.clayPackManager = new ClayPackManager(this, this.castle);
  }

  private createEntities(): void {
    this.clayPackManager.createClayPacks(this.simulationConfig);
    this.antManager.createAnts(this.simulationConfig);
  }

  private initializeSystems(): void {
    this.behaviorSystem = new BehaviorSystem(
      this.antManager,
      this.clayPackManager,
      this.castle,
      this,
      this.simulationConfig.harvesting.damagePerHit,
      this.castleData
    );

    this.collisionSystem = new CollisionSystem(
      this.antManager,
      this.clayPackManager,
      this.castle,
      this.castleData,
      this.simulationConfig
    );

    this.gameUI = new GameUI(this, this.antManager, this.clayPackManager);
    this.gameUI.setBehaviorSystem(this.behaviorSystem);
  }

  private setupPhysics(): void {
    const ants = this.antManager.getAnts();
    const clayPacks = this.clayPackManager.getClayPacks();

    this.physics.add.overlap(
      ants,
      clayPacks,
      this.collisionSystem.handleAntClayPackOverlap,
      undefined,
      this
    );
    this.physics.add.overlap(
      ants,
      this.castle,
      this.collisionSystem.handleAntCastleOverlap,
      undefined,
      this
    );
    this.physics.add.collider(
      ants,
      ants,
      this.collisionSystem.handleAntCollision,
      undefined,
      this
    );
    this.physics.add.collider(ants, this.castle);
    this.physics.add.collider(ants, clayPacks);
  }

  private createUI(): void {
    this.gameUI.create();
  }

  private updateUI(): void {
    this.gameUI.updateDebugText(this.collisionSystem.getCastleData());
  }

  update(): void {
    const ants = this.antManager.getAnts();

    ants.forEach((ant) => {
      this.behaviorSystem.updateAntBehavior(ant);
    });

    this.collisionSystem.update();
    this.updateUI();
  }

  resize(gameSize: { width: number; height: number }): void {
    WORLD_CONFIG.width = gameSize.width;
    WORLD_CONFIG.height = gameSize.height;

    if (this.castle) {
      this.castle.setPosition(gameSize.width / 2, gameSize.height / 2);
    }

    if (this.gameUI) {
      this.gameUI.resize(gameSize);
    }
  }
}
