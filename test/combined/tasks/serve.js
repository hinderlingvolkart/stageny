const Stageny = require(`./base`)
const { default: StagenyServe } = require(`@stageny/plugin-serve`)
const { default: StagenyWatch } = require(`@stageny/plugin-watch`)

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
