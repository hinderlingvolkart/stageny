import Stageny from "./base.js"
import { default as StagenyServe } from "@stageny/plugin-serve"
import { default as StagenyWatch } from "@stageny/plugin-watch"

Stageny.config((config) => {
	config.plugins.push(StagenyServe())
	config.plugins.push(
		StagenyWatch({
			server: StagenyServe,
			path: ["source/data/*.*", "source/helpers/*.*"],
		})
	)
})

Stageny.run()
