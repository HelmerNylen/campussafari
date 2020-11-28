const tilesets = ["roguelike-modern-city-pack.png", "rpg-urban-pack.png"];
class LevelEditor {

	constructor() {
		const onImageLoad = () => {
			if (this.images.every(i => i.complete))
				this.onImagesLoaded();
		};
		this.images = tilesets.map(filename => {
			const img = new Image();
			img.onload = onImageLoad;
			img.src = "tilesets/" + filename;
			return img;
		});
	}

	onImagesLoaded() {
		this.ctx = document.getElementById("gameboard").getContext("2d");
		this.ctx.drawImage(this.images[0], 0, 0);
	}
}