class ObjectParser {
	constructor(options, parent) {
		this._options = options;
		this._parent = parent;
	}

	_parseSingle(object) {
		return new Promise((resolve, reject) => {
			resolve(object);
		});
	}

	parse(objects) {
		return Promise.all(objects.map(this._parseSingle));
	}
}

module.exports = ObjectParser;