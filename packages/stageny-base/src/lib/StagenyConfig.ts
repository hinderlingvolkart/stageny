import Path from "path"

import type {
	MinimalGlobInputs,
	StagenyFile,
	StagenyConfig as StagenyConfigType,
	StagenyFileNamer,
	StagenyPlugin,
	DataMap,
} from "@stageny/types"

export default class StagenyConfig implements StagenyConfigType {
	components!: MinimalGlobInputs | MinimalGlobInputs[]
	pages!: MinimalGlobInputs | MinimalGlobInputs[]
	layouts!: MinimalGlobInputs | MinimalGlobInputs[]
	componentName!: StagenyFileNamer
	layoutName!: StagenyFileNamer
	data!: DataMap
	formats!: string[]
	engineOptions!: any
	plugins!: StagenyPlugin[]
	dist!: string
	verbose!: boolean
	alwaysRebuildSitemap!: boolean
	writeToDisk!: boolean

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
		this.writeToDisk = true
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
