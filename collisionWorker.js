importScripts('Vector2.js');

let particles, canvasWidth, canvasHeight, dt;

self.onmessage = function (event) {
  particles = event.data.particles;
  canvasWidth = event.data.canvasDimen.width;
  canvasHeight = event.data.canvasDimen.height;
  dt = event.data.dt;

  computeCollisions();

  self.postMessage({
    particles: particles
  });
};

function computeCollisions() {
  for (let i = 0; i < particles.length; i++) {
    const particle = particles[i];

    for (let j = 0; j < particles.length; j++) {
      const nextParticle = particles[j];
      if (particle === nextParticle) continue;

      let distanceVect = nextParticle.position.subtract(particle.position);
      let distance = distanceVect.magnitude();
      let sumOfRadii = particle.radius + nextParticle.radius;

      if (distance <= sumOfRadii) {
        // The particles are colliding
        
        // Resolve overlap
        let overlap = sumOfRadii - distance;
        let direction = distanceVect.normalize();
        particle.position = particle.position.subtract(direction.multiply(overlap / 2));
        nextParticle.position = nextParticle.position.add(direction.multiply(overlap / 2));

        let relativeVelocity = nextParticle.velocity.subtract(particle.velocity);
        let impulse = direction.multiply(2 * relativeVelocity.dot(direction));
        particle.velocity = particle.velocity.subtract(impulse);
        nextParticle.velocity = nextParticle.velocity.add(impulse);
      }
    }
  }
}