const Stageny = require(`./base`)
const StagenyServe = require(`@stageny/plugin-serve`)
const StagenyWatch = require(`@stageny/plugin-watch`)

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
