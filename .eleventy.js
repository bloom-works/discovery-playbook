const { DateTime } = require('luxon');
const fs = require('fs');
const pluginRss = require('@11ty/eleventy-plugin-rss');
const pluginSyntaxHighlight = require('@11ty/eleventy-plugin-syntaxhighlight');
const pluginNavigation = require('@11ty/eleventy-navigation');
const pluginTOC = require('eleventy-plugin-nesting-toc');
const markdownLibrary = require('./markdown');

const CalloutComponent = require('./_includes/components/Callout')
const ChecklistComponent = require('./_includes/components/Checklist.js');
const KeyQuestionsComponent = require('./_includes/components/KeyQuestions.js');
const GridComponent = require('./_includes/components/Grid');
const GridColumnComponent = require('./_includes/components/GridColumn');
const PageHeaderComponent = require('./_includes/components/PageHeader');
const PaginationComponent = require('./_includes/components/Pagination.js');
const PrivateLinkComponent = require('./_includes/components/PrivateLink.js');
const ResourcePrivateComponent = require('./_includes/components/ResourcePrivate');
const ResourcePublicComponent = require('./_includes/components/ResourcePublic');
const ResourceGroupComponent = require('./_includes/components/ResourceGroup');
const TableOfContentsComponent = require('./_includes/components/TableOfContents');

module.exports = function (eleventyConfig) {
  // Add plugins
  eleventyConfig.addPlugin(pluginRss);
  eleventyConfig.addPlugin(pluginSyntaxHighlight);
  eleventyConfig.addPlugin(pluginNavigation);
  eleventyConfig.addPlugin(pluginTOC, {
    tags: ['h2'],
    wrapper: 'div',
    wrapperClass: 'l-stack'
  });

  // https://www.11ty.dev/docs/data-deep-merge/
  eleventyConfig.setDataDeepMerge(true);

  eleventyConfig.addFilter('readableDate', dateObj => {
    return DateTime.fromJSDate(dateObj, { zone: 'utc' }).toFormat('dd LLL yyyy');
  });

  // https://html.spec.whatwg.org/multipage/common-microsyntaxes.html#valid-date-string
  eleventyConfig.addFilter('htmlDateString', (dateObj) => {
    return DateTime.fromJSDate(dateObj, { zone: 'utc' }).toFormat('yyyy-LL-dd');
  });

  // Get the first `n` elements of a collection.
  eleventyConfig.addFilter('head', (array, n) => {
    if (n < 0) {
      return array.slice(n);
    }

    return array.slice(0, n);
  });

  // Return the smallest number argument
  eleventyConfig.addFilter('min', (...numbers) => {
    return Math.min.apply(null, numbers);
  });

  eleventyConfig.addFilter('filterTagList', tags => {
    // should match the list in tags.njk
    return (tags || []).filter(tag => ['all', 'nav'].indexOf(tag) === -1);
  })

  // Create an array of all tags
  eleventyConfig.addCollection('tagList', function (collection) {
    const tagSet = new Set();
    collection.getAll().forEach(item => {
      (item.data.tags || []).forEach(tag => tagSet.add(tag));
    });

    return [...tagSet];
  });

  // Combines metadata on pages that use the section layout with the ordering in the table of contents file
  // Is used to generate nav items and get metadata on page ordering
  eleventyConfig.addCollection('sections', collection => {
    const tableOfContentsData = require('./_data/table_of_contents.json');

    const combinedData = tableOfContentsData.map((fileSlug, index) => {
      const matchingPage = collection.getAll().find(item => item.page.fileSlug === fileSlug);
      return {
        data: matchingPage.data,
        page: matchingPage.page,
        order: index
      };
    });

    return combinedData;
  });

  // Copy the `img` and `css` folders to the output
  eleventyConfig.addPassthroughCopy('img');
  eleventyConfig.addPassthroughCopy('css');

  // Customize Markdown library and settings:
  eleventyConfig.setLibrary('md', markdownLibrary);

  // Override Browsersync defaults (used only with --serve)
  eleventyConfig.setBrowserSyncConfig({
    callbacks: {
      ready: function (err, browserSync) {
        const contentHTML404 = fs.readFileSync('_site/404.html');
        console.log('Inside 404 error', err);

        browserSync.addMiddleware('*', (req, res) => {
          // Provides the 404 content without redirect.
          res.writeHead(404, { 'Content-Type': 'text/html; charset=UTF-8' });
          res.write(contentHTML404);
          res.end();
        });
      }
    },
    ui: false,
    ghostMode: false
  });

  eleventyConfig.addPairedShortcode('Callout', CalloutComponent);
  eleventyConfig.addPairedShortcode('Grid', GridComponent);
  eleventyConfig.addPairedShortcode('GridColumn', GridColumnComponent);
  eleventyConfig.addPairedShortcode('Checklist', ChecklistComponent);
  eleventyConfig.addPairedShortcode('KeyQuestions', KeyQuestionsComponent);
  eleventyConfig.addShortcode('PageHeader', PageHeaderComponent);
  eleventyConfig.addPairedShortcode('PrivateLink', PrivateLinkComponent);
  eleventyConfig.addShortcode('Pagination', PaginationComponent);
  eleventyConfig.addShortcode('PrivateResource', ResourcePrivateComponent);
  eleventyConfig.addShortcode('PublicResource', ResourcePublicComponent);
  eleventyConfig.addPairedShortcode('ResourceGroup', ResourceGroupComponent);
  eleventyConfig.addPairedShortcode('TableOfContents', TableOfContentsComponent);

  return {
    // Control which files Eleventy will process
    // e.g.: *.md, *.njk, *.html, *.liquid
    templateFormats: [
      'md',
      'njk',
      'html',
      'liquid'
    ],

    // -----------------------------------------------------------------
    // If your site deploys to a subdirectory, change `pathPrefix`.
    // Don’t worry about leading and trailing slashes, we normalize these.

    // If you don’t have a subdirectory, use '' or '/' (they do the same thing)
    // This is only used for link URLs (it does not affect your file structure)
    // Best paired with the `url` filter: https://www.11ty.dev/docs/filters/url/

    // You can also pass this in on the command line using `--pathprefix`

    // Optional (default is shown)
    pathPrefix: '/',
    // -----------------------------------------------------------------

    // Pre-process *.md files with: (default: `liquid`)
    markdownTemplateEngine: 'njk',

    // Pre-process *.html files with: (default: `liquid`)
    htmlTemplateEngine: 'njk',

    // Opt-out of pre-processing global data JSON files: (default: `liquid`)
    dataTemplateEngine: false,

    // These are all optional (defaults are shown):
    dir: {
      input: '.',
      includes: '_includes',
      data: '_data',
      output: '_site'
    }
  };
};