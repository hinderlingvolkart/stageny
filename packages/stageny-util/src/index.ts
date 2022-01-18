import { default as cloneObject } from "./lib/cloneObject"
import { default as normalizeInputs } from "./lib/normalizeInputs"
import { default as Perf } from "./lib/perf"

export { cloneObject, normalizeInputs, Perf }

export function log(...rest: any) {
	console.log.apply(null, rest)
}

export * as Colorize from "ansi-colors"
