const Stageny = require("../index")
const Path = require("path")
const FS = require("fs")

try {
	FS.unlinkSync(Path.join(__dirname, "dist/index.html"))
} catch (e) {
	// ignore
}

Stageny.config((config) => {
	config.verbose = true
})
Stageny.run().then(() => {
	try {
		if (
			FS.readFileSync(
				Path.join(__dirname, "dist/index.html")
			).toString() !==
			`<!DOCTYPE html><html><head><title>Home</title></head><body><p id="intro">Just home is great</p><p id="desc">Just home</p><p id="meta-desc">That is the layout</p><h1>Home</h1><div class="A">Love you all</div><p class="B">B: And more</p></body></html>`
		) {
			throw new Error("Result does not match")
		}
		console.log("✅  Looks good")
	} catch (e) {
		console.log("Outsch --", e)
	}
})
