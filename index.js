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
      createParticle();
  }

});

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function createParticle() {
	let second = new Date().getSeconds();
	console.log(`particle created at ${second}`);
  const position = new Vector2(20, 20);
  const velocity = new Vector2(400, 400);
  const particle = new Particle(position, getRandomInt(4,16), velocity, "white");
  console.log(particle.mass);
  particles.push(particle);
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
let particleCreationIntervalInSeconds = 0.5;

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

		if (particles.length < 3) {
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
      particle.position.x,
      particle.position.y,
      particle.radius,
      0,
      Math.PI * 2
    );
    ctx.fillStyle = particle.color;
    ctx.fill();
    ctx.closePath();
  });
}
