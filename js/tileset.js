class Tileset {
	constructor(image, tilesizeX, sepX, tilesizeY, sepY) {
		this.image = image;
		this.tilesizeX = tilesizeX;
		this.tilesizeY = tilesizeY || this.tilesizeX;
		this.sepX = sepX || 0;
		this.sepY = sepY || this.sepX;
		this.width = Math.floor((this.image.width + this.sepX) / (this.tilesizeX + this.sepX));
		this.height = Math.floor((this.image.height + this.sepY) / (this.tilesizeY + this.sepY));
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
					this.image, (x + i) * (this.tilesizeX + this.sepX),
					(y + j) * (this.tilesizeY + this.sepY),
					this.tilesizeX, this.tilesizeY,
					i * this.tilesizeX, j * this.tilesizeY,
					this.tilesizeX, this.tilesizeY
				);
			}
		}

		return canvas;
	}
}