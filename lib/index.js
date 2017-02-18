const XMLDownloader = require("./xmldownloader");
const XMLToJson = require("./xml2json");
const EntryParser = require("./entryparser");

const PropertyTransport = require("./propertytransport");
const MediaTransport = require("./mediatransport");
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

		this.logger = this._options.logTransport || new LogTransport(this._options);
		this.properties = this._options.propertyTransport;
		this.media = this._options.mediaTransport;

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

		if(this._cron) {
			try {
				this._cronjob = new CronJob(this._cronPattern, function () {
					this.update()
						.catch((err) => {
							this.emit("error", err);
						});
				}.bind(this), null, true, this._cronTimezone);
			} catch(err) {
				throw new Error("Invalid cron pattern: "+err.message);
			}
		}
	}

	update() {
		// Update from XML feed for all types
		Promise.all(this._types.map((type) => {
			// Download all XML feeds
			return this._downloader.download(type)
				.then((xmlData) => {
					// Convert XML to JSON
					return this._converter.convert(xmlData);
				})
				.then((entries) => {
					// Parse entries
					return this._parser.parse(entries);
				});
		}))
		.then((results) => {
			// TODO: Remove entries that are supposed to be removed
			return Promise.resolve(results);
		})
		.catch((err) => {
			return Promise.reject(err);
		});
	}
}

module.exports.Realworks = Realworks;
module.exports.PropertyTransport = PropertyTransport;
module.exports.MediaTransport = MediaTransport;
module.exports.LogTransport = LogTransport;