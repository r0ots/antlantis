interface Circle {
  x: number;
  y: number;
  radius: number;
  vx: number;
  vy: number;
  facingRight: boolean;
  animationPhase: number; // For walking animation
  prevX: number; // Previous x position
  prevY: number; // Previous y position
}

const canvas = document.getElementById("simulationCanvas") as HTMLCanvasElement;
const ctx = canvas.getContext("2d")!;

// Load the ant image
const antImage = new Image();
antImage.src = "assets/fourmi.png"; // Path to your image

let mouseX = 0;
let mouseY = 0;

const numCircles = 5;
const circles: Circle[] = [];
const circleRadius = 20;

function resizeCanvas() {
  canvas.width = window.innerWidth * 0.9;
  canvas.height = window.innerHeight * 0.9;
}

window.addEventListener("resize", resizeCanvas);
document.addEventListener("mousemove", (event) => {
  const rect = canvas.getBoundingClientRect();
  mouseX = event.clientX - rect.left;
  mouseY = event.clientY - rect.top;
});

function initCircles() {
  for (let i = 0; i < numCircles; i++) {
    const initialX =
      Math.random() * (canvas.width - circleRadius * 2) + circleRadius;
    const initialY =
      Math.random() * (canvas.height - circleRadius * 2) + circleRadius;
    circles.push({
      x: initialX,
      y: initialY,
      radius: circleRadius,
      vx: 0,
      vy: 0,
      facingRight: false,
      animationPhase: Math.random() * Math.PI * 2, // Start with a random phase
      prevX: initialX, // Initialize prevX
      prevY: initialY, // Initialize prevY
    });
  }
}

function drawCircle(circle: Circle) {
  ctx.save(); // Save the current state

  // Animation parameters
  const bobbleAmplitude = circle.radius * 0.1; // How much it bobs
  const bobbleSpeed = 0.3; // How fast it bobs
  const rotationAmplitude = 0.1; // Radians, for wiggling
  const movementThreshold = 0.05; // Minimum pixel displacement to trigger animation

  let yOffset = 0;
  let angle = 0;

  const actualDx = circle.x - circle.prevX;
  const actualDy = circle.y - circle.prevY;

  // Apply animation only if actual displacement is above threshold
  if (
    Math.abs(actualDx) > movementThreshold ||
    Math.abs(actualDy) > movementThreshold
  ) {
    yOffset = Math.sin(circle.animationPhase * bobbleSpeed) * bobbleAmplitude;
    angle =
      Math.sin(circle.animationPhase * bobbleSpeed * 0.5) * rotationAmplitude; // Slower rotation
  }

  ctx.translate(circle.x, circle.y + yOffset); // Move to the circle's position, add bobble

  // Flip if facingRight is true
  if (circle.facingRight) {
    ctx.scale(-1, 1);
  }

  ctx.rotate(angle); // Apply wiggle rotation

  // Draw the image
  // Adjust width and height as needed, using circle.radius for sizing
  const drawWidth = circle.radius * 2;
  const drawHeight = circle.radius * 2;
  ctx.drawImage(
    antImage,
    -drawWidth / 2,
    -drawHeight / 2, // Center the image
    drawWidth,
    drawHeight
  );

  ctx.restore(); // Restore the original state
}

function updateCircles() {
  circles.forEach((circle) => {
    // Store current position as previous position before any updates
    circle.prevX = circle.x;
    circle.prevY = circle.y;

    // Move towards mouse
    const dx = mouseX - circle.x;
    const dy = mouseY - circle.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const speed = 2;

    // Update orientation based on horizontal direction to mouse
    const orientationThreshold = 1; // Minimum horizontal distance to change orientation
    if (dx > orientationThreshold) {
      circle.facingRight = true;
    } else if (dx < -orientationThreshold) {
      circle.facingRight = false;
    }
    // If dx is very small, maintain current orientation

    if (dist > 1) {
      // Prevent shaking when close
      circle.vx = (dx / dist) * speed;
      circle.vy = (dy / dist) * speed;
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
    if (circle.x + circle.radius > canvas.width) {
      circle.x = canvas.width - circle.radius;
      circle.vx *= -0.5;
    }
    if (circle.y - circle.radius < 0) {
      circle.y = circle.radius;
      circle.vy *= -0.5;
    }
    if (circle.y + circle.radius > canvas.height) {
      circle.y = canvas.height - circle.radius;
      circle.vy *= -0.5;
    }
  });

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

function gameLoop() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  updateCircles();
  circles.forEach(drawCircle);
  requestAnimationFrame(gameLoop);
}

resizeCanvas();

// Ensure image is loaded before starting the game
antImage.onload = () => {
  initCircles();
  gameLoop();
};

antImage.onerror = () => {
  console.error("Failed to load ant image at path: assets/fourmi.png");
};
