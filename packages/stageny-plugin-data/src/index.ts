import fs from "fs"
import Path from "path"
import { globbySync } from "globby"
import yaml from "js-yaml"
import { dirname, importUncached } from "@stageny/util"
import { StagenyData, StagenyConfig, StagenyPlugin } from "@stageny/types"

var datastore: StagenyData = {}
let stagenyConfig: StagenyConfig

// reads and keeps data from a directory

function verbose(): boolean {
	return !!(stagenyConfig && stagenyConfig.verbose)
}

function reset(): void {
	datastore = {}
}
async function readAll(value: string | string[]) {
	if (verbose()) console.log("Reading data")
	var files = globbySync(value)
	await Promise.all(
		files.map((file) => {
			readFile(file)
		})
	)
}

async function readFile(value: string) {
	try {
		var key = pathToKey(value)
		datastore[key] = await parse(Path.extname(value), value)
		if (verbose()) console.log(`- added data "${key}"`)
	} catch (error) {
		console.error(`🛑  Could not read data from "${value}"`)
		if (error instanceof Error) {
			console.log(error.stack || error.message)
		}
	}
}

function removeFile(value: string) {
	var name = pathToKey(value)
	delete datastore[name]
}

function pathToKey(value: string): string {
	return Path.basename(value).split(".")[0]
}

async function parse(ext: string, value: string) {
	if (ext == ".yaml" || ext == ".yml") {
		var content = fs.readFileSync(value)
		return await parseYaml(content.toString())
	}
	if (ext == ".json") {
		var content = fs.readFileSync(value)
		return await parseJson(content.toString())
	}
	if (ext == ".js") {
		return await parseJS(value)
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
async function parseJS(value: string): Promise<StagenyData> {
	try {
		var importPath = Path.resolve(process.cwd(), value)
		const dataImport = importUncached(importPath)
		if ("default" in dataImport) {
			return dataImport["default"]
		}
	} catch (error) {
		throw new Error("Could not import javascript data from " + value)
	}
}

function plugin(options = { path: "data/*.*" }): StagenyPlugin {
	return {
		start() {
			this.config(async (config: StagenyConfig) => {
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
	get: function (key: string) {
		if (typeof key === "string") {
			return datastore[key]
		}
		return datastore
	},
})

export default plugin
