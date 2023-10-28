const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
let lastTime;
let dt = 0;
let interval;
let particles = [];
let workers = [];

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
        createParticle();
      }
  }

});

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

  console.log(`accel: ${expX}:${expY}`);

  return new Vector2(expX, expY);
}

function createParticle() {
	let second = new Date().getSeconds();
	console.log(`particle created at ${second}`);
  const oldPos = new Vector2(canvasWidth/2, 20);
  const position = new Vector2(canvasWidth/2, 20);
  const accel = getReasonableMousePos(position.x, position.y);
  const particle = new Particle(position, oldPos, getRandomInt(4,16), accel, getRandomColor());
  console.log(particle.mass);
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

function start() {
  playing = true;
  // If on first load, make the first particle without waiting
  if (intervalChange === 0) {
    createParticle();
  }
  intervalChange++;
	lastTime = Date.now();
  interval = setInterval(() => {
    let now = Date.now();
    dt = (now - lastTime) / 1000;
    lastTime = now;

		accumulatedTime += dt;

		if (particles.length < 700) {
			if (accumulatedTime >= particleCreationIntervalInSeconds) {
				createParticle();
				accumulatedTime -= particleCreationIntervalInSeconds;
			}
		}

    worker.postMessage({
      particles: particles,
      dt: dt,
			canvasDimen: { width: canvas.width, height: canvas.height }
    });
  }, 5);
}

function stop() {
  if (interval) {
    clearInterval(interval);
    playing = false;
  }
}

let worker = new Worker("particleWorker.js");
worker.onmessage = function (event) {
  particles = event.data;

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