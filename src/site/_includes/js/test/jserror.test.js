/**
 * @jest-environment jsdom
 */

const lib = require('../myscript');

test('Error in event handler does not stop the test', () => {
	document.body.parentElement.innerHTML = `
	  <div id="click-for-error">
	    Hello World
	  </div>`;

	lib.init();
	document.getElementById('click-for-error').dispatchEvent(new Event('click'));
	console.log('The test incorrectly continues to run');
});
