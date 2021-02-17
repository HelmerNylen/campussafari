const mainControls = ['KeyW', 'KeyS', 'KeyA', 'KeyD', 'Space'];
const tilesetControls = ['KeyI', 'KeyK', 'KeyJ', 'KeyL'];
const patchControls = ['ArrowLeft', 'ArrowRight'];

class Editor {
	static get tilesetFiles() {
		return [
			"exterior-32x32-town-tileset.png",
			"lpc-city-inside.png",
			"lpc-city-outside.png",
			"lpc-house-interior-and-decorations.png",
			"roguelike-modern-city-pack.png",
			"rpg-urban-pack.png"
		];
	}

	constructor(tilesets, tilesetCanvas, tilesetName, tilesizeInput, separationInput, patchCanvas, patchWidthInput, patchScaleInput, levelCanvas) {
		this.tilesets = tilesets;
		this.tilesetInd = 0;
		this.tilesetCanvas = tilesetCanvas;
		this.tilesetBackground = "clear";
		this.tilesetName = tilesetName;
		this.tilesizeInput = tilesizeInput;
		this.separationInput = separationInput;
		this.patchCanvas = patchCanvas;
		this.patchWidthInput = patchWidthInput;
		this.patchScaleInput = patchScaleInput;
		this.levelCanvas = levelCanvas;
		
		let nullPatch = document.createElement('div');
		nullPatch.textContent = "null";
		nullPatch.id = "nullPatch";
		nullPatch.classList.add("patch", "selected");
		document.getElementById("patchesSelection").appendChild(nullPatch);

		this.patches = [{
			null: true,
			canvas: nullPatch
		}];
		this.selectedPatch = 0;
		nullPatch.addEventListener('click', _ => {
			this.selectPatch(0);
			return true;
		});

		this.terrain = null;
		this.terrainCursorX = 0;
		this.terrainCursorY = 0;
		this.terrainOffsetX = 0;
		this.terrainOffsetY = 0;
		this.terrainRendered = null;
		
		this.clickX = null;
		this.clickY = null;
		
		this.resetMark();
		this.viewTileset();
		this.updateFields();
	}

	get currentTileset() {
		return this.tilesets[this.tilesetInd];
	}

	get currentMark() {
		if (this.marks.length > 0)
			return this.marks[this.marks.length - 1];
		else
			return null;
	}

	get currentPatch() {
		return this.patches[this.selectedPatch];
	}

	viewTileset() {
		const tileset = this.currentTileset;
		this.tilesetCanvas.width = tileset.image.width;
		this.tilesetCanvas.height = tileset.image.height;

		let ctx = this.tilesetCanvas.getContext('2d');
		if (this.tilesetBackground === "clear")
			ctx.clearRect(0, 0, this.tilesetCanvas.width, this.tilesetCanvas.height);
		else {
			ctx.fillStyle = this.tilesetBackground;
			ctx.fillRect(0, 0, this.tilesetCanvas.width, this.tilesetCanvas.height);
		}
		ctx.drawImage(tileset.image, 0, 0);
		ctx.strokeStyle = "red";
		for (let mark of this.marks) {
			ctx.strokeRect(
				tileset.indexToPixelX(mark.x),
				tileset.indexToPixelY(mark.y),
				tileset.indexToPixelX(mark.x + this.markWidth) - tileset.indexToPixelX(mark.x),
				tileset.indexToPixelY(mark.y + this.markHeight) - tileset.indexToPixelY(mark.y)
			);
		}

		this.viewPatch();
	}

	viewPatch() {
		let canvas = Level.makePatch(this.currentTileset, {
			x: this.marks.map(m => m.x),
			y: this.marks.map(m => m.y),
			width: this.markWidth,
			height: this.markHeight,
			rowLength: this.patchWidthInput.value * 1,
			scale: this.patchScaleInput.value * 1
		});
		this.patchCanvas.width = canvas.width;
		this.patchCanvas.height = canvas.height;
		let ctx = this.patchCanvas.getContext('2d');
		ctx.clearRect(0, 0, this.patchCanvas.width, this.patchCanvas.height);
		ctx.drawImage(canvas, 0, 0);
	}

	changeTileset(prev) {
		this.tilesetInd = (this.tilesetInd + this.tilesets.length + (prev ? -1 : 1)) % this.tilesets.length;
		this.resetMark();
		this.viewTileset();
		this.updateFields();
	}

	changeTilesize(value) {
		this.currentTileset.tilesizeX = value;
		this.currentTileset.tilesizeY = value;
		this.viewTileset();
		this.updatePatches();
	}

	changeSeparation(value) {
		this.currentTileset.sepX = value;
		this.currentTileset.sepY = value;
		this.viewTileset();
		this.updatePatches();
	}

	updateFields() {
		this.tilesetName.textContent = Editor.tilesetFiles[this.tilesetInd];
		this.tilesizeInput.value = this.currentTileset.tilesizeX;
		this.separationInput.value = this.currentTileset.sepX;
	}

	resetMark() {
		this.marks = [{
			x: 0,
			y: 0
		}];
		this.markWidth = 1;
		this.markHeight = 1;
		this.patchWidthInput.value = 1;
		this.patchWidthInput.max = 1;
	}

	updatePatches() {
		let anyChanged = false;
		this.patches.forEach(p => {
			if (p.tileset === this.currentTileset) {
				let c = Level.makePatch(p.tileset, p);
				p.canvas.width = c.width;
				p.canvas.height = c.height;
				let ctx = p.canvas.getContext('2d');
				ctx.clearRect(0, 0, p.canvas.width, p.canvas.height);
				ctx.drawImage(c, 0, 0);
				anyChanged = true;
			}
		});
		if (anyChanged) {
			this.updateTerrainImage();
			this.drawTerrain();
		}
	}

	getPatch(_patch) {
		let patch = _patch || {
			tileset: this.currentTileset,
			x: this.marks.map(m => m.x),
			y: this.marks.map(m => m.y),
			width: this.markWidth,
			height: this.markHeight,
			rowLength: this.patchWidthInput.value * 1,
			scale: this.patchScaleInput.value * 1
		};
		let canvas = Level.makePatch(patch.tileset, patch);
		canvas.classList.add("patch");
		document.getElementById("patchesSelection").appendChild(canvas);
		patch.canvas = canvas;

		this.patches.push(patch);
		patch.canvas.addEventListener('click', _ => {
			this.selectPatch(this.patches.findIndex(p => p === patch));
			return true;
		});
	}

	selectPatch(patchInd) {
		this.currentPatch.canvas.classList.remove("selected");
		this.selectedPatch = patchInd;
		this.currentPatch.canvas.classList.add("selected");
	}

	deletePatch() {
		if (this.selectedPatch === 0) {
			console.log("Cannot remove the null patch");
			return;
		}
		const unused = this.terrain === null || !this.terrain.imageData.some(
			d => d instanceof Array ? d.some(dd => dd === this.selectedPatch) : d === this.selectedPatch
		);
		if (unused || confirm("This patch is used in the current terrain. Do you still want to remove it?")) {
			if (this.terrain !== null) {
				// Gå igenom terrängdatan och ersätt den borttagna patchen med nullpatchen
				// I fallet med flera patches på varandra raderas de översta helt om de är av typen som nu tas bort
				// Korrigera också indexet på övriga patches
				for (let i = 0; i < this.terrain.imageData.length; i++) {
					if (this.terrain.imageData[i] instanceof Array) {
						for (let j = this.terrain.imageData[i].length - 1; j >= 0; j++) {
							if (this.terrain.imageData[i][j] === this.selectedPatch) {
								if (j === this.terrain.imageData[i][j].length - 1)
									this.terrain.imageData[i].splice(j, 1);
								else
									this.terrain.imageData[i][j] = 0;
							} else if (this.terrain.imageData[i][j] > this.selectedPatch)
								this.terrain.imageData[i][j]--;
						}
						if (this.terrain.imageData[i].length === 0)
							this.terrain.imageData[i] = 0;
						else if (this.terrain.imageData[i].length === 1)
							this.terrain.imageData[i] = this.terrain.imageData[i][0];
					} else {
						if (this.terrain.imageData[i] > this.selectedPatch)
							this.terrain.imageData[i]--;
						else if (this.terrain.imageData[i] === this.selectedPatch)
							this.terrain.imageData[i] = 0;
					}
				}
			}
			this.currentPatch.canvas.remove();
			this.patches.splice(this.selectedPatch, 1);
			this.selectedPatch = this.selectedPatch - 1;
			this.currentPatch.canvas.classList.add("selected");
			if (!unused) {
				this.updateTerrainImage();
				this.drawTerrain();
			}
		}
	}

	updateTerrainSize(cellsize, width, height, nocopy) {
		if (cellsize <= 0 || width <= 0 || height <= 0) {
			alert("cellsize, width and height must all be > 0");
			return;
		}

		let oldTerrain = nocopy ? null : this.terrain;
		this.terrain = {
			cellsize: cellsize,
			width: width,
			height: height,
			imageData: new Array(width * height).fill(0)
		};
		if (oldTerrain !== null) {
			for (let j = 0; j < oldTerrain.height && j < this.terrain.height; j++) {
				for (let i = 0; i < oldTerrain.width && i < this.terrain.width; i++) {
					if (oldTerrain.imageData[j * oldTerrain.width + i] !== 0)
						this.terrain.imageData[j * this.terrain.width + i] = oldTerrain.imageData[j * oldTerrain.width + i];
				}
			}
		}
		this.terrainCursorX = Math.min(this.terrain.width - 1, this.terrainCursorX);
		this.terrainCursorY = Math.min(this.terrain.height - 1, this.terrainCursorY);
		this.updateTerrainImage();
		this.drawTerrain();
	}

	updateTerrainImage() {
		let t = {
			cellsize: this.terrain.cellsize,
			width: this.terrain.width,
			height: this.terrain.height,
			imageData: this.terrain.imageData,
			patches: this.patches.slice(1).map(p => ({
				tileset: this.tilesets.findIndex(t => t === p.tileset),
				x: p.x,
				y: p.y,
				width: p.width,
				height: p.height,
				rowLength: p.rowLength,
				scale: p.scale
			}))
		};
		this.terrainRendered = Level.drawTerrain(this.tilesets, t);
	}

	drawTerrain() {
		if (this.terrainRendered === null)
			this.updateTerrainImage();
		
		let ctx = this.levelCanvas.getContext('2d');
		ctx.clearRect(0, 0, this.levelCanvas.width, this.levelCanvas.height);
		const cs = this.terrain.cellsize;
		ctx.drawImage(this.terrainRendered, this.terrainOffsetX * cs, this.terrainOffsetY * cs);
		ctx.strokeStyle = 'red';
		ctx.strokeRect(
			(this.terrainOffsetX + this.terrainCursorX) * cs,
			(this.terrainOffsetY + this.terrainCursorY) * cs,
			cs + 1,
			cs + 1
		);
	}

	setTerrainPatch(add) {
		if (this.terrain === null) {
			alert("Create a terrain first");
			return false;
		}
		const i = this.terrainCursorY * this.terrain.width + this.terrainCursorX;
		if (add) {
			if (this.terrain.imageData[i] instanceof Array)
				this.terrain.imageData[i].push(this.selectedPatch);
			else
				this.terrain.imageData[i] = [this.terrain.imageData[i], this.selectedPatch];
		} else
			this.terrain.imageData[i] = this.selectedPatch;
		
		return true;
	}

	hover(e) {
		if (!this.terrain)
			return;
		let rect = this.levelCanvas.getBoundingClientRect();
		let x = Math.floor((e.clientX - rect.left) / this.terrain.cellsize);
		let y = Math.floor((e.clientY - rect.top) / this.terrain.cellsize);

		if (x < 0 || y < 0 || x >= this.terrain.width || y >= this.terrain.height)
			return;

		if (x !== this.terrainCursorX || y !== this.terrainCursorY) {
			this.terrainCursorX = x;
			this.terrainCursorY = y;
			this.drawTerrain();
		}
	}

	importLevel(file) {
		const reader = new FileReader();
		reader.onload = () => {
			let json = JSON.parse(reader.result);
			this.updateTerrainSize(
				json.terrain.cellsize,
				json.terrain.width,
				json.terrain.height,
				true
			);
			// Funkar inte om man har flera tilesets från samma url men så illa hoppas jag inte det blir
			json.tilesets.forEach(ts => {
				const tileset = this.tilesets.find(_ts => _ts.image.src.endsWith(ts.file));
				tileset.tilesizeX = ts["tilesizeX"] || ts["tilesize"];
				tileset.tilesizeY = ts["tilesizeY"] || ts["tilesize"];
				tileset.sepX = ts['separationX'] || ts['separation'] || 0;
				tileset.sepY = ts['separationY'] || ts['separation'] || 0;
			});
			this.selectPatch(0);
			json.terrain.patches.forEach(p => {
				p.tileset = this.tilesets.find(_ts => _ts.image.src.endsWith(json.tilesets[p.tileset].file));
				this.getPatch(p);
			});
			this.terrain.imageData = json.terrain.imageData;
			this.updateTerrainImage();
			this.drawTerrain();
		};
		reader.readAsText(file, "UTF-8");
	}

	exportLevel(compressionLevel = 1) {
		let obj = {
			tilesets: this.tilesets.map((ts, i) => ({
				file: Editor.tilesetFiles[i],
				tilesize: ts.tilesizeX,
				separation: ts.sepX
			})),
			terrain: {
				cellsize: this.terrain.cellsize,
				width: this.terrain.width,
				height: this.terrain.height,
				patches: this.patches.slice(1).map(p => ({
					tileset: this.tilesets.findIndex(t => t === p.tileset),
					x: p.x,
					y: p.y,
					width: p.width,
					height: p.height,
					rowLength: p.rowLength,
					scale: p.scale
				})),
				imageData: this.terrain.imageData.filter(_ => true)
			},
			entities: [],
			adjacent: []
		};

		// Remove unused patches
		if (compressionLevel >= 2) {
			let patchesUsed = [];
			for (let patchInd = 0; patchInd < obj.terrain.patches.length; patchInd++) {
				let isPresent = false;
				for (let imageInd = 0; imageInd < obj.terrain.imageData.length; imageInd++) {
					if (obj.terrain.imageData[imageInd] === patchInd + 1) {
						isPresent = true;
						obj.terrain.imageData[imageInd] = patchesUsed.length + 1;
					}
				}
				if (isPresent)
					patchesUsed.push(obj.terrain.patches[patchInd]);
			}

			obj.terrain.patches = patchesUsed;
		}

		// Remove data with implicit defaults from patches
		if (compressionLevel >= 1) {
			obj.terrain.patches = obj.terrain.patches.map(patch => {
				let p = {
					tileset: patch.tileset,
					x: patch.x.length > 1 ? patch.x : patch.x[0],
					y: patch.y.length > 1 ? patch.y : patch.y[0]
				};
				if (patch.width !== 1 || patch.height !== 1) {
					p.width = patch.width;
					p.height = patch.height;
				}
				if (patch.x.length > 1)
					p.rowLength = patch.rowLength;
				if (patch.scale !== 100)
					p.scale = patch.scale;
				
				return p;
			});
		}

		// Keep only relevant tilesets
		if (compressionLevel >= 1) {
			let tilesetsUsed = [];
			for (let tilesetInd = 0; tilesetInd < obj.tilesets.length; tilesetInd++) {
				let isPresent = false;

				for (const patch of obj.terrain.patches) {
					if (patch.tileset === tilesetInd) {
						isPresent = true;
						// Reassign tileset indices on patches to use the list we are generating
						patch.tileset = tilesetsUsed.length;
					}
				}

				for (const entity of obj.entities) {
					if (entity.hasOwnProperty("animationSet")) {
						for (const patch of Object.values(entity["animationSet"])) {
							if (patch.hasOwnProperty("tileset") && patch.tileset === tilesetInd) {
								isPresent = true;
								patch.tileset = tilesetsUsed.length;
							}
						}
					}
				}

				if (isPresent)
					tilesetsUsed.push(obj.tilesets[tilesetInd])
			}

			obj.tilesets = tilesetsUsed;
		}
		
		let levelData = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(obj));
		let a = document.createElement('a');
		a.href = levelData;
		a.download = "level.json";
		a.click();
	}

	static async setupEditor() {
		let tilesets = (await loadResources(Editor.tilesetFiles.map(f => "tilesets/" + f))).map(i => new Tileset(i, 32));
		let tilesetCanvas = document.getElementById("tileset");
		let patchCanvas = document.getElementById("patch");
		let levelCanvas = document.getElementById("level");

		// Tileset parameters
		let tilesetName = document.getElementById("tilesetName");
		let tilesizeInput = document.getElementById("tilesetTilesize");
		let separationInput = document.getElementById("tilesetSeparation");
		// Patch parameters
		let patchWidthInput = document.getElementById("patchWidth");
		let patchScaleInput = document.getElementById("patchScale");
		// Level parameters
		let levelCellsizeInput = document.getElementById("levelCellsize");
		let levelWidthInput = document.getElementById("levelWidth");
		let levelHeightInput = document.getElementById("levelHeight");

		let editor = new Editor(tilesets, tilesetCanvas, tilesetName, tilesizeInput, separationInput, patchCanvas, patchWidthInput, patchScaleInput, levelCanvas);
		tilesizeInput.addEventListener('change', () => editor.changeTilesize(1 * tilesizeInput.value));
		separationInput.addEventListener('change', () => editor.changeSeparation(1 * separationInput.value));
		patchWidthInput.addEventListener('change', () => editor.viewPatch());
		patchScaleInput.addEventListener('change', () => editor.viewPatch());

		levelCanvas.addEventListener('mousemove', e => editor.hover(e));
		levelCanvas.addEventListener('mousedown', e => {
			if (editor.setTerrainPatch(e.shiftKey)) {
				editor.updateTerrainImage();
				editor.drawTerrain();
			}
			e.stopPropagation();
			e.preventDefault();
		});

		// Selection of tiles
		tilesetCanvas.addEventListener('mousedown', e => {
			let rect = tilesetCanvas.getBoundingClientRect();
			editor.clickX = e.clientX - rect.left;
			editor.clickY = e.clientY - rect.top;
			if (e.shiftKey)
				tilesetCanvas.dispatchEvent(new MouseEvent('mouseup'));
			else
				editor.marks = [];
		});
		tilesetCanvas.addEventListener('mouseup', e => {
			if (editor.clickX === null)
				return;
			
			let x2, y2;
			if (!editor.currentMark) {
				let rect = tilesetCanvas.getBoundingClientRect();
				x2 = e.clientX - rect.left;
				y2 = e.clientY - rect.top;
				if (x2 < editor.clickX)
					[x2, editor.clickX] = [editor.clickX, x2];
				if (y2 < editor.clickY)
					[y2, editor.clickY] = [editor.clickY, y2];
			}
			let mark = {
				x: Math.floor(editor.currentTileset.pixelToIndexX(editor.clickX)),
				y: Math.floor(editor.currentTileset.pixelToIndexY(editor.clickY))
			};
			if (!editor.currentMark) {
				let x = Math.ceil(editor.currentTileset.pixelToIndexY(x2));
				let y = Math.ceil(editor.currentTileset.pixelToIndexY(y2));
				editor.markWidth = Math.max(1, x - mark.x);
				editor.markHeight = Math.max(1, y - mark.y);
			}
			editor.marks.push(mark);
			editor.clickX = null;
			editor.clickY = null;
			patchWidthInput.max = editor.marks.length;
			patchWidthInput.value = Math.min(patchWidthInput.max, patchWidthInput.value);
			
			editor.viewTileset();
		});
		document.body.addEventListener('keydown', e => {
			if (editor.clickX !== null)
				return true;
			if (e.shiftKey) {
				switch (e.code) {
					case tilesetControls[0]:
						editor.markHeight = Math.max(1, editor.markHeight - 1);
						break;
					case tilesetControls[1]:
						editor.markHeight++;
						break;
					case tilesetControls[2]:
						editor.markWidth = Math.max(1, editor.markWidth - 1);
						break;
					case tilesetControls[3]:
						editor.markWidth++;
						break;
					default:
						return true;
				}
			} else {
				switch (e.code) {
					case tilesetControls[0]:
						editor.currentMark.y--;
						break;
					case tilesetControls[1]:
						editor.currentMark.y++;
						break;
					case tilesetControls[2]:
						editor.currentMark.x--;
						break;
					case tilesetControls[3]:
						editor.currentMark.x++;
						break;

					default:
						return true;
				}
			}
			editor.viewTileset();
			e.preventDefault();
		});
		document.body.addEventListener('keydown', e => {
			let patchInd = null;
			switch (e.code) {
				case patchControls[0]:
					patchInd = Math.max(0, editor.selectedPatch - 1);
					break;
				case patchControls[1]:
					patchInd = Math.min(editor.patches.length - 1, editor.selectedPatch + 1);
					break;
				default:
					return true;
			}
			editor.selectPatch(patchInd);
			e.preventDefault();
		});
		document.body.addEventListener('keydown', e => {
			if (editor.terrain === null)
				return true;
			if (e.shiftKey) {
				switch(e.code) {
					case mainControls[0]:
						editor.terrainOffsetY--;
						break;
					case mainControls[1]:
						editor.terrainOffsetY++;
						break;
					case mainControls[2]:
						editor.terrainOffsetX--;
						break;
					case mainControls[3]:
						editor.terrainOffsetX++;
						break;
					case mainControls[4]:
						editor.setTerrainPatch(true);
						editor.updateTerrainImage();
						break;
					default:
						return true;
				}
			} else {
				switch (e.code) {
					case mainControls[0]:
						editor.terrainCursorY = Math.max(0, editor.terrainCursorY - 1);
						break;
					case mainControls[1]:
						editor.terrainCursorY = Math.min(editor.terrain.height - 1, editor.terrainCursorY + 1);
						break;
					case mainControls[2]:
						editor.terrainCursorX = Math.max(0, editor.terrainCursorX - 1);
						break;
					case mainControls[3]:
						editor.terrainCursorX = Math.min(editor.terrain.width - 1, editor.terrainCursorX + 1);
						break;
					case mainControls[4]:
						editor.setTerrainPatch();
						editor.updateTerrainImage();
						break;
					default:
						return true;
				}
			}
			editor.drawTerrain();
			e.preventDefault();
		});

		// Buttons to switch tileset
		let nextTilesetButton = document.getElementById("tilesetNext");
		nextTilesetButton.addEventListener('click', () => editor.changeTileset(false));

		let prevTilesetButton = document.getElementById("tilesetPrev");
		prevTilesetButton.addEventListener('click', () => editor.changeTileset(true));

		// Button to change tileset background
		const nextCol = {
			"clear": "black",
			"black": "magenta",
			"magenta": "clear"
		};
		const capFirst = s => s[0].toUpperCase() + s.slice(1);
		let backgroundButton = document.getElementById("tilesetChangeBackground");
		backgroundButton.textContent = capFirst(nextCol[editor.tilesetBackground]);
		backgroundButton.addEventListener('click', () => {
			editor.tilesetBackground = nextCol[editor.tilesetBackground];
			backgroundButton.textContent = capFirst(nextCol[editor.tilesetBackground]);
			editor.viewTileset();
		});

		// Button to get a patch
		let getPatchButton = document.getElementById("getPatch");
		getPatchButton.addEventListener('click', () => editor.getPatch());
		// Button to delete a patch
		let deletePatch = document.getElementById("deletePatch");
		deletePatch.addEventListener('click', () => editor.deletePatch());

		// Button to update the size of the level
		let levelCreateButton = document.getElementById("levelCreate");
		levelCreateButton.addEventListener('click', () => {
			editor.updateTerrainSize(
				levelCellsizeInput.value * 1,
				levelWidthInput.value * 1,
				levelHeightInput.value * 1
			);
		});

		// Level file input
		let levelImportField = document.getElementById("levelImport");
		levelImportField.addEventListener('change', () => editor.importLevel(levelImportField.files[0]));

		// Button to download a level
		let levelExportButton = document.getElementById("levelExport");
		levelExportButton.addEventListener('click', () => editor.exportLevel());

		window.editor = editor;
	}
}