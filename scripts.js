mapboxgl.accessToken = 'pk.eyJ1IjoiajAwYnkiLCJhIjoiY2x1bHUzbXZnMGhuczJxcG83YXY4czJ3ayJ9.S5PZpU9VDwLMjoX_0x5FDQ';

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

    map.addSource('state-senators', {
        type: 'geojson',
        data: 'data/state-senators.json'
    });
    
    // IN CASE I WANT TO SHOW THIS STATE BOUNDARIES IN THE FUTURE
    // map.addLayer({
    //     'id': 'senators-layer',
    //     'type': 'circle',
    //     'source': 'state-senators',
    //     'paint': {
    //         'circle-radius': 5,
    //         'circle-color': '#007cbf'
    //     }
    // });
    



    // MAPBOX STUDIO EDITING - Move the state labels layer to the top to ensure it is on top of all custom layers
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


    // Add state label for respective State FIPS numeric code for popup addition
    const stateFipsMapping = {
        '01': 'Alabama', '02': 'Alaska', '04': 'Arizona', '05': 'Arkansas', '06': 'California',
        '08': 'Colorado', '09': 'Connecticut', '10': 'Delaware', '11': 'District of Columbia',
        '12': 'Florida', '13': 'Georgia', '15': 'Hawaii', '16': 'Idaho', '17': 'Illinois',
        '18': 'Indiana', '19': 'Iowa', '20': 'Kansas', '21': 'Kentucky', '22': 'Louisiana',
        '23': 'Maine', '24': 'Maryland', '25': 'Massachusetts', '26': 'Michigan', '27': 'Minnesota',
        '28': 'Mississippi', '29': 'Missouri', '30': 'Montana', '31': 'Nebraska', '32': 'Nevada',
        '33': 'New Hampshire', '34': 'New Jersey', '35': 'New Mexico', '36': 'New York',
        '37': 'North Carolina', '38': 'North Dakota', '39': 'Ohio', '40': 'Oklahoma', '41': 'Oregon',
        '42': 'Pennsylvania', '44': 'Rhode Island', '45': 'South Carolina', '46': 'South Dakota',
        '47': 'Tennessee', '48': 'Texas', '49': 'Utah', '50': 'Vermont', '51': 'Virginia',
        '53': 'Washington', '54': 'West Virginia', '55': 'Wisconsin', '56': 'Wyoming',
        '60': 'American Samoa', '64': 'Federated States of Micronesia', '66': 'Guam',
        '68': 'Marshall Islands', '69': 'Northern Mariana Islands', '70': 'Palau',
        '72': 'Puerto Rico', '74': 'U.S. Minor Outlying Islands', '78': 'U.S. Virgin Islands',
        '81': 'Baker Island', '84': 'Howland Island', '86': 'Jarvis Island',
        '67': 'Johnston Atoll', '89': 'Kingman Reef', '71': 'Midway Islands', '76': 'Navassa Island',
        '95': 'Palmyra Atoll', '79': 'Wake Island'
    };

    // When a user clicks on a district, show a popup with contact information
    map.on('click', function (e) {
        var features = map.queryRenderedFeatures(e.point, { layers: ['districts-layer', 'counties-layer'] });
        var districtInfo = '';
        var countyInfo = '';
        var seenDistricts = {}; // Object to track seen district entries
        var seenCounties = {}; // Object to track seen county entries

        // DISTRICTS-LAYER = CONGRESSIONAL 118TH NAMES + CONTACT INFO
        features.forEach(function (feature) {
            if (feature.layer.id === 'districts-layer') {
                const props = feature.properties;
                const districtId = props.FIRSTNAME + props.LASTNAME; // Unique identifier for district entries
                // congress photourl code here <img src="${props.PHOTOURL}" alt="Profile Picture" style="width: 100px; height: 100px; border-radius: 50%; object-fit: cover; display: block; align: left;">

                // NAMELSAD 20 = CONGRESSIONAL DISTRICT #
                if (!seenDistricts[districtId]) {
                    seenDistricts[districtId] = true;
                    districtInfo += `
                        <div style="min-width: 200px">
                        <p><strong>${props.NAMELSAD20}</strong></p>
                        <p style="font-weight: bold; color: #a50f15">Congress Representative</p>
                        <p>${props.FIRSTNAME} ${props.LASTNAME} (${props.PARTY})</p> 
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
                const stateName = stateFipsMapping[props.STATEFP]; // Retrieve state name using FIPS code
                if (!seenCounties[countyId]) {
                    seenCounties[countyId] = true;
                    countyInfo += `
                        <h3 style="border-bottom: 2px solid #fb6a4a; padding-bottom: 5px;">${props.NAME} County, ${stateName}</h4>
                        <p><strong># of Federally Declared Disasters:</strong> ${props.FEMA_TOTAL_FEMA_DISASTERS}
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
            this.textContent = 'Show Disaster Data'; // Update button text to show
        } else {
            // If not visible, show it
            map.setLayoutProperty('counties-layer', 'visibility', 'visible');
            this.textContent = 'Hide Disaster Data'; // Update button text to hide
        }
    });




});
