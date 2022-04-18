// simple button click event handler
var form = document.querySelector("#housing-search");
form.addEventListener('submit', function(event) {
  event.preventDefault();
  const formData = new FormData(form);
  console.log(`form submitted`, formData);



}, false);
