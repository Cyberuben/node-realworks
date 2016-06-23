class ObjectParser {
	constructor(options, parent) {
		this._options = options;
		this._parent = parent;
	}

	_parseSingle(entry) {
		return new Promise((resolve, reject) => {
			resolve(entry);
		});
	}

	parse(entries) {
		return Promise.all(entries.map(this._parseSingle));
	}
}

module.exports = ObjectParser;