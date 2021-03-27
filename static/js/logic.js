$(document).ready(function() {
    makeMap();

});

function makeMap() {
    // set title
    $("#maptitle").text(`All Earthquakes Recorded by the USGS for the past 7 days`);

    var queryUrl = 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_week.geojson'

    // Perform a GET request
    $.ajax({
        type: "GET",
        url: queryUrl,
        success: function(data) {
            // make second call for tetonic plates
            $.ajax({
                type: "GET",
                url: "static/data/tetonic_data.json",
                success: function(tectonicPlates) {
                    // build map with both datasets
                    buildMap(data, tectonicPlates);
                },
                error: function(XMLHttpRequest, textStatus, errorThrown) {
                    alert("Status: " + textStatus);
                    alert("Error: " + errorThrown);
                }
            });
        },
        error: function(XMLHttpRequest, textStatus, errorThrown) {
            alert("Status: " + textStatus);
            alert("Error: " + errorThrown);
        }
    });
}

function buildMap(data, tectonicPlates) {
    $("#mapcontainer").empty();
    $("#mapcontainer").append(`<div id="mymap"></div>`);

    // Create the Tile Layers
    // Add a tile layer
    var dark_mode = L.tileLayer("https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}", {
        attribution: "© <a href='https://www.mapbox.com/about/maps/'>Mapbox</a> © <a href='http://www.openstreetmap.org/copyright'>OpenStreetMap</a> <strong><a href='https://www.mapbox.com/map-feedback/' target='_blank'>Improve this map</a></strong>",
        tileSize: 512,
        maxZoom: 18,
        zoomOffset: -1,
        id: "mapbox/dark-v10",
        accessToken: API_KEY
    });

    var light_mode = L.tileLayer("https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}", {
        attribution: "© <a href='https://www.mapbox.com/about/maps/'>Mapbox</a> © <a href='http://www.openstreetmap.org/copyright'>OpenStreetMap</a> <strong><a href='https://www.mapbox.com/map-feedback/' target='_blank'>Improve this map</a></strong>",
        tileSize: 512,
        maxZoom: 18,
        zoomOffset: -1,
        id: "mapbox/light-v10",
        accessToken: API_KEY
    });

    var satellite_mode = L.tileLayer("https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}", {
        attribution: "© <a href='https://www.mapbox.com/about/maps/'>Mapbox</a> © <a href='http://www.openstreetmap.org/copyright'>OpenStreetMap</a> <strong><a href='https://www.mapbox.com/map-feedback/' target='_blank'>Improve this map</a></strong>",
        tileSize: 512,
        maxZoom: 18,
        zoomOffset: -1,
        id: "mapbox/satellite-v9",
        accessToken: API_KEY
    });

    // Create a map object
    var myMap = L.map("mymap", {
        center: [36.0, -96.5],
        zoom: 4,
        layers: [light_mode, dark_mode, satellite_mode]
    });

    // Create tectonic plates
    var tectonic_plates = L.geoJSON(tectonicPlates, {
        color: "white",
        weight: 3
    });

    // Create Markers
    var earthquakes = [];
    var circles = [];
    data.features.forEach(function(earthquake) {
        var marker = L.geoJSON(earthquake, {
            onEachFeature: onEachFeature
        });
        earthquakes.push(marker);

        var circle = L.geoJSON(earthquake, {
            pointToLayer: function(feature, latlng) {
                var markerDisplay = markerFeatures(feature);
                return L.circleMarker(latlng, markerDisplay);
            },
            onEachFeature: onEachFeature
        });
        circles.push(circle);
    });




    var marker_group = L.layerGroup(earthquakes);
    var marker_group2 = L.layerGroup(circles);
    var tectonic_layer = L.layerGroup([tectonic_plates]);

    // Create Layers
    var baseMaps = {
        "Light Mode": light_mode,
        "Dark Mode": dark_mode,
        "Satellite Mode": satellite_mode
    };

    var overlayMaps = {
        "Markers": marker_group,
        "Circles": marker_group2,
        "Tectonic Plates": tectonic_layer
    };

    // Layer Legend to map
    L.control.layers(baseMaps, overlayMaps).addTo(myMap);

    // add layers pre-clicked to map
    tectonic_plates.addTo(myMap);
    marker_group2.addTo(myMap);

    // Step 4: CREATE THE LEGEND (of Zelda)

    // Set up the legend
    var legend = L.control({ position: "bottomleft" });
    legend.onAdd = function() {
        var div = L.DomUtil.create("div", "info legend");

        // create legend as raw html
        var legendInfo = `<h4 style = "margin-bottom:10px"> Earthquake Depth </h4>
        <div>
        <div style = "background:#98ee00;height:10px;width:10px;display:inline-block"> </div> 
        <div style = "display:inline-block"> Less than 10 Miles</div>
        </div> 
        <div>
        <div style = "background:#d4ee00;height:10px;width:10px;display:inline-block"></div> 
        <div style = "display:inline-block">10 - 30 Miles</div>
        </div>
        <div>
        <div style = "background:#eecc00;height:10px;width:10px;display:inline-block"></div>
        <div style = "display:inline-block">30 - 50 Miles</div>
        </div>
        <div>
        <div style = "background:#ee9c00;height:10px;width:10px;display:inline-block"></div> 
        <div style = "display:inline-block">50 - 70 Miles</div>
        </div>
        <div>
        <div style = "background:#ea822c;height:10px;width:10px;display:inline-block"></div>
        <div style = "display:inline-block">70 - 90 Miles</div>
        </div> 
        <div>
        <div style = "background:#ea2c2c;height:10px;width:10px;display:inline-block"></div>
        <div style = "display:inline-block">Greater than 90 Miles</div>
        </div>`;

        div.innerHTML = legendInfo;
        return (div)
    }

    // Adding legend to the map
    legend.addTo(myMap);

}

function markerFeatures(feature) {
    var depth = feature.geometry.coordinates[2];
    var theColor = "";
    if (depth > 90) {
        theColor = "#ea2c2c";
    } else if (depth > 70) {
        theColor = "#ea822c";
    } else if (depth > 50) {
        theColor = "#ee9c00";
    } else if (depth > 30) {
        theColor = "#eecc00";
    } else if (depth > 10) {
        theColor = "#d4ee00";
    } else {
        theColor = "#98ee00";
    }


    var markerDisplay = {
        radius: (feature.properties.mag * 4),
        fillColor: theColor,
        color: "#000",
        weight: 1,
        opacity: 1,
        fillOpacity: 0.8
    };

    return (markerDisplay)
}

function onEachFeature(feature, layer) {

    if (feature.properties && feature.properties.place) {
        layer.bindPopup(feature.properties.title);
    }
}