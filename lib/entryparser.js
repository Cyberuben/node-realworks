const hash = require("object-hash");
const moment = require("moment");

class EntryParser {
	constructor(options, parent) {
		this._options = options;
		this._parent = parent;
		this._logger = this._parent.logger;
	}

	_parseSingle(entry) {
		// Check if a property exists with the specified ID

		var status;
		if(entry.hasOwnProperty("Wonen")) {
			status = entry.ObjectDetails.StatusBeschikbaarheid.Status;
		}else if(entry.hasOwnProperty("Gebouw")) {
			status = entry.ObjectDetails.Status.StatusType;
		}

		if(status == "Ingetrokken") {
			return this._parent.properties.remove(entry.ObjectSystemID)
			.then(() => {
				this._parent.emit("entry removed", entry.ObjectSystemID, entry);
				this._logger.log("INFO", "Property " + entry.ObjectSystemID + " has been removed", entry.ObjectSystemID);

				return Promise.resolve({
					status: "removed",
					entry: entry
				});
			});
		}

		return this._parent.properties.get(entry.ObjectSystemID)
		.then((property) => {
			// If property doesn't exist, create it
			if(!property) {
				return this._parent.properties.create(entry)
				.then(() => {
					this._parent.emit("entry added", entry.ObjectSystemID, entry);
					this._logger.log("INFO", "Adding new property " + entry.ObjectSystemID, entry.ObjectSystemID, {
						old: null,
						new: entry
					});

					return Promise.resolve({
						status: "added",
						entry: entry
					});
				});
			}

			// Otherwise, check if it has changed
			var oldHash = hash(property);
			var newHash = hash(entry);

			if(oldHash == newHash) {
				this._parent.emit("entry unchanged", entry.ObjectSystemID, entry);
				this._logger.log("INFO", "Property " + entry.ObjectSystemID + " hasn't changed", entry.ObjectSystemID);

				return Promise.resolve({
					status: "up-to-date",
					entry: entry
				});
			}

			return this._parent.properties.update(entry.ObjectSystemID, entry)
			.then(() => {
				var status;
				if(entry.hasOwnProperty("Wonen")) {
					status = entry.ObjectDetails.StatusBeschikbaarheid.Status;
				}else if(entry.hasOwnProperty("Gebouw")) {
					status = entry.ObjectDetails.Status.StatusType;
				}

				if(status == "Verhuurd" || status == "Verkocht") {
					return this._parent.properties.isQueued(entry.ObjectSystemID)
					.then((isQueued) => {
						if(!isQueued) {
							var removalDate = moment().add(this._options.softRemoveInterval.amount, this._options.softRemoveInterval.size).format("YYYY-MM-DD");

							return this._parent.properties.queueRemoval(entry.ObjectSystemID, removalDate)
							.then(() => {
								this._parent.emit("entry soft removed", entry.ObjectSystemID, entry, removalDate);
								this._logger.log("INFO", "Property " + entry.ObjectSystemID + " will be removed on "+removalDate, entry.ObjectSystemID);

								return Promise.resolve({
									status: "soft-removed",
									entry: entry
								});
							})
						}

						this._parent.emit("entry soft removed", entry.ObjectSystemID, entry);
						this._logger.log("INFO", "Property " + entry.ObjectSystemID + " already queued for removal", entry.ObjectSystemID);

						return Promise.resolve({
							status: "soft-removed",
							entry: entry
						});
					});
				}

				this._parent.emit("entry updated", entry.ObjectSystemID, entry);
				this._logger.log("INFO", "Property " + entry.ObjectSystemID + " updated", entry.ObjectSystemID, {
					old: property,
					new: entry
				});

				return Promise.resolve({
					status: "updated",
					entry: entry
				});
			});
		})
		.then((data) => {
			this._parent.emit("entry parsed", data.entry.ObjectSystemID, data.entry);

			return Promise.resolve(data);
		});
	}

	parse(entries) {
		return Promise.all(entries.map(this._parseSingle, this))
		.then((entries) => {
			return Promise.resolve(entries);
		})
	}
}

module.exports = EntryParser;