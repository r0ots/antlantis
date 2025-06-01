import {
  Circle,
  SimulationConfig,
  AntCharacteristics,
  Castle,
  ClayPack,
} from "./types";

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

  public createCastle(canvasWidth: number, canvasHeight: number): Castle {
    const castleWidth = this.config.castle.width;
    const castleHeight = this.config.castle.height;

    // Place castle randomly but ensure it's fully within canvas bounds
    const x = Math.random() * (canvasWidth - castleWidth) + castleWidth / 2;
    const y = Math.random() * (canvasHeight - castleHeight) + castleHeight / 2;

    return {
      x,
      y,
      width: castleWidth,
      height: castleHeight,
      clayInventory: 0,
    };
  }

  public createClayPacks(
    canvasWidth: number,
    canvasHeight: number,
    existingEntities: (Castle | ClayPack)[] = []
  ): ClayPack[] {
    const clayPacks: ClayPack[] = [];
    const clayPackWidth = this.config.clayPacks.width;
    const clayPackHeight = this.config.clayPacks.height;
    const minDistance = 100; // Minimum distance between entities

    for (let i = 0; i < this.config.clayPacks.count; i++) {
      let attempts = 0;
      let validPosition = false;
      let x: number, y: number;

      // Try to find a position that doesn't overlap with existing entities
      while (!validPosition && attempts < 50) {
        x = Math.random() * (canvasWidth - clayPackWidth) + clayPackWidth / 2;
        y =
          Math.random() * (canvasHeight - clayPackHeight) + clayPackHeight / 2;

        validPosition = true;

        // Check distance from all existing entities
        for (const entity of existingEntities) {
          const dx = x - entity.x;
          const dy = y - entity.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < minDistance) {
            validPosition = false;
            break;
          }
        }

        attempts++;
      }

      // If we couldn't find a good position after many attempts, just place it randomly
      if (!validPosition) {
        x = Math.random() * (canvasWidth - clayPackWidth) + clayPackWidth / 2;
        y =
          Math.random() * (canvasHeight - clayPackHeight) + clayPackHeight / 2;
      }

      const clayPack: ClayPack = {
        x: x!,
        y: y!,
        width: clayPackWidth,
        height: clayPackHeight,
        id: i,
      };

      clayPacks.push(clayPack);
      existingEntities.push(clayPack); // Add to existing entities to avoid future overlaps
    }

    return clayPacks;
  }

  private findNearestClayPack(
    ant: Circle,
    clayPacks: ClayPack[]
  ): ClayPack | null {
    if (clayPacks.length === 0) return null;

    let nearestClayPack = clayPacks[0];
    let minDistance = this.getDistance(ant, nearestClayPack);

    for (let i = 1; i < clayPacks.length; i++) {
      const distance = this.getDistance(ant, clayPacks[i]);
      if (distance < minDistance) {
        minDistance = distance;
        nearestClayPack = clayPacks[i];
      }
    }

    return nearestClayPack;
  }

  private getDistance(ant: Circle, target: { x: number; y: number }): number {
    const dx = target.x - ant.x;
    const dy = target.y - ant.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  private isCircleCollidingWithRectangle(
    circle: Circle,
    rect: Castle | ClayPack
  ): boolean {
    // Calculate the closest point on the rectangle to the circle center
    const closestX = Math.max(
      rect.x - rect.width / 2,
      Math.min(circle.x, rect.x + rect.width / 2)
    );
    const closestY = Math.max(
      rect.y - rect.height / 2,
      Math.min(circle.y, rect.y + rect.height / 2)
    );

    // Calculate distance from circle center to this closest point
    const distanceX = circle.x - closestX;
    const distanceY = circle.y - closestY;
    const distanceSquared = distanceX * distanceX + distanceY * distanceY;

    // Check if the distance is less than the circle's radius
    return distanceSquared < circle.radius * circle.radius;
  }

  private isCircleCollidingWithCastle(circle: Circle, castle: Castle): boolean {
    return this.isCircleCollidingWithRectangle(circle, castle);
  }

  private isCircleCollidingWithClayPack(
    circle: Circle,
    clayPack: ClayPack
  ): boolean {
    return this.isCircleCollidingWithRectangle(circle, clayPack);
  }

  public updateCircleMovement(
    circle: Circle,
    canvasWidth: number,
    canvasHeight: number,
    castle: Castle,
    clayPacks: ClayPack[]
  ): { harvestedClayPackId: number | null; droppedOffClay: boolean } {
    // Store current position as previous position before any updates
    circle.prevX = circle.x;
    circle.prevY = circle.y;

    let targetX: number, targetY: number;
    let harvestedClayPackId: number | null = null;
    let droppedOffClay = false;

    // Determine target based on ant's current state
    if (!circle.isCarrying) {
      // Ant is not carrying anything, go to nearest clay pack
      const nearestClayPack = this.findNearestClayPack(circle, clayPacks);
      if (nearestClayPack) {
        targetX = nearestClayPack.x;
        targetY = nearestClayPack.y;
        circle.targetClayPackIndex = nearestClayPack.id;

        // Check if ant is close enough to harvest
        const distanceToClayPack = this.getDistance(circle, nearestClayPack);
        if (distanceToClayPack <= this.config.harvesting.harvestDistance) {
          circle.isCarrying = true;
          circle.targetClayPackIndex = null;
          harvestedClayPackId = nearestClayPack.id;
        }
      } else {
        // No clay packs available, just stay put
        targetX = circle.x;
        targetY = circle.y;
      }
    } else {
      // Ant is carrying clay, go to castle
      targetX = castle.x;
      targetY = castle.y;

      // Check if ant is close enough to drop off
      const distanceToCastle = this.getDistance(circle, castle);
      if (distanceToCastle <= this.config.harvesting.dropOffDistance) {
        circle.isCarrying = false;
        droppedOffClay = true;
      }
    }

    // Move towards target
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

    // Calculate potential new position
    const newX = circle.x + circle.vx;
    const newY = circle.y + circle.vy;

    // Create a temporary circle to test collision
    const tempCircle = { ...circle, x: newX, y: newY };

    // Check if moving would cause collision with castle or clay packs
    let wouldCollide = false;

    if (castle && this.isCircleCollidingWithCastle(tempCircle, castle)) {
      wouldCollide = true;
    }

    for (const clayPack of clayPacks) {
      if (this.isCircleCollidingWithClayPack(tempCircle, clayPack)) {
        wouldCollide = true;
        break;
      }
    }

    if (wouldCollide) {
      // Don't move if it would collide with any entity
      circle.vx = 0;
      circle.vy = 0;
    } else {
      // Safe to move
      circle.x = newX;
      circle.y = newY;
    }

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

    return { harvestedClayPackId, droppedOffClay };
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
      isCarrying: false,
      targetClayPackIndex: null,
    };
  }
}
