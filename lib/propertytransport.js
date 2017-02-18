class PropertyTransport {
	constructor() {
		
	}
	
	/*
		create(property) is called when a new object is retrieved from the XML 
		update. "property" is a JSON representation of the XML object <Object>

		Implementations should return a Promise
	*/
	create(property) {
		throw new Error("Not yet implemented");
	}

	/*
		get(id) should return the JSON object like it was passed by either 
		update() or create() on it's resolve(). Not returning the same JSON 
		object will return in false "updates". "id" is the ObjectSystemID

		Implementations should return a Promise
	*/
	get(id) {
		throw new Error("Not yet implemented");
	}

	/*
		getIds() should return an array of ObjectSystemIDs in it's resolve()

		Implementations should return a Promise
	*/
	getIds() {
		throw new Error("Not yet implemented");
	}

	/*
		getMedia() should return an array of Media objects in it's resolve()

		Implementations should return a Promise
	*/
	getMedia() {
		throw new Error("Not yet implemented");
	}

	/*
		update(id, property) is called when an object seems to have updated
		(tested by a JSON object hash check). "id" is the <ObjectSystemID>,
		"property" is the new JSON object

		Implementations should return a Promise
	*/
	update(id, property) {
		throw new Error("Not yet implemented");
	}

	/*
		delete(id) is called when a property has to be deleted
	*/
	delete(id) {
		throw new Error("Not yet implemented");
	}
}

module.exports = PropertyTransport;