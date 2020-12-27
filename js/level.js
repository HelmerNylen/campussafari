class Level {
	static async drawTerrain(json) {
		const images = await loadResources(json.tilesets.map(ts => "tilesets/" + ts.file));

		let tilesets = json.tilesets.map((ts, i) => new Tileset(
			images[i],
			ts['tilesizeX'] || ts['tilesize'],
			ts['separationX'] || ts['separation'],
			ts['tilesizeY'] || ts['tilesize'],
			ts['separationY'] || ts['separation']
		));
		
		let patches = json.terrain.patches.map(p => tilesets[p.tileset].tilesMerged(p.x, p.y, p['width'], p['height']));
		
		let canvas = document.createElement('canvas', { alpha: false });
		canvas.width = json.terrain.cellsize * json.terrain.width;
		canvas.height = json.terrain.cellsize * json.terrain.height;
		let ctx = canvas.getContext('2d');
		
		ctx.fillStyle = "black";
		ctx.fillRect(0, 0, canvas.width, canvas.height);
		
		let patchesDrawnAbove = [];
		for (let y = 0, d; y < json.terrain.height; y++) {
			for (let x = 0; x < json.terrain.width; x++) {
				d = json.terrain.data[y * json.terrain.width + x];
				if (d instanceof Array) {
					patchesDrawnAbove.push([x, y]);
					d = d[0];
				}
				if (d !== 0)
					ctx.drawImage(patches[d - 1], json.terrain.cellsize * x, json.terrain.cellsize * y);
			}
		}

		const maxLayer = Math.max(...patchesDrawnAbove.map(
			coords => json.terrain.data[coords[1] * json.terrain.width + coords[0]].length
		));
		for (let layer = 1, d; layer < maxLayer; layer++) {
			patchesDrawnAbove = patchesDrawnAbove.filter(coords => {
				d = json.terrain.data[coords[1] * json.terrain.width + coords[0]];
				if (layer >= d.length)
					return false;
				else {
					ctx.drawImage(patches[d[layer] - 1], json.terrain.cellsize * coords[0], json.terrain.cellsize * coords[1]);
					return true;
				}
			});
		}

		/*document.body.appendChild(document.createTextNode("Patches in level: "));
		patches.forEach((p, i) => {
			if (i > 0)
				document.body.appendChild(document.createTextNode(", "));
			document.body.appendChild(p);
		});*/

		return canvas;
	}
}