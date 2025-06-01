import { Circle, AnimationConfig, Castle, ClayPack } from "./types";

abstract class BaseRenderer {
  protected image: HTMLImageElement;

  constructor(imagePath: string) {
    this.image = new Image();
    this.image.src = imagePath;
  }

  public isImageLoaded = () =>
    this.image.complete && this.image.naturalHeight !== 0;
  public onImageLoad = (callback: () => void) => (this.image.onload = callback);
  public onImageError = (callback: () => void) =>
    (this.image.onerror = callback);

  protected withContext(
    ctx: CanvasRenderingContext2D,
    drawFn: () => void
  ): void {
    ctx.save();
    drawFn();
    ctx.restore();
  }

  protected drawImageCentered(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number
  ): void {
    ctx.drawImage(this.image, x - width / 2, y - height / 2, width, height);
  }

  public draw(
    ctx: CanvasRenderingContext2D,
    obj: { x: number; y: number; width: number; height: number }
  ): void {
    this.withContext(ctx, () =>
      this.drawImageCentered(ctx, obj.x, obj.y, obj.width, obj.height)
    );
  }
}

export class AntRenderer extends BaseRenderer {
  constructor(imagePath: string, private animationConfig: AnimationConfig) {
    super(imagePath);
  }

  public drawCircle(ctx: CanvasRenderingContext2D, circle: Circle): void {
    this.withContext(ctx, () => {
      const { bobbleSpeed, rotationAmplitude, movementThreshold } =
        this.animationConfig;
      const animationSpeedMultiplier = circle.speed / circle.maxSpeed;
      const actualMovement =
        Math.abs(circle.x - circle.prevX) + Math.abs(circle.y - circle.prevY);

      let yOffset = 0,
        angle = 0;
      if (actualMovement > movementThreshold) {
        const phase =
          circle.animationPhase * bobbleSpeed * animationSpeedMultiplier;
        yOffset = Math.sin(phase) * circle.radius * 0.1;
        angle = Math.sin(phase * 0.5) * rotationAmplitude;
      }

      ctx.translate(circle.x, circle.y + yOffset);
      if (circle.facingRight) ctx.scale(-1, 1);
      ctx.rotate(angle);

      this.drawImageCentered(ctx, 0, 0, circle.radius * 2, circle.radius * 2);
    });
  }
}

export class CastleRenderer extends BaseRenderer {}
export class ClayPackRenderer extends BaseRenderer {}
