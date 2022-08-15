import Stageny from "../src/index.js"
import Path from "path"
import FS from "fs/promises"
import { dirname } from "@stageny/util"

async function build() {
	const __dirname = dirname(import.meta.url)

	try {
		await FS.unlink(Path.join(__dirname, "dist/index.html"))
	} catch (e) {
		// ignore
	}

	await Stageny.config((config) => {
		config.verbose = true
		config.data = {
			cms: ["you", "me"],
		}
	})

	// let's run them twice to make sure that concurrent calls don't lead to mistakes
	for (let i = 0; i < 2; i++) {
		await Stageny.run()
		try {
			if (
				(
					await FS.readFile(Path.join(__dirname, "dist/index.html"))
				).toString() !==
				`<!DOCTYPE html><html><head><title>Home</title></head><body><p id="intro">Just home is great</p><p id="desc">Just home</p><p id="meta-desc">That is the layout</p><h1>Home</h1><div class="A">Love you all</div><p class="cms">me</p><p class="B">B: And more</p><p class="cms">you,me</p></body></html>`
			) {
				throw new Error("Result does not match")
			}
			console.log("✅  Looks good")
		} catch (e) {
			console.log("Outsch --", e)
		}
	}
}

build()
