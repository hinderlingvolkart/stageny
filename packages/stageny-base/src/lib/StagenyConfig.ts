const Path = require("path")

import {
	MinimalGlobInputs,
	StagenyFile,
	StagenyConfig as StagenyConfigType,
	StagenyFileNamer,
	StagenyData,
	StagenyRenderEngine,
	StagenyPlugin,
} from "@stageny/types"

export default class StagenyConfig implements StagenyConfigType {
	components!: MinimalGlobInputs | MinimalGlobInputs[]
	pages!: MinimalGlobInputs | MinimalGlobInputs[]
	layouts!: MinimalGlobInputs | MinimalGlobInputs[]
	componentName!: StagenyFileNamer
	layoutName!: StagenyFileNamer
	data!: StagenyData
	formats!: string[]
	engineOptions!: any
	plugins!: StagenyPlugin[]
	dist!: string
	verbose!: boolean
	alwaysRebuildSitemap!: boolean

	constructor() {
		this.reset()
	}

	reset(): any {
		this.components = { glob: "**/*.*", base: "source/components" }
		this.pages = { glob: "**/*.*", base: "source/pages/" }
		this.layouts = { glob: "**/*.*", base: "source/layouts" }
		this.componentName = getFileName
		this.layoutName = getFileName
		this.data = {}
		this.formats = ["pug", "js"]
		this.engineOptions = {}
		this.plugins = []
		this.dist = "dist"
		this.verbose = false
		this.alwaysRebuildSitemap = true
	}
}

function getFileName(file: StagenyFile): string {
	return (
		(file.rawMeta && file.rawMeta.$name) ||
		(file.meta && file.meta.$name) ||
		Path.basename(file.url)
			.replace(/\.\w+$/, "")
			.replace(/^_/, "")
	)
}
