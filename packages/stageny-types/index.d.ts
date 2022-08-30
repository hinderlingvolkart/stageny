export type OptionalPromise<T> = T | Promise<T>
export interface StagenyBase {
	config: (
		process: StagenyConfigProcessor | null = null
	) => Promise<StagenyConfig>
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

export type StagenyData = DataMap & {
	_stageny: StagenyBase
	_page: StagenyFile
	_pages: StagenyFile[]
	_captured: Record<string, string>
	_data: DataMap
	_locals: StagenyData
	component: (name: string, options: DataMap) => string
	capture: (key: string, content: string) => void
	captured: (key: string) => string | undefined
}

export type DataMap = Record<string, any>

export type StagenyFileNamer = (file: StagenyFile) => string

export interface StagenyConfig {
	components: MinimalGlobInputs | MinimalGlobInputs[]
	pages: MinimalGlobInputs | MinimalGlobInputs[]
	layouts: MinimalGlobInputs | MinimalGlobInputs[]
	componentName: StagenyFileNamer
	layoutName: StagenyFileNamer
	data: Record<string, any>
	formats: string[]
	engineOptions: Record<string, object>
	plugins: StagenyPlugin[]
	dist: string
	verbose: boolean
	alwaysRebuildSitemap: boolean
}

type StagenyConfigProcessor = (
	config: StagenyConfig
) => OptionalPromise<StagenyConfig | void>

export type StagenyPluginFunction<T = []> = (
	this: StagenyBase,
	...rest: T
) => void | Promise<void>
export type StagenyPluginFunctionFile = StagenyPluginFunction<[StagenyFile]>
export type StagenyPluginFunctionFiles = StagenyPluginFunction<[StagenyFile[]]>
export type StagenyPluginFunctionFileData = StagenyPluginFunction<
	[StagenyFile, StagenyData]
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

export type StagenyHelper = Function & Partial<StagenyPluginListener>

export interface StagenyPluginListener {
	on: StagenyPluginListenerFunction<"init">
	on: StagenyPluginListenerFunction<"start">
	on: StagenyPluginListenerFunction<"end">
	on: StagenyPluginListenerFunction<"sitemap">
	on: StagenyPluginListenerFunction<"beforepageprocess">
	on: StagenyPluginListenerFunction<"beforepagedata">
	on: StagenyPluginListenerFunction<"afterpagedata">
	on: StagenyPluginListenerFunction<"beforepagerender">
	on: StagenyPluginListenerFunction<"afterpagerender">
	on: StagenyPluginListenerFunction<"pageerror">
	on: StagenyPluginListenerFunction<"beforepagewrite">
	on: StagenyPluginListenerFunction<"afterpagewrite">
	on: StagenyPluginListenerFunction<"all">
}

export type StagenyPluginListener<T> = (
	event: T,
	callback: StagenyPlugin[T]
) => void

export interface StagenyRenderEngine<T = any> {
	read?: (source: string) => OptionalPromise<{
		data: StagenyData
		content: T
	}>
	compile: (
		file: StagenyFile<T>,
		options?: any
	) => (data?: StagenyData) => string
	matchFile?: (file: StagenyFile) => boolean
	inputFormats?: string[]
	outputFormat?: string
}

type FilterFunction<T = any> = (page: T, index: Number, source: T[]) => boolean
export interface RunOptions {
	filter?: FilterFunction<StagenyFile>
}

type MinimalGlobInputs = Partial<GlobInputs>
export interface GlobInputs {
	glob: string[] | string
	base: string
	dest: string
}
