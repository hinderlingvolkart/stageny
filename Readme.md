![Stageny Logo](extra/logo.svg)

# Stageny

Simple static site generator

-   template language agnostic (but focused on PUG)
-   focus on HTML only
-   supports layouts and components / partials
-   rather fast
-   simple core, extensible via plugins
-   focus on frontend development rather than Blogs

## Mono Repo

We keep plugins, engines and our core as separate NPM modules, but have them in a single mono repo (inspired by babel, react etc.). We use Lerna to make this kind of structure work easy for the developer.

### Install

```
yarn
yarn run bootstrap
```

[lerna bootstrap](https://github.com/lerna/lerna/tree/master/commands/bootstrap#readme) will install all dependencies in all packages, but will on top symlink all packasges between each other, greatly simlifying development.

### Update Stageny

Once you've improved anything, you first have to commit and push the change to the repository. Once you've done that, you call `npm run version`. Now you can patch the version of the changed packages.

If you're all set, you can publish to NPM: `npm run publish`

Please be extra cautious, because right now we've not set up a testing.

## Packages

-   [@stageny/base](./packages/stageny-base/)
-   [@stageny/util](./packages/stageny-util/)
-   [@stageny/engine-js](./packages/stageny-engine-js/)
-   [@stageny/engine-pug](./packages/stageny-engine-pug/)
-   [@stageny/plugin-data](./packages/stageny-plugin-data/)
-   [@stageny/plugin-helpers](./packages/stageny-plugin-helpers/)
-   [@stageny/plugin-i18n](./packages/stageny-plugin-i18n/)
-   [@stageny/plugin-pagination](./packages/stageny-plugin-pagination/)
-   [@stageny/plugin-serve](./packages/stageny-plugin-serve/)
-   [@stageny/plugin-watch](./packages/stageny-plugin-watch/)

## How to use

Let's start real simple:

```
npm init -y
npm install @stageny/base
mkdir source; mkdir source/pages
echo "p Hello world" > source/pages/index.html.pug
node -e "require('@stageny/base').run()"
```

In most projects you want to work with layouts, components and pages at the very least. Your setup will look like this:

```
source
  components
    List.pug
	Paragraph.pug
	Teaser.pug
  layouts
    base.pug
	default.pug
  pages
    index.html.pug
	portfolio
	  index.html.pug
	  project1.html.md
	  project2.html.md
```

A slightly more advanced setup will make use of plugins for data and helpers (and locales and pagination):

```
source
  helpers
    url_for.js
	get_uid.js
	include_file.js
  data
    site.json
	cms.json
  components
    ...
  layouts
    ...
  pages
    ...
```
