var https = require("https");
var qs = require("querystring");

const XMLDownloader = require("./xmldownloader");

class Realworks {
	constructor(options) {
		this._options = options;

		this._downloader = new XMLDownloader(this._options);
	}
}

module.exports = Realworks;