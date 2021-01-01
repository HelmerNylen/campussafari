const tilesetControls = ['i', 'k', 'j', 'l'];

class Editor {
	static get tilesets() {
		return [
			"exterior-32x32-town-tileset.png",
			"lpc-city-inside.png",
			"lpc-city-outside.png",
			"lpc-house-interior-and-decorations.png",
			"roguelike-modern-city-pack.png",
			"rpg-urban-pack.png"
		].map(f => "tilesets/" + f);
	}

	constructor(tilesets, canvas, tilesetName, tilesizeInput, separationInput, patchCanvas, patchWidthInput) {
		this.tilesets = tilesets;
		this.tilesetInd = 0;
		this.tilesetCanvas = canvas;
		this.tilesetBackground = "clear";
		this.tilesetName = tilesetName;
		this.tilesizeInput = tilesizeInput;
		this.separationInput = separationInput;
		this.patchCanvas = patchCanvas;
		this.patchWidthInput = patchWidthInput;
		this.patches = [];
		this.selectedPatch = null;
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
				tileset.indexToPixelX(mark.x + mark.width) - tileset.indexToPixelX(mark.x),
				tileset.indexToPixelY(mark.y + mark.height) - tileset.indexToPixelY(mark.y)
			);
		}

		this.viewPatch();
	}

	viewPatch() {
		let tiles = [];
		for (let mark of this.marks) {
			tiles = tiles.concat(this.currentTileset.tilesMerged(mark.x, mark.y, mark.width, mark.height));
		}
		try {
			let patch = Tileset.mergeArrayOfTiles(tiles, this.patchWidthInput.value * 1);
			this.patchCanvas.width = patch.width;
			this.patchCanvas.height = patch.height;
			let ctx = this.patchCanvas.getContext('2d');
			ctx.clearRect(0, 0, this.patchCanvas.width, this.patchCanvas.height);
			ctx.drawImage(patch, 0, 0);
		} catch (e) {
			console.error(e);
			this.patchCanvas.width = 16;
			this.patchCanvas.height = 16;
			let ctx = this.patchCanvas.getContext('2d');
			ctx.fillStyle = "red";
			ctx.fillRect(0, 0, 16, 16);
		}
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
	}

	changeSeparation(value) {
		this.currentTileset.sepX = value;
		this.currentTileset.sepY = value;
		this.viewTileset();
	}

	updateFields() {
		this.tilesetName.textContent = Editor.tilesets[this.tilesetInd];
		this.tilesizeInput.value = this.currentTileset.tilesizeX;
		this.separationInput.value = this.currentTileset.sepX;
	}

	resetMark() {
		this.marks = [{
			x: 0,
			y: 0,
			width: 1,
			height: 1
		}];
		this.patchWidthInput.value = 1;
		this.patchWidthInput.max = 1;
	}

	getPatch() {
		let patch = document.createElement('canvas');
		patch.width = this.patchCanvas.width;
		patch.height = this.patchCanvas.height;
		patch.getContext('2d').drawImage(this.patchCanvas, 0, 0);
		patch.classList.add("patch");
		document.getElementById("patchesSelection").appendChild(patch);
		this.patches.push(patch);
		if (this.selectedPatch === null)
			this.selectedPatch = 0;
		this.patches[this.selectedPatch].classList.add("selected");
		patch.addEventListener('click', _ => {
			this.patches[this.selectedPatch].classList.remove("selected");
			this.selectedPatch = this.patches.findIndex(p => p === patch);
			this.patches[this.selectedPatch].classList.add("selected");
			return true;
		});
	}

	static async setupEditor() {
		let tilesets = (await loadResources(this.tilesets)).map(i => new Tileset(i, 32));
		let tilesetCanvas = document.getElementById("tileset");
		let patchCanvas = document.getElementById("patch");

		// Tileset parameters
		let tilesetName = document.getElementById("tilesetName");
		let tilesizeInput = document.getElementById("tilesetTilesize");
		let separationInput = document.getElementById("tilesetSeparation");
		// Patch parameters
		let patchWidthInput = document.getElementById("patchWidth");

		let editor = new Editor(tilesets, tilesetCanvas, tilesetName, tilesizeInput, separationInput, patchCanvas, patchWidthInput);
		tilesizeInput.addEventListener('change', () => editor.changeTilesize(1 * tilesizeInput.value));
		separationInput.addEventListener('change', () => editor.changeSeparation(1 * separationInput.value));
		patchWidthInput.addEventListener('change', () => editor.viewPatch());

		// Selection of tiles
		tilesetCanvas.addEventListener('mousedown', e => {
			let rect = tilesetCanvas.getBoundingClientRect();
			if (!e.shiftKey)
				editor.marks = [];
			editor.clickX = e.clientX - rect.left;
			editor.clickY = e.clientY - rect.top;
		});
		tilesetCanvas.addEventListener('mouseup', e => {
			let rect = tilesetCanvas.getBoundingClientRect();
			let x2 = e.clientX - rect.left;
			let y2 = e.clientY - rect.top;
			if (x2 < editor.clickX)
				[x2, editor.clickX] = [editor.clickX, x2];
			if (y2 < editor.clickY)
				[y2, editor.clickY] = [editor.clickY, y2];
			
			let mark = {
				x: Math.floor(editor.currentTileset.pixelToIndexX(editor.clickX)),
				y: Math.floor(editor.currentTileset.pixelToIndexY(editor.clickY))
			}
			let x = Math.ceil(editor.currentTileset.pixelToIndexY(x2));
			let y = Math.ceil(editor.currentTileset.pixelToIndexY(y2));
			mark.width = Math.max(1, x - mark.x),
			mark.height = Math.max(1, y - mark.y)
			editor.clickX = null;
			editor.clickY = null;
			editor.marks.push(mark);
			editor.patchWidthInput.max = editor.marks.length;
			
			editor.viewTileset();
		});
		document.body.addEventListener('keydown', e => {
			if (editor.marks.length > 1 || editor.clickX !== null)
				return true;
			switch (e.key) {
				case tilesetControls[3]:
					editor.currentMark.x++;
					break;
				case tilesetControls[2]:
					editor.currentMark.x--;
					break;
				case tilesetControls[1]:
					editor.currentMark.y++;
					break;
				case tilesetControls[0]:
					editor.currentMark.y--;
					break;
				case tilesetControls[3].toUpperCase():
					editor.currentMark.width++;
					break;
				case tilesetControls[2].toUpperCase():
					editor.currentMark.width = Math.max(1, editor.currentMark.width - 1);
					break;
				case tilesetControls[1].toUpperCase():
					editor.currentMark.height++;
					break;
				case tilesetControls[0].toUpperCase():
					editor.currentMark.height = Math.max(1, editor.currentMark.height - 1);
					break;

				default:
					return true;
			}
			editor.viewTileset();
		})

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
	}
}