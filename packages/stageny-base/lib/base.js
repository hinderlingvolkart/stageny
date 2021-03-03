const Frontmatter = require("./frontmatter")
const FS = require("fs").promises
const Glob = require("globby")
const Path = require("path")
const mkdirp = require("mkdirp")
const { Perf, Colorize, normalizeInputs } = require("@stageny/util")
const jstransformer = require("jstransformer")
const findJstransformer = require("inputformat-to-jstransformer")
const config = require("./config")
const PugEngine = require("@stageny/engine-pug")
const JavascriptEngine = require("@stageny/engine-js")
const { renderAsHtml: renderError } = require("./renderError")

const pages = []
const layouts = new Map()
const components = new Map()
const templateEngines = [PugEngine, JavascriptEngine]
let savedPages = {}
let isPaused = false
let initialised = false
let perf
let currentRun

const Stageny = {
	config(process = null) {
		if (process) {
			const result = process(config)
			if (result) {
				Object.assign(config, result)
			}
			config.pages = normalizeInputs(config.pages)
			config.components = normalizeInputs(config.components)
			config.layouts = normalizeInputs(config.layouts)
		}
		return config
	},
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
		runNext(options, run)
	},
	render(options) {
		runNext(options, render)
	},
	pause() {
		isPaused = true
	},
	resume() {
		isPaused = false
	},
}

function runNext(options, runMethod = run) {
	if (currentRun) {
		if (config.verbose) console.log("Waiting for current run to finish ...")
		return new Promise((resolve, reject) => {
			currentRun.finally(() => runMethod(options).then(resolve, reject))
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

function init() {
	if (!initialised) {
		applyPlugins("init")
		return true
	}
	return false
}

async function run(options) {
	const overallPerf = new Perf()
	perf = new Perf()
	let perfMeasure

	if (isPaused) return
	await init()

	isPaused = true
	applyPlugins("start")

	perfMeasure = overallPerf.start("Reading sitemap")
	await read()
	overallPerf.end(perfMeasure)

	perfMeasure = overallPerf.start("Sitemap plugins")
	applyPlugins("sitemap", pages)
	// sort pages by url, this a) is nice and b) eases iterations
	// at this point no modification to sitemap should happen anymore
	pages.sort((a, b) => (a.url == b.url ? 0 : +(a.url > b.url) || -1))
	overallPerf.end(perfMeasure)

	perfMeasure = overallPerf.start("Rendering")
	await process(options)
	overallPerf.end(perfMeasure)

	applyPlugins("end")

	overallPerf.print()
	if (config.verbose) {
		perf.print(true)
	}
	overallPerf.clean()
	perf.clean()

	isPaused = false
}

async function render(options) {
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

async function process(options = {}) {
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

async function unlink(path) {
	try {
		await FS.unlink(path)
	} catch (error) {
		// ignore
	}
}

async function processPage(file) {
	console.log("📃 Rendering page", file.url)

	applyPlugins("beforepageprocess", file)

	const mergedData = {}
	Object.assign(
		mergedData,
		config.data,
		{
			_stageny: Stageny,
			_page: file,
			_pages: pages,
			_captured: {},
			_data: config.data,
			_locals: mergedData,
		},
		{
			component: function (name, options) {
				const html = processComponent(name, options, mergedData)
				return html
			},
			capture: function (key, content) {
				mergedData._captured[key] = content
			},
			captured(key) {
				return mergedData._captured[key] || ""
			},
		}
	)

	let result
	try {
		compileTemplate(file)

		applyPlugins("beforepagedata", file, mergedData)
		Object.assign(mergedData, config.data, { _data: config.data })
		if (file.meta && file.meta.data)
			Object.assign(mergedData, file.meta.data)
		file.meta = Frontmatter.process(file.meta, mergedData)
		Object.assign(mergedData, { _meta: file.meta })
		Object.assign(mergedData, file.meta.data)
		applyPlugins("afterpagedata", file, mergedData)

		applyPlugins("beforepagerender", file)
		result = processFile(file, mergedData)
		applyPlugins("afterpagerender", file)
	} catch (error) {
		applyPlugins("pageerror", file)
		console.error(
			"🚨 Problem processing",
			"\n  🎬",
			file.sourcePath,
			"\n  🎈",
			file.url
		)
		//console.log(file.renderFn.toString())
		if (!error.stack || error.stack.indexOf(error.message) < 0) {
			console.error(error.message)
		}
		console.error(error.stack)
		result = renderError(error)
	}

	if (result === false) {
		throw new Error("Found not transformer for " + file.sourcePath)
	}

	// let's give plugins a chance to post process the result
	file.result = result
	file.destination = Path.join(config.dist, file.url)
	applyPlugins("beforepagewrite", file)
	result = file.result

	mkdirp.sync(Path.dirname(file.destination))
	await FS.writeFile(file.destination, result)
	savedPages[file.url] = file.destination
	applyPlugins("afterpagewrite", file)
	delete file.result
}

function processComponent(name, localData, globalData) {
	const file = components.get(name)
	if (!file) {
		throw new Error("Could not find component " + name)
	}
	const perfItem = perf.start(`Component ${name}`)
	compileData(file)

	const data = {}
	Object.assign(
		data,
		globalData,
		{
			_locals: data,
			_args: localData,
		},
		file.meta,
		localData
	)

	const meta = Frontmatter.process(file.meta, data)

	const result = processFile(file, Object.assign({}, data, meta, localData))
	if (result === false) {
		throw new Error(`Missing transformer for ${file.sourcePath}`)
	}
	perf.end(perfItem)
	return result
}

function processLayout(name, data) {
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
	if (result === false) {
		throw new Error(`Missing transformer for ${file.sourcePath}`)
	}
	return result
}

function assignIfNot(target, source) {
	for (let key in source) {
		if (!target.hasOwnProperty(key)) {
			target[key] = source[key]
		}
	}
}

function processFile(file, data = {}) {
	compileTemplate(file)
	let result = file.render(data)

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

function compileTemplate(file) {
	if (!file.render) {
		const perfItem = perf.start("Compile")
		const engine = getEngineForFile(file)
		if (typeof file.extension === "undefined")
			file.extension = getExtension(file.sourcePath)
		const engineOptions = config.engineOptions[file.extension]
		if (!engine) return false
		file.render = engine.compile(file, engineOptions)
		perf.end(perfItem)
	}
}
function compileData(file) {
	if (!file.meta) {
		file.meta = Frontmatter.compile(file.rawMeta)
	}
}

async function readComponents() {
	const hash = {}
	const files = await readFiles(config.components)
	components.clear()
	files.forEach((file) => {
		let name = config.componentName(file)
		file.name = name

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
	const hash = {}
	const files = await readFiles(config.layouts)
	layouts.clear()
	files.forEach((file) => {
		let name = config.layoutName(file)
		file.name = name

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
	const pathTest = /\.\w+\.\w+$/ // we want two extensions
	const files = await readFiles(config.pages, (path) => pathTest.test(path))
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

async function readFiles(inputs, filter = null) {
	inputs = normalizeInputs(inputs)
	let result = []
	for (let i = 0; i < inputs.length; i++) {
		const input = inputs[i]
		let paths = await Glob(input.glob, { cwd: input.base || "." })
		paths = paths.filter((path) =>
			config.formats.includes(getExtension(path))
		)
		if (filter) {
			paths = paths.filter(filter)
		}
		if (config.verbose) console.log(paths.length, input.glob, input.base)
		result = result.concat(paths.map((path) => readFile(path, input)))
	}
	return Promise.all(result)
}

function isSupportedFile(path) {
	return !!(
		config.formats.includes(getExtension(path)) &&
		getEngineForFile({ sourcePath: path })
	)
}

async function readFile(path, { base, dest, data: defaultData }) {
	const file = {
		sourcePath: Path.join(base, path),
		url: Path.join(dest, path),
	}
	if (file.url.charAt(0) !== "/") {
		file.url = "/" + file.url
	}
	const engine = getEngineForFile(file)
	if (engine && engine.read) {
		let { data, content } = engine.read(file.sourcePath)
		Object.assign(file, {
			content,
			meta: Object.assign({}, defaultData, data),
		})
	} else {
		const rawContent = (await FS.readFile(file.sourcePath)).toString()
		const matter = Frontmatter.extract(rawContent)
		Object.assign(file, {
			raw: rawContent,
			content: matter.content,
			rawMeta: Object.assign({}, defaultData, matter.data),
		})
	}
	return file
}

function getExtension(path) {
	const extensionMatch = path.match(/\.(\w+)$/)
	if (extensionMatch) {
		return extensionMatch[1]
	}
}

const engineLookupCache = {}

function getEngineForFile(file) {
	let extension, handler

	if (engineLookupCache[file.sourcePath]) {
		let { handler, extension } = engineLookupCache[file.sourcePath]
		file.extension = extension
		return handler
	}

	extension = getExtension(file.sourcePath)
	file.extension = extension

	// let's try to find in registered handlers
	handler = templateEngines.find((h) => {
		if (h.matchFile) {
			return h.matchFile(file)
		}
		for (let format of h.inputFormats || []) {
			if (format === extension) {
				return true
			}
		}
	})
	if (!handler) {
		handler = findJstransformer(extension)
		if (handler) {
			handler = jstransformer(handler)
		}
		if (handler.compile) {
			handler = {
				compile(file) {
					return handler.compile(file.content).fn
				},
			}
		} else if (handler.render) {
			handler = {
				compile: function (file) {
					return function (data) {
						return handler.render(file.content, data).body
					}
				},
			}
		}
	}
	if (!handler) handler = false
	engineLookupCache[file.sourcePath] = { handler, extension }
	return handler
}

function getExtension(path) {
	const match = path.match(/\.(\w+)$/)
	if (match) return match[1]
	return ""
}

function applyPlugins(key, ...rest) {
	config.plugins.forEach((plugin) => {
		if (plugin[key]) {
			plugin[key].apply(Stageny, rest)
		}
		if (plugin.all) {
			plugin.all.apply(Stageny, [key].concat(rest))
		}
	})
}

module.exports = Stageny
