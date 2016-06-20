class XMLDownloader {
	constructor(options) {
		this._options = options;
	}

	_parseResponse(res) {
		return new Promise((resolve, reject) => {

		});
	}

	download(type) {
		return new Promise((resolve, reject) => {
			const queryParams = {
				koppeling: "WEBSITE",
				user: _options.user,
				password: _options.password,
				og: type
			};

			if(this._options.hasOwnProperty("kantoor")) {
				queryParams.kantoor = this._options.kantoor;
			}

			const options = {
				method: "GET", 
				protocol: "https:",
				hostname: "xml-publish.realworks.nl",
				path: "/servlets/ogexport?" + qs.stringify(queryParams),
				auth: this._options.key+":"+this._options.secret
			}

			const request = https.request(opts, (res) => {
				resolve(this._parseJsonResponse(res));
			});
			request.on("error", reject);
			request.end();
		});
	}
}

module.exports = XMLDownloader;