interface Circle {
  x: number;
  y: number;
  radius: number;
  vx: number;
  vy: number;
  color: string;
  facingRight: boolean;
}

const canvas = document.getElementById("simulationCanvas") as HTMLCanvasElement;
const ctx = canvas.getContext("2d")!;

let mouseX = 0;
let mouseY = 0;

const numCircles = 5;
const circles: Circle[] = [];
const circleRadius = 20;
const colors = ["#FF6B6B", "#4ECDC4", "#45B7D1", "#FED766", "#F67280"];

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
    circles.push({
      x: Math.random() * (canvas.width - circleRadius * 2) + circleRadius,
      y: Math.random() * (canvas.height - circleRadius * 2) + circleRadius,
      radius: circleRadius,
      vx: 0,
      vy: 0,
      color: colors[i % colors.length],
      facingRight: false,
    });
  }
}

function drawCircle(circle: Circle) {
  ctx.save(); // Save the current state
  ctx.translate(circle.x, circle.y); // Move to the circle's position

  // Flip if facingRight is true (assuming emoji faces left by default)
  if (circle.facingRight) {
    ctx.scale(-1, 1);
  }

  ctx.font = `${circle.radius * 1.5}px Arial`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("🐜", 0, 0); // Draw at the new origin (0,0)

  ctx.restore(); // Restore the original state
}

function updateCircles() {
  circles.forEach((circle) => {
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
    } else {
      circle.vx = 0;
      circle.vy = 0;
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
initCircles();
gameLoop();
