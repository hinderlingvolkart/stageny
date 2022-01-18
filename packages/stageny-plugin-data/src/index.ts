import fs from "fs"
import path from "path"
import globby from "globby"
import yaml from "js-yaml"

import { StagenyData, StagenyConfig } from "@stageny/types"

var datastore: StagenyData = {}
let stagenyConfig: StagenyConfig

// reads and keeps data from a directory

function verbose(): boolean {
	return !!(stagenyConfig && stagenyConfig.verbose)
}

function reset(): void {
	datastore = {}
}
function readAll(value: string | string[]): void {
	if (verbose()) console.log("Reading data")
	var files = globby.sync(value)
	files.forEach(function (file) {
		readFile(file)
	})
}

function readFile(value: string): void {
	try {
		var key = pathToKey(value)
		datastore[key] = parse(path.extname(value), value)
		if (verbose()) console.log(`- added data "${key}"`)
	} catch (error) {
		console.error(`🛑  Could not read data from "${value}"`)
		if (error instanceof Error) {
			console.log(error.stack || error.message)
		}
	}
}

function removeFile(value: string): void {
	var name = pathToKey(value)
	delete datastore[name]
}

function pathToKey(value: string): string {
	return path.basename(value).split(".")[0]
}

function parse(ext: string, value: string): StagenyData | undefined {
	if (ext == ".yaml" || ext == ".yml") {
		var content = fs.readFileSync(value)
		return parseYaml(content.toString())
	}
	if (ext == ".json") {
		var content = fs.readFileSync(value)
		return parseJson(content.toString())
	}
	if (ext == ".js") {
		return parseJS(value)
	}
}
function parseYaml(content: string): StagenyData {
	const result = yaml.load(content)
	if (result instanceof Object) {
		return result
	} else {
		return {}
	}
}
function parseJson(content: string): StagenyData {
	return JSON.parse(content)
}
function parseJS(value: string): StagenyData {
	delete require.cache[require.resolve(value)]
	return require(value)
}

function plugin(options = { path: "data/*.*" }) {
	return {
		start() {
			this.config((config) => {
				stagenyConfig = config
				readAll(options.path)
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

export default plugin
