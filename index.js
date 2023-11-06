const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
let lastTime;
let dt = 0;
let interval;
let particles = [];
let workers = [];

let spitting = false;

document.addEventListener('keypress', (event) => {
  switch (event.key) {
    case " ":
      if (playing) {
        stop();
      } else {
        start();
      };
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

const addParticleBtn = document.getElementById('addParticle');
addParticleBtn.addEventListener('click', createParticle);

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

canvas.addEventListener('mousemove', (event) => {
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
  const oldPos = new Vector2(canvasWidth/2, 20);
  const position = new Vector2(canvasWidth/2, 20);
  // const accel = getReasonableMousePos(position.x, position.y);
  const accel = new Vector2(70, 70);
  // const radius = getRandomInt(4, 16);
  const radius = 8;
  const particle = new Particle(position, oldPos, radius, accel, "blue");
  particles.push(particle);
  particleCountText.innerHTML = `Particle count: ${particles.length}`
}

let playing = false;
const btnStartSim = document.getElementById("startSim");
btnStartSim.addEventListener("click", () => {
	if (!playing) {
		start();
	}
});

let intervalChange = 0;
let accumulatedTime = 0;
let particleCreationIntervalInSeconds = 0.2;

function animate() {
  let now = Date.now();
  dt = (now - lastTime) / 1000;
  lastTime = now;

  accumulatedTime += dt;

  worker.postMessage({
    particles: particles,
    dt: dt,
    canvasDimen: { width: canvas.width, height: canvas.height }
  });

  frameCount++;

  let currentFPSUpdateTime = Date.now();
  if (currentFPSUpdateTime - fpsLastTime >= 1000) { // check every second
      fpsDisplay.textContent = `FPS: ${frameCount}`;
      frameCount = 0; // reset frame count
      fpsLastTime = currentFPSUpdateTime; // update last time FPS was updated
  }

  requestAnimationFrame(animate); // Loop
}

function start() {
  playing = true;
  if (intervalChange === 0) {
      createParticle();
  }
  intervalChange++;
  lastTime = Date.now();
  animate(); // Start the animation loop
}

function stop() {
  if (interval) {
    clearInterval(interval);
    playing = false;
  }
}

let spitTimer = 0;
let worker = new Worker("particleWorker.js");
worker.onmessage = function (event) {
  particles = event.data;

  if (spitting) {
    spitTimer++;

    if (spitTimer % 10 === 0) {
      createParticle();
      spitTimer = 0;
    }
  }

	if (!Array.isArray(particles)) {
		console.log('not an array');
	} else {
		renderParticles(particles);
	}

};

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

const particleCountText = document.getElementById('particleCount');

let frameCount = 0;
let fpsLastTime = 0;
let fpsDisplay = document.createElement('div');
fpsDisplay.style.position = 'fixed';
fpsDisplay.style.top = '10px';
fpsDisplay.style.left = '10px';
fpsDisplay.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
fpsDisplay.style.color = 'white';
fpsDisplay.style.padding = '5px 10px';
fpsDisplay.style.zIndex = '1000';
document.body.appendChild(fpsDisplay);