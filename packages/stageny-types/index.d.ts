export interface StagenyBase {
	config: (process: StagenyConfigProcessor | null = null) => StagenyConfig
	init: () => boolean
	components: any
	layouts: any
	sitemap: any[]
	addEngine: (StagenyRenderEngine) => void
	run: (RunOptions) => Promise<any>
	render: (RunOptions) => Promise<any>
	pause: () => void
	resume: () => void
	isSupportedFile: (path: string) => boolean
}

export interface StagenyFile {
	meta: StagenyData
	rawMeta: StagenyData
	url: string
	sourcePath?: string
	content?: string
	result?: string
	destination?: string
}

export type StagenyData = { [key: string]: any }

export type StagenyFileNamer = (file: StagenyFile) => string

export interface StagenyConfig {
	components: MinimalGlobInputs | MinimalGlobInputs[]
	pages: MinimalGlobInputs | MinimalGlobInputs[]
	layouts: MinimalGlobInputs | MinimalGlobInputs[]
	componentName: StagenyFileNamer
	layoutName: StagenyFileNamer
	data: object
	formats: string[]
	engineOptions: object
	plugins: any[]
	dist: string
	verbose: boolean
	alwaysRebuildSitemap: boolean
}

export interface StagenyRenderEngine {
	read?: (source: string) => {
		data: StagenyData
		content: string
	}
	compile: (
		file: StagenyFile,
		options?: any
	) => (data?: StagenyData) => string
	inputFormats: string[]
	outputFormat: string
}

export interface RunOptions {
	filter?: any
}

export interface MinimalGlobInputs {
	glob?: string[] | string
	base?: string
	dest?: string
}

export interface GlobInputs {
	glob: string[] | string
	base: string
	dest: string
}
