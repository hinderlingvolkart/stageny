import path from "path"
import { fileURLToPath } from "url"

/*
use like this:
const __dirname = dirname(import.meta.url)
*/

export function filename(url: string) {
	return fileURLToPath(url)
}

export function dirname(url: string) {
	return path.dirname(filename(url))
}

export default dirname
