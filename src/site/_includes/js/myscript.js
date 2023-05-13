function init() {
	document.getElementById("click-for-error").addEventListener("click", () => {
		null.foo = 4;
	});
}

module.exports = {
  init,
};
