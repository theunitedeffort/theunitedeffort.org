(function() {

  const MAP_CENTER_LAT = 37.233907;  // Center of Santa Clara County.
  const MAP_CENTER_LNG = -121.756180;  // Center of Santa Clara County.
  const MAP_ID = "9cafc548a28110af";  // For custom map styling.
  const MAP_INIT_ZOOM = 9;  // Zoom level
  const MAP_HIGHLIGHT_ZOOM = 15;  // Zoom level

  // https://mt.google.com/vt/icon/name=icons/spotlight/measle_8px.png&scale=2
  const SMALL_BUS_ICON_PATH = "/images/measle_2x.png";
  const SMALL_BUS_ICON_WIDTH = 16;  // px
  const SMALL_BUS_ICON_HEIGHT = 16;  // px
  const SMALL_BUS_ICON_SCALE = 2;
  // https://mt.google.com/vt/icon/name=icons/spotlight/transit/bus_small.png&scale=2
  const LARGE_BUS_ICON_PATH = "/images/bus_small_2x.png";
  const LARGE_BUS_ICON_WIDTH = 30;  // px
  const LARGE_BUS_ICON_HEIGHT = 30;  // px
  const LARGE_BUS_ICON_SCALE = 2;

  const TRANSIT_ICON_VISIBLE_BP = 12;  // Zoom level
  const TRANSIT_ICON_SIZE_BP = 14;  // Zooom level

  function switchToMapView(interface) {
    interface.mapContainer.classList.remove("responsive_hidden");
    interface.mapContainer.classList.add("responsive_visible");
    interface.listContainer.classList.remove("responsive_visible");
    interface.listContainer.classList.add("responsive_hidden");
    interface.toggleButton.textContent ="Show List";
  }

  function switchToListView(interface) {
    interface.listContainer.classList.remove("responsive_hidden");
    interface.listContainer.classList.add("responsive_visible");
    interface.mapContainer.classList.remove("responsive_visible");
    interface.mapContainer.classList.add("responsive_hidden");
    interface.toggleButton.textContent = "Show Map";
    const selectedItem = document.querySelector("li.highlighted");
    if (selectedItem) {
      selectedItem.scrollIntoView();
    }
  }

  function setMapBounds(map, markers) {
    const bounds = new google.maps.LatLngBounds();
    for (const marker of markers) {
      bounds.extend(marker.position);
    }
    map.fitBounds(bounds);
    return bounds;
  }

  function crossedZoomBp(zoom, prevZoom, breakpoint) {
    return (
      (zoom > breakpoint && prevZoom <= breakpoint) ||
      (zoom <= breakpoint && prevZoom > breakpoint));
  }

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

  function setLegendIcon(legend, icon) {
    legend.lastChild.innerHTML = '<img ' +
      'src="' + icon.url + 
      '" width="' + icon.scaledSize.width + 
      '" height="' + icon.scaledSize.height + 
      '"> ' + 'Bus Stop';
  }

  function addLegend(map, icon) {
    const legend = document.getElementById("map-legend");
    legend.setAttribute("hidden", "hidden");
    const legendContent = document.createElement("div");
    legend.appendChild(legendContent);

    setLegendIcon(legend, icon);

    map.controls[google.maps.ControlPosition.TOP_RIGHT].push(legend);
    return legend;
  }

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

  function setTransitMarkerOptions(transitMarkers, legend, markerOptions) {
    for (i = 0; i < transitMarkers.length; i++) {
      transitMarkers[i].setOptions(markerOptions);
    }
    setLegendIcon(legend, markerOptions.icon);
  }

  function setUpAptListeners(map, markers, infowindow, interface) {
    for (const marker of markers) {
      const listItem = document.getElementById("property-" + marker.apt.id);
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
          listItem.scrollIntoView();
        }
        listItem.classList.add('highlighted');
        infowindow.listItem = listItem;
        map.setZoom(MAP_HIGHLIGHT_ZOOM);
        map.panTo(marker.getPosition());
      });

      // TODO: add the link button from scratch here instead of finding it in
      // the DOM. Also,  only add the button if a marker exists for that list
      // item.
      const mapLink = listItem.querySelector("button.map_link");
      if (mapLink) {
        mapLink.addEventListener("click", () => {
          google.maps.event.trigger(marker, "click", null, true);
          switchToMapView(interface);
          interface.toggleButton.scrollIntoView();
        });
      }
    }
  }

  // Adds a marker for each apartment and sets up listeners for that marker.
  function addAptMarkers(map) {
    const markers = [];
    for (const loc of aptLocations) {
      const marker = new google.maps.Marker({
        position: new google.maps.LatLng(loc.lat, loc.lng),
        map: map,
        title: loc.name,
      });
      marker.apt = loc;
      markers.push(marker);
    }
    return markers;
  }

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

  // Initialize and add the map
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

    let prevZoom = 0;
    google.maps.event.addListener(map, 'zoom_changed', () => {
      google.maps.event.addListenerOnce(map, 'idle', () => {
        const zoom = map.getZoom();
        if (crossedZoomBp(zoom, prevZoom, 12)) {
          // Hide or show bus stops.
          displayTransit(transitMarkers, legend, zoom > 12);
        }
        if (crossedZoomBp(zoom, prevZoom, 14)) {
          // Choose appropriate bus icon.
          const markerOptions = (
            zoom > 14 ? largeTransitMarkerOpts : smallTransitMarkerOpts);
          setTransitMarkerOptions(transitMarkers, legend, markerOptions);
        }
        prevZoom = zoom;
      });
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
        map.fitBounds(bounds);
      }
    });
  }

  window.initMap = initMap;
}());