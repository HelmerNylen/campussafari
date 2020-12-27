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

	static viewTileset(canvas, tileset) {
		canvas.width = tileset.image.width;
		canvas.height = tileset.image.height;
		let ctx = canvas.getContext('2d');
		ctx.clearRect(0, 0, canvas.width, canvas.height);
		ctx.drawImage(tileset.image, 0, 0);
		ctx.strokeStyle = "red";
		ctx.strokeRect(
			tileset.indexToPixelX(canvas.markX),
			tileset.indexToPixelY(canvas.markY),
			tileset.indexToPixelX(canvas.markX + canvas.markWidth) - tileset.indexToPixelX(canvas.markX),
			tileset.indexToPixelY(canvas.markY + canvas.markHeight) - tileset.indexToPixelY(canvas.markY)
		);
	}

	static resetMark(canvas) {
		canvas.markX = 0;
		canvas.markY = 0;
		canvas.markWidth = 1;
		canvas.markHeight = 1;
	}

	static async setupEditor(setupButton) {
		const tilesets = (await loadResources(this.tilesets)).map(i => new Tileset(i, 32));
		setupButton.remove();

		let tilesetPreview = document.createElement('canvas');
		tilesetPreview.tilesetInd = 0;
		this.resetMark(tilesetPreview);
		this.viewTileset(tilesetPreview, tilesets[tilesetPreview.tilesetInd]);

		let tilesetName = document.createTextNode(this.tilesets[tilesetPreview.tilesetInd]);
		let tilesize = document.createElement('input');
		tilesize.type = "number";
		tilesize.addEventListener('change', e => {
			tilesets[tilesetPreview.tilesetInd].tilesizeX = 1 * tilesize.value;
			tilesets[tilesetPreview.tilesetInd].tilesizeY = 1 * tilesize.value;
			this.viewTileset(tilesetPreview, tilesets[tilesetPreview.tilesetInd]);
		});
		let separation = document.createElement('input');
		separation.type = "number";
		separation.addEventListener('change', e => {
			tilesets[tilesetPreview.tilesetInd].sepX = 1 * separation.value;
			tilesets[tilesetPreview.tilesetInd].sepY = 1 * separation.value;
			this.viewTileset(tilesetPreview, tilesets[tilesetPreview.tilesetInd]);
		});

		const updateFields = () => {
			tilesetName.textContent = this.tilesets[tilesetPreview.tilesetInd];
			tilesize.value = tilesets[tilesetPreview.tilesetInd].tilesizeX;
			separation.value = tilesets[tilesetPreview.tilesetInd].sepX;
		};
		updateFields();

		// Selection of tiles
		tilesetPreview.addEventListener('mousedown', e => {
			let rect = tilesetPreview.getBoundingClientRect();
			tilesetPreview.markX = e.clientX - rect.left;
			tilesetPreview.markY = e.clientY - rect.top;
		});
		tilesetPreview.addEventListener('mouseup', e => {
			let rect = tilesetPreview.getBoundingClientRect();
			let x2 = e.clientX - rect.left;
			let y2 = e.clientY - rect.top;
			if (x2 < tilesetPreview.markX)
				[x2, tilesetPreview.markX] = [tilesetPreview.markX, x2];
			if (y2 < tilesetPreview.markY)
				[y2, tilesetPreview.markY] = [tilesetPreview.markY, y2];
			
			tilesetPreview.markX = Math.floor(tilesets[tilesetPreview.tilesetInd].pixelToIndexX(tilesetPreview.markX));
			tilesetPreview.markY = Math.floor(tilesets[tilesetPreview.tilesetInd].pixelToIndexY(tilesetPreview.markY));
			let x = Math.ceil(tilesets[tilesetPreview.tilesetInd].pixelToIndexY(x2));
			let y = Math.ceil(tilesets[tilesetPreview.tilesetInd].pixelToIndexY(y2));
			tilesetPreview.markWidth = Math.max(1, x - tilesetPreview.markX);
			tilesetPreview.markHeight = Math.max(1, y - tilesetPreview.markY);
			
			this.viewTileset(tilesetPreview, tilesets[tilesetPreview.tilesetInd]);
		});

		// Buttons to switch tileset
		let nextTilesetButton = document.createElement('button');
		nextTilesetButton.textContent = "Next";
		nextTilesetButton.addEventListener('click', e => {
			tilesetPreview.tilesetInd = (tilesetPreview.tilesetInd + 1) % tilesets.length;
			this.resetMark(tilesetPreview);
			this.viewTileset(tilesetPreview, tilesets[tilesetPreview.tilesetInd]);
			updateFields();
		});

		let prevTilesetButton = document.createElement('button');
		prevTilesetButton.textContent = "Previous";
		prevTilesetButton.addEventListener('click', e => {
			tilesetPreview.tilesetInd = (tilesetPreview.tilesetInd + tilesets.length - 1) % tilesets.length;
			this.resetMark(tilesetPreview);
			this.viewTileset(tilesetPreview, tilesets[tilesetPreview.tilesetInd]);
			updateFields();
		});

		document.body.appendChild(tilesetName);

		document.body.appendChild(document.createElement('br'));
		document.body.appendChild(nextTilesetButton);
		document.body.appendChild(prevTilesetButton);
		
		document.body.appendChild(document.createElement('br'));
		document.body.appendChild(document.createTextNode("Tile size (px): "));
		document.body.appendChild(tilesize);
		document.body.appendChild(document.createTextNode("Tile separation (px): "));
		document.body.appendChild(separation);
		

		document.body.appendChild(document.createElement('br'));
		document.body.appendChild(tilesetPreview);


	}
}