const fs = require('fs');
const path = require('path');
const {JSDOM} = require('jsdom');

let eligScript;
beforeAll(() => {
  eligScript = fs.readFileSync(
  	path.resolve(__dirname, '../eligibility.js'), 'utf8');
});

beforeEach(async () => {
	// This is a bit of a hack to run the eligibility script in the loaded
	// HTML document.  Loading the file as an external <script> as is done
	// in production has proven to be difficult because:
	//   1) We don't necessarily want to use runScripts: "dangerously" as
	//      there may be third-party external scripts included in the HTML,
	//      particularly from the base.liquid layout.
	//   2) The src of the <script> needs to be different for production
	//      and testing, as root-relative URLS (src="/js/eligibility.js")
	//      don't seem to work with JSDOM.
	// There may be a way to set up a test with a node server running and
	// create a JSDOM object from the url of that server.  We'd still have to
	// make a custom JSDOM Resource Loader to avoid loading anything *except*
	// the script we care about: eligibility.js
	let dom = await JSDOM.fromFile('dist/public-assistance/eligibility/index.html', {
    runScripts: "outside-only",
  });
  return new Promise((resolve) => {
    dom.window.addEventListener("load", () => {
    	document = dom.window.document;
    	window = dom.window;
    	// Mock any browser methods that are not implemented by JSDOM.
    	window.HTMLElement.prototype.scrollIntoView = jest.fn();
    	window.scrollTo = jest.fn();

			// const data = fs.readFileSync(path.resolve(__dirname, '../eligibility.js'), 'utf8');
    	window.eval(eligScript);
    	window.eval('init()');
      resolve();
    });
  });
	// console.log(__dirname);
	// console.log(`file://${__dirname}../../../../dist/public-assistance/eligibility/index.html`);
	// dom = await JSDOM.fromFile('dist/public-assistance/eligibility/index.html', {
	// 	runScripts: 'dangerously',
	// 	resources: 'usable',
	// 	url: `file://${__dirname}/../../../../dist/public-assistance/eligibility/index.html`
	// });
	// document = dom.window.document;
});

test('Example', () => {

	// This does not work because top level stuff like DocumentFragment is not
	// defined when the init() is called out of the scope of window.  It's trying
	// to run DocumentFragment (e.g.) in the node env.
	//
	// window.HTMLElement.prototype.scrollIntoView = jest.fn();
	// window.scrollTo = jest.fn();
	// elig.init();

	expect(document.querySelectorAll('[id^=hh-member-name]').length).toBe(0);
	const button = document.getElementById('page-household-members')
	  .querySelector('.field_list_add');
	button.click();
	expect(document.querySelectorAll('[id^=hh-member-name]').length).toBe(1);
});