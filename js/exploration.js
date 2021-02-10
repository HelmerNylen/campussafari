class ExplorationController {
	/** Den aktiva instansen, om sådan finns
	 *  @type ExplorationController */
	static instance = null;

	constructor(canvas) {
		this.canvas = canvas;
		this.terrainImage = null;
		this.areas = null;
		this.areasWidth = null;
		this.areasHeight = null;
		this.cellsize = null;
		this.entities = null;
		this.currentLevel = null;
		this.loadingMessage = null;

		this.timestampLast = null;
		window.requestAnimationFrame(this.update.bind(this));
		
		this.userinput = null;
		document.body.addEventListener('keydown', e => {
			switch (e.code) {
				case 'KeyW':
				case 'ArrowUp':
					this.userinput = Direction.North;
					break;
				case 'KeyS':
				case 'ArrowDown':
					this.userinput = Direction.South;
					break;
				case 'KeyA':
				case 'ArrowLeft':
					this.userinput = Direction.West;
					break;
				case 'KeyD':
				case 'ArrowRight':
					this.userinput = Direction.East;
					break;
				default:
					return true;
			}
			e.preventDefault();
		});

		ExplorationController.instance = this;
	}

	areaAt(x, y) {
		const a = this.areaAtOrNull(x, y);
		if (a === null)
			throw Error(`Index (${x}, ${y}) out of bounds (0-${this.areasWidth - 1}, 0-${this.areasHeight - 1})`);
		return a;
	}

	areaAtOrNull(x, y) {
		if (x < 0 || x >= this.areasWidth || y < 0 || y >= this.areasHeight)
			return null;

		return this.areas[y * this.areasWidth + x];
	}

	setAreaAt(x, y, flag, set) {
		if (x < 0 || x >= this.areasWidth || y < 0 || y >= this.areasHeight)
			throw Error(`Index (${x}, ${y}) out of bounds (0-${this.areasWidth - 1}, 0-${this.areasHeight - 1})`);
		
		if (set)
			this.areas[y * this.areasWidth + x] |= flag;
		else
			this.areas[y * this.areasWidth + x] &= ~flag;
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
		this.terrainImage = await Level.createTerrain(json);
		this.cellsize = json.terrain.cellsize;
		this.areas = json.terrain.areaData;
		this.areasWidth = json.terrain.width;
		this.areasHeight = json.terrain.height;
		this.entities = await Level.createEntities(json);
	}

	update(timestamp) {
		const delta = timestamp - this.timestampLast;
		this.timestampLast = timestamp;

		// Skip first frame and frames where the player has tabbed out a while
		if (this.timestampLast === null || delta > 1000) {
			window.requestAnimationFrame(this.update.bind(this));
			return;
		}

		if (this.entities !== null && this.terrainImage !== null) {
			// Update entities
			for (const entity of this.entities)
				entity.update(delta, this.userinput);

			// Draw background
			const ctx = this.canvas.getContext('2d');
			ctx.fillStyle = "black";
			ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
			ctx.drawImage(this.terrainImage, 0, 0);

			// Draw entities
			for (const entity of this.entities)
				ctx.drawImage(
					entity.currentSprite,
					this.cellsize * entity.x,
					this.cellsize * entity.y
				);
		}

		window.requestAnimationFrame(this.update.bind(this));
		this.userinput = null;
	}
}