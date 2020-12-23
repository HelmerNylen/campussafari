/**
 * Ger ett Promise som resolvas när alla de listade sakerna hämtats (eller någon failar)
 * @param {any[][]} resources En array med saker att hämta. Dessa är i sig arrayer: [path, type, onload, onerr]. type är vad för slags objekt det är som hämtas (ex. Image, Audio). onload körs när det hämtats, onerr om det inte kan hämtas.
 * @param {*} defaultType Om en array i resources inte specificerar en typ används denna
 * @param {Function} onUpdate Körs varje gång ett objekt har hämtats (och onload körts). Kan t.ex. användas för loading bars
 */
function loadResources(resources, defaultType = Image, onUpdate = null) {
	let progress = 0;
	let items = [];

	for (let resource of resources) {
		if (resource instanceof String)
			resource = [resource];

		let path = resource[0];
		let type = resource.length >= 2 ? resource[1] : defaultType;
		let onload = resource.length >= 3 ? resource[2] : null;
		let onerr = resource.length >= 4 ? resource[3] : null;

		let promise;
		if (type === JSON)
			promise = new Promise((resolve, reject) => {
				fetch(path).then(response => {
					if (response.ok)
						resolve(response.json());
					else
						reject(response);
				}).catch(reject);
			});
		else
			promise = new Promise((resolve, reject) => {
				const item = new type();
				if (type === Audio) {
					item.addEventListener('canplaythrough', () => resolve(item));
					item.preload = true;
				}
				else
					item.addEventListener('load', () => resolve(item));
				item.addEventListener('error', reject);
				item.src = path;
			})

		promise = promise.then(item => (onload ? onload(item) : null) || item);

		if (onerr)
			promise = promise.catch(onerr);

		promise.finally(() => {
			progress++;
			if (onUpdate)
				onUpdate(progress, items.length);
		});

		items.push(promise);
	}

	return Promise.all(items);
}