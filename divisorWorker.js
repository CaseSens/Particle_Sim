let particles;
let canvasWidth, canvasHeight;

let GRID_WIDTH;
let GRID_HEIGHT;

self.onmessage = function (event) {
  particles = event.data.particles;
	canvasWidth = event.data.canvasDimen.width;
	canvasHeight = event.data.canvasDimen.height;
	GRID_WIDTH = event.data.gridDimen.width;
	GRID_HEIGHT = event.data.gridDimen.height;

	const particlePositionsInGrid = determineParticlePositionsInGrid();

	self.postMessage(particlePositionsInGrid);
};

function determineParticlePositionsInGrid() {
	const particlesByCell = {};

	for (let i = 0; i < particles.length; i++) {
			const particle = particles[i];
			const px = particle.position_current.x;
			const py = particle.position_current.y;

			const gridXIndex = Math.floor(px / GRID_WIDTH);
			const gridYIndex = Math.floor(py / GRID_HEIGHT);
			const key = `${gridXIndex},${gridYIndex}`;

			if (!particlesByCell[key]) particlesByCell[key] = [];
			particlesByCell[key].push(particle);
	}

	return particlesByCell;
}