(function() {

  const MAP_CENTER_LAT = 37.233907;  // Center of Santa Clara County.
  const MAP_CENTER_LNG = -121.756180;  // Center of Santa Clara County.
  const MAP_ID = "9cafc548a28110af";  // For custom map styling.
  const MAP_INIT_ZOOM = 9;  // Zoom level
  const MAP_HIGHLIGHT_ZOOM = 15;  // Zoom level
  
  // Icon from
  // https://mt.google.com/vt/icon/name=icons/spotlight/measle_8px.png&scale=2
  const SMALL_BUS_ICON_PATH = "/images/measle_2x.png";
  const SMALL_BUS_ICON_WIDTH = 16;  // px
  const SMALL_BUS_ICON_HEIGHT = 16;  // px
  const SMALL_BUS_ICON_SCALE = 2;
  // Icon from
  // https://mt.google.com/vt/icon/name=icons/spotlight/transit/bus_small.png&scale=2
  const LARGE_BUS_ICON_PATH = "/images/bus_small_2x.png";
  const LARGE_BUS_ICON_WIDTH = 30;  // px
  const LARGE_BUS_ICON_HEIGHT = 30;  // px
  const LARGE_BUS_ICON_SCALE = 2;

  const TRANSIT_ICON_VISIBLE_BP = 12;  // Zoom level
  const TRANSIT_ICON_SIZE_BP = 14;  // Zooom level

  // Sets element visibility to show the map view rather than the
  // list view on small screens.
  function switchToMapView(interface) {
    interface.mapContainer.classList.remove("responsive_hidden");
    interface.mapContainer.classList.add("responsive_visible");
    interface.listContainer.classList.remove("responsive_visible");
    interface.listContainer.classList.add("responsive_hidden");
    interface.toggleButton.textContent ="Show List";
  }

  // Sets element visibility to show the list view rather than the
  // map view on small screens.
  function switchToListView(interface) {
    interface.listContainer.classList.remove("responsive_hidden");
    interface.listContainer.classList.add("responsive_visible");
    interface.mapContainer.classList.remove("responsive_visible");
    interface.mapContainer.classList.add("responsive_hidden");
    interface.toggleButton.textContent = "Show Map";
    const selectedItem = document.querySelector("li.highlighted");
    if (selectedItem) {
      // When switching into the list view, make sure that any highlighted list 
      // item is visible on the screen.
      selectedItem.scrollIntoView();
    }
  }

  // Computes bounds to show all 'markers' on 'map.'
  // This updates the map to those bounds and returns the bounds themselves.
  function setMapBounds(map, markers) {
    const bounds = new google.maps.LatLngBounds();
    for (const marker of markers) {
      bounds.extend(marker.position);
    }
    map.fitBounds(bounds);
    return bounds;
  }

  // Returns true if the zoom level has crossed the given breakpoint.
  // i.e. 'prevZoom' and 'zoom' are on opposite sides of 'breakpoint'.
  function crossedZoomBp(zoom, prevZoom, breakpoint) {
    return (
      (zoom > breakpoint && prevZoom <= breakpoint) ||
      (zoom <= breakpoint && prevZoom > breakpoint));
  }

  // Creates MarkerOptions for the icon at 'path'.
  // 'width' and 'height' are specified in px, and scale gives the factor
  // to reduce the icon's size by before render -- useful for high dpi displays.
  function makeMarkerOpts(path, width, height, scale) {
    return {
      icon: {
        url: path,
        size: new google.maps.Size(width, height),
        scaledSize: new google.maps.Size(width / scale, height / scale),
        anchor: new google.maps.Point(0.5 * width / scale,
          0.5 * height / scale),
      },
      anchorPoint: new google.maps.Point(0, (-0.5 * height / scale) - 1),
    };
  }

  // Sets the legend content to display the given icon
  // The text "Bus Stop" will be displayed next to the icon.
  function setLegendContent(legend, icon) {
    legend.lastChild.innerHTML = '<img ' +
      'src="' + icon.url + 
      '" width="' + icon.scaledSize.width + 
      '" height="' + icon.scaledSize.height + 
      '"> ' + 'Bus Stop';
  }

  // Adds a legend to the map with 'icon' showing by default.
  // An element with id "map-legend" must be present in th DOM.
  function addLegend(map, icon) {
    const legend = document.getElementById("map-legend");
    legend.setAttribute("class", "map_legend");
    legend.setAttribute("hidden", "hidden");

    const legendTitle = document.createElement("h3");
    legendTitle.textContent = "Legend";
    legend.appendChild(legendTitle);

    const legendContent = document.createElement("div");
    legend.appendChild(legendContent);

    setLegendContent(legend, icon);

    map.controls[google.maps.ControlPosition.TOP_RIGHT].push(legend);
    return legend;
  }

  // Turns on or off the custom public transit layer based on 'isVisible'.
  // The custom transit layer consists of transit stop markers and a legend.
  function displayTransit(transitMarkers, legend, isVisible) {
    for (i = 0; i < transitMarkers.length; i++) {
      transitMarkers[i].setVisible(isVisible);
    }
    if (isVisible) {
      legend.removeAttribute("hidden");
    } else {
      legend.setAttribute("hidden", "hidden");
    }
  }

  // Sets the marker options for all transit markers.
  // This is useful to change the transit marker icon.  The transit stop legend 
  // will also be updated to use the same icon.
  function setTransitMarkerOptions(transitMarkers, legend, markerOptions) {
    for (i = 0; i < transitMarkers.length; i++) {
      transitMarkers[i].setOptions(markerOptions);
    }
    setLegendContent(legend, markerOptions.icon);
  }

  // Sets up listeners for the apartment location markers.
  function setUpAptListeners(map, markers, infowindow, interface) {
    for (const marker of markers) {
      marker.addListener("click", (e, disableScroll) => {
        if (infowindow.listItem) {
          infowindow.listItem.classList.remove('highlighted');
        }
        infowindow.setContent(marker.apt.content);
        infowindow.open({
          anchor: marker,
          map: map,
          shouldFocus: false,
        });
    
        if (!disableScroll) {
          marker.listItem.scrollIntoView();
        }
        marker.listItem.classList.add('highlighted');
        infowindow.listItem = marker.listItem;
        map.setZoom(MAP_HIGHLIGHT_ZOOM);
        map.panTo(marker.getPosition());
      });
    }
  }

  // Adds a marker for each apartment to the map.
  function addAptMarkers(map) {
    const markers = [];
    for (const loc of aptLocations) {
      const marker = new google.maps.Marker({
        position: new google.maps.LatLng(loc.lat, loc.lng),
        map: map,
        title: loc.name,
      });
      marker.apt = loc;
      marker.listItem = document.getElementById("property-" + loc.id);
      markers.push(marker);
    }
    return markers;
  }

  // Sets up listeners for the transit stop markers.
  function setUpTransitListeners(map, markers, infowindow) {
    for (const marker of markers) {
      marker.addListener("click", () => {
        infowindow.setContent(
          '<div class="map_infowindow_content">' +
          '<h1>' + marker.stop.operator + ' Bus Stop</h1>' + 
          marker.stop.name +
          '</div>');
        infowindow.open({
          anchor: marker,
          map,
          shouldFocus: false,
        });
      });
    }
  }

  // Adds a marker for each public transit stop to the map.
  function addTransitMarkers(map, markerOptions) {
    const transitMarkers = [];
    for (const stop of transitStops) {
      const marker = new google.maps.Marker({
        position: new google.maps.LatLng(stop.lat, stop.lng),
        map: map,
        visible: false,
      });
      marker.stop = stop;
      marker.setOptions(markerOptions);
      transitMarkers.push(marker);
    }
    return transitMarkers;
  }

  // Initializes the map's surrounding interface and sets up relevant listeners.
  function initInterface(interface, markers) {
    // Show the map, toggle button, and interactive list item map links since 
    // javascript is working.
    interface.toggleButton.parentNode.classList.remove("hidden");
    interface.listContainer.classList.add("responsive_split");
    interface.mapContainer.classList.add("responsive_split");
    interface.mapContainer.classList.remove("hidden");
    for (const marker of markers) {
      const showMapButton = marker.listItem.querySelector("button.map_link");
      const extMapLink = marker.listItem.querySelector("span.ext_map_link");
      showMapButton.classList.remove("hidden");
      extMapLink.classList.add("hidden");

      showMapButton.addEventListener("click", () => {
        google.maps.event.trigger(marker, "click", null, true);
        switchToMapView(interface);
        interface.toggleButton.scrollIntoView();
      });
    }
    // Start the user out with a list view.
    switchToListView(interface);
  }

  // Initialize and add the map, set up all markers.
  function initMap() {
    const smallTransitMarkerOpts = makeMarkerOpts(SMALL_BUS_ICON_PATH, 
      SMALL_BUS_ICON_WIDTH, SMALL_BUS_ICON_HEIGHT, SMALL_BUS_ICON_SCALE);
    const largeTransitMarkerOpts = makeMarkerOpts(LARGE_BUS_ICON_PATH, 
      LARGE_BUS_ICON_WIDTH, LARGE_BUS_ICON_HEIGHT, LARGE_BUS_ICON_SCALE);
    const interface = {
      toggleButton: document.querySelector("#map-toggle button"),
      mapContainer: document.getElementById("map-container"),
      listContainer: document.getElementById("list-container"),
    };
    const map = new google.maps.Map(document.getElementById("map"), {
      mapId: MAP_ID,
      zoom: MAP_INIT_ZOOM,
      center: new google.maps.LatLng(MAP_CENTER_LAT, MAP_CENTER_LNG),
      gestureHandling: "greedy",
      mapTypeControlOptions: {
        style: google.maps.MapTypeControlStyle.DROPDOWN_MENU,
        mapTypeIds: ["roadmap", "satellite"],
      },
      fullscreenControlOptions: {
        position: google.maps.ControlPosition.BOTTOM_LEFT,
      },
    });

    const infowindow = new google.maps.InfoWindow();
    const aptMarkers = addAptMarkers(map);
    setUpAptListeners(map, aptMarkers, infowindow, interface);
    const bounds = setMapBounds(map, aptMarkers);

    const transitMarkers = addTransitMarkers(map, smallTransitMarkerOpts);
    setUpTransitListeners(map, transitMarkers, infowindow);

    const legend = addLegend(map, smallTransitMarkerOpts.icon);

    initInterface(interface, aptMarkers);

    let prevZoom = 0;
    google.maps.event.addListener(map, 'zoom_changed', () => {
      google.maps.event.addListenerOnce(map, 'idle', () => {
        const zoom = map.getZoom();
        if (crossedZoomBp(zoom, prevZoom, TRANSIT_ICON_VISIBLE_BP)) {
          // Hide or show bus stops.
          displayTransit(transitMarkers, legend,
            zoom > TRANSIT_ICON_VISIBLE_BP);
        }
        if (crossedZoomBp(zoom, prevZoom, TRANSIT_ICON_SIZE_BP)) {
          // Choose appropriate bus icon.
          const markerOptions = (
            zoom > TRANSIT_ICON_SIZE_BP ? 
            largeTransitMarkerOpts : smallTransitMarkerOpts);
          setTransitMarkerOptions(transitMarkers, legend, markerOptions);
        }
        prevZoom = zoom;
      });
    });

    // If the page loads with the map hidden, the map bounds are incorrect
    // when the map is eventually shown.  The bounds_changed listeners below
    // are a bit of a hack to get the bounds reset when the map is shown for
    // the first time.
    google.maps.event.addListenerOnce(map, 'bounds_changed', () => {
      // bounds_changed fires once on map load.  If the map is hidden,
      // it will fire a second time when it's shown.  The map can become visible
      // either by increasing the browser window size or clicking the Show Map
      // button, and this will handle both of those cases.
      // The check for zero width is important because without it, the first 
      // user interaction with a map that is visible on initial page load will
      // be overridden by the call to fitBounds().
      const mapWidth = document.getElementById("map").offsetWidth;
      if (mapWidth <= 0) {
        google.maps.event.addListenerOnce(map, 'bounds_changed', () => {
          map.fitBounds(bounds);
        });
      }
    });
    
    google.maps.event.addListener(infowindow,'closeclick',function(){
      if (this.listItem) {
        this.listItem.classList.remove('highlighted');
      }
    });

    interface.toggleButton.addEventListener("click", () => {
      if (interface.listContainer.classList.contains("responsive_hidden")) {
        switchToListView(interface);
      } else {
        switchToMapView(interface);
      }
    });
  }

  window.initMap = initMap;
}());