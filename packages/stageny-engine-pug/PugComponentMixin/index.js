const ComponentMixin = require('./ComponentMixin');

module.exports = function () {
	return {
		preCodeGen(ast, options) {
			ast.nodes.unshift.apply(ast.nodes, ComponentMixin);
			return ast;
		},
	};
};
