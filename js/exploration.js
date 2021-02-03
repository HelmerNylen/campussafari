class ExplorationController {
	constructor(canvas) {
		this.canvas = canvas;
		this.terrain = null;
		this.cellsize = null;
		this.entities = null;
		this.currentLevel = null;
		this.loadingMessage = null;
	}

	async loadLevel(level) {
		if (typeof level !== "string")
			throw Error("Invalid level: " + level);
		let json;
		try {
			json = (await loadResources(`levels/${level}.json`, JSON))[0];
		} catch (e) {
			console.error("Could not load level: " + level);
			throw e;
		}

		this.currentLevel = level;
		this.terrain = await Level.createTerrain(json);
		this.cellsize = json.terrain.cellsize;
		this.entities = await Level.createEntities(json);
		const ctx = this.canvas.getContext('2d');

		ctx.fillStyle = "black";
		ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
		ctx.drawImage(this.terrain, 0, 0);
		this.entities.forEach(entity => ctx.drawImage(
			entity.currentSprite,
			this.cellsize * entity.x,
			this.cellsize * entity.y
		));
	}
}