var fs = require("fs").promises
var path = require("path")
var globby = require("globby")

var datastore = {}
let stagenyConfig = {}

// reads and keeps data from a directory

function reset() {
	datastore = {}
}
async function readAll(value) {
	if (stagenyConfig.verbose) console.log("Reading data")
	var files = globby.sync(value)
	await Promise.all(files.map(async function (file) {
		await readFile(file)
	}))
}

async function readFile(value) {
	try {
		var key = pathToKey(value)
		datastore[key] = await parse(path.extname(value), value)
		if (stagenyConfig.verbose) console.log(`- added data "${key}"`)
	} catch (error) {
		console.error(`🛑  Could not read data from "${value}"`)
		console.log(error.stack || error.message)
	}
}

function removeFile(value) {
	var name = pathToKey(value)
	delete datastore[key]
}

function pathToKey(value) {
	return path.basename(value).split(".")[0]
}

async function parse(ext, value) {
	if (ext == ".yaml" || ext == ".yml") {
		var content = await fs.readFile(value)
		return parseYaml(content)
	}
	if (ext == ".json") {
		var content = await fs.readFile(value)
		return parseJson(content)
	}
	if (ext == ".js") {
		return await parseJS(value)
	}
}
function parseYaml(content) {
	var yaml = require("js-yaml")
	return yaml.load(content)
}
function parseJson(content) {
	return JSON.parse(content)
}
function parseJS(value) {
	delete require.cache[require.resolve(value)]
	const js = require(value)
	if (typeof js === 'function') {
		return await js()
	} else {
		return js
	}
}

function plugin(options = { path: "data/*.*" }) {
	return {
		async start() {
			await this.config(async (config) => {
				stagenyConfig = config
				await readAll(options.path)
				// we could only update (add/replace/delete)
				// entries from datastore, instead of replacing
				// the entire data object
				config.data = datastore
			})
		},
	}
}

Object.assign(plugin, {
	reset: reset,
	update: readAll,
	read: readFile,
	remove: removeFile,
	get: function (key) {
		if (typeof key === "string") {
			return datastore[key]
		}
		return datastore
	},
})

module.exports = plugin
