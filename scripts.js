mapboxgl.accessToken = 'pk.eyJ1IjoiajAwYnkiLCJhIjoiY2x1bHUzbXZnMGhuczJxcG83YXY4czJ3ayJ9.S5PZpU9VDwLMjoX_0x5FDQ';
// Determine the initial zoom level based on the screen width
const initialZoom = window.innerWidth < 768 ? 3 : 4;  // Zoom level 3 for mobile, 4 for desktop

const map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/j00by/clvx7jcp006zv01ph3miketyz',
    center: [-97.97919, 40.00215],
    zoom: initialZoom
});

// Add zoom and rotation controls to the map.
map.addControl(new mapboxgl.NavigationControl());


map.on('load', function () {
    // Ensure that the info-icon event listener is added after the map has fully loaded
    document.getElementById('info-icon').addEventListener('click', function () {
        var infoPanel = document.getElementById('info-panel');
        if (infoPanel.style.display === 'none' || infoPanel.style.display === '') {
            infoPanel.style.display = 'block';  // Show the panel
        } else {
            infoPanel.style.display = 'none';  // Hide the panel
        }
    });

    // Load the GeoJSON file for counties and fema declaration count
    map.addSource('counties', {
        type: 'geojson',
        data: 'data/US_Counties.json'
    });

    // Add a layer for counties
    map.addLayer({
        'id': 'counties-layer',
        'type': 'fill',
        'source': 'counties',
        'paint': {
            'fill-color': [
                'match',
                ['coalesce', ['get', 'FEMA_TOTAL_FEMA_DISASTERS'], 0], // Default to 0 if value is null
                0, '#ffffff',
                1, '#fee5d9',
                2, '#fee5d9',
                3, '#fcae91',
                4, '#fcae91',
                5, '#fb6a4a',
                6, '#fb6a4a',
                7, '#de2d26',
                8, '#de2d26',
                9, '#de2d26',
                10, '#a50f15',
                11, '#a50f15',
                12, '#a50f15',
                13, '#a50f15',
                14, '#a50f15',
                15, '#a50f15',
                '#ffffff' // Default color used if none of the values match
            ],
            'fill-opacity': 0.9
        }
    }, 'state-label');



    // Load the GeoJSON file for congressional districts with representative names
    map.addSource('districts', {
        type: 'geojson',
        data: 'data/US_Districts.json'
    });

    // Add a layer for districts
    map.addLayer({
        'id': 'districts-layer',
        'type': 'fill',
        'source': 'districts',
        'paint': {
            'fill-color': 'transparent', // No fill color
            'fill-outline-color': '#000' // Black border color
        }
    });

    // Line layer specifically for district borders
    map.addLayer({
        'id': 'districts-border',
        'type': 'line',
        'source': 'districts',
        'layout': {},
        'paint': {
            'line-color': '#000', // Black border color
            'line-width': 0.5
        }
    }, 'state-label');


    // Move the state labels layer to the top to ensure it is on top of all custom layers
    const stateLabelLayerId = 'state-label';
    if (map.getLayer(stateLabelLayerId)) {
        map.moveLayer(stateLabelLayerId);
    }





    // When a user clicks on a district, show a popup with contact information
    // Initialize the popup globally if it needs to be accessed by different layers
    var popup = new mapboxgl.Popup({
        closeButton: true,
        closeOnClick: true
    });

    // When a user clicks on a district, show a popup with contact information
    map.on('click', function (e) {
        var features = map.queryRenderedFeatures(e.point, { layers: ['districts-layer', 'counties-layer'] });
        var districtInfo = '';
        var countyInfo = '';
        var seenDistricts = {}; // Object to track seen district entries
        var seenCounties = {}; // Object to track seen county entries

        features.forEach(function (feature) {
            if (feature.layer.id === 'districts-layer') {
                const props = feature.properties;
                const districtId = props.FIRSTNAME + props.LASTNAME; // Unique identifier for district entries
                if (!seenDistricts[districtId]) {
                    seenDistricts[districtId] = true;
                    districtInfo += `
                        <div style="min-width: 200px;">
                            <img src="${props.PHOTOURL}" alt="Profile Picture" style="width: 150px; height: 150px; border-radius: 50%; object-fit: cover; display: block; margin-left: auto; margin-right: auto;">
                            <p><strong>${props.FIRSTNAME} ${props.LASTNAME} (${props.PARTY})</strong></p>
                            <p><strong>${props.NAMELSAD20}</strong></p>
                            <p><a href="${props.WEBSITEURL}" target="_blank"><img src="img/id-card.svg" alt="Website" style="width: 24px; height: 24px;"></a>
                               <a href="${props.FACE_BOOK_URL}" target="_blank"><img src="img/facebook.svg" alt="Facebook" style="width: 24px; height: 24px;"></a>
                               <a href="${props.TWITTER_URL}" target="_blank"><img src="img/twitter.svg" alt="Twitter" style="width: 24px; height: 24px;"></a>
                               <a href="${props.INSTAGRAM_URL}" target="_blank"><img src="img/instagram.svg" alt="Instagram" style="width: 24px; height: 24px;"></a>
                            </p>
                        </div>
                    `;
                }
            } else if (feature.layer.id === 'counties-layer') {
                const props = feature.properties;
                const countyId = props.NAME; // Unique identifier for county entries
                if (!seenCounties[countyId]) {
                    seenCounties[countyId] = true;
                    countyInfo += `
                        <h4 style="border-bottom: 2px solid #a50f15; padding-bottom: 5px;">${props.NAME} County has been affected by a total of ${props.FEMA_TOTAL_FEMA_DISASTERS} disasters declared by FEMA.</h4>
                    `;
                }
            }
        });

        // Combine the info with county information on top
        var featureHTML = countyInfo + districtInfo;

        // Display popup at the clicked location
        popup.setLngLat(e.lngLat)
            .setHTML(featureHTML)
            .addTo(map);
    });



    // Update mouse settings to change on enter and leave of any interactive layer
    ['districts-layer', 'counties-layer'].forEach(function (layer) {
        map.on('mouseenter', layer, function () {
            map.getCanvas().style.cursor = 'pointer';
        });

        map.on('mouseleave', layer, function () {
            map.getCanvas().style.cursor = '';
        });
    });


    // Toggle counties layer 
    document.getElementById('toggle-counties').addEventListener('click', function () {
        // Get the current visibility state of the counties-layer
        var visibility = map.getLayoutProperty('counties-layer', 'visibility');

        // Toggle the visibility based on the current state
        if (visibility === 'visible' || visibility === undefined) {
            // If visible, or undefined (not yet set), hide it
            map.setLayoutProperty('counties-layer', 'visibility', 'none');
            this.textContent = 'Show Counties Layer'; // Update button text to show
        } else {
            // If not visible, show it
            map.setLayoutProperty('counties-layer', 'visibility', 'visible');
            this.textContent = 'Hide Counties Layer'; // Update button text to hide
        }
    });



    // HIDE TITLE IF USING AN IFRAME FOR WORDPRESS
    document.addEventListener("DOMContentLoaded", function () {
        if (window.location !== window.parent.location) {
            // The page is in an iframe
            var titleElement = document.querySelector('.css-atlas-title');
            if (titleElement) {
                titleElement.style.display = 'none';
            }
        } else {
            // The page is not in an iframe, do nothing
        }
    });


});
