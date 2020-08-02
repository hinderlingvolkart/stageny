const Pug = require('pug');

const compiled = Pug.compileFile('ComponentMixin.pug', {
	plugins: [
		{
			preCodeGen(ast) {
				const result = JSON.stringify(ast.nodes, null, 2);
				require('fs').writeFileSync('ComponentMixin.js', `module.exports = ${result}`);

				return {
					type: 'Block',
					nodes: [],
				};
			},
		},
	],
	filename: 'ComponentMixin.pug',
});
