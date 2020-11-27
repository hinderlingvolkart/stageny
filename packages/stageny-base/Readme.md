## Introduction

Stageny (without plugins) is a basic but powerful static site generator that focuses on performance, versatility and simplicity. It has been born out of the wish for a (node/js only) replacement for Middleman.

It compiles pages written in many templates languages (but prefering PUG) into HTML. It does not compile to CSS or JS or anything else.

A page is built with those 4 elements

### Pages

A page has two parts: frontmatter data and the actual template. (JS is slightly special, see below).

The frontmatter will be parsed right away so you can use it for routing / sitemap. It will be accessible in templates via `_meta`. Put into `data` what you want to populate to the merged data object.

`i-am-a-page.html.pug`
```
---
title: I am a page
data:
  date*: new Date()
layout: default
---

h1 #{_meta.title} from #{date.toLocaleString()}
p With not much content
```

 or `i-am-a-page.html.js`
 ```
 module.exports = {
	 data: {
		 title: 'I am a page',
		 layout: 'default',
		 data: {
		 	date: () => new Date()
		 }
	 },
	 render(data) {
		 return `
			<h1>${data._meta.title} from ${data.date}</h1>
			<p>With not much content</p>
		`
	 }
 }
 ```

Stageny in its core supports Components and Layouts.

### Layouts

A page's frontmatter `layout: default` points to a specific layout:

`layouts/default.pug`:
```
html
	head
		title #{_meta.title}
	body
		!= content
```

A layout too can have frontmatter which will be overruled by the page (except for `layout` which you use to define a super layout).

### Components

Components must be uniquely named, no matter their file path. Frontmatter serves as default paramters.

`components/Button.pug`:
```
---
tag: button
content: Button
---

#{tag}.Button(type=(tag === 'button' && tag))!= content
```

`content` is a special parameter, at least in pug, as the slot will be put into it.

`page.html.pug`:
```
+Component('Button')
	i.Icon(data-icon="plus")
	| Add
```

`page.html.js`:
```
module.exports = function(data) {
	return data.component('Button', {
		content: `<i class="Icon" data-icon="plus"></i> Add`
	})
}
```




## Data

Data can be global or on a page level.

Data will be applied in this order:

- _page and internal component helper
- data and _data (if Data Plugin)
- helpers and _helpers (if Helper Plugin)
- page frontmatter (also via _page.meta)


## Page

- url
- meta
- content
- result
- render
- rawMeta



## Events / Plugins

Plugins (and helpers) can sneak into any of those events:

- init (before first run)
- on every run:
	- start
	- sitemap (array of pages)
	- for every page:
		- beforepageprocess (file)
		- beforepagedata (file, data)
		- afterpagedata (file, data)
		- beforepagerender (file)
		- afterpagerender (file)
		- afterpagewrite (file)
		- pageerror (file)
	- end
