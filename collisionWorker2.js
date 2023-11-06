importScripts("Vector2.js");
importScripts("Particles.js");

const GRAVITY = new Vector2(0, 1000);
const FRICTION_COEFFICIENT = 0.8; // 0: no friction, 1: very high friction
const STATIC_FRICTION = 0.5;
const KINETIC_FRICTION = 0.3;

let particles;
let canvasWidth, canvasHeight;
let dt;

self.onmessage = function (event) {

	particles = event.data.particles.map(
    (p) =>
      new Particle(
				p.id,
        new Vector2(p.position_current.x, p.position_current.y),
        new Vector2(p.position_old.x, p.position_old.y),
        p.radius,
        new Vector2(p.acceleration.x, p.acceleration.y),
        p.color
      )
  );

  canvasWidth = event.data.canvasDimen.width;
  canvasHeight = event.data.canvasDimen.height;

  dt = event.data.dt;


	update(dt);

	const updatedParticlesMap = particles.map(particle => ({
		id: particle.id,
		position_current: { x: particle.position_current.x, y: particle.position_current.y },
		position_old: { x: particle.position_old.x, y: particle.position_old.y },
		radius: particle.radius,
		acceleration: { x: particle.acceleration.x, y: particle.acceleration.y },
		color: particle.color
	}
	));

	// console.log('collision worker posted', updatedParticlesMap);

	self.postMessage({ particles: updatedParticlesMap });
};

function update(dt) {
	applyGravity();
	updatePositions(dt);

	if (particles.length >= 2) {
		solveCollisions(particles);
	}

	applyConstraint();
}

function updatePositions(dt) {
  particles.forEach((particle) => {
    particle.updatePosition(dt);
  });
}

function applyGravity(dt) {
	for (let i = 0; i < particles.length; i++) {
		const particle = particles[i];
		particle.accelerate(GRAVITY);
	}
}

function applyConstraint() {
	for (let i = 0; i < particles.length; i++) {
		const particle = particles[i];

		const leftBound = 0;
    const rightBound = canvasWidth;
    const topBound = 0;
    const bottomBound = canvasHeight;
    let reflection = 0.1; // You can adjust this value for how "bouncy" you want the particle to be

    // Check left boundary
    if (particle.position_current.x - particle.radius < leftBound) {
      let overlap = leftBound - (particle.position_current.x - particle.radius);
      particle.position_current.x += 2 * overlap;
      particle.position_old.x += 2 * overlap * reflection;
    }

    // Check right boundary
    if (particle.position_current.x + particle.radius > rightBound) {
      let overlap = particle.position_current.x + particle.radius - rightBound;
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
      let overlap = particle.position_current.y + particle.radius - bottomBound;
      particle.position_current.y -= 2 * overlap;
      particle.position_old.y -= 2 * overlap * reflection;
    }
  };
}

function solveCollisions(particles) {
  const numParticles = particles.length;

  for (let i = 0; i < numParticles; i++) {
    const p1 = particles[i];
    for (let j = i + 1; j < numParticles; j++) {
      const p2 = particles[j];

      let collAxis = p1.position_current.subtract(p2.position_current);
      let dist = collAxis.magnitude();

      if (dist === 0) {
        p2.position_current.x += 0.0001;
        collAxis = p1.position_current.subtract(p2.position_current);
        dist = collAxis.magnitude();
      }

      // Combined radius of both particles
      const combinedRadius = p1.radius + p2.radius;

      // Check if they are overlapping
      if (dist < combinedRadius) {
        const n = collAxis.divide(dist); // Find the normal
        const overlap = combinedRadius - dist; // The amount of penetration/overlap

        // Correct the positions based on the overlap
        p1.position_current = p1.position_current.add(
          n.multiply(0.5 * overlap)
        );
        p2.position_current = p2.position_current.subtract(
          n.multiply(0.5 * overlap)
        );
      }
    }
  }
}


// function computeCollisions() {
// 	const collidedParticles = []; //[i, j], new calculated pos

//   for (let i = 0; i < particles.length; i++) {
//     const particle = particles[i];

//     for (let j = i + 1; j < particles.length; j++) {
//       const nextParticle = particles[j];

//       let distanceVect = nextParticle.position.subtract(particle.position);
//       let distance = distanceVect.magnitude();
//       let sumOfRadii = particle.radius + nextParticle.radius;

//       if (distance <= sumOfRadii) {
//         // The particles are colliding

//         // Resolve overlap
//         let overlap = sumOfRadii - distance;
//         let direction = distanceVect.normalize();

//         let p1NewPos = particle.position.subtract(
//           direction.multiply(overlap / 2)
//         );

//         let p2NewPos = nextParticle.position.add(
//           direction.multiply(overlap / 2)
//         );

//         let relativeVelocity = nextParticle.velocity.subtract(
//           particle.velocity
//         );
//         let impulse = direction.multiply(2 * relativeVelocity.dot(direction));
//         particle.velocity = particle.velocity.subtract(impulse);
//         nextParticle.velocity = nextParticle.velocity.add(impulse);
//       }
//     }
//   }
// }
