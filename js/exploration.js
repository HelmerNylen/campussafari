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
		this.adjacentLevels = null;

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

		// Tillsvidare
		document.getElementById("saveButton").addEventListener("click", e => {
			this.saveState();
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
		if (!Number.isSafeInteger(x) || x < 0 || x >= this.areasWidth
				|| !Number.isSafeInteger(y) || y < 0 || y >= this.areasHeight)
			return null;

		return this.areas[y * this.areasWidth + x];
	}

	setAreaAt(x, y, flag, set) {
		if (!Number.isSafeInteger(x) || x < 0 || x >= this.areasWidth
				|| !Number.isSafeInteger(y) || y < 0 || y >= this.areasHeight)
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

	async loadLevel(level, playerEntity = null, playerState = null) {
		this.loadingMessage = `Loading level: ${level}`;
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
		this.loadingMessage = "Drawing terrain";
		this.terrainImage = await Level.createTerrain(json);
		this.cellsize = json.terrain.cellsize;
		this.areas = json.terrain.areaData;
		this.areasWidth = json.terrain.width;
		this.areasHeight = json.terrain.height;
		this.adjacentLevels = json.adjacent;
		this.loadingMessage = "Loading entities";
		this.entities = await Level.createEntities(json);
		
		if (playerEntity === null) {
			const playerInd = this.entities.findIndex(e => e.movement.type === MovementType.Player);
			// If this level defined the player entity, store the definition so we can use it in other levels
			if (playerInd !== -1) {
				playerEntity = this.entities[playerInd];
				const entityDef = json["entities"][playerInd];

				// Keep only relevant tilesets
				entityDef["tilesets"] = [];
				for (let tilesetInd = 0; tilesetInd < json.tilesets.length; tilesetInd++) {
					let isPresent = false;

					if (entityDef.hasOwnProperty("animationSet")) {
						for (const patch of Object.values(entityDef["animationSet"])) {
							if (patch.hasOwnProperty("tileset") && patch.tileset === tilesetInd) {
								isPresent = true;
								// Reassign tileset indices on patches to use the list we are generating
								patch.tileset = entityDef["tilesets"].length;
							}
						}
					}

					if (isPresent)
						entityDef["tilesets"].push(json.tilesets[tilesetInd])
				}

				// Set via playerState when the entity is created
				entityDef.x = null;
				entityDef.y = null;

				window.localStorage.setItem("playerEntityDef", JSON.stringify(entityDef));
			}
			// If no player provided and none found in this level, read entity definition from storage
			else {
				const json = JSON.parse(window.localStorage.getItem("playerEntityDef"));
				const tilesets = await Level.getTilesets(json);
				playerEntity = Entity.createEntity(tilesets, json);
			}
		}
		if (playerState === null)
			playerState = JSON.parse(window.localStorage.getItem("playerState") || null);

		// Place player last, if already defined (else append provided player entity)
		this.entities = this.entities
			.filter(e => e.movement.type !== MovementType.Player)
			.concat([playerEntity]);
		
		// Read positions of entities
		const levelState = JSON.parse(window.localStorage.getItem("levelState") || "{}");
		if (levelState[this.currentLevel])
			Entity.setStates(this.entities, levelState[this.currentLevel].concat([playerState]));
		else if (playerState)
			playerEntity.setState(playerState);

		this.centerCameraOn(playerEntity);
		this.camTracking = playerEntity;

		this.loadingMessage = null;
	}

	saveState() {
		let levelState = JSON.parse(window.localStorage.getItem("levelState") || "{}");
		// Player state handled separately
		levelState[this.currentLevel] = this.entities
			.filter(e => e.movement.type !== MovementType.Player)
			.map(e => e.getState());
		window.localStorage.setItem("levelState", JSON.stringify(levelState));
		console.log(`Saved state of ${this.currentLevel}`);
		
		const player = this.entities.find(e => e.movement.type === MovementType.Player);
		window.localStorage.setItem("playerState", JSON.stringify(player.getState()));

		window.localStorage.setItem("currentLevel", JSON.stringify(this.currentLevel));
	}

	unloadLevel() {
		this.saveState();

		this.currentLevel = null;
		this.terrainImage = null;
		this.cellsize = null;
		this.areas = null;
		this.areasWidth = null;
		this.areasHeight = null;
		this.entities = null;
		this.camTracking = null;
		this.adjacentLevels = null;
	}

	changeLevel(destinationInfo) {
		const player = this.camTracking;
		player.moveTo(null, null);

		const playerState = {
			gridX: destinationInfo.x,
			gridY: destinationInfo.y,
			waitTimer: null,
			movementProgress: 0 // Gör att vi promenerar in på rutan vi anländer till
		};
		if ("direction" in destinationInfo) {
			if (typeof destinationInfo.direction === "string")
				playerState.direction = Direction[Object.keys(Direction).find(d => d.toLowerCase() === destinationInfo.direction.toLowerCase())];
			else
				playerState.direction = destinationInfo.direction;
		} else
			playerState.direction = player.direction;

		this.unloadLevel();
		this.loadLevel(destinationInfo.level, player, playerState).then(_ => this.saveState());
	}

	centerCameraOn(entity) {
		this.camOffsetX = Math.round((entity.x + 0.5) * this.cellsize - this.canvas.width / 2);
		this.camOffsetY = Math.round((entity.y + 0.5) * this.cellsize - this.canvas.height / 2);
	}

	keepInFrame(entity) {
		const x = entity.x * this.cellsize;
		const y = entity.y * this.cellsize;
		if (x - this.camOffsetX < this.camMarginX)
			this.camOffsetX = x - this.camMarginX;
		else if (this.camOffsetX + this.canvas.width - (x + this.cellsize) < this.camMarginX)
			this.camOffsetX = x + this.cellsize + this.camMarginX - this.canvas.width;
		if (y - this.camOffsetY < this.camMarginY)
			this.camOffsetY = y - this.camMarginY;
		else if (this.camOffsetY + this.canvas.height - (y + this.cellsize) < this.camMarginY)
			this.camOffsetY = y + this.cellsize + this.camMarginY - this.canvas.height;
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
				this.keepInFrame(this.camTracking);

				// Change level if a portal is entered
				if (this.camTracking.movementProgress === 1) {
					const a = this.areaAt(this.camTracking.gridX, this.camTracking.gridY);
					if (a & Area.Portal) {
						console.log("Check passed");
						// Compute the portal destination (index stored in bits 8-15)
						const portalTo = (a & Area.Portal) >> Math.log2(Area.Portal & -Area.Portal);
						// Actual next level name and position is stored in a level's "adjacent" field (1-indexed)
						this.changeLevel(this.adjacentLevels[portalTo - 1]);
						
						window.requestAnimationFrame(this.update.bind(this));
						return;
					}
				}
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


		} else if (this.loadingMessage !== null) {
			const ctx = this.canvas.getContext('2d');
			ctx.fillStyle = "black";
			ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
			ctx.fillStyle = "gray";
			ctx.textAlign = "center";
			ctx.fillText(this.loadingMessage, this.canvas.width / 2, this.canvas.height / 2, this.canvas.width);
		}

		window.requestAnimationFrame(this.update.bind(this));
		if (this.lastPressed !== null)
			this.pressDuration += delta;
	}
}