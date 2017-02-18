const xml2js = require("xml2js");

class XMLToJson {
	constructor(options) {
		this._options = options;
	}

	convert(xmlData) {
		return new Promise((resolve, reject) => {
			xml2js.parseString(xmlData, { explicitArray: false }, (err, result) => {
				if(err) {
					return reject(err);
				}

				if(result.ObjectenLijst && result.ObjectenLijst.Object) {
					if(!Array.isArray(result.ObjectenLijst.Object)) result.ObjectenLijst.Object = [result.ObjectenLijst.Object];
					
					resolve(result.ObjectenLijst.Object);
				}
			});
		});
	}
}

module.exports = XMLToJson;