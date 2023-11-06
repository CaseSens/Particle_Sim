class Vector2 {
    constructor(x, y) {
      this.x = x;
      this.y = y;

      if (isNaN(this.x) || isNaN(this.y)) {
        console.error('NaN detected in Vector2', this);
      }
    }
  
    static one() {
      return new Vector2(1, 1);
    }
  
    static zero() {
      return new Vector2(0, 0);
    }
  
    add(v) {
      return new Vector2(this.x + v.x, this.y + v.y);
    }
  
    subtract(v) {
      return new Vector2(this.x - v.x, this.y - v.y);
    }
  
    multiply(scalar) {
      return new Vector2(this.x * scalar, this.y * scalar);
    }
  
    divide(scalar) {
      if (scalar === 0) throw new Error("Division by zero");
      return new Vector2(this.x / scalar, this.y / scalar);
    }
  
    magnitude() {
      return Math.sqrt(this.x * this.x + this.y * this.y);
    }

    normalize() {
      let mag = this.magnitude();
      if (mag === 0) return Vector2.zero();
      return this.divide(mag);
    }

    dot(v) {
      return this.x * v.x + this.y * v.y;
    }
  }
  