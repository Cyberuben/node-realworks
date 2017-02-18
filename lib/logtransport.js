const path = require("path");
const fs = require("fs");
const os = require("os");

class LogTransport {
	constructor(options) {
		if(!options) options = {};

		this._options = options;

		// TODO: Check for file permissions
		// TODO: Log errors while writing to logfile

		this._outputFile = this._options.outputFile || path.join(__dirname, "../realworks.log");

		this._outputStream = fs.createWriteStream(this._outputFile, { flags: "a" });
	}

	get() {
		throw new Error("Not yet implemented");
	}

	log(type, msg, property, meta) {
		// TODO: Check if type is valid (e.g. INFO, WARNING, ERROR, etc)
		var date = new Date();

		var prefix = "[" + date.toISOString() + "] " + type + " ";
		if(property != null) {
			prefix += "[" + property + "] ";
		}

		try {
			if(meta) {
				this._outputStream.write(prefix + msg + ": " + JSON.stringify(meta, null, 2) + os.EOL);
			}else{
				this._outputStream.write(prefix + msg + os.EOL);
			}
		} catch(err) {
			throw err;
		}
	}
}

module.exports = LogTransport;