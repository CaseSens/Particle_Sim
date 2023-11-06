const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
let lastTime;
let dt = 0;
let interval;
let particles = [];
let particlePositionsInGrid = [];
const workers = [];

const GRID_WIDTH = 400;
const GRID_HEIGHT = 200;

let spitting = false;

document.addEventListener("keypress", (event) => {
  switch (event.key) {
    case " ":
      if (playing) {
        stop();
      } else {
        start();
      }
      break;

    case "f":
      if (playing) {
        if (spitting) {
          spitting = false;
        } else {
          spitting = true;
        }
      }
  }
});

const addParticleBtn = document.getElementById("addParticle");
addParticleBtn.addEventListener("click", createParticle);

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRandomColor() {
  const r = getRandomInt(0, 255);
  const g = getRandomInt(0, 255);
  const b = getRandomInt(0, 255);

  return `rgb(${r},${g},${b})`;
}

let canvasWidth = canvas.width;
let canvasHeight = canvas.height;
let mouseX = canvasWidth;
let mouseY = canvasHeight;

canvas.addEventListener("mousemove", (event) => {
  mouseX = event.pageX;
  mouseY = event.pageY;
});

function getReasonableMousePos(px, py) {
  const a = 1; // Base value
  const b = 1.015; // Growth rate
  const diffX = Math.abs(px - mouseX);
  const diffY = Math.abs(py - mouseY);

  const expX = a * Math.pow(b, diffX);
  const expY = a * Math.pow(b, diffY);

  return new Vector2(expX, expY);
}

function createParticle() {
  let second = new Date().getSeconds();
  const id = particles.length + 1;
  const oldPos = new Vector2(canvasWidth / 2, 20);
  const position = new Vector2(canvasWidth / 2, 20);
  // const accel = getReasonableMousePos(position.x, position.y);
  const accel = new Vector2(70, 70);
  // const radius = getRandomInt(4, 16);
  const radius = 8;
  const particle = new Particle(id, position, oldPos, radius, accel, "blue");
  particles.push(particle);
  particleCountText.innerHTML = `Particle count: ${particles.length}`;
}

let playing = false;
const btnStartSim = document.getElementById("startSim");
btnStartSim.addEventListener("click", () => {
  if (!playing) {
    start();
  } else {
    stop();
  }
});

let animationFrameId;

function start() {
  playing = true;
  if (intervalChange === 0) {
    createParticle();
  }
  intervalChange++;
  lastTime = Date.now();
  animationFrameId = requestAnimationFrame(animate); // Start the animation loop
}

function stop() {
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
    animationFrameId = null; // Clear the stored ID
  }
  playing = false;
}

let intervalChange = 0;
let accumulatedTime = 0;
let particleCreationIntervalInSeconds = 0.2;

// Store all updates from workers
let globalWorkerUpdates = [];

// Instantiate the workers that we'll need
const numRows = Math.ceil(canvasWidth / GRID_WIDTH);
const numCols = Math.ceil(canvasHeight / GRID_HEIGHT);

function updateParticleData(particles, updatedParticles) {
  // Create a map of the updated particles for quick lookup
  const updatedParticlesMap = new Map(updatedParticles.map((p) => [p.id, p]));

  // Loop through the original particles array and update their properties
  particles.forEach((particle) => {
    if (updatedParticlesMap.has(particle.id)) {
      const updatedParticle = updatedParticlesMap.get(particle.id);

      // Copy the properties from the updated particle to the original particle
      Object.assign(particle, updatedParticle);
    }
  });

  renderParticles(particles);
}

let canStartNextIteration = true;
let workerCount = numRows * numCols;
let workersFinished = 0;

for (let x = 0; x < numRows; x++) {
  workers[x] = [];
  for (let y = 0; y < numCols; y++) {
    const collisionWorker = new Worker("collisionWorker2.js");

    collisionWorker.onmessage = function (event) {
      const updatedParticles = event.data.particles;

      workersFinished++;

      // Store updates from each worker in the global array
      globalWorkerUpdates = globalWorkerUpdates.concat(updatedParticles);

      updateParticleData(particles, globalWorkerUpdates);
    };

    workers[x][y] = collisionWorker;
    console.log("worker created");
  }
}

function getNeighboringCells(cellX, cellY) {
  const neighbors = [
    [cellX - 1, cellY - 1],
    [cellX, cellY - 1],
    [cellX + 1, cellY - 1],
    [cellX - 1, cellY],
    [cellX + 1, cellY],
    [cellX - 1, cellY + 1],
    [cellX, cellY + 1],
    [cellX + 1, cellY + 1],
  ];
  return neighbors.filter(
    ([x, y]) => x >= 0 && x < numRows && y >= 0 && y < numCols
  );
}

let divisorWorker = new Worker("divisorWorker.js");
divisorWorker.onmessage = function (event) {
  const eventParticlesByCell = event.data;

  Object.entries(eventParticlesByCell).forEach(([key, particlesByCell]) => {
    const [cellX, cellY] = key.split(",").map(Number);
    workers[cellX][cellY].postMessage({
      particles: particlesByCell,
      dt: dt,
      canvasDimen: { width: canvasWidth, height: canvasHeight },
    });
  });
};

function animate() {
  let now = Date.now();
  dt = (now - lastTime) / 1000;
  lastTime = now;

  accumulatedTime += dt;
  
  divisorWorker.postMessage({
    particles: particles,
    canvasDimen: { width: canvas.width, height: canvas.height },
    gridDimen: { width: GRID_WIDTH, height: GRID_HEIGHT },
  });

  let spitTimer = 0;

  if (spitting) {
    spitTimer++;

    if (spitTimer % 10 === 0) {
      createParticle();
      spitTimer = 0;
    }
  }

  requestAnimationFrame(animate); // Loop
}

// let spitTimer = 0;
// let worker = new Worker("particleWorker.js");
// worker.onmessage = function (event) {
//   particles = event.data;

//   if (spitting) {
//     spitTimer++;

//     if (spitTimer % 10 === 0) {
//       createParticle();
//       spitTimer = 0;
//     }
//   }

//   if (!Array.isArray(particles)) {
//     console.log("not an array");
//   } else {
//     renderParticles(particles);
//   }
// };

function renderParticles(particles) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  particles.forEach((particle) => {
    ctx.beginPath();
    ctx.arc(
      particle.position_current.x,
      particle.position_current.y,
      particle.radius,
      0,
      Math.PI * 2
    );
    ctx.fillStyle = particle.color;
    ctx.fill();
    ctx.closePath();
  });
}

const particleCountText = document.getElementById("particleCount");