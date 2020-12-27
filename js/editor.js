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

	constructor(tilesets, canvas, tilesetName, tilesizeInput, separationInput) {
		this.tilesets = tilesets;
		this.tilesetInd = 0;
		this.tilesetCanvas = canvas;
		this.tilesetBackground = "clear";
		this.tilesetName = tilesetName;
		this.tilesizeInput = tilesizeInput;
		this.separationInput = separationInput;
		this.resetMark();
		this.viewTileset();
		this.updateFields();
	}

	get currentTileset() {
		return this.tilesets[this.tilesetInd];
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
		ctx.strokeRect(
			tileset.indexToPixelX(this.markX),
			tileset.indexToPixelY(this.markY),
			tileset.indexToPixelX(this.markX + this.markWidth) - tileset.indexToPixelX(this.markX),
			tileset.indexToPixelY(this.markY + this.markHeight) - tileset.indexToPixelY(this.markY)
		);
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
		this.markX = 0;
		this.markY = 0;
		this.markWidth = 1;
		this.markHeight = 1;
	}

	getPatch() {
		let patch = {
			x: this.markX,
			y: this.markY
		};
		if (this.markWidth !== 1 || this.markHeight !== 1) {
			patch.width = this.markWidth;
			patch.height = this.markHeight;
		}
		document.body.appendChild(document.createTextNode(" "));
		document.body.appendChild(this.currentTileset.tilesMerged(patch.x, patch.y, patch['width'], patch['height']));
	}

	static async setupEditor(setupButton) {
		let tilesets = (await loadResources(this.tilesets)).map(i => new Tileset(i, 32));
		setupButton.remove();
		let tilesetCanvas = document.createElement('canvas');

		// Tileset parameters
		let tilesetName = document.createTextNode("Tileset name");
		let tilesizeInput = document.createElement('input');
		tilesizeInput.type = "number";
		let separationInput = document.createElement('input');
		separationInput.type = "number";

		let editor = new Editor(tilesets, tilesetCanvas, tilesetName, tilesizeInput, separationInput);
		tilesizeInput.addEventListener('change', () => editor.changeTilesize(1 * tilesizeInput.value));
		separationInput.addEventListener('change', () => editor.changeSeparation(1 * separationInput.value));

		// Selection of tiles
		tilesetCanvas.addEventListener('mousedown', e => {
			let rect = tilesetCanvas.getBoundingClientRect();
			editor.markX = e.clientX - rect.left;
			editor.markY = e.clientY - rect.top;
		});
		tilesetCanvas.addEventListener('mouseup', e => {
			let rect = tilesetCanvas.getBoundingClientRect();
			let x2 = e.clientX - rect.left;
			let y2 = e.clientY - rect.top;
			if (x2 < editor.markX)
				[x2, editor.markX] = [editor.markX, x2];
			if (y2 < editor.markY)
				[y2, editor.markY] = [editor.markY, y2];
			
			editor.markX = Math.floor(editor.currentTileset.pixelToIndexX(editor.markX));
			editor.markY = Math.floor(editor.currentTileset.pixelToIndexY(editor.markY));
			let x = Math.ceil(editor.currentTileset.pixelToIndexY(x2));
			let y = Math.ceil(editor.currentTileset.pixelToIndexY(y2));
			editor.markWidth = Math.max(1, x - editor.markX);
			editor.markHeight = Math.max(1, y - editor.markY);
			
			editor.viewTileset();
		});

		// Buttons to switch tileset
		let nextTilesetButton = document.createElement('button');
		nextTilesetButton.textContent = "Next";
		nextTilesetButton.addEventListener('click', () => editor.changeTileset(false));

		let prevTilesetButton = document.createElement('button');
		prevTilesetButton.textContent = "Previous";
		prevTilesetButton.addEventListener('click', () => editor.changeTileset(true));

		// Button to change tileset background
		let backgroundButton = document.createElement('button');
		backgroundButton.textContent = "Change background";
		backgroundButton.addEventListener('click', () => {
			editor.tilesetBackground = {
				"clear": "black",
				"black": "magenta",
				"magenta": "clear"
			}[editor.tilesetBackground];
			editor.viewTileset();
		});

		// Button to get a patch
		let getPatchButton = document.createElement('button');
		getPatchButton.textContent = "Extract patch";
		getPatchButton.addEventListener('click', () => editor.getPatch());

		for (let item of [
			tilesetName,
			document.createElement('br'),
			prevTilesetButton,
			nextTilesetButton,
			backgroundButton,
			getPatchButton,
			document.createElement('br'),
			document.createTextNode("Tile size (px): "),
			tilesizeInput,
			document.createTextNode("Tile separation (px): "),
			separationInput,
			document.createElement('br'),
			tilesetCanvas,
			document.createElement('br'),
			document.createTextNode('Patches:')
		])
			document.body.appendChild(item);
	}
}