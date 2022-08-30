import Frontmatter from "./frontmatter.js"
import FS from "fs/promises"
import { globby } from "globby"
import Path from "path"
import mkdirp from "mkdirp"
import { Perf, Colorize, normalizeInputs } from "@stageny/util"
import jstransformer from "jstransformer"
import findJstransformer from "inputformat-to-jstransformer"
import config from "./config.js"
import PugEngine from "@stageny/engine-pug"
import JavascriptEngine from "@stageny/engine-js"
import { renderAsHtml as renderError } from "./renderError.js"
import {
	StagenyFile,
	StagenyBase,
	RunOptions,
	StagenyRenderEngine,
	StagenyConfigProcessor,
	StagenyData,
	GlobInputs,
	StagenyPlugin,
	StagenyPluginFunction,
} from "@stageny/types"

const pages: StagenyFile[] = []
const layouts = new Map()
const components = new Map()
const templateEngines: StagenyRenderEngine[] = [PugEngine, JavascriptEngine]
let savedPages: { [key: string]: string } = {}
let isPaused = false
let initialised = false
let perf: Perf
let currentRun: Promise<void> | null

const Stageny: StagenyBase = {
	async config(process: StagenyConfigProcessor | null = null) {
		if (process) {
			const result = await process(config)
			if (result) {
				Object.assign(config, result)
			}
			config.pages = normalizeInputs(config.pages)
			config.components = normalizeInputs(config.components)
			config.layouts = normalizeInputs(config.layouts)
		}
		return config
	},
	getConfig: () => config,
	init,
	get components() {
		return components
	},
	get layouts() {
		return layouts
	},
	get sitemap() {
		return pages
	},
	addEngine(engine) {
		templateEngines.push(engine)
	},
	isSupportedFile,
	run(options) {
		return runNext(options, run)
	},
	render(options) {
		return runNext(options, render)
	},
	pause() {
		isPaused = true
	},
	resume() {
		isPaused = false
	},
}

function runNext(options: RunOptions, runMethod = run) {
	if (currentRun) {
		if (config.verbose) console.log("Waiting for current run to finish ...")
		return new Promise((resolve, reject) => {
			currentRun &&
				currentRun.finally(() =>
					runMethod(options).then(resolve, reject)
				)
		})
	} else {
		if (config.verbose) console.log("Starting new run")
		currentRun = runMethod(options)
		currentRun.finally(() => {
			if (config.verbose) console.log("Cleaned run.")
			currentRun = null
		})
		return currentRun
	}
}

async function init() {
	if (!initialised) {
		await applyPlugins("init")
		return true
	}
	return false
}

async function run(options: RunOptions) {
	const overallPerf = new Perf()
	perf = new Perf()
	let perfMeasure

	if (isPaused) return
	await init()

	isPaused = true
	await applyPlugins("start")

	perfMeasure = overallPerf.start("Reading sitemap")
	await read()
	overallPerf.end(perfMeasure)

	perfMeasure = overallPerf.start("Sitemap plugins")
	await applyPlugins("sitemap", pages)
	// sort pages by url, this a) is nice and b) eases iterations
	// at this point no modification to sitemap should happen anymore
	pages.sort((a, b) => (a.url == b.url ? 0 : +(a.url > b.url) || -1))
	overallPerf.end(perfMeasure)

	perfMeasure = overallPerf.start("Rendering")
	await process(options)
	overallPerf.end(perfMeasure)

	await applyPlugins("end")

	overallPerf.print()
	if (config.verbose) {
		perf.print(true)
	}
	overallPerf.clean()
	perf.clean()

	isPaused = false
}

async function render(options: RunOptions) {
	const overallPerf = new Perf()
	let perfMeasure

	if (isPaused) return
	if (await init()) {
		return process(options)
	}

	isPaused = true

	perfMeasure = overallPerf.start("Rendering")
	await process(options)
	overallPerf.end(perfMeasure)

	overallPerf.print()
	overallPerf.clean()

	isPaused = false
}

function read() {
	return Promise.all([readComponents(), readLayouts(), readPages()])
}

async function process(options: RunOptions = {}) {
	// delete old pages
	pages.forEach((page) => {
		delete savedPages[page.url]
	})
	Object.values(savedPages).forEach((destination) => {
		unlink(destination)
	})
	savedPages = {}

	let pagesToProcess = pages
	if (options.filter) {
		pagesToProcess = pagesToProcess.filter(options.filter)
	}

	console.log(
		`Rendering ${pagesToProcess.length} out of ${pages.length} pages:`
	)

	for (let i = 0; i < pagesToProcess.length; i++) {
		const page = pagesToProcess[i]
		await processPage(page)
	}
}

async function unlink(path: string) {
	try {
		await FS.unlink(path)
	} catch (error) {
		// ignore
	}
}

async function processPage(file: StagenyFile) {
	console.log("📃 Rendering page", file.url)

	await applyPlugins("beforepageprocess", file)

	const initialData: Omit<StagenyData, "_locals"> = {
		...config.data,
		_stageny: Stageny,
		_page: file,
		_pages: pages,
		_captured: {},
		_data: config.data,
		component: function (name: string, options: Record<string, any> = {}) {
			const html = processComponent(name, options, mergedData)
			return html
		},
		capture: function (key: string, content: string) {
			mergedData._captured[key] = content
		},
		captured(key: string) {
			return mergedData._captured[key] || ""
		},
	}
	const mergedData: StagenyData = Object.assign(initialData as StagenyData, {
		_locals: initialData as StagenyData,
	})

	let result
	try {
		compileTemplate(file)

		await applyPlugins("beforepagedata", file, mergedData)
		if (file.meta && file.meta.data)
			Object.assign(mergedData, file.meta.data)
		file.meta = Frontmatter.process(file.meta, mergedData)
		Object.assign(mergedData, { _meta: file.meta })
		Object.assign(mergedData, file.meta.data)
		await applyPlugins("afterpagedata", file, mergedData)

		await applyPlugins("beforepagerender", file)
		result = processFile(file, mergedData)
		await applyPlugins("afterpagerender", file)
	} catch (error) {
		await applyPlugins("pageerror", file)
		console.error(
			"🚨 Problem processing",
			"\n  🎬",
			file.sourcePath,
			"\n  🎈",
			file.url
		)
		//console.log(file.renderFn.toString())
		if (error instanceof Error) {
			if (!error.stack || error.stack.indexOf(error.message) < 0) {
				console.error(error.message)
			}
			console.error(error.stack)
			result = renderError(error)
		}
	}

	// let's give plugins a chance to post process the result
	file.result = result
	file.destination = Path.join(config.dist, file.url)
	await applyPlugins("beforepagewrite", file)
	result = file.result

	mkdirp.sync(Path.dirname(file.destination))
	await FS.writeFile(file.destination, result || "")
	savedPages[file.url] = file.destination
	await applyPlugins("afterpagewrite", file)
	delete file.result
}

function processComponent(
	name: string,
	localData: Record<string, any>,
	globalData: StagenyData
) {
	const file = components.get(name)
	if (!file) {
		throw new Error("Could not find component " + name)
	}
	const perfItem = perf.start(`Component ${name}`)
	compileData(file)

	const data = {
		...globalData,
		get _args() {
			if (config.verbose) console.log("Usage of _args is deprecated")
			return localData
		}, // deprecated
		_props: localData,
		...file.meta,
		...localData,
	}

	data._locals = data

	const meta = Frontmatter.process(file.meta, data)

	const result = processFile(file, Object.assign({}, data, meta, localData))
	perf.end(perfItem)
	return result
}

function processLayout(name: string, data: StagenyData) {
	const file = layouts.get(name)
	if (!file) {
		throw new Error("Could not find layout " + name)
	}
	compileData(file)

	// we want _meta to be layout._meta + page._meta
	// (page or super layout overrides layout)
	const mergedData = Object.assign({}, data)
	if (file.meta && file.meta.data)
		Object.assign(mergedData, file.meta.data, mergedData._meta.data || {})
	file.meta = Frontmatter.process(file.meta, mergedData)
	if (!mergedData._meta.data) mergedData._meta.data = {}

	assignIfNot(mergedData._meta, file.meta)
	assignIfNot(mergedData._meta.data, file.meta.data || {})
	Object.assign(mergedData, mergedData._meta.data)

	const result = processFile(file, mergedData)
	return result
}

function assignIfNot(target: Record<string, any>, source: Record<string, any>) {
	for (let key in source) {
		if (!Object.hasOwnProperty.call(target, key)) {
			target[key] = source[key]
		}
	}
}

function processFile(file: StagenyFile, data: StagenyData): string {
	try {
		compileTemplate(file)
	} catch (error) {
		throw new Error(
			`Error compiling file ${file.sourcePath}:\n${error.message}`
		)
	}
	if (!file.render)
		throw new Error("No render function found for " + file.sourcePath)
	if (typeof file.render !== "function")
		throw new Error(
			"Render function is not a function for " + file.sourcePath
		)
	let result
	try {
		result = file.render(data)
	} catch (error) {
		throw new Error(
			`Error rendering file ${file.sourcePath}:\n${error.message}`
		)
	}

	compileData(file)

	const layoutName = file.meta.layout
	if (layoutName) {
		result = processLayout(
			layoutName,
			Object.assign({}, data, { content: result })
		)
	}

	return result
}

function compileTemplate(file: StagenyFile) {
	if (!file.render) {
		const perfItem = perf.start("Compile")
		const engine = getEngineForFile(file)
		if (typeof file.extension === "undefined")
			file.extension = getExtension(file.sourcePath!)
		const engineOptions = config.engineOptions[file.extension || ""]
		if (!engine) {
			throw new Error("Found no engine for " + file.sourcePath)
		}
		file.render = engine.compile(file, engineOptions)
		perf.end(perfItem)
	}
}
function compileData(file: StagenyFile) {
	if (!file.meta) {
		file.meta = Frontmatter.compile(file.rawMeta)
	}
}

async function readComponents() {
	const hash: Record<string, boolean> = {}
	const files = await readFiles(config.components)
	components.clear()
	files.forEach((file) => {
		let name = config.componentName(file)
		// file.name = name

		if (hash[name]) {
			console.warn("Duplicate component", name)
		} else {
			hash[name] = true
		}
		if (!components.has(name)) {
			components.set(name, file)
		}
	})
	console.log(
		Colorize.green(String(components.size).padStart(6)),
		"components"
	)
}

async function readLayouts() {
	const hash: Record<string, boolean> = {}
	const files = await readFiles(config.layouts)
	layouts.clear()
	files.forEach((file) => {
		let name = config.layoutName(file)
		// file.name = name

		if (hash[name]) {
			console.warn("Duplicate layout", name)
		} else {
			hash[name] = true
		}
		layouts.set(name, file)
	})
	console.log(Colorize.green(String(layouts.size).padStart(6)), "layouts")
}

async function readPages() {
	pages.length = 0
	const files = await readFiles(config.pages)
	files.forEach((file) => {
		// let's make sure there's initally always a meta.data object
		if (file.meta && !file.meta.data) {
			file.meta.data = {}
		} else if (file.rawMeta && !file.rawMeta.data) {
			file.rawMeta.data = {}
		}
		compileData(file)
		file.url = file.url.replace(/\.\w+$/, "")
		if (!getExtension(file.url)) {
			file.url += ".html"
		}
		if (pages.find((page) => page.url === file.url)) {
			console.warn("Duplicate page", file.url)
		} else {
			if (config.verbose) console.log("Add page", file.url)
			pages.push(file)
		}
	})
	console.log(Colorize.green(String(pages.length).padStart(6)), "pages")
}

async function readFiles(minmalInputs: any, filter = null) {
	const inputs: GlobInputs[] = normalizeInputs(minmalInputs)
	let result: Promise<StagenyFile>[] = []
	for (let i = 0; i < inputs.length; i++) {
		const input = inputs[i]
		let paths = await globby(input.glob, { cwd: input.base || "." })
		paths = paths.filter((path) => {
			const ext = getExtension(path)
			if (!ext) return false
			return config.formats.includes(ext)
		})
		if (filter) {
			paths = paths.filter(filter)
		}
		if (config.verbose) console.log(paths.length, input.glob, input.base)
		result = result.concat(paths.map((path) => readFile(path, input)))
	}
	return Promise.all(result)
}

function isSupportedFile(path: string) {
	const ext = getExtension(path)
	return !!(
		ext &&
		config.formats.includes(ext) &&
		getEngineForFile({ sourcePath: path })
	)
}

async function readFile(
	path: string,
	{ base, dest }: GlobInputs
): Promise<StagenyFile> {
	const file = {
		sourcePath: Path.join(base, path),
		url: Path.join(dest, path),
	}
	if (file.url.charAt(0) !== "/") {
		file.url = "/" + file.url
	}
	const engine = getEngineForFile(file)
	if (engine && engine.read) {
		let { data, content } = await engine.read(file.sourcePath)
		Object.assign(file, {
			content,
			meta: Object.assign({}, data),
		})
	} else {
		const rawContent = (await FS.readFile(file.sourcePath)).toString()
		let matter = { data: {}, content: rawContent }
		try {
			matter = Frontmatter.extract(rawContent)
		} catch (e) {
			throw new Error(
				"Error extracting frontmatter from " +
					file.sourcePath +
					": " +
					e.message
			)
		}
		Object.assign(file, {
			raw: rawContent,
			content: matter.content,
			rawMeta: Object.assign({}, matter.data),
		})
	}
	return file as StagenyFile
}

const engineLookupCache: Record<
	string,
	{ engine: StagenyRenderEngine; extension: string | undefined }
> = {}

function getEngineForFile(file: { sourcePath?: string; extension?: string }) {
	let extension: string | undefined, engine: StagenyRenderEngine | undefined

	if (!file.sourcePath) return

	if (engineLookupCache[file.sourcePath]) {
		const { engine, extension } = engineLookupCache[file.sourcePath]
		file.extension = extension
		return engine
	}

	extension = getExtension(file.sourcePath)
	file.extension = extension

	// let's try to find in registered handlers
	engine = templateEngines.find((h) => {
		if (h.matchFile) {
			return h.matchFile(file as StagenyFile)
		}
		for (let format of h.inputFormats || []) {
			if (format === extension) {
				return true
			}
		}
	})
	if (!engine) {
		const handler = findJstransformer(extension)
		if (handler) {
			const transformer = jstransformer(handler)
			if (transformer.compile) {
				engine = {
					compile(file: StagenyFile) {
						return transformer.compile(file.content).fn
					},
				}
			} else if (transformer.render) {
				engine = {
					compile(file: StagenyFile) {
						return function (data?: StagenyData) {
							return transformer.render(file.content, data)
								.body as string
						}
					},
				}
			}
		}
	}
	if (engine) engineLookupCache[file.sourcePath] = { engine, extension }
	return engine
}

function getExtension(path: string): string | undefined {
	const extensionMatch = path.match(/\.(\w+)$/)
	if (extensionMatch) {
		return extensionMatch[1]
	}
}

async function applyPlugins(key: keyof StagenyPlugin, ...rest: any[]) {
	for (let plugin of config.plugins) {
		if (plugin[key]) {
			const pluginFunc: StagenyPluginFunction<any[]> = plugin[key]!
			await pluginFunc.apply(Stageny, rest)
		}
		if (plugin.all) {
			await plugin.all.apply(Stageny, [key].concat(rest))
		}
	}
}

export default Stageny
