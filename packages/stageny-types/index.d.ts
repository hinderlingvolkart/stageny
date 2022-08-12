export interface StagenyBase {
	config: (
		process: StagenyConfigProcessor | null = null
	) => Promise<StagenyConfig> | StagenyConfig
	getConfig: () => StagenyConfig
	init: () => Promise<boolean>
	components: any
	layouts: any
	sitemap: StagenyFile[]
	addEngine: (StagenyRenderEngine) => void
	run: (RunOptions?) => Promise<any>
	render: (RunOptions?) => Promise<any>
	pause: () => void
	resume: () => void
	isSupportedFile: (path: string) => boolean
}

export interface StagenyFile<T = any> {
	meta: StagenyData
	rawMeta: StagenyData
	url: string
	sourcePath?: string
	content?: T
	result?: string
	destination?: string
	extension?: string
	render?: (data: StagenyData) => string
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

export type StagenyPluginFunction<T = []> = (
	this: StagenyBase,
	...rest: T
) => void | Promise<void>
export type StagenyPluginFunctionFile = StagenyPluginFunction<[StagenyFile]>
export type StagenyPluginFunctionFiles = StagenyPluginFunction<[StagenyFile[]]>
export type StagenyPluginFunctionFileData = StagenyPluginFunction<
	[StagenyFile, any]
>
export interface StagenyPlugin {
	init?: StagenyPluginFunction
	start?: StagenyPluginFunction
	end?: StagenyPluginFunction
	sitemap?: StagenyPluginFunctionFiles
	beforepageprocess?: StagenyPluginFunctionFile
	beforepagedata?: StagenyPluginFunctionFileData
	afterpagedata?: StagenyPluginFunctionFileData
	beforepagerender?: StagenyPluginFunctionFile
	afterpagerender?: StagenyPluginFunctionFile
	pageerror?: StagenyPluginFunctionFile
	beforepagewrite?: StagenyPluginFunctionFile
	afterpagewrite?: StagenyPluginFunctionFile
	all?: (this: StagenyBase, ...rest: any) => void
}

export interface StagenyHelper extends Function {
	on?: (event: string, callback: Function) => void
}

export interface StagenyRenderEngine<T = any> {
	read?: (source: string) => {
		data: StagenyData
		content: T
	}
	compile: (
		file: StagenyFile<T>,
		options?: any
	) => (data?: StagenyData) => string
	matchFile?: (file: StagenyFile) => boolean
	inputFormats?: string[]
	outputFormat?: string
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
