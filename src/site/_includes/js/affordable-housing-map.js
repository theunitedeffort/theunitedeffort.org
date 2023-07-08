'use strict';

/* global transitStops, aptLocations, google */
(function() {
  const MAP_CENTER_LAT = 37.233907; // Center of Santa Clara County.
  const MAP_CENTER_LNG = -121.756180; // Center of Santa Clara County.
  const MAP_ID = '9cafc548a28110af'; // For custom map styling.
  const MAP_INIT_ZOOM = 9; // Zoom level
  const MAP_HIGHLIGHT_ZOOM = 15; // Zoom level

  // Icon from
  // https://mt.google.com/vt/icon/name=icons/spotlight/measle_8px.png&scale=2
  const SMALL_BUS_ICON_PATH = '/images/measle_2x.png';
  const SMALL_BUS_ICON_WIDTH = 16; // px
  const SMALL_BUS_ICON_HEIGHT = 16; // px
  const SMALL_BUS_ICON_SCALE = 2;
  // Icon from
  // https://mt.google.com/vt/icon/name=icons/spotlight/transit/bus_small.png&scale=2
  const LARGE_BUS_ICON_PATH = '/images/bus_small_2x.png';
  const LARGE_BUS_ICON_WIDTH = 30; // px
  const LARGE_BUS_ICON_HEIGHT = 30; // px
  const LARGE_BUS_ICON_SCALE = 2;

  const TRANSIT_ICON_VISIBLE_BP = 12; // Zoom level
  const TRANSIT_ICON_SIZE_BP = 14; // Zooom level

  // Sets element visibility to show the map view rather than the
  // list view on small screens.
  function switchToMapView(interf) {
    interf.mapContainer.classList.remove('responsive_hidden');
    interf.mapContainer.classList.add('responsive_visible');
    interf.listContainer.classList.remove('responsive_visible');
    interf.listContainer.classList.add('responsive_hidden');
    interf.toggleButton.textContent = 'Show List';
  }

  // Sets element visibility to show the list view rather than the
  // map view on small screens.
  function switchToListView(interf) {
    interf.listContainer.classList.remove('responsive_hidden');
    interf.listContainer.classList.add('responsive_visible');
    interf.mapContainer.classList.remove('responsive_visible');
    interf.mapContainer.classList.add('responsive_hidden');
    interf.toggleButton.textContent = 'Show Map';
    const selectedItem = document.querySelector('li.highlighted');
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
    // Prevent the map from zooming in too far when setting bounds to avoid
    // getting very close in for small bounds (e.g. a single marker).
    map.setOptions({maxZoom: MAP_HIGHLIGHT_ZOOM});
    map.fitBounds(bounds);
    // Then reset the max zoom so the user can zoom freely.
    google.maps.event.addListenerOnce(map, 'idle', () => {
      map.setOptions({maxZoom: null});
    });
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
    const legend = document.getElementById('map-legend');
    legend.setAttribute('class', 'map_legend');
    legend.setAttribute('hidden', 'hidden');

    const legendTitle = document.createElement('h3');
    legendTitle.textContent = 'Legend';
    legend.appendChild(legendTitle);

    const legendContent = document.createElement('div');
    legend.appendChild(legendContent);

    setLegendContent(legend, icon);

    map.controls[google.maps.ControlPosition.TOP_RIGHT].push(legend);
    return legend;
  }

  // Turns on or off the custom public transit layer based on 'isVisible'.
  // The custom transit layer consists of transit stop markers and a legend.
  function displayTransit(map, transitMarkers, legend, isVisible) {
    let mapRef = null;
    if (isVisible) {
      mapRef = map;
    }
    for (let i = 0; i < transitMarkers.length; i++) {
      transitMarkers[i].setMap(mapRef);
    }
    if (isVisible) {
      legend.removeAttribute('hidden');
    } else {
      legend.setAttribute('hidden', 'hidden');
    }
  }

  // Sets the marker options for all transit markers.
  // This is useful to change the transit marker icon.  The transit stop legend
  // will also be updated to use the same icon.
  function setTransitMarkerOptions(transitMarkers, legend, markerOptions) {
    for (let i = 0; i < transitMarkers.length; i++) {
      transitMarkers[i].setOptions(markerOptions);
    }
    setLegendContent(legend, markerOptions.icon);
  }

  // Sets up listeners for the apartment location markers.
  function setUpAptListeners(map, markers, infowindow, interf) {
    for (const marker of markers) {
      marker.addListener('click', (e, disableScroll) => {
        if (infowindow.listItem) {
          infowindow.listItem.classList.remove('highlighted');
        }
        const container = document.createElement('div');
        container.className = 'map_infowindow_content';
        container.innerHTML = marker.listItem.innerHTML;
        const mapLink = container.querySelector('.map_link_container');
        if (mapLink) {
          const gmapsLink = mapLink.querySelector('.ext_map_link');
          mapLink.remove();
          if (gmapsLink) {
            gmapsLink.className = 'map_infowindow_footer';
            gmapsLink.firstChild.textContent = 'View on Google Maps';
            container.appendChild(gmapsLink);
          }
        }
        infowindow.setContent(container);
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
    // Reusable options for faster looping.
    const options = {
      position: {lat: 0, lng: 0},
      map: map,
      title: '',
    };
    for (const loc of aptLocations) {
      options.position.lat = loc.lat;
      options.position.lng = loc.lng;
      options.title = loc.name;
      const marker = new google.maps.Marker(options);
      marker.apt = loc;
      marker.listItem = document.getElementById('property-' + loc.id);
      markers.push(marker);
    }
    return markers;
  }

  // Sets up listeners for the transit stop markers.
  function setUpTransitListeners(map, markers, infowindow) {
    for (const marker of markers) {
      marker.addListener('click', () => {
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

  // Makes an array of markers, one for each public transit stop.
  // The markers are not added to the map.
  function makeTransitMarkers() {
    const transitMarkers = [];
    // Reusable options for faster looping.
    const options = {
      position: {lat: 0, lng: 0},
    };
    for (const stop of transitStops) {
      options.position.lat = stop.lat;
      options.position.lng = stop.lng;
      const marker = new google.maps.Marker(options);
      marker.stop = stop;
      transitMarkers.push(marker);
    }
    return transitMarkers;
  }

  // Initializes the map's surrounding interface and sets up relevant listeners.
  function initInterface(interf, map, markers) {
    // Show the map, toggle button, and interactive list item map links since
    // javascript is working.
    if (markers.length > 0) {
      interf.toggleButton.parentNode.classList.remove('hidden');
      interf.listContainer.classList.add('responsive_split');
      interf.mapContainer.classList.add('responsive_split');
      interf.mapContainer.classList.remove('hidden');
    } else {
      interf.listContainer.querySelector('ul').classList.add('no_results');
    }
    for (const marker of markers) {
      const showMapButton = marker.listItem.querySelector('button.map_link');
      const extMapLink = marker.listItem.querySelector('span.ext_map_link');
      showMapButton.classList.remove('hidden');
      extMapLink.classList.add('hidden');

      showMapButton.addEventListener('click', () => {
        // On page load, there is a bounds_changed listener that helps
        // set the initial map bounds properly if the map is hidden.  Make sure
        // that listener is not active before highlighting the marker so
        // the map can zoom and pan uninterrupted.
        google.maps.event.clearListeners(map, 'bounds_changed');
        google.maps.event.trigger(marker, 'click', null, true);
        switchToMapView(interf);
        interf.toggleButton.scrollIntoView();
      });
    }
    // Start the user out with a list view.
    switchToListView(interf);
  }

  // Initialize and add the map, set up all markers.
  function initMap() {
    const smallTransitMarkerOpts = makeMarkerOpts(SMALL_BUS_ICON_PATH,
      SMALL_BUS_ICON_WIDTH, SMALL_BUS_ICON_HEIGHT, SMALL_BUS_ICON_SCALE);
    const largeTransitMarkerOpts = makeMarkerOpts(LARGE_BUS_ICON_PATH,
      LARGE_BUS_ICON_WIDTH, LARGE_BUS_ICON_HEIGHT, LARGE_BUS_ICON_SCALE);
    const interf = {
      toggleButton: document.querySelector('#map-toggle button'),
      mapContainer: document.getElementById('map-container'),
      listContainer: document.getElementById('list-container'),
    };
    const map = new google.maps.Map(document.getElementById('map'), {
      mapId: MAP_ID,
      zoom: MAP_INIT_ZOOM,
      center: new google.maps.LatLng(MAP_CENTER_LAT, MAP_CENTER_LNG),
      gestureHandling: 'greedy',
      mapTypeControlOptions: {
        style: google.maps.MapTypeControlStyle.DROPDOWN_MENU,
        mapTypeIds: ['roadmap', 'satellite'],
      },
      fullscreenControlOptions: {
        position: google.maps.ControlPosition.BOTTOM_LEFT,
      },
    });

    const infowindow = new google.maps.InfoWindow();
    const aptMarkers = addAptMarkers(map);
    setUpAptListeners(map, aptMarkers, infowindow, interf);
    setMapBounds(map, aptMarkers);

    // This array will be filled when the transit markers are first
    // requested to be visible, i.e. when the map gets zoomed in enough.
    let transitMarkers = [];

    const legend = addLegend(map, smallTransitMarkerOpts.icon);

    initInterface(interf, map, aptMarkers);

    let prevZoom = 0;
    google.maps.event.addListener(map, 'zoom_changed', () => {
      google.maps.event.addListenerOnce(map, 'idle', () => {
        const zoom = map.getZoom();
        if (crossedZoomBp(zoom, prevZoom, TRANSIT_ICON_VISIBLE_BP)) {
          // Hide or show bus stops.
          if (zoom > TRANSIT_ICON_VISIBLE_BP) {
            if (transitMarkers.length == 0) {
              // Only make the transit markers when they are first needed.
              // TODO: Only make markers that will be visible in the viewport?
              transitMarkers = makeTransitMarkers();
              setUpTransitListeners(map, transitMarkers, infowindow);
            }
            // Transit markers show up with the small icon.
            setTransitMarkerOptions(transitMarkers, legend,
              smallTransitMarkerOpts);
          }
          displayTransit(map, transitMarkers, legend,
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
      const mapWidth = document.getElementById('map').offsetWidth;
      if (mapWidth <= 0) {
        google.maps.event.addListenerOnce(map, 'bounds_changed', () => {
          setMapBounds(map, aptMarkers);
        });
      }
    });

    google.maps.event.addListener(infowindow, 'closeclick', () => {
      if (infowindow.listItem) {
        infowindow.listItem.classList.remove('highlighted');
      }
    });

    interf.toggleButton.addEventListener('click', () => {
      if (interf.listContainer.classList.contains('responsive_hidden')) {
        switchToListView(interf);
      } else {
        switchToMapView(interf);
      }
    });
  }

  window.initMap = initMap;
}());
