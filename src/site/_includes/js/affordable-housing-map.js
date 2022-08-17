(function() {

  const MAP_CENTER_LAT = 37.233907;  // Center of Santa Clara County.
  const MAP_CENTER_LNG = -121.756180;  // Center of Santa Clara County.
  const MAP_ID = "9cafc548a28110af";
  const MAP_INIT_ZOOM = 9;
  const MAP_HIGHLIGHT_ZOOM = 15;

  // https://mt.google.com/vt/icon/name=icons/spotlight/measle_8px.png&scale=2
  const SMALL_BUS_ICON_PATH = "/images/measle_2x.png";
  const SMALL_BUS_ICON_WIDTH = 16;
  const SMALL_BUS_ICON_HEIGHT = 16;
  // https://mt.google.com/vt/icon/name=icons/spotlight/transit/bus_small.png&scale=2
  const LARGE_BUS_ICON_PATH = "/images/bus_small_2x.png";
  const LARGE_BUS_ICON_WIDTH = 30;
  const LARGE_BUS_ICON_HEIGHT = 30;

  let toggleButton = document.querySelector("#map-toggle button");
  let mapContainer = document.getElementById("map-container");
  let listContainer = document.getElementById("list-container");

  function setMapBounds(map, markers) {
    let bounds = new google.maps.LatLngBounds();
    for (const marker of markers) {
      bounds.extend(marker.position);
    }
    map.fitBounds(bounds);
  }

  function setUpAptListeners(map, markers, infowindow) {
    for (const marker of markers) {
      let listItem = document.getElementById("property-" + marker.apt.id);
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
      let mapLink = listItem.querySelector("button.map_link");
      if (mapLink) {
        mapLink.addEventListener("click", () => {
          google.maps.event.trigger(marker, "click", null, true);
          // Hide list and show map.
          mapContainer.classList.remove("responsive_hidden");
          mapContainer.classList.add("responsive_visible");
          listContainer.classList.remove("responsive_visible");
          listContainer.classList.add("responsive_hidden");
          toggleButton.textContent ="Show List";
          toggleButton.scrollIntoView();
        });
      }
    }
  }

  // Adds a marker for each apartment and sets up listeners for that marker.
  function addAptMarkers(map) {
    let markers = [];
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
    let transitMarkers = [];
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

  function addLegend(map) {
    const legend = document.getElementById("map-legend");
    legend.setAttribute("hidden", "hidden");

    const legendContent = document.createElement("div");
    legendContent.innerHTML = '<img ' +
      'src="' + SMALL_BUS_ICON_PATH + 
      '" width="' + SMALL_BUS_ICON_WIDTH / 2 +
      '" height="' + SMALL_BUS_ICON_HEIGHT / 2 + 
      '"> ' + 'Bus Stop';
    legend.appendChild(legendContent);

    map.controls[google.maps.ControlPosition.TOP_RIGHT].push(legend);
    return legend;
  }

  // Initialize and add the map
  function initMap() {
    let smallTransitMarkerOpts = {
      icon: {
        url: SMALL_BUS_ICON_PATH,
        size: new google.maps.Size(SMALL_BUS_ICON_WIDTH,
          SMALL_BUS_ICON_HEIGHT),
        scaledSize: new google.maps.Size(SMALL_BUS_ICON_WIDTH / 2,
          SMALL_BUS_ICON_HEIGHT / 2),
        anchor: new google.maps.Point(SMALL_BUS_ICON_WIDTH / 4,
          SMALL_BUS_ICON_HEIGHT / 4)
      },
      anchorPoint: new google.maps.Point(0,
        (-1 * SMALL_BUS_ICON_HEIGHT / 4) - 1),
    };
    let largeTransitMarkerOpts = {
      icon: {
        url: LARGE_BUS_ICON_PATH,
        size: new google.maps.Size(LARGE_BUS_ICON_WIDTH,
          LARGE_BUS_ICON_HEIGHT),
        scaledSize: new google.maps.Size(LARGE_BUS_ICON_WIDTH / 2,
          LARGE_BUS_ICON_HEIGHT / 2),
        anchor: new google.maps.Point(LARGE_BUS_ICON_WIDTH / 4,
          LARGE_BUS_ICON_HEIGHT / 4)
      },
      anchorPoint: new google.maps.Point(0,
        (-1 * LARGE_BUS_ICON_HEIGHT / 4) - 1),
    };

    const mapCenter = { lat: MAP_CENTER_LAT, lng: MAP_CENTER_LNG };
    const map = new google.maps.Map(document.getElementById("map"), {
      mapId: MAP_ID,
      zoom: MAP_INIT_ZOOM,
      center: mapCenter,
      gestureHandling: "greedy",
      mapTypeControlOptions: {
        style: google.maps.MapTypeControlStyle.DROPDOWN_MENU,
        mapTypeIds: ["roadmap", "satellite"],
      },
      fullscreenControlOptions: {
        position: google.maps.ControlPosition.BOTTOM_LEFT,
      },
    });

    let infowindow = new google.maps.InfoWindow({
      disableAutoPan: false
    });
    let aptMarkers = addAptMarkers(map);
    setUpAptListeners(map, aptMarkers, infowindow);
    setMapBounds(map, aptMarkers);

    let transitMarkers = addTransitMarkers(map, smallTransitMarkerOpts);
    setUpTransitListeners(map, transitMarkers, infowindow);

    let legend = addLegend(map);

    let prevZoom = 0;
    let div = legend.querySelector("div");
    google.maps.event.addListener(map, 'zoom_changed', () => {
      google.maps.event.addListenerOnce(map, 'idle', () => {
        const zoom = map.getZoom();
        if ((zoom > 12 && prevZoom <= 12) || (zoom <= 12 && prevZoom > 12)) {
          // Display bus stops
          let isVisible = zoom > 12;
          for (i = 0; i < transitMarkers.length; i++) {
            transitMarkers[i].setVisible(isVisible);
          }
          if (isVisible) {
            legend.removeAttribute("hidden");
          } else {
            legend.setAttribute("hidden", "hidden");
          }
        }

        if ((zoom > 14 && prevZoom <= 14) || (zoom <= 14 && prevZoom > 14)) {
          // Change bus stop icon
          let markerOptions = smallTransitMarkerOpts;
          if (zoom > 14) {
            markerOptions = largeTransitMarkerOpts;
          }
          for (i = 0; i < transitMarkers.length; i++) {
            transitMarkers[i].setOptions(markerOptions);
          }
          div.innerHTML = '<img src="' + markerOptions.icon.url + '" width="' + markerOptions.icon.scaledSize.width + '" height="' + markerOptions.icon.scaledSize.height + '"> ' + 'Bus Stop';
        }
        prevZoom = zoom;
      });
    });
    
    google.maps.event.addListener(infowindow,'closeclick',function(){
      if (this.listItem) {
        this.listItem.classList.remove('highlighted');
      }
    });

    toggleButton.addEventListener("click", () => {
      if (listContainer.classList.contains("responsive_hidden")) {
        // Hide map and show list
        listContainer.classList.remove("responsive_hidden");
        listContainer.classList.add("responsive_visible");
        mapContainer.classList.remove("responsive_visible");
        mapContainer.classList.add("responsive_hidden");
        toggleButton.textContent = "Show Map";
        let selectedItem = document.querySelector("li.highlighted");
        if (selectedItem) {
          selectedItem.scrollIntoView();
        }
      } else {
        // Hide list and show map.
        mapContainer.classList.remove("responsive_hidden");
        mapContainer.classList.add("responsive_visible");
        listContainer.classList.remove("responsive_visible");
        listContainer.classList.add("responsive_hidden");
        toggleButton.textContent ="Show List";
        map.fitBounds(bounds);
      }
    });
  }

  window.initMap = initMap;
}());