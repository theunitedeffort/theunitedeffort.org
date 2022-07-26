(function() {
  // https://inclusive-components.design/tooltips-toggletips/
  function openToggletip(liveRegion, message) {
    liveRegion.innerHTML = '';
    window.setTimeout(function() {
      liveRegion.innerHTML = '<span class="toggletip_content">'+ message +'</span>';
    }, 100);
  }

  function closeToggletip(liveRegion) {
    liveRegion.innerHTML = '';   
  }

  function setUpToggleTips() {
    // Get all the toggletip buttons
    let toggletipTexts = document.querySelectorAll('[data-toggletip]');

    // Iterate over them
    Array.prototype.forEach.call(toggletipTexts, function(toggletipText) {
      // Store the toggletip message
      let message = toggletipText.innerHTML;

      // Create the container element
      let container = document.createElement('span');
      container.setAttribute('class', 'toggletip_entry');
      
      // Put it before the original element in the DOM
      toggletipText.parentNode.insertBefore(container, toggletipText);
      
      // Create the button element
      let toggletip = document.createElement('button');
      let toggletipClass = toggletipText.getAttribute('data-toggletip-class');
      toggletip.setAttribute('type', 'button');
      toggletip.setAttribute('aria-label', 'more info');
      let className = 'btn';
      if (toggletipClass) {
        className += ' ' + toggletipClass;
      }
      toggletip.setAttribute('class', className);
      
      // Place the button element in the container
      container.appendChild(toggletip);
      
      // Create the live region
      let liveRegion = document.createElement('span');
      liveRegion.setAttribute('role', 'status');
      liveRegion.setAttribute('class', 'toggletip_container');
      
      // Place the live region in the container
      container.appendChild(liveRegion);
      
      // Remove the original element
      toggletipText.parentNode.removeChild(toggletipText);

      // Show the message on click
      toggletip.addEventListener('click', function() {
        openToggletip(liveRegion, message);
      });

      // Show the message on hover
      toggletip.addEventListener('mouseover', function() {
        openToggletip(liveRegion, message);
      });

      // Close on outside click
      document.addEventListener('click', function (e) {
        if (e.target !== toggletip && e.target.parentNode !== liveRegion) {
          closeToggletip(liveRegion);
        }   
      });

      // Close after a hover
      // Use the container here so that a user can mouse over
      // the toggletip content without the content disappearing.
      container.addEventListener('mouseleave', function() {
        closeToggletip(liveRegion);     
      });

      // Remove toggletip on ESC
      toggletip.addEventListener('keydown', function(e) {
        if ((e.keyCode || e.which) === 27) {
          closeToggletip(liveRegion);
        }
      });
      
      // Remove on focusout
      container.addEventListener('focusout', function (e) {
        // Only remove if the user is actually focusing on a different
        // element.
        if (e.relatedTarget) {
          closeToggletip(liveRegion);
        }
      });
    });
  }

  setUpToggleTips();
}());