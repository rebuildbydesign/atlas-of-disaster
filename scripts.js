mapboxgl.accessToken = 'pk.eyJ1IjoiajAwYnkiLCJhIjoiY2x1bHUzbXZnMGhuczJxcG83YXY4czJ3ayJ9.S5PZpU9VDwLMjoX_0x5FDQ';
// Determine the initial zoom level based on the screen width
const initialZoom = window.innerWidth < 768 ? 3 : 4;  // Zoom level 3 for mobile, 4 for desktop

const map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/light-v10',
    center: [-97.97919, 40.00215],
    zoom: initialZoom  // Use the dynamic zoom level based on device type
});

// Add zoom and rotation controls to the map.
map.addControl(new mapboxgl.NavigationControl());


map.on('load', function () {
    // Ensure that the info-icon event listener is added after the map has fully loaded
     document.getElementById('info-icon').addEventListener('click', function() {
        var infoPanel = document.getElementById('info-panel');
        if (infoPanel.style.display === 'none' || infoPanel.style.display === '') {
            infoPanel.style.display = 'block';  // Show the panel
        } else {
            infoPanel.style.display = 'none';  // Hide the panel
        }
    });
    
    // Load the GeoJSON file for congressional districts with representative names
    map.addSource('districts', {
        type: 'geojson',
        data: 'https://j00by.github.io/atlas-of-disaster/data/US_Districts.json'
    });

    // Add a layer for districts
    map.addLayer({
        'id': 'districts-layer',
        'type': 'fill',
        'source': 'districts',
        'paint': {
            'fill-color': '#e6e6e5',  // Existing fill color
            'fill-opacity': 0.4,      // Existing opacity
            'fill-outline-color': '#000000'  // Setting black as the border color
        }
    });

    // Line layer specifically for district borders
    map.addLayer({
        'id': 'districts-border',
        'type': 'line',
        'source': 'districts',
        'layout': {},
        'paint': {
            'line-color': '#791c41',  // Black border color
            'line-width': 2  // Adjust line width here for thicker borders
        }
    });

    // Load the GeoJSON file for counties and fema declaration count
    map.addSource('counties', {
        type: 'geojson',
        data: 'https://j00by.github.io/atlas-of-disaster/data/US_Counties.json'
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
                0, '#e6e6e5',
                1, '#f8e0de',
                2, '#f8e0de',
                3, '#f5c6c2',
                4, '#f5c6c2',
                5, '#eea3b6',
                6, '#eea3b6',
                7, '#e770a1',
                8, '#e770a1',
                9, '#e770a1',
                10, '#9c335d',
                11, '#9c335d',
                12, '#9c335d',
                13, '#9c335d',
                14, '#9c335d',
                15, '#9c335d',
                '#e6e6e5' // Default color used if none of the values match
            ],
            'fill-outline-color': '#ffffff',
            'fill-opacity': 0.8
        }
    });
    


    // When a user clicks on a district, show a popup with contact information
    // Initialize the popup globally if it needs to be accessed by different layers
    var popup = new mapboxgl.Popup({
        closeButton: true,
        closeOnClick: true
    });

    // When a user clicks on a district, show a popup with contact information
    map.on('click', function (e) {
        var features = map.queryRenderedFeatures(e.point, { layers: ['districts-layer', 'counties-layer'] });
        var featureHTML = '';

        features.forEach(function (feature) {
            if (feature.layer.id === 'districts-layer') {
                const props = feature.properties;
                featureHTML += `
                    <div style="min-width: 200px;">
                    <img src="${props.PHOTOURL}" alt="Profile Picture" style="width: 150px; height: 150px; border-radius: 50%; object-fit: cover; display: block; margin-left: auto; margin-right: auto;">
                        <p><strong>${props.FIRSTNAME} ${props.LASTNAME} (${props.PARTY})</strong></p>
                        <p><strong>${props.NAMELSAD20}</strong></p>
                        <p><a href="${props.WEBSITEURL}" target="_blank"><img src="https://j00by.github.io/atlas-of-disaster/images/id-card.svg" alt="Website" style="width: 24px; height: 24px;"></a>
                           <a href="${props.FACE_BOOK_URL}" target="_blank"><img src="https://j00by.github.io/atlas-of-disaster/images/facebook.svg" alt="Facebook" style="width: 24px; height: 24px;"></a>
                           <a href="${props.TWITTER_URL}" target="_blank"><img src="https://j00by.github.io/atlas-of-disaster/images/twitter.svg" alt="Twitter" style="width: 24px; height: 24px;"></a>
                           <a href="${props.INSTAGRAM_URL}" target="_blank"><img src="https://j00by.github.io/atlas-of-disaster/images/instagram.svg" alt="Instagram" style="width: 24px; height: 24px;"></a>
                        </p>
                    </div>
                `;
            } else if (feature.layer.id === 'counties-layer') {
                const props = feature.properties;
                featureHTML += `
                <h4 style="border-bottom: 2px solid #e770a1; padding-bottom: 5px;">${props.NAME} County has been affected by a total of ${props.FEMA_TOTAL_FEMA_DISASTERS} disasters declared by FEMA.</h4>
                `;
            }
        });

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


    // Information box top left for methodology
    document.getElementById('info-icon').addEventListener('click', function () {
        var infoPanel = document.getElementById('info-panel');
        if (infoPanel.style.display === 'none') {
            infoPanel.style.display = 'block';
        } else {
            infoPanel.style.display = 'none';
        }
    });


});
