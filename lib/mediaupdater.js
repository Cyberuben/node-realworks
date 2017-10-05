const url = require("url");
const path = require("path");
const stream = require("stream");
const https = require("https");

const uuid = require("uuid");

class MediaUpdater {
	constructor(options, parent) {
		this._options = options;
		this._parent = parent;
		this._logger = this._parent.logger;
	}

	_updateSingle(entry) {
		if(entry.status == "removed") {
			return this.removeAll(entry.entry.ObjectSystemID);
		}

		entry = entry.entry;

		var toDownload = [];
		var toRemove = [];
		var currentFiles = [];
		var newList = [];

		// Get images from downloaded entry and stored entry
		return this._parent.properties.getImages(entry.ObjectSystemID)
		.then((currentList) => {
			if(entry.hasOwnProperty("MediaLijst") && entry.MediaLijst.hasOwnProperty("Media")) {
				if(!Array.isArray(entry.MediaLijst.Media)) {
					entry.MediaLijst.Media = [entry.MediaLijst.Media];
				}

				entry.MediaLijst.Media.forEach((media) => {
					if(media.Groep == "HoofdFoto" || media.Groep == "Foto") {
						newList.push(media.URL);
					}
				});
			}

			currentFiles = currentList.map((element) => { return element.filename; });
			var newFiles = newList.map((element) => { return path.basename(url.parse(element).pathname); });

			// Compare newList to currentList
			toDownload = newList.filter((element) => {
				var urlObject = url.parse(element);

				if(currentFiles.indexOf(path.basename(urlObject.pathname)) == -1) {
					return true;
				}

				return false;
			});

			toRemove = currentList.filter((element) => {
				if(newFiles.indexOf(element.filename) == -1) {
					return true;
				}

				return false;
			});

			this._logger.log("INFO", "Images to download: " + toDownload.length + ". To remove: " + toRemove.length, entry.ObjectSystemID);

			return Promise.resolve();
		})
		.then(() => {
			var promise = Promise.resolve();

			toDownload.forEach((element) => {
				promise = promise.then(() => {
					var parsedUrl = url.parse(element);
					var localName = uuid() + path.extname(parsedUrl.pathname);
					var filename = path.basename(parsedUrl.pathname);
					
					return this._parent.properties.addImage(entry.ObjectSystemID, filename, localName)
					.then(() => {
						return this._download(entry.ObjectSystemID, element);
					})
					.then((buffer) => {
						return this._parent.media.store(entry.ObjectSystemID, buffer, filename, localName)
						.then(() => {
							this._logger.log("DEBUG", "Added image " + filename, entry.ObjectSystemID);
							this._parent.emit("image added", entry.ObjectSystemID, filename, localName);
							return Promise.resolve();
						});
					});
				});
			});

			return promise.then(() => {
				return Promise.resolve();
			});
		})
		.then(() => {
			return Promise.all(toRemove.map((image) => {
				return this._parent.media.remove(entry.ObjectSystemID, image.localName)
				.then(() => {
					this._logger.log("DEBUG", "Removed image " + image.filename, entry.ObjectSystemID);
					this._parent.emit("image removed", entry.ObjectSystemID, image.filename, image.localName);
					return this._parent.properties.removeImage(entry.ObjectSystemID, image.filename);
				});
			}))
			.then(() => {
				return this._parent.properties.updateDisplayOrder(entry.ObjectSystemID, newFiles);
			})
			.then(() => {
				return Promise.resolve();
			});
		});
	}

	_download(id, url) {
		return new Promise((resolve, reject) => {
			const request = https.get(url, (res) => {
				var data = new stream.Transform();
				
				res.on("data", (chunk) => {
					data.push(chunk);
				});

				res.on("end", () => {
					return resolve(data.read());
				});
			});
			
			request.on("error", (err) => {
				this._logger.log("ERR", "Error downloading file "+url, id, err);
				return reject(err);
			});
		});
	}

	update(entries) {
		var promise = Promise.resolve();

		entries.forEach((entry) => {
			promise = promise.then(() => {
				return this._updateSingle(entry);
			});
		});

		return promise.then(() => {
			return Promise.resolve(entries);
		});
	}

	removeAll(id) {
		return this._parent.properties.getImages(id)
		.then((images) => {
			return Promise.all(images.map((image) => {
				this._parent.emit("image removed", id, image.filename, image.localName);
				return this._parent.media.remove(id, image.localName);
			}));
		})
		.then(() => {
			return this._parent.media.clean(id);
		})
		.then(() => {
			return Promise.resolve();
		});
	}
}

module.exports = MediaUpdater;