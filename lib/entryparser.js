const hash = require("object-hash");
const diff = require("deep-diff").diff;

class EntryParser {
	constructor(options, parent) {
		this._options = options;
		this._parent = parent;
		this._logger = this._parent.logger;
	}

	_parseSingle(entry) {
		// Check if a property exists with the specified ID
		this._parent.properties.get(entry.ObjectSystemID)
		.then((property) => {
			// If property doesn't exist, create it
			if(!property) {
				this._logger.log("INFO", "Adding new property " + entry.ObjectSystemID, entry.ObjectSystemID);
				return this._parent.properties.create(entry);
			}

			// Otherwise, check if it has changed
			var oldHash = hash(property);
			var newHash = hash(entry);

			if(oldHash == newHash) {
				this._logger.log("INFO", "Property " + entry.ObjectSystemID + " is already up to date", entry.ObjectSystemID);
				return Promise.resolve();
			}

			var difference = diff(entry, property);
			this._logger.log("INFO", "Property " + entry.ObjectSystemID + " updated", entry.ObjectSystemID, difference);
			return this._parent.properties.update(entry.ObjectSystemID, entry);
		});
	}

	parse(entries) {
		return Promise.all(entries.map(this._parseSingle, this));
	}
}

module.exports = EntryParser;