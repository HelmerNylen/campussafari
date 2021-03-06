class Tileset {
	constructor(image, tilesizeX, sepX, tilesizeY, sepY) {
		this.image = image;
		this.tilesizeX = tilesizeX;
		this.tilesizeY = tilesizeY || this.tilesizeX;
		this.sepX = sepX || 0;
		this.sepY = sepY || this.sepX;
	}

	get width() {
		return Math.floor((this.image.width + this.sepX) / (this.tilesizeX + this.sepX));
	}
	get height() {
		return Math.floor((this.image.height + this.sepY) / (this.tilesizeY + this.sepY));
	}

	pixelToIndexX(x) {
		return x / (this.tilesizeX + this.sepX);
	}
	pixelToIndexY(y) {
		return y / (this.tilesizeY + this.sepY);
	}
	indexToPixelX(x) {
		return x * (this.tilesizeX + this.sepX);
	}
	indexToPixelY(y) {
		return y * (this.tilesizeY + this.sepY);
	}

	tile(x, y) {
		return this.tilesMerged(x, y);
	}

	tilesArray(xs, ys, width = 1, height = 1) {
		if (!(xs instanceof Array) && !(ys instanceof Array)) {
			let xCoords = [];
			let yCoords = [];
			for (let y = 0; y < height; y++) {
				for (let x = 0; x < width; x++) {
					xCoords.push(xs + x);
					yCoords.push(ys + y);
				}
			}
		}
		else if (xs.length != ys.length)
			throw `xs length (${xs.length}) does not match ys length (${ys.length})`;
		
		let res = [];
		for (let i = 0; i < xs.length; i++) {
			res.push(this.tile(xs[i], ys[i]));
		}
		
		return res;
	}

	tilesMerged(x, y, width = 1, height = 1) {
		let canvas = document.createElement('canvas');
		canvas.width = this.tilesizeX * width;
		canvas.height = this.tilesizeY * height;
		let ctx = canvas.getContext('2d');

		for (let j = 0; j < height; j++) {
			for (let i = 0; i < width; i++) {
				ctx.drawImage(
					this.image, this.indexToPixelX(x + i), this.indexToPixelY(y + j),
					this.tilesizeX, this.tilesizeY,
					i * this.tilesizeX, j * this.tilesizeY,
					this.tilesizeX, this.tilesizeY
				);
			}
		}

		return canvas;
	}

	static mergeArrayOfTiles(tiles, width) {
		if (!width)
			width = tiles.length;
		let height = Math.ceil(tiles.length / width);
		if (!tiles.every(t => t.width === tiles[0].width && t.height === tiles[0].height))
			throw `Not all tiles have the same size (expected ${tiles[0].width}x${tiles[0].height})`;

		let canvas = document.createElement('canvas');
		canvas.width = tiles[0].width * width;
		canvas.height = tiles[0].height * height;
		let ctx = canvas.getContext('2d');

		for (let j = 0; j < height; j++) {
			for (let i = 0; i < width; i++) {
				if (j * width + i >= tiles.length)
					return canvas;
				ctx.drawImage(tiles[j * width + i], tiles[0].width * i, tiles[0].height * j);
			}
		}

		return canvas;
	}
}