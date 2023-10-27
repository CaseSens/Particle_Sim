importScripts('Vector2.js');

const GRAVITY = new Vector2(0, 9.8);
const FRICTION_COEFFICIENT = 0.2; // 0: no friction, 1: very high friction
const STATIC_FRICTION = 0.5;
const KINETIC_FRICTION = 0.3;
const MAX_ITERATIONS = 4; // Number of iterations of collision checking, computationally expensive without grid offloading
const SUBSTEPS = 4;

let particles;
let canvasWidth, canvasHeight;
let dt;

self.onmessage = function (event) {
  particles = event.data.particles.map(p => ({
    ...p,
    position: new Vector2(p.position.x, p.position.y),
    velocity: new Vector2(p.velocity.x, p.velocity.y)
  }));

  canvasWidth = event.data.canvasDimen.width;
  canvasHeight = event.data.canvasDimen.height;

  dt = event.data.dt;
  updateWithSubSteps(dt, SUBSTEPS);

  self.postMessage(particles);
};

function update(particle, dt) {
  const downwardsForce = GRAVITY.y * particle.mass * dt;
  particle.velocity.y += downwardsForce;

  applyGroundFriction(particle, dt);

  const newX = particle.position.x + particle.velocity.x * dt;
  const newY = particle.position.y + particle.velocity.y * dt;

  

  handleWallCollisions(particle, newX, newY);

  let iterations = 0;
  while (iterations < MAX_ITERATIONS) {
    computeCollisions();
    iterations++;
  }

  computeCollisions();
}

function updateWithSubSteps(dt, substeps) {
  const sub_dt = dt / substeps;
  for (let i = 0; i < substeps; i++) {
    particles.forEach((particle) => {
      update(particle, sub_dt);
    });
  }
}

function handleWallCollisions(particle, newX, newY) {
  const radius = particle.radius;
  const rightEdge = newX + radius;
  const leftEdge = newX - radius;
  const topEdge = newY - radius;
  const bottomEdge = newY + radius;

  let adjustedX = newX
  let adjustedY = newY;

  if (leftEdge <= 0) {
    adjustedX = 0 + radius;
    calculateNewVel(particle, "horizontal");
  }
  if (rightEdge >= canvasWidth) {
    adjustedX = canvasWidth - radius;
    calculateNewVel(particle, "horizontal");
  }
  if (topEdge <= 0) {
    adjustedY = 0 + radius;
    calculateNewVel(particle, "vertical");
  }
  if (bottomEdge >= canvasHeight) {
    adjustedY = canvasHeight - radius;
    calculateNewVel(particle, "vertical");
  }

  const newPos = new Vector2(adjustedX, adjustedY);
  particle.position = newPos;
}

function calculateNewVel(particle, dir) {
  switch (dir) {
    case "horizontal":
      let vx = particle.velocity.x;
      let newVx = -vx;
      particle.velocity.x = newVx;
      particle.velocity.x /= 2;
      break;
    case "vertical":
      let vy = particle.velocity.y;
      let newVy = -vy;
      particle.velocity.y = newVy;
      particle.velocity.y /= 2;
      break;
  }
}

function applyFriction(particle, dt) {
  if (particle.position.y + particle.radius >= canvasHeight) { // if particle is on the ground
    const frictionForce = (FRICTION_COEFFICIENT * 50) * GRAVITY.y; 
    particle.velocity.x = Math.sign(particle.velocity.x) * Math.max(0, Math.abs(particle.velocity.x) - frictionForce * dt);
  }
}

function applyGroundFriction(particle, dt) {
  if (particle.position.y + particle.radius >= canvasHeight) {
      let frictionMagnitude = GRAVITY.y * particle.mass;
      if (Math.abs(particle.velocity.x) < 0.1) {
          // Static friction
          frictionMagnitude *= STATIC_FRICTION;
      } else {
          // Kinetic friction
          frictionMagnitude *= KINETIC_FRICTION;
      }

      // Apply friction in the opposite direction of motion
      let frictionForce = new Vector2(-Math.sign(particle.velocity.x) * frictionMagnitude, 0);
      particle.velocity = particle.velocity.add(frictionForce.multiply(dt));
  }
}

function applyParticleFriction(p1, p2, dt) {
  let relativeVelocity = p1.velocity.subtract(p2.velocity);
  let frictionMagnitude = GRAVITY.y * Math.min(p1.mass, p2.mass);

  if (relativeVelocity.magnitude() < 0.1) {
      frictionMagnitude *= STATIC_FRICTION;
  } else {
      frictionMagnitude *= KINETIC_FRICTION;
  }

  let frictionForce = relativeVelocity.normalize().multiply(-frictionMagnitude);

  p1.velocity = p1.velocity.add(frictionForce.multiply(dt / p1.mass));
  p2.velocity = p2.velocity.subtract(frictionForce.multiply(dt / p2.mass));
}

function computeCollisions() {
  for (let i = 0; i < particles.length; i++) {
      const p1 = particles[i];

      for (let j = i + 1; j < particles.length; j++) {  // Note the change here to j = i + 1
          const p2 = particles[j];

          let distanceVect = p2.position.subtract(p1.position);
          let distance = distanceVect.magnitude();
          let sumOfRadii = p1.radius + p2.radius;

          if (distance <= sumOfRadii) {

              // Resolve overlap
              let overlap = sumOfRadii - distance;
              let direction = distanceVect.normalize();
              let totalMass = p1.mass + p2.mass;
              p1.position = p1.position.subtract(direction.multiply(overlap * (p2.mass / totalMass)));
              p2.position = p2.position.add(direction.multiply(overlap * (p1.mass / totalMass)));

              applyParticleFriction(p1, p2, dt);

              let impulse = calculateImpulse(p1, p2, direction);
              console.log(`${impulse.x} / ${impulse.y}`);
              // let impulse = new Vector2(10, 0); // SOMEHOW THIS WORKS....? KINDA
              p1.velocity = p1.velocity.subtract(impulse.divide(p1.mass));
              p2.velocity = p2.velocity.add(impulse.divide(p2.mass));
          }
      }
  }
}

function calculateImpulse(p1, p2, direction) {
  // Relative velocity
  let relativeVelocity = p1.velocity.subtract(p2.velocity);

  // Dot product of relative velocity and collision direction
  let velAlongNormal = relativeVelocity.dot(direction);

  // Do not resolve the collision if velocities are separating
  if (velAlongNormal > 0) {
      return direction.multiply(0);
  } else {
    console.log(`velAlongNormal: ${velAlongNormal}`);
  }

  // Coefficient of restitution
  const e = 1; // 1 = Perfectly elastic collision

  // Compute impulse scalar
  let impulseScalar = -(1 + e) * velAlongNormal;
  impulseScalar /= (1/p1.mass + 1/p2.mass);

  // Apply impulse to each particle in proportion to their mass
  let impulseVector = direction.multiply(impulseScalar);

  return impulseVector;
}