var https = require("https");
var qs = require("querystring");

const XMLDownloader = require("./xmldownloader");

class XMLToJSONParser {

}

class Realworks {
	constructor(options) {
		this._downloader = new XMLDownloader(this._options);
	}
}