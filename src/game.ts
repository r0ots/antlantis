import { Circle, AnimationConfig, SimulationConfig } from "./types";
import { CanvasManager } from "./canvas";
import { AntRenderer } from "./drawing";
import { PhysicsEngine } from "./physics";

export class Game {
  private canvasManager: CanvasManager;
  private antRenderer: AntRenderer;
  private physicsEngine: PhysicsEngine;
  private circles: Circle[] = [];
  private config: SimulationConfig;
  private animationConfig: AnimationConfig;

  constructor(
    canvasId: string,
    config: SimulationConfig,
    animationConfig: AnimationConfig,
    antImagePath: string
  ) {
    this.config = config;
    this.animationConfig = animationConfig;

    this.canvasManager = new CanvasManager(canvasId);
    this.antRenderer = new AntRenderer(antImagePath, animationConfig);
    this.physicsEngine = new PhysicsEngine(config);
  }

  public async start(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.antRenderer.onImageLoad(() => {
        this.initCircles();
        this.gameLoop();
        resolve();
      });

      this.antRenderer.onImageError(() => {
        console.error("Failed to load ant image");
        reject(new Error("Failed to load ant image"));
      });
    });
  }

  private initCircles(): void {
    const { width, height } = this.canvasManager.getDimensions();

    for (let i = 0; i < this.config.numCircles; i++) {
      const circle = this.physicsEngine.createCircle(width, height);
      this.circles.push(circle);
    }
  }

  private updateCircles(): void {
    const { x: mouseX, y: mouseY } = this.canvasManager.getMousePosition();
    const { width, height } = this.canvasManager.getDimensions();

    this.circles.forEach((circle) => {
      this.physicsEngine.updateCircleMovement(
        circle,
        mouseX,
        mouseY,
        width,
        height
      );
    });

    this.physicsEngine.handleCircleCollisions(this.circles);
  }

  private render(): void {
    const ctx = this.canvasManager.getContext();
    this.canvasManager.clearCanvas();

    this.circles.forEach((circle) => {
      this.antRenderer.drawCircle(ctx, circle);
    });
  }

  private gameLoop = (): void => {
    this.updateCircles();
    this.render();
    requestAnimationFrame(this.gameLoop);
  };
}
