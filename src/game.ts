import {
  Circle,
  AnimationConfig,
  SimulationConfig,
  Castle,
  ClayPack,
} from "./types";
import { CanvasManager } from "./canvas";
import { AntRenderer, CastleRenderer, ClayPackRenderer } from "./drawing";
import { PhysicsEngine } from "./physics";

export class Game {
  private canvasManager: CanvasManager;
  private antRenderer: AntRenderer;
  private castleRenderer: CastleRenderer;
  private clayPackRenderer: ClayPackRenderer;
  private physicsEngine: PhysicsEngine;
  private circles: Circle[] = [];
  private castle: Castle | null = null;
  private clayPacks: ClayPack[] = [];
  private config: SimulationConfig;
  private animationConfig: AnimationConfig;
  private imagesLoaded = { ant: false, castle: false, clayPack: false };

  constructor(
    canvasId: string,
    config: SimulationConfig,
    animationConfig: AnimationConfig,
    antImagePath: string,
    castleImagePath: string,
    clayPackImagePath: string
  ) {
    this.config = config;
    this.animationConfig = animationConfig;

    this.canvasManager = new CanvasManager(canvasId);
    this.antRenderer = new AntRenderer(antImagePath, animationConfig);
    this.castleRenderer = new CastleRenderer(castleImagePath);
    this.clayPackRenderer = new ClayPackRenderer(clayPackImagePath);
    this.physicsEngine = new PhysicsEngine(config);
  }

  public async start(): Promise<void> {
    return new Promise((resolve, reject) => {
      // Handle ant image loading
      this.antRenderer.onImageLoad(() => {
        this.imagesLoaded.ant = true;
        this.checkAllImagesLoaded(resolve);
      });

      this.antRenderer.onImageError(() => {
        console.error("Failed to load ant image");
        reject(new Error("Failed to load ant image"));
      });

      // Handle castle image loading
      this.castleRenderer.onImageLoad(() => {
        this.imagesLoaded.castle = true;
        this.checkAllImagesLoaded(resolve);
      });

      this.castleRenderer.onImageError(() => {
        console.error("Failed to load castle image");
        reject(new Error("Failed to load castle image"));
      });

      // Handle clay pack image loading
      this.clayPackRenderer.onImageLoad(() => {
        this.imagesLoaded.clayPack = true;
        this.checkAllImagesLoaded(resolve);
      });

      this.clayPackRenderer.onImageError(() => {
        console.error("Failed to load clay pack image");
        reject(new Error("Failed to load clay pack image"));
      });
    });
  }

  private checkAllImagesLoaded(resolve: () => void): void {
    if (
      this.imagesLoaded.ant &&
      this.imagesLoaded.castle &&
      this.imagesLoaded.clayPack
    ) {
      this.initEntities();
      this.gameLoop();
      resolve();
    }
  }

  private initEntities(): void {
    const { width, height } = this.canvasManager.getDimensions();

    // Create castle first
    this.castle = this.physicsEngine.createCastle(width, height);

    // Create clay packs, avoiding overlap with castle
    const existingEntities = this.castle ? [this.castle] : [];
    this.clayPacks = this.physicsEngine.createClayPacks(
      width,
      height,
      existingEntities
    );

    // Create circles (ants)
    for (let i = 0; i < this.config.numCircles; i++) {
      const circle = this.physicsEngine.createCircle(width, height);
      this.circles.push(circle);
    }
  }

  private removeClayPack(clayPackId: number): void {
    this.clayPacks = this.clayPacks.filter(
      (clayPack) => clayPack.id !== clayPackId
    );
  }

  private updateCircles(): void {
    const { width, height } = this.canvasManager.getDimensions();

    if (!this.castle) return; // Safety check

    this.circles.forEach((circle) => {
      const result = this.physicsEngine.updateCircleMovement(
        circle,
        width,
        height,
        this.castle!,
        this.clayPacks
      );

      // Handle harvesting
      if (result.harvestedClayPackId !== null) {
        this.removeClayPack(result.harvestedClayPackId);
        console.log(
          `Clay pack ${result.harvestedClayPackId} harvested! Remaining: ${this.clayPacks.length}`
        );
      }

      // Handle drop-off
      if (result.droppedOffClay && this.castle) {
        this.castle.clayInventory += 1;
        console.log(
          `Clay delivered to castle! Castle inventory: ${this.castle.clayInventory}`
        );
      }
    });

    this.physicsEngine.handleCircleCollisions(this.circles);
  }

  private render(): void {
    const ctx = this.canvasManager.getContext();
    this.canvasManager.clearCanvas();

    // Draw castle first (behind everything)
    if (this.castle) {
      this.castleRenderer.drawCastle(ctx, this.castle);
    }

    // Draw clay packs
    this.clayPacks.forEach((clayPack) => {
      this.clayPackRenderer.drawClayPack(ctx, clayPack);
    });

    // Draw ants on top
    this.circles.forEach((circle) => {
      this.antRenderer.drawCircle(ctx, circle);
    });

    // Draw debug info (optional)
    this.drawDebugInfo(ctx);
  }

  private drawDebugInfo(ctx: CanvasRenderingContext2D): void {
    if (!this.castle) return;

    ctx.save();
    ctx.fillStyle = "white";
    ctx.font = "16px Arial";
    ctx.fillText(`Castle Inventory: ${this.castle.clayInventory}`, 10, 30);
    ctx.fillText(`Clay Packs Remaining: ${this.clayPacks.length}`, 10, 50);

    // Show ant states
    let y = 70;
    this.circles.forEach((circle, index) => {
      const state = circle.isCarrying ? "Carrying" : "Searching";
      ctx.fillText(`Ant ${index + 1}: ${state}`, 10, y);
      y += 20;
    });

    ctx.restore();
  }

  private gameLoop = (): void => {
    this.updateCircles();
    this.render();
    requestAnimationFrame(this.gameLoop);
  };
}
