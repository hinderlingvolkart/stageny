Adds some crazy useful mixins to every pug template.


## `+Component(name, options = {})`

```
+Component("Name", { title: "Hello", text: "world" })(text="you" variant="new")
	p So fancy, isn't it.
```

is the equivalent to:

```
!= component("Name", { content: "<p>So fancy, isn't it.</p>", title: "Hello", text: "world", variant: "new", attributes: { text: "you", variant: "new" } })
```

So basically we do:

```
mergedOptions = Object.assign(
	{},
	attributes,
	options,
	{ content: block() }
)

and then:

!= component(name, mergedOptions)
```


## `+Capture(key, callback = null)`

```
+Capture('paragraph')
	p Hello world
```

is the equivalent to:

```
- capture('paragraph', '<p>Hello world</p>)
```

For a documentation of `capture` and `component` see @stageny/base.
