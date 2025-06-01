import Phaser from "phaser";
import { SimulationConfig, AnimationConfig, CastleData } from "../types";
import { AntManager, DEFAULT_SIMULATION_CONFIG } from "../entities/AntManager";
import { ClayPackManager } from "../entities/ClayPackManager";
import { BehaviorSystem } from "../systems/BehaviorSystem";
import {
  AnimationSystem,
  DEFAULT_ANIMATION_CONFIG,
} from "../systems/AnimationSystem";
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
  // Game entities
  private castle!: Phaser.GameObjects.Sprite;
  private castleData: CastleData = { clayInventory: 0 };

  // Managers
  private antManager!: AntManager;
  private clayPackManager!: ClayPackManager;

  // Systems
  private behaviorSystem!: BehaviorSystem;
  private animationSystem!: AnimationSystem;
  private collisionSystem!: CollisionSystem;
  private gameUI!: GameUI;

  // Configuration
  private simulationConfig: SimulationConfig = DEFAULT_SIMULATION_CONFIG;
  private animationConfig: AnimationConfig = DEFAULT_ANIMATION_CONFIG;

  constructor() {
    super({ key: "AntSimulationScene" });
  }

  // Allow external configuration
  public setConfig(config: Partial<SimulationConfig>): void {
    this.simulationConfig = { ...this.simulationConfig, ...config };
  }

  public setAnimationConfig(config: Partial<AnimationConfig>): void {
    this.animationConfig = { ...this.animationConfig, ...config };
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
    this.initializeSystems();
    this.createEntities();
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

  private initializeSystems(): void {
    this.behaviorSystem = new BehaviorSystem(
      this.antManager,
      this.clayPackManager,
      this.castle
    );
    this.animationSystem = new AnimationSystem(
      this.antManager,
      this.clayPackManager,
      this.animationConfig,
      this,
      this.simulationConfig.harvesting.damagePerHit
    );
    this.collisionSystem = new CollisionSystem(
      this.antManager,
      this.clayPackManager,
      this.castle,
      this.castleData,
      this.simulationConfig
    );
    this.gameUI = new GameUI(this, this.antManager, this.clayPackManager);
  }

  private createEntities(): void {
    this.clayPackManager.createClayPacks(this.simulationConfig);
    this.antManager.createAnts(this.simulationConfig);
  }

  private setupPhysics(): void {
    const ants = this.antManager.getAnts();
    const clayPacks = this.clayPackManager.getClayPacks();

    // Overlap detection for harvesting and delivery
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

    // Collision detection for realistic movement
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
      this.animationSystem.updateAntAnimation(ant);
    });

    // Update collision system to handle harvest completion
    this.collisionSystem.update();

    this.updateUI();
  }

  resize(gameSize: { width: number; height: number }): void {
    // Update world config
    WORLD_CONFIG.width = gameSize.width;
    WORLD_CONFIG.height = gameSize.height;

    // Reposition castle to center of new dimensions
    if (this.castle) {
      this.castle.setPosition(gameSize.width / 2, gameSize.height / 2);
    }

    // Update UI positioning if needed
    if (this.gameUI) {
      this.gameUI.resize(gameSize);
    }
  }
}
