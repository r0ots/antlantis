import Phaser from "phaser";
import { SimulationConfig, AnimationConfig } from "../types";

export default class AntSimulationScene extends Phaser.Scene {
  private ants: Phaser.GameObjects.Sprite[] = [];
  private castle!: Phaser.GameObjects.Sprite;
  private clayPacks: Phaser.GameObjects.Sprite[] = [];
  private debugText!: Phaser.GameObjects.Text;

  // Custom properties we'll track separately
  private antData = new Map<
    Phaser.GameObjects.Sprite,
    {
      isCarrying: boolean;
      speed: number;
      animationPhase: number;
    }
  >();

  private castleData = { clayInventory: 0 };

  // Configuration - will be passed in from game creation
  private config: SimulationConfig = {
    numAnts: 8,
    antSpeed: { min: 60, max: 120 },
    antSize: { min: 25, max: 45 },
    clayPackCount: 6,
    clayPackSize: { width: 50, height: 50 },
    castleSize: { width: 100, height: 100 },
    harvesting: {
      harvestDistance: 35,
      dropOffDistance: 45,
    },
  };

  private animationConfig: AnimationConfig = {
    bobbleSpeed: 0.15,
    rotationAmplitude: 0.08,
    movementThreshold: 1.0,
  };

  constructor() {
    super({ key: "AntSimulationScene" });
  }

  // Allow external configuration
  public setConfig(config: Partial<SimulationConfig>): void {
    this.config = { ...this.config, ...config };
  }

  public setAnimationConfig(config: Partial<AnimationConfig>): void {
    this.animationConfig = { ...this.animationConfig, ...config };
  }

  preload(): void {
    this.load.image("ant", "assets/fourmi.png");
    this.load.image("castle", "assets/chateau.png");
    this.load.image("clayPack", "assets/grospackargile.png");
  }

  create(): void {
    // Create castle at center
    const centerX = this.scale.width / 2;
    const centerY = this.scale.height / 2;

    this.castle = this.physics.add.sprite(centerX, centerY, "castle");
    this.castle.setDisplaySize(
      this.config.castleSize.width,
      this.config.castleSize.height
    );
    (this.castle.body as Phaser.Physics.Arcade.Body).setImmovable(true);

    // Create clay packs
    this.createClayPacks();

    // Create ants
    this.createAnts();

    // Setup physics interactions
    this.setupPhysics();

    // Create UI
    this.createUI();

    this.updateDebugText();
  }

  private setupPhysics(): void {
    // Overlap detection for harvesting and delivery
    this.physics.add.overlap(
      this.ants,
      this.clayPacks,
      this.handleAntClayPackOverlap,
      undefined,
      this
    );
    this.physics.add.overlap(
      this.ants,
      this.castle,
      this.handleAntCastleOverlap,
      undefined,
      this
    );

    // Collision detection for realistic movement
    this.physics.add.collider(
      this.ants,
      this.ants,
      this.handleAntCollision,
      undefined,
      this
    );
    this.physics.add.collider(this.ants, this.castle);
    this.physics.add.collider(this.ants, this.clayPacks);
  }

  private createUI(): void {
    this.debugText = this.add.text(15, 15, "", {
      fontSize: "14px",
      color: "#ffffff",
      backgroundColor: "#000000aa",
      padding: { x: 10, y: 8 },
    });
    this.debugText.setDepth(1000); // Ensure it's on top
  }

  private createClayPacks(): void {
    const { clayPackCount, clayPackSize } = this.config;

    for (let i = 0; i < clayPackCount; i++) {
      const position = this.findValidPosition(
        clayPackSize.width,
        clayPackSize.height,
        120
      );

      const clayPack = this.physics.add.sprite(
        position.x,
        position.y,
        "clayPack"
      );
      clayPack.setDisplaySize(clayPackSize.width, clayPackSize.height);
      (clayPack.body as Phaser.Physics.Arcade.Body).setImmovable(true);
      this.clayPacks.push(clayPack);
    }
  }

  private createAnts(): void {
    const { numAnts, antSize, antSpeed } = this.config;

    for (let i = 0; i < numAnts; i++) {
      const position = this.findValidPosition(antSize.max, antSize.max, 80);
      const ant = this.physics.add.sprite(position.x, position.y, "ant");

      const size = Phaser.Math.Between(antSize.min, antSize.max);
      ant.setDisplaySize(size, size);

      // Set physics properties
      (ant.body as Phaser.Physics.Arcade.Body).setCollideWorldBounds(true);
      (ant.body as Phaser.Physics.Arcade.Body).setBounce(0.3, 0.3);

      // Store ant data
      this.antData.set(ant, {
        isCarrying: false,
        speed: Phaser.Math.Between(antSpeed.min, antSpeed.max),
        animationPhase: Math.random() * Math.PI * 2,
      });

      this.ants.push(ant);
    }
  }

  private findValidPosition(
    width: number,
    height: number,
    minDistance: number
  ): { x: number; y: number } {
    const margin = Math.max(width, height) / 2 + 20;

    for (let attempts = 0; attempts < 100; attempts++) {
      const x = Phaser.Math.Between(margin, this.scale.width - margin);
      const y = Phaser.Math.Between(margin, this.scale.height - margin);

      // Check distance from castle
      const distanceToCastle = Phaser.Math.Distance.Between(
        x,
        y,
        this.castle.x,
        this.castle.y
      );
      if (distanceToCastle < minDistance) continue;

      // Check distance from existing clay packs
      const tooCloseToOthers = this.clayPacks.some(
        (pack) =>
          Phaser.Math.Distance.Between(x, y, pack.x, pack.y) < minDistance
      );

      if (!tooCloseToOthers) {
        return { x, y };
      }
    }

    // Fallback position if no valid position found
    return {
      x: Phaser.Math.Between(margin, this.scale.width - margin),
      y: Phaser.Math.Between(margin, this.scale.height - margin),
    };
  }

  private handleAntClayPackOverlap = (ant: any, clayPack: any): void => {
    const antSprite = ant as Phaser.GameObjects.Sprite;
    const clayPackSprite = clayPack as Phaser.GameObjects.Sprite;
    const antData = this.antData.get(antSprite);

    if (
      antData &&
      !antData.isCarrying &&
      Phaser.Math.Distance.Between(
        antSprite.x,
        antSprite.y,
        clayPackSprite.x,
        clayPackSprite.y
      ) <= this.config.harvesting.harvestDistance
    ) {
      antData.isCarrying = true;

      // Visual feedback
      antSprite.setTint(0x8b4513); // Brown tint when carrying

      clayPackSprite.destroy();
      this.clayPacks = this.clayPacks.filter((pack) => pack !== clayPackSprite);
      this.updateDebugText();
    }
  };

  private handleAntCastleOverlap = (ant: any, castle: any): void => {
    const antSprite = ant as Phaser.GameObjects.Sprite;
    const antData = this.antData.get(antSprite);

    if (
      antData &&
      antData.isCarrying &&
      Phaser.Math.Distance.Between(
        antSprite.x,
        antSprite.y,
        castle.x,
        castle.y
      ) <= this.config.harvesting.dropOffDistance
    ) {
      antData.isCarrying = false;
      this.castleData.clayInventory++;

      // Remove visual feedback
      antSprite.clearTint();

      this.updateDebugText();
    }
  };

  private handleAntCollision = (ant1: any, ant2: any): void => {
    // Add slight randomness to prevent ants getting stuck together
    const ant1Body = (ant1 as Phaser.GameObjects.Sprite)
      .body as Phaser.Physics.Arcade.Body;
    const ant2Body = (ant2 as Phaser.GameObjects.Sprite)
      .body as Phaser.Physics.Arcade.Body;

    ant1Body.velocity.x += Phaser.Math.Between(-5, 5);
    ant1Body.velocity.y += Phaser.Math.Between(-5, 5);
    ant2Body.velocity.x += Phaser.Math.Between(-5, 5);
    ant2Body.velocity.y += Phaser.Math.Between(-5, 5);
  };

  private updateDebugText(): void {
    const antStates = this.ants.map((ant, i) => {
      const data = this.antData.get(ant);
      return `Ant ${i + 1}: ${
        data?.isCarrying ? "🏗️ Carrying" : "🔍 Searching"
      }`;
    });

    const progress =
      this.clayPacks.length === 0
        ? "🎉 Complete!"
        : `${this.clayPacks.length} clay packs remaining`;

    this.debugText.setText([
      `🏰 Castle Inventory: ${this.castleData.clayInventory}`,
      `📦 ${progress}`,
      "",
      ...antStates,
    ]);
  }

  update(): void {
    this.ants.forEach((ant) => {
      this.updateAntBehavior(ant);
      this.updateAntAnimation(ant);
    });
  }

  private updateAntBehavior(ant: Phaser.GameObjects.Sprite): void {
    const antData = this.antData.get(ant);
    if (!antData) return;

    let target: { x: number; y: number } | null = null;

    if (!antData.isCarrying) {
      // Find nearest clay pack
      if (this.clayPacks.length > 0) {
        target = this.clayPacks.reduce((closest, current) => {
          const distToCurrent = Phaser.Math.Distance.Between(
            ant.x,
            ant.y,
            current.x,
            current.y
          );
          const distToClosest = Phaser.Math.Distance.Between(
            ant.x,
            ant.y,
            closest.x,
            closest.y
          );
          return distToCurrent < distToClosest ? current : closest;
        });
      }
    } else {
      // Go to castle
      target = this.castle;
    }

    // Move towards target
    if (target) {
      const distance = Phaser.Math.Distance.Between(
        ant.x,
        ant.y,
        target.x,
        target.y
      );
      const body = ant.body as Phaser.Physics.Arcade.Body;

      if (distance > 8) {
        const angle = Phaser.Math.Angle.Between(
          ant.x,
          ant.y,
          target.x,
          target.y
        );
        body.setVelocity(
          Math.cos(angle) * antData.speed,
          Math.sin(angle) * antData.speed
        );

        // Update facing direction
        ant.setFlipX(target.x < ant.x);
      } else {
        body.setVelocity(0, 0);
      }
    }
  }

  private updateAntAnimation(ant: Phaser.GameObjects.Sprite): void {
    const antData = this.antData.get(ant);
    if (!antData) return;

    const body = ant.body as Phaser.Physics.Arcade.Body;
    const isMoving =
      body.velocity.length() > this.animationConfig.movementThreshold;

    if (isMoving) {
      antData.animationPhase += this.animationConfig.bobbleSpeed;

      // Bobbing and wiggle animation
      const bobble = Math.sin(antData.animationPhase) * 1.5;
      const wiggle =
        Math.sin(antData.animationPhase * 0.7) *
        this.animationConfig.rotationAmplitude;

      ant.y += bobble * 0.1;
      ant.setRotation(wiggle);
    } else {
      // Gradually return to neutral position when not moving
      ant.setRotation(ant.rotation * 0.9);
    }
  }
}
