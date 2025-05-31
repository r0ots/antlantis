import { Circle, AnimationConfig } from "./types";

export class AntRenderer {
  private antImage: HTMLImageElement;
  private animationConfig: AnimationConfig;

  constructor(imagePath: string, animationConfig: AnimationConfig) {
    this.antImage = new Image();
    this.antImage.src = imagePath;
    this.animationConfig = animationConfig;
  }

  public isImageLoaded(): boolean {
    return this.antImage.complete && this.antImage.naturalHeight !== 0;
  }

  public onImageLoad(callback: () => void): void {
    this.antImage.onload = callback;
  }

  public onImageError(callback: () => void): void {
    this.antImage.onerror = callback;
  }

  public drawCircle(ctx: CanvasRenderingContext2D, circle: Circle): void {
    ctx.save(); // Save the current state

    const { bobbleSpeed, rotationAmplitude, movementThreshold } =
      this.animationConfig;

    // Scale animation based on ant size
    const bobbleAmplitude = circle.radius * 0.1; // Dynamic bobble amplitude based on size
    const animationSpeedMultiplier = circle.speed / circle.maxSpeed; // Faster ants animate faster

    let yOffset = 0;
    let angle = 0;

    const actualDx = circle.x - circle.prevX;
    const actualDy = circle.y - circle.prevY;

    // Apply animation only if actual displacement is above threshold
    if (
      Math.abs(actualDx) > movementThreshold ||
      Math.abs(actualDy) > movementThreshold
    ) {
      yOffset =
        Math.sin(
          circle.animationPhase * bobbleSpeed * animationSpeedMultiplier
        ) * bobbleAmplitude;
      angle =
        Math.sin(
          circle.animationPhase * bobbleSpeed * animationSpeedMultiplier * 0.5
        ) * rotationAmplitude; // Slower rotation
    }

    ctx.translate(circle.x, circle.y + yOffset); // Move to the circle's position, add bobble

    // Flip if facingRight is true
    if (circle.facingRight) {
      ctx.scale(-1, 1);
    }

    ctx.rotate(angle); // Apply wiggle rotation

    // Draw the image using individual radius
    const drawWidth = circle.radius * 2;
    const drawHeight = circle.radius * 2;
    ctx.drawImage(
      this.antImage,
      -drawWidth / 2,
      -drawHeight / 2, // Center the image
      drawWidth,
      drawHeight
    );

    ctx.restore(); // Restore the original state
  }
}
