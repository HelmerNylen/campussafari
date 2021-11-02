const Area = {
	"Occupied": 1 << 0,
	/* Här kan man lägga till andra flaggor,
	 * t.ex. att i det här området kan man hitta vilda teknologer
	 * eller här är det vatten man måste segla på: */
	// "Water": 1 << 1,
	// "Encounter": 1 << 2,
	
	// Portal är tänkt att kunna definiera att man hamnar i en annan värld (en av 255 andra) om man kliver här
	"Portal": 1 << 8 | 1 << 9 | 1 << 10 | 1 << 11 | 1 << 12 | 1 << 13 | 1 << 14 | 1 << 15
};

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

	static async getTilesets(json) {
		const images = await Resource.load(json.tilesets.map(ts => "tilesets/" + ts.file));

		const tilesets = json.tilesets.map((ts, i) => new Tileset(
			images[i],
			ts['tilesizeX'] || ts['tilesize'],
			ts['separationX'] || ts['separation'],
			ts['tilesizeY'] || ts['tilesize'],
			ts['separationY'] || ts['separation']
		));

		return tilesets;
	}

	static async createTerrain(json) {
		const tilesets = await this.getTilesets(json);
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
				d = terrain.imageData[y * terrain.width + x];
				if (d instanceof Array) {
					patchesDrawnAbove.push([x, y]);
					d = d[0];
				}
				if (d !== 0)
					ctx.drawImage(patches[d - 1], terrain.cellsize * x, terrain.cellsize * y);
			}
		}

		const maxLayer = Math.max(...patchesDrawnAbove.map(
			coords => terrain.imageData[coords[1] * terrain.width + coords[0]].length
		));
		for (let layer = 1, d; layer < maxLayer; layer++) {
			patchesDrawnAbove = patchesDrawnAbove.filter(coords => {
				d = terrain.imageData[coords[1] * terrain.width + coords[0]];
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

	static async createEntities(json) {
		const tilesets = await this.getTilesets(json);
		return (json["entities"] || []).map(en => Entity.createEntity(tilesets, en));
	}
}