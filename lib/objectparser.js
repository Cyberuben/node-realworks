const xml2js = require("xml2js");

class XMLParser {
	constructor(options) {
		this._options = options;
	}

	parse(xmlData) {
		return new Promise((resolve, reject) => {
			xml.parseString(xmlData, { explicitArray: false }, (err, result) => {
				if(err) {
					return reject(err);
				}

				resolve(result);
			});
		});
	}
}

module.exports = XMLParser;