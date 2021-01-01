class Level {
	static makePatch(tileset, patchJSON) {
		if (tileset instanceof Array)
			tileset = tileset[patchJSON.tileset];
		
		let x = patchJSON.x;
		let y = patchJSON.y;

		if (!(x instanceof Array))
			x = [x];
		if (!(y instanceof Array))
			y = [y];
		if (x.length !== y.length)
			throw `Length of x (${patchJSON.x}) must match y (${patchJSON.y}).`;
		
		let tiles = x.map((_, i) =>
			tileset.tilesMerged(x[i], y[i], patchJSON["width"] || 1, patchJSON["height"] || 1)
		);
		let patch = tiles.length === 1 ? tiles[0] : Tileset.mergeArrayOfTiles(tiles, patchJSON["rowLength"] || 1);
		if ((patchJSON["scale"] || 100) !== 100) {
			let scaledPatch = document.createElement('canvas');
			scaledPatch.width = patch.width * (patchJSON.scale / 100);
			scaledPatch.height = patch.height * (patchJSON.scale / 100);
			let ctx = scaledPatch.getContext('2d');
			ctx.drawImage(patch, 0, 0, patch.width, patch.height, 0, 0, scaledPatch.width, scaledPatch.height);
			return scaledPatch;
		}
		else
			return patch;
	}

	static async createTerrain(json) {
		const images = await loadResources(json.tilesets.map(ts => "tilesets/" + ts.file));

		let tilesets = json.tilesets.map((ts, i) => new Tileset(
			images[i],
			ts['tilesizeX'] || ts['tilesize'],
			ts['separationX'] || ts['separation'],
			ts['tilesizeY'] || ts['tilesize'],
			ts['separationY'] || ts['separation']
		));
		
		return this.drawTerrain(tilesets, json.terrain);
	}

	static drawTerrain(tilesets, terrain) {
		let patches = terrain.patches.map(p => this.makePatch(tilesets[p.tileset], p));
		
		let canvas = document.createElement('canvas', { alpha: false });
		canvas.width = terrain.cellsize * terrain.width;
		canvas.height = terrain.cellsize * terrain.height;
		let ctx = canvas.getContext('2d');
		
		ctx.fillStyle = "black";
		ctx.fillRect(0, 0, canvas.width, canvas.height);
		
		let patchesDrawnAbove = [];
		for (let y = 0, d; y < terrain.height; y++) {
			for (let x = 0; x < terrain.width; x++) {
				d = terrain.data[y * terrain.width + x];
				if (d instanceof Array) {
					patchesDrawnAbove.push([x, y]);
					d = d[0];
				}
				if (d !== 0)
					ctx.drawImage(patches[d - 1], terrain.cellsize * x, terrain.cellsize * y);
			}
		}

		const maxLayer = Math.max(...patchesDrawnAbove.map(
			coords => terrain.data[coords[1] * terrain.width + coords[0]].length
		));
		for (let layer = 1, d; layer < maxLayer; layer++) {
			patchesDrawnAbove = patchesDrawnAbove.filter(coords => {
				d = terrain.data[coords[1] * terrain.width + coords[0]];
				if (layer >= d.length)
					return false;
				else {
					if (d[layer] !== 0)
						ctx.drawImage(patches[d[layer] - 1], terrain.cellsize * coords[0], terrain.cellsize * coords[1]);
					return true;
				}
			});
		}

		return canvas;
	}
}