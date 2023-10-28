class Particle {
    constructor(position_current, position_old, radius, acceleration, color) {
      this.position_current = position_current;
      this.position_old = position_old
      this.radius = radius;
      this.acceleration = acceleration;
      this.color = color;
      this.mass = radius * 3.14159;
    }

    updatePosition(dt) {
      const velocity = this.position_current.subtract(this.position_old);
      const accelerationTerm = this.acceleration.multiply(dt * dt);
  
      this.position_old = this.position_current;
      this.position_current = this.position_current.add(velocity).add(accelerationTerm);
  
      // Reset accel
      this.acceleration = Vector2.zero();
    }

    accelerate(acc) {
      this.acceleration = this.acceleration.add(acc);
    }
  }
  