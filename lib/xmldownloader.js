const https = require("https");

const fs = require("fs-extra");
const path = require("path");
const unzip = require("unzip2");

function pad(n, width, z) {
	z = z || "0";
	n = n + "";
	return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
}

class XMLDownloader {
	constructor(options) {
		this._options = options;

		// Set default parameters for this module to work
		this._downloadPath = this._options.downloadPath || path.join(path.dirname(__filename), "..", "temp");
		this._keepZip = this._options.keepZip || false;
		this._keepXml = this._options.keepXml || false;

		// Set default parameters for the Realworks XML API
		this._hostname = "xml-publish.realworks.nl";
		this._path = "/servlets/ogexport";

		// ALlow overriding of default parameters
		if(this._options.hasOwnProperty("override")) {
			Object.keys(this._options.override).forEach((key) => {
				this["_"+key] = this._options.override[key];
			});
		}
	}

	_parseResponse(type, res) {
		return new Promise((resolve, reject) => {
			const now = (!this._options.override || !this._options.override.now ? new Date() : this._options.override.now);
			const filename = this._downloadPath + "/" + 
				type + "-" + pad(now.getFullYear(), 2) + "-" + pad(now.getMonth() + 1, 2) + "-" + pad(now.getDate(), 2) + ".zip";

			// Make sure the download directory exists
			fs.ensureDir(path.dirname(filename), (err) => {
				if(err) {
					return reject(err);
				}

				// Prepare for writing the .zip data
				const file = fs.createWriteStream(filename);
				file.on("error", (err) => {
					return reject(err);
				});

				res.on("data", (chunk) => {
					file.write(chunk);
				}).on("end", () => {
					file.end();

					resolve(filename);
				});
			});
		});
	}

	_unpackZip(filename) {
		return new Promise((resolve, reject) => {
			const extractDir = path.join(path.dirname(filename), path.basename(filename, path.extname(filename)));

			// Make sure the extract directory exists
			fs.ensureDir(extractDir, (err) => {
				if(err) {
					return reject(err);
				}

				resolve(extractDir);
			});
		}).then((extractDir) => {
			return new Promise((resolve, reject) => {
				// Read the .zip file and extract it
				const zipFile = fs.createReadStream(filename)
					.pipe(unzip.Extract({
						path: extractDir
					}).on("close", () => {
						const parts = path.basename(filename, path.extname(filename)).split("-");

						const xmlFilename = path.join(extractDir, parts[0]+"_"+parts[1]+parts[2]+parts[3]+".xml");

						if(this._keepZip) {
							// Keep the .zip file if required
							return resolve(xmlFilename);
						}

						// Delete downloaded .zip file
						fs.remove(filename, (err) => {
							if(err) {
								return reject(err);
							}

							resolve(xmlFilename);
						});
					}).on("error", (err) => {
						reject(err);
					}));

				zipFile.on("error", (err) => {
					reject(err);
				});
			});
		});
	}

	_readXml(filename) {
		return new Promise((resolve, reject) => {
			var chunks = [];
			// Read the .xml file
			const xmlFile = fs.createReadStream(filename)
				.on("data", (chunk) => {
					chunks.push(chunk);
				}).on("end", () => {
					if(this._keepXml) {
						// Keep the .zip file if required
						return resolve(chunks.join(""));
					}

					// Delete downloaded .zip file
					fs.remove(path.dirname(filename), (err) => {
						if(err) {
							return reject(err);
						}

						resolve(chunks.join(""));
					});
				}).on("error", (err) => {
					reject(err);
				});
		});
	}

	download(type) {
		return new Promise((resolve, reject) => {
			// Set query parameters required for Realworks
			const queryParams = {
				koppeling: "WEBSITE",
				user: this._options.user,
				password: this._options.password,
				og: type
			};

			// Set 'kantoor' property when given
			if(this._options.kantoor) {
				queryParams.kantoor = this._options.kantoor;
			}

			// Set HTTPS request options
			const options = {
				method: "GET", 
				protocol: "https:",
				hostname: this._hostname,
				path: (!this._options.override || !this._options.override.path ? this._path + "?" + qs.stringify(queryParams) : this._options.override.path)
			};

			// Create the request
			const request = https.request(options, (res) => {
				this._parseResponse(type, res)
					.then((filename) => this._unpackZip(filename))
					.then((xmlFilename) => this._readXml(xmlFilename))
					.then((xmlData) => {
						resolve(xmlData);
					})
					.catch((err) => {
						reject(err);
					});
			});
			request.on("error", reject);
			request.end();
		});
	}
}

module.exports = XMLDownloader;