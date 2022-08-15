export function importUncached(modulePath: string) {
	const hash = Date.now().toString()
	return import(`${modulePath}?v=${hash}`)
}
