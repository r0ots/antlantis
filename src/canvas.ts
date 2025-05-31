export class CanvasManager {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  public mouseX: number = 0;
  public mouseY: number = 0;

  constructor(canvasId: string) {
    this.canvas = document.getElementById(canvasId) as HTMLCanvasElement;
    this.ctx = this.canvas.getContext("2d")!;

    this.setupEventListeners();
    this.resizeCanvas();
  }

  private setupEventListeners(): void {
    window.addEventListener("resize", () => this.resizeCanvas());

    document.addEventListener("mousemove", (event) => {
      const rect = this.canvas.getBoundingClientRect();
      this.mouseX = event.clientX - rect.left;
      this.mouseY = event.clientY - rect.top;
    });
  }

  private resizeCanvas(): void {
    this.canvas.width = window.innerWidth * 0.9;
    this.canvas.height = window.innerHeight * 0.9;
  }

  public getCanvas(): HTMLCanvasElement {
    return this.canvas;
  }

  public getContext(): CanvasRenderingContext2D {
    return this.ctx;
  }

  public getMousePosition(): { x: number; y: number } {
    return { x: this.mouseX, y: this.mouseY };
  }

  public getDimensions(): { width: number; height: number } {
    return { width: this.canvas.width, height: this.canvas.height };
  }

  public clearCanvas(): void {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }
}
