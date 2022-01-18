module.exports = [
  {
    "type": "Mixin",
    "name": "Component",
    "args": "key, options = { }",
    "block": {
      "type": "Block",
      "nodes": [
        {
          "type": "Conditional",
          "test": "block",
          "consequent": {
            "type": "Block",
            "nodes": [
              {
                "type": "Code",
                "val": "const beforeHtml = pug_html; // save the current HTML state in a variable",
                "buffer": false,
                "mustEscape": false,
                "isInline": false,
                "line": 3,
                "column": 3,
                "filename": "ComponentMixin.pug"
              },
              {
                "type": "MixinBlock",
                "line": 4,
                "column": 3,
                "filename": "ComponentMixin.pug"
              },
              {
                "type": "Code",
                "val": "options.content = pug_html.substr(beforeHtml.length)\npug_html = beforeHtml",
                "buffer": false,
                "mustEscape": false,
                "isInline": false,
                "line": 5,
                "column": 3,
                "filename": "ComponentMixin.pug"
              }
            ],
            "line": 3,
            "filename": "ComponentMixin.pug"
          },
          "alternate": null,
          "line": 2,
          "column": 2,
          "filename": "ComponentMixin.pug"
        },
        {
          "type": "Conditional",
          "test": "attributes",
          "consequent": {
            "type": "Block",
            "nodes": [
              {
                "type": "Code",
                "val": "options = Object.assign({ attributes }, attributes, options)",
                "buffer": false,
                "mustEscape": false,
                "isInline": false,
                "line": 9,
                "column": 3,
                "filename": "ComponentMixin.pug"
              }
            ],
            "line": 9,
            "filename": "ComponentMixin.pug"
          },
          "alternate": null,
          "line": 8,
          "column": 2,
          "filename": "ComponentMixin.pug"
        },
        {
          "type": "Conditional",
          "test": "component",
          "consequent": {
            "type": "Block",
            "nodes": [
              {
                "type": "Code",
                "val": "component(key, options)",
                "buffer": true,
                "mustEscape": false,
                "isInline": false,
                "line": 12,
                "column": 3,
                "filename": "ComponentMixin.pug"
              }
            ],
            "line": 12,
            "filename": "ComponentMixin.pug"
          },
          "alternate": {
            "type": "Block",
            "nodes": [
              {
                "type": "Code",
                "val": "throw new Error('component function is missing')",
                "buffer": false,
                "mustEscape": false,
                "isInline": false,
                "line": 14,
                "column": 3,
                "filename": "ComponentMixin.pug"
              }
            ],
            "line": 14,
            "filename": "ComponentMixin.pug"
          },
          "line": 11,
          "column": 2,
          "filename": "ComponentMixin.pug"
        }
      ],
      "line": 2,
      "filename": "ComponentMixin.pug"
    },
    "call": false,
    "line": 1,
    "column": 1,
    "filename": "ComponentMixin.pug"
  },
  {
    "type": "Mixin",
    "name": "Capture",
    "args": "key, done = null",
    "block": {
      "type": "Block",
      "nodes": [
        {
          "type": "Conditional",
          "test": "block",
          "consequent": {
            "type": "Block",
            "nodes": [
              {
                "type": "Code",
                "val": "const beforeHtml = pug_html; // save the current HTML state in a variable",
                "buffer": false,
                "mustEscape": false,
                "isInline": false,
                "line": 19,
                "column": 3,
                "filename": "ComponentMixin.pug"
              },
              {
                "type": "MixinBlock",
                "line": 20,
                "column": 3,
                "filename": "ComponentMixin.pug"
              },
              {
                "type": "Code",
                "val": "content = pug_html.substr(beforeHtml.length)\npug_html = beforeHtml\nif (typeof done === 'function') {\n\tdone(content)\n} else\nif (typeof capture === 'function') {\n\tcapture(key, content)\n} else {\n\tthrow new Error('capture function is missing')\n}",
                "buffer": false,
                "mustEscape": false,
                "isInline": false,
                "line": 21,
                "column": 3,
                "filename": "ComponentMixin.pug"
              }
            ],
            "line": 19,
            "filename": "ComponentMixin.pug"
          },
          "alternate": null,
          "line": 18,
          "column": 2,
          "filename": "ComponentMixin.pug"
        }
      ],
      "line": 18,
      "filename": "ComponentMixin.pug"
    },
    "call": false,
    "line": 17,
    "column": 1,
    "filename": "ComponentMixin.pug"
  }
]