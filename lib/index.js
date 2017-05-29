const XMLDownloader = require("./xmldownloader");
const XMLToJson = require("./xml2json");
const EntryParser = require("./entryparser");
const MediaUpdater = require("./mediaupdater");

const LogTransport = require("./logtransport");

const EventEmitter = require("events");

// 3rd party dependencies
const CronJob = require("cron").CronJob;

class Realworks extends EventEmitter {
	constructor(options) {
		super();

		this._options = options;

		if(!this._options.user) throw new TypeError("'options.user' is not set");
		if(!this._options.password) throw new TypeError("'options.password' is not set");
		if(!this._options.propertyTransport) throw new TypeError("'options.propertyTransport' is not set");
		if(!this._options.mediaTransport) throw new TypeError("'options.mediaTransport' is not set");

		if(this._options.logTransport) {
			this.logger = new this._options.logTransport(this._options);
		}else{
			this.logger = new LogTransport(this._options);
		}

		if(!this._options.softRemoveInterval) {
			this._options.softRemoveInterval = {
				amount: 2,
				size: "months"
			};
		}else{
			if(!(this._options.softRemoveInterval.hasOwnProperty("amount") && typeof this._options.softRemoveInterval.amount == "number")) {
				this._options.softRemoveInterval.amount = 2;
			}
			if(!(this._options.softRemoveInterval.hasOwnProperty("size") && typeof this._options.softRemoveInterval.size == "string")) {
				this._options.softRemoveInterval.size = "months";
			}
		}

		this.properties = new this._options.propertyTransport(this._options, this);
		this.media = new this._options.mediaTransport(this._options, this);

		this._cron = this._options.cron || true;
		this._cronPattern = this._options.cronPattern || "0 0 9 * * *";
		this._cronTimezone = this._options.cronTimezone || "Europe/Amsterdam";
		this._removeInterval = this._options.removeInterval || 7;

		if(!this._options.types) throw new TypeError("'options.types' is not set");
		if(typeof this._options.types == "string") this._options.types = [this._options.types];
		this._types = this._options.types;

		this._downloader = new XMLDownloader(this._options, this);
		this._converter = new XMLToJson(this._options, this);
		this._parser = new EntryParser(this._options, this);
		this._mediaUpdater = new MediaUpdater(this._options, this);

		if(this._cron) {
			try {
				this._cronjob = new CronJob(this._cronPattern, function () {
					this.update()
					.then(() => {
						this.emit("update finished");
						this.logger.log("INFO", "Update finished", null, null);
					})
					.catch((err) => {
						this.emit("error", err);
						this.logger.log("ERR", "Error running update", null, err);
					});
				}.bind(this), null, true, this._cronTimezone);
			} catch(err) {
				throw new Error("Invalid cron pattern: "+err.message);
			}
		}
	}

	update() {
		this.emit("update started");
		this.logger.log("INFO", "Update started");
		
		// Update from XML feed for all types
		return Promise.all(this._types.map((type) => {
			// Download all XML feeds
			return this._downloader.download(type)
			.then((xmlData) => {
				// Convert XML to JSON
				return this._converter.convert(xmlData);
			})
			.then((entries) => {
				// Parse entries
				return this._parser.parse(entries);
			})
			.then((entries) => {
				return this._mediaUpdater.update(entries);
			})
			.then(() => {
				return this.properties.getReadyForRemoval()
				.then((ids) => {
					if(!ids || ids.length == 0) {
						this.logger.log("INFO", "No queued properties to remove yet");
						return Promise.resolve();
					}

					return Promise.all(ids.map((id) => {
						return this.properties.remove(id)
						.then(() => {
							this.emit("entry removed", id);
							this.logger.log("INFO", "Removed property " + id, id);
							return Promise.resolve();
						});
					}))
					.then(() => {
						return Promise.resolve();
					});
				});
			});
		}))
		.then((results) => {
			// TODO: Remove entries that are supposed to be removed
			this.emit("entries parsed", results);

			return Promise.resolve(results);
		})
		.catch((err) => {
			return Promise.reject(err);
		});
	}
}

module.exports.Realworks = Realworks;
module.exports.LogTransport = LogTransport;