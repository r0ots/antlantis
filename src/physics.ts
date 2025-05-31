import { Circle, SimulationConfig, AntCharacteristics } from "./types";

export class PhysicsEngine {
  private config: SimulationConfig;

  constructor(config: SimulationConfig) {
    this.config = config;
  }

  private generateRandomCharacteristics(): AntCharacteristics {
    const radius =
      Math.random() *
        (this.config.circleRadius.max - this.config.circleRadius.min) +
      this.config.circleRadius.min;

    const maxSpeed =
      Math.random() * (this.config.speed.max - this.config.speed.min) +
      this.config.speed.min;

    return {
      radius,
      speed: maxSpeed, // Start with max speed
      maxSpeed,
    };
  }

  public updateCircleMovement(
    circle: Circle,
    targetX: number,
    targetY: number,
    canvasWidth: number,
    canvasHeight: number
  ): void {
    // Store current position as previous position before any updates
    circle.prevX = circle.x;
    circle.prevY = circle.y;

    // Move towards target (mouse)
    const dx = targetX - circle.x;
    const dy = targetY - circle.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    // Update orientation based on horizontal direction to target
    const orientationThreshold = 1; // Minimum horizontal distance to change orientation
    if (dx > orientationThreshold) {
      circle.facingRight = true;
    } else if (dx < -orientationThreshold) {
      circle.facingRight = false;
    }
    // If dx is very small, maintain current orientation

    if (dist > 1) {
      // Prevent shaking when close
      // Use individual circle speed instead of global speed
      circle.vx = (dx / dist) * circle.speed;
      circle.vy = (dy / dist) * circle.speed;
      circle.animationPhase += 1; // Increment animation phase when intending to move
    } else {
      circle.vx = 0;
      circle.vy = 0;
      // Optionally reset animationPhase or let it pause: circle.animationPhase = 0;
    }

    circle.x += circle.vx;
    circle.y += circle.vy;

    // Boundary collision
    if (circle.x - circle.radius < 0) {
      circle.x = circle.radius;
      circle.vx *= -0.5; // Dampen velocity on collision
    }
    if (circle.x + circle.radius > canvasWidth) {
      circle.x = canvasWidth - circle.radius;
      circle.vx *= -0.5;
    }
    if (circle.y - circle.radius < 0) {
      circle.y = circle.radius;
      circle.vy *= -0.5;
    }
    if (circle.y + circle.radius > canvasHeight) {
      circle.y = canvasHeight - circle.radius;
      circle.vy *= -0.5;
    }
  }

  public handleCircleCollisions(circles: Circle[]): void {
    // Circle to circle collision
    for (let i = 0; i < circles.length; i++) {
      for (let j = i + 1; j < circles.length; j++) {
        const c1 = circles[i];
        const c2 = circles[j];
        const dx = c2.x - c1.x;
        const dy = c2.y - c1.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const minDistance = c1.radius + c2.radius;

        if (distance < minDistance) {
          const overlap = minDistance - distance;
          const adjustX = (overlap / 2) * (dx / distance);
          const adjustY = (overlap / 2) * (dy / distance);

          c1.x -= adjustX;
          c1.y -= adjustY;
          c2.x += adjustX;
          c2.y += adjustY;

          // Basic elastic collision response (optional, can be complex)
          // For simplicity, we're just pushing them apart.
          // A more realistic collision would involve swapping velocities.
        }
      }
    }
  }

  public createCircle(canvasWidth: number, canvasHeight: number): Circle {
    const characteristics = this.generateRandomCharacteristics();

    const initialX =
      Math.random() * (canvasWidth - characteristics.radius * 2) +
      characteristics.radius;
    const initialY =
      Math.random() * (canvasHeight - characteristics.radius * 2) +
      characteristics.radius;

    return {
      x: initialX,
      y: initialY,
      radius: characteristics.radius,
      vx: 0,
      vy: 0,
      facingRight: false,
      animationPhase: Math.random() * Math.PI * 2, // Start with a random phase
      prevX: initialX, // Initialize prevX
      prevY: initialY, // Initialize prevY
      speed: characteristics.speed,
      maxSpeed: characteristics.maxSpeed,
    };
  }
}
