const XMLDownloader = require("./xmldownloader");
const XMLParser = require("./xmlparser");
const EntryParser = require("./entryparser");

const EventEmitter = require("events");

// 3rd party dependencies
const CronJob = require("cron").CronJob;

class Realworks extends EventEmitter {
	constructor(options) {
		super();

		this._options = options;

		if(!this._options.user) throw new TypeError("'options.user' is not set");
		if(!this._options.password) throw new TypeError("'options.password' is not set");

		this._cron = this._options.cron || true;
		this._cronPattern = this._options.cronPattern || "0 0 9 * * *";
		this._cronTimezone = this._options.cronTimezone || "Europe/Amsterdam";

		if(!this._options.types) throw new TypeError("'options.types' is not set");
		if(typeof this._options.types == "string") this._options.types = [this._options.types];
		this._types = this._options.types;

		this._downloader = new XMLDownloader(this._options, this);
		this._converter = new XMLParser(this._options, this);
		this._parser = new EntryParser(this._options, this);

		if(this._cron) {
			try {
				this._cronjob = new CronJob(this._cronPattern, function () {
					this.update()
						.catch((err) => {
							this.emit("error", err);
						});
				}, null, true, this._cronTimezone);
			} catch(err) {
				throw new Error("Invalid cron pattern: "+err.message);
			}
		}
	}

	update() {
		return new Promise((resolve, reject) => {
			Promise.all(this._types.map((type) => {
				return this._downloader.download(type)
					.then((xmlData) => {
						return this._converter.parse(xmlData);
					})
					.then((entries) => {
						return this._parser.parse(entries);
					});
			}))
			.then((results) => {
				resolve(results);
			})
			.catch((err) => {
				reject(err);
			});
		});
	}
}

module.exports = Realworks;