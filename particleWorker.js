importScripts('Vector2.js');
importScripts('Particles.js');

const GRAVITY = new Vector2(0, 1000);
const FRICTION_COEFFICIENT = 0.2; // 0: no friction, 1: very high friction
const STATIC_FRICTION = 0.5;
const KINETIC_FRICTION = 0.3;
const GRID_DIVISOR = 10;

let particles;
let canvasWidth, canvasHeight;
let dt;

let cells = [];
let cellWidth = getCellWidth();
let cellHeight = getCellHeight();

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
  const sub_steps = 1;
  const sub_dt = dt / sub_steps
  for (let i = 0; i < sub_steps; i++) {
    applyGravity();
    updatePositions(sub_dt);
    // fillCellsWithParticles(particles);
    // findCollisionsInGrid();
    solveCollisions(particles);
    applyConstraint();
  }
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

function solveCollisions(particlesInArea) {
  const numParticles = particlesInArea.length;

  for (let i = 0; i < numParticles; i++) {
      const p1 = particlesInArea[i];
      for (let j = i + 1; j < numParticles; j++) {
          const p2 = particlesInArea[j];
          const collAxis = p1.position_current.subtract(p2.position_current);
          const dist = collAxis.magnitude();

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
            p1.position_current = p1.position_current.add(n.multiply(0.5 * overlap));
            p2.position_current = p2.position_current.subtract(n.multiply(0.5 * overlap));
          }
      }
  }
}

/------------------------------------------------/

function getCellWidth() {
  return canvasWidth / GRID_DIVISOR;
}

function getCellHeight() {
  return canvasHeight / GRID_DIVISOR;
}

function isBetween(n1, n2, val) {
  return (val >= n1 && val <= n2);
}

function fillCellsWithParticles(particles) {
  cells = [];
  // Only need to loop once, since the grids are squares
  for (let x = 0; x < GRID_DIVISOR; x++) {
    for (let y = 0; y < GRID_DIVISOR; y++) {
      let cx1 = getCellWidth() * x;
      let cx2 = getCellWidth() + getCellWidth()*x;
      let cy1 = getCellHeight() * y;
      let cy2 = getCellHeight() + getCellHeight()*y;

      cells.push({
        cx1: cx1,
        cx2: cx2,
        cy1: cy1,
        cy2: cy2,
        particles: []
      });
    }
  }

  particles.forEach((particle) => {
    let px = particle.position_current.x;
    let py = particle.position_current.y;

    cells.forEach((cell, index) => {
      if (isBetween(cell.cx1, cell.cx2, px)) {
        if (isBetween(cell.cy1, cell.cy2, py)) {
          cell.particles.push(particle);
        }
      }
    });
  });
}

function findCollisionsInGrid() {
  // Skip the cells on the border, since they contain impossible grids
  cells.forEach((cell, index) => {
    if (
      !isBetween(0, GRID_DIVISOR - 1, index) &&
      index % GRID_DIVISOR !== 0 &&
      (index + 1) % GRID_DIVISOR !== 0 &&
      !isBetween((cells.length - GRID_DIVISOR), (cells.length - 1), index)
    ) {
      let particlesInArea = [];
      particlesInArea.push(...cell.particles);
      let cellsInArea = findCellsInArea(index);
      cellsInArea.forEach((cell) => {
        particlesInArea = particlesInArea.concat(...cell.particles);
      });

      solveCollisions(particlesInArea);
    }
  });
}

function findCellsInArea(index) {
  let cellsInArea = [];
  
  // Top-left cell
  if(cells[index - GRID_DIVISOR - 1]) {
    cellsInArea.push(cells[index - GRID_DIVISOR - 1]);
  }
  
  // Top cell
  if(cells[index - GRID_DIVISOR]) {
    cellsInArea.push(cells[index - GRID_DIVISOR]);
  }
  
  // Top-right cell
  if(cells[index - GRID_DIVISOR + 1]) {
    cellsInArea.push(cells[index - GRID_DIVISOR + 1]);
  }
  
  // Left cell
  if(cells[index - 1]) {
    cellsInArea.push(cells[index - 1]);
  }

  // Right cell
  if(cells[index + 1]) {
    cellsInArea.push(cells[index + 1]);
  }
  
  // Bottom-left cell
  if(cells[index + GRID_DIVISOR - 1]) {
    cellsInArea.push(cells[index + GRID_DIVISOR - 1]);
  }

  // Bottom cell
  if(cells[index + GRID_DIVISOR]) {
    cellsInArea.push(cells[index + GRID_DIVISOR]);
  }
  
  // Bottom-right cell
  if(cells[index + GRID_DIVISOR + 1]) {
    cellsInArea.push(cells[index + GRID_DIVISOR + 1]);
  }

  return cellsInArea;
}