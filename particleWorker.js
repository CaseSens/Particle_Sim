importScripts('Vector2.js');
importScripts('Particles.js');

const GRAVITY = new Vector2(0, 1000);
const FRICTION_COEFFICIENT = 0.2; // 0: no friction, 1: very high friction
const STATIC_FRICTION = 0.5;
const KINETIC_FRICTION = 0.3;

let particles;
let canvasWidth, canvasHeight;
let dt;

self.onmessage = function (event) {
  particles = event.data.particles.map(p => new Particle(
    new Vector2(p.position_current.x, p.position_current.y),
    new Vector2(p.position_old.x, p.position_old.y),
    p.radius,
    new Vector2(p.acceleration.x, p.acceleration.y),
    p.color
  ));

  canvasWidth = event.data.canvasDimen.width;
  canvasHeight = event.data.canvasDimen.height;
  dt = event.data.dt;

  update(dt);

  self.postMessage(particles);
};

function update(dt) {
  applyGravity();
  updatePositions(dt);
  solveCollisions();
  applyConstraint();
}

function updatePositions(dt) {
  particles.forEach((particle) => {
    particle.updatePosition(dt);
  });
}

function applyGravity() {
  particles.forEach((particle) => {
    particle.accelerate(GRAVITY);
  });
}

function applyConstraint() {
  particles.forEach((particle) => {
    // Define the bounds of the rectangle
    const leftBound = 0;
    const rightBound = canvasWidth;
    const topBound = 0;
    const bottomBound = canvasHeight;
    let reflection = 0.2; // You can adjust this value for how "bouncy" you want the particle to be

    // Check left boundary
    if (particle.position_current.x - particle.radius < leftBound) {
        let overlap = leftBound - (particle.position_current.x - particle.radius);
        particle.position_current.x += 2 * overlap;
        particle.position_old.x += 2 * overlap * reflection;
    }

    // Check right boundary
    if (particle.position_current.x + particle.radius > rightBound) {
        let overlap = (particle.position_current.x + particle.radius) - rightBound;
        particle.position_current.x -= 2 * overlap;
        particle.position_old.x -= 2 * overlap * reflection;
    }

    // Check top boundary
    if (particle.position_current.y - particle.radius < topBound) {
        let overlap = topBound - (particle.position_current.y - particle.radius);
        particle.position_current.y += 2 * overlap;
        particle.position_old.y += 2 * overlap * reflection;
    }

    // Check bottom boundary
    if (particle.position_current.y + particle.radius > bottomBound) {
        let overlap = (particle.position_current.y + particle.radius) - bottomBound;
        particle.position_current.y -= 2 * overlap;
        particle.position_old.y -= 2 * overlap * reflection;
    }
  });
}

function solveCollisions() {
  const numParticles = particles.length;
  for (let i = 0; i < numParticles; i++) {
      const p1 = particles[i];
      for (let j = i + 1; j < numParticles; j++) {
          const p2 = particles[j];
          const collAxis = p1.position_current.subtract(p2.position_current);
          const dist = collAxis.magnitude();

          // Combined radius of both particles
          const combinedRadius = p1.radius + p2.radius;

          // Check if they are overlapping
          if (dist < combinedRadius) {
              const n = collAxis.divide(dist); // Find the normal
              const overlap = combinedRadius - dist; // The amount of penetration/overlap

              // Correct the positions based on the overlap
              p1.position_current = p1.position_current.add(n.multiply(0.5 * overlap));
              p2.position_current = p2.position_current.subtract(n.multiply(0.5 * overlap));
          }
      }
  }
}