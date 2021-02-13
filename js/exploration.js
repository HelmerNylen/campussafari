class ExplorationController {
	/** Den aktiva instansen, om sådan finns
	 *  @type ExplorationController */
	static instance = null;
	static PLAYER_INTERACT = Math.max(...Object.values(Direction)) + 1;

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

		this.camMarginX = 4 * 16;
		this.camMarginY = 3 * 16;
		this.camOffsetX = 0;
		this.camOffsetY = 0;
		this.camTracking = null;
		
		this.isPressed = {
			[Direction.North]: false,
			[Direction.South]: false,
			[Direction.West]: false,
			[Direction.East]: false,
			[ExplorationController.PLAYER_INTERACT]: false
		};
		this.lastPressed = null;
		this.pressDuration = 0;
		document.body.addEventListener('keydown', e => {
			let action;
			switch (e.code) {
				case 'KeyW':
				case 'ArrowUp':
					action = Direction.North;
					break;
				case 'KeyS':
				case 'ArrowDown':
					action = Direction.South;
					break;
				case 'KeyA':
				case 'ArrowLeft':
					action = Direction.West;
					break;
				case 'KeyD':
				case 'ArrowRight':
					action = Direction.East;
					break;
				case 'Space':
					action = ExplorationController.PLAYER_INTERACT;
					break;
				default:
					return true;
			}

			// Ignorera att flera event firas medan en knapp är nedtryckt
			if (action !== null && !this.isPressed[action]) {
				this.lastPressed = action;
				this.pressDuration = 0;
				this.isPressed[this.lastPressed] = true;
			}
			e.preventDefault();
		});

		document.body.addEventListener('keyup', e => {
			let action;
			switch (e.code) {
				case 'KeyW':
				case 'ArrowUp':
					action = Direction.North;
					break;
				case 'KeyS':
				case 'ArrowDown':
					action = Direction.South;
					break;
				case 'KeyA':
				case 'ArrowLeft':
					action = Direction.West;
					break;
				case 'KeyD':
				case 'ArrowRight':
					action = Direction.East;
					break;
				case 'Space':
					action = ExplorationController.PLAYER_INTERACT;
					break;
				default:
					return true;
			}

			// "Kom ihåg" senaste knapptryckningen när i en situation
			// när en knapp hålls ner konstant och en annan trycks kort samtidigt
			this.isPressed[action] = false;
			if (this.lastPressed === action) {
				this.lastPressed = null;
				this.pressDuration = 0;

				for (const d of Object.keys(this.isPressed)) {
					// Återaktivera inte interaktionstangenten
					if (this.isPressed[d] && d !== ExplorationController.PLAYER_INTERACT) {
						// Alla keys omvandlas till strings, så omvandla tillbaka
						this.lastPressed = d * 1;
						break;
					}
				}
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

	playDialogue(dialogue) {
		// Det ska väl till nån snygg UI-lösning på detta, ja
		for (const line of dialogue)
			alert(line);
		
		// alert() blockar keyup så för att inte skicka \inf dialoger får vi göra detta tills ett annat dialogsystem existerar
		this.isPressed[ExplorationController.PLAYER_INTERACT] = false;
		if (this.lastPressed === ExplorationController.PLAYER_INTERACT) {
			this.lastPressed = null;
			this.pressDuration = 0;
		}
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
		this.camTracking = this.entities.find(e => e.movement.type === MovementType.Player);
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
				entity.update(delta, this.lastPressed);

			// Update camera position
			if (this.camTracking) {
				const x = this.camTracking.x * this.cellsize;
				const y = this.camTracking.y * this.cellsize;
				if (x - this.camOffsetX < this.camMarginX)
					this.camOffsetX = x - this.camMarginX;
				else if (this.camOffsetX + this.canvas.width - (x + this.cellsize) < this.camMarginX)
					this.camOffsetX = x + this.cellsize + this.camMarginX - this.canvas.width;
				if (y - this.camOffsetY < this.camMarginY)
					this.camOffsetY = y - this.camMarginY;
				else if (this.camOffsetY + this.canvas.height - (y + this.cellsize) < this.camMarginY)
					this.camOffsetY = y + this.cellsize + this.camMarginY - this.canvas.height;
			}

			// Draw background
			const ctx = this.canvas.getContext('2d');
			ctx.fillStyle = "black";
			ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
			ctx.drawImage(this.terrainImage, -this.camOffsetX, -this.camOffsetY);

			// Draw entities
			for (const entity of this.entities)
				if (!entity.isInvisible)
					ctx.drawImage(
						entity.currentSprite,
						this.cellsize * entity.x - this.camOffsetX,
						this.cellsize * entity.y - this.camOffsetY
					);
		}

		window.requestAnimationFrame(this.update.bind(this));
		if (this.lastPressed !== null)
			this.pressDuration += delta;
	}
}