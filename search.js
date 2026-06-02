(function() {
    // 1. Identify the container on the TDx page
    const appContainer = document.getElementById('classroom-search-app');
    if (!appContainer) return; // Safely exit if not on the search page

    // 2. Inject the CSS styles directly into the TDx page head
    const styles = `
        .search-container { background: #f9f9f9; padding: 20px; border-radius: 8px; border: 1px solid #ddd; margin-bottom: 20px; }
        .filter-group { margin-bottom: 15px; display: flex; flex-wrap: wrap; gap: 15px; }
        .filter-item { display: flex; flex-direction: column; }
        .filter-item label { font-weight: bold; margin-bottom: 5px; font-size: 0.9em; color: #333; }
        .filter-item input, .filter-item select { padding: 8px; border: 1px solid #ccc; border-radius: 4px; background: white; }
        .checkbox-group { display: flex; gap: 15px; align-items: center; margin-top: 10px; flex-wrap: wrap; }
        .checkbox-item { display: flex; align-items: center; gap: 5px; color: #333; }
        button#searchBtn { background-color: #0056b3; color: white; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer; font-size: 1em; }
        button#searchBtn:hover { background-color: #004494; }
        #results-status { margin-bottom: 15px; font-style: italic; color: #666; }
        .room-card { background: white; border: 1px solid #e1e1e1; padding: 15px; margin-bottom: 10px; border-radius: 5px; box-shadow: 0 2px 4px rgba(0,0,0,0.05); }
        .room-title { font-size: 1.2em; font-weight: bold; margin: 0 0 10px 0; }
        .room-title a { color: #0056b3; text-decoration: none; }
        .room-title a:hover { text-decoration: underline; }
        .room-details { margin: 0; font-size: 0.9em; line-height: 1.5; color: #444; }
        .feature-badge { display: inline-block; background: #e9ecef; padding: 2px 6px; border-radius: 4px; margin-right: 5px; margin-top: 5px; font-size: 0.85em; color: #495057; }
    `;
    const styleSheet = document.createElement("style");
    styleSheet.innerText = styles;
    document.head.appendChild(styleSheet);

    // 3. Inject the Search UI interface HTML layout
    appContainer.innerHTML = `
        <div class="search-container">
            <h2>Find a Space</h2>
            <div class="filter-group">
                <div class="filter-item">
                    <label for="buildingSelect">Building</label>
                    <select id="buildingSelect"><option value="Any">Any Building</option></select>
                </div>
                <div class="filter-item">
                    <label for="roomTypeSelect">Room Type</label>
                    <select id="roomTypeSelect"><option value="Any">Any Type</option></select>
                </div>
                <div class="filter-item">
                    <label for="capacityInput">Minimum Seats Required</label>
                    <input type="number" id="capacityInput" min="1" placeholder="e.g. 20">
                </div>
            </div>
            <div class="checkbox-group">
                <div class="checkbox-item"><input type="checkbox" id="reqZoom"><label for="reqZoom">Zoom</label></div>
                <div class="checkbox-item"><input type="checkbox" id="reqComputerLab"><label for="reqComputerLab">Computer Lab</label></div>
                <div class="checkbox-item"><input type="checkbox" id="reqDvd"><label for="reqDvd">DVD Player</label></div>
                <div class="checkbox-item"><input type="checkbox" id="reqRecordStream"><label for="reqRecordStream">Record/Stream</label></div>
                <div class="checkbox-item"><input type="checkbox" id="reqVenue"><label for="reqVenue">Venue</label></div>
            </div>
            <br>
            <button id="searchBtn">Search</button>
        </div>
        <div id="results-status">Loading database...</div>
        <div id="results-container"></div>
    `;

    // 4. Main Search Engine Logic (Identical to your working code)
    const CSV_URL = 'https://raw.githubusercontent.com/trstones/Classroom-360/main/classroom-database.csv';
    const COLUMNS = {
        building: 'Building', roomNumber: 'Room Number', roomType: 'WD Room Type',
        capacity: 'Seating Capacity', zoom: 'Video Conferencing (Zoom Room)',
        computerLab: 'Number of Lab Computers', dvd: 'Optical Drive (DVD/Blu-Ray)',
        recordStream: 'Record / Stream', venue: 'Is Venue', searchable: 'Searchable', tdxUrl: 'TDx URL'
    };

    let masterData = [];
    const isYes = (val) => val && val.toString().toLowerCase().trim() === 'yes';
    const isLab = (val) => val && val.toString().trim() !== '' && parseInt(val, 10) > 0;

    Papa.parse(CSV_URL, {
        download: true,
        header: true,
        skipEmptyLines: true,
        complete: function(results) {
            masterData = results.data.filter(room => isYes(room[COLUMNS.searchable]));
            initializeFilters();
            displayResults(masterData);
        },
        error: function(err) {
            document.getElementById('results-status').textContent = 'Error loading data.';
            console.error(err);
        }
    });

    function initializeFilters() {
        const buildings = new Set();
        const roomTypes = new Set();
        masterData.forEach(row => {
            if (row[COLUMNS.building]?.trim()) buildings.add(row[COLUMNS.building].trim());
            if (row[COLUMNS.roomType]?.trim()) roomTypes.add(row[COLUMNS.roomType].trim());
        });

        const bSelect = document.getElementById('buildingSelect');
        Array.from(buildings).sort().forEach(b => bSelect.options.add(new Option(b, b)));

        const tSelect = document.getElementById('roomTypeSelect');
        Array.from(roomTypes).sort().forEach(t => tSelect.options.add(new Option(t, t)));
    }

    document.getElementById('searchBtn').addEventListener('click', function() {
        const prefBldg = document.getElementById('buildingSelect').value;
        const prefType = document.getElementById('roomTypeSelect').value;
        const reqCap = parseInt(document.getElementById('capacityInput').value, 10) || 0;
        
        const rZoom = document.getElementById('reqZoom').checked;
        const rLab = document.getElementById('reqComputerLab').checked;
        const rDvd = document.getElementById('reqDvd').checked;
        const rStream = document.getElementById('reqRecordStream').checked;
        const rVenue = document.getElementById('reqVenue').checked;

        const filtered = masterData.filter(room => {
            if (prefBldg !== 'Any' && room[COLUMNS.building] !== prefBldg) return false;
            if (prefType !== 'Any' && room[COLUMNS.roomType] !== prefType) return false;
            if ((parseInt(room[COLUMNS.capacity], 10) || 0) < reqCap) return false;
            if (rZoom && !isYes(room[COLUMNS.zoom])) return false;
            if (rLab && !isLab(room[COLUMNS.computerLab])) return false;
            if (rDvd && !isYes(room[COLUMNS.dvd])) return false;
            if (rStream && !isYes(room[COLUMNS.recordStream])) return false;
            if (rVenue && !isYes(room[COLUMNS.venue])) return false;
            return true;
        });
        displayResults(filtered);
    });

    function displayResults(data) {
        const container = document.getElementById('results-container');
        const status = document.getElementById('results-status');
        container.innerHTML = '';
        status.textContent = `Found ${data.length} space(s).`;

        data.forEach(room => {
            const card = document.createElement('div');
            card.className = 'room-card';

            const title = document.createElement('h3');
            title.className = 'room-title';
            const titleText = `${room[COLUMNS.building] || 'Unknown'} ${room[COLUMNS.roomNumber] || 'Unknown'}`;
            const url = room[COLUMNS.tdxUrl] ? room[COLUMNS.tdxUrl].trim() : '';

            if (url) {
                const link = document.createElement('a');
                link.href = url;
                link.target = '_blank';
                link.rel = 'noopener noreferrer';
                link.textContent = titleText;
                title.appendChild(link);
            } else {
                title.textContent = titleText;
            }

            const details = document.createElement('p');
            details.className = 'room-details';
            details.textContent = `Type: ${room[COLUMNS.roomType] || 'N/A'} | Seats: ${room[COLUMNS.capacity] || 'N/A'}`;
            card.appendChild(title);
            card.appendChild(details);

            const badges = document.createElement('div');
            if (isYes(room[COLUMNS.zoom])) addBadge(badges, 'Zoom');
            if (isLab(room[COLUMNS.computerLab])) addBadge(badges, `Computer Lab (${room[COLUMNS.computerLab].trim()} stations)`);
            if (isYes(room[COLUMNS.dvd])) addBadge(badges, 'DVD Player');
            if (isYes(room[COLUMNS.recordStream])) addBadge(badges, 'Record/Stream');
            if (isYes(room[COLUMNS.venue])) addBadge(badges, 'Venue');

            if (badges.hasChildNodes()) card.appendChild(badges);
            container.appendChild(card);
        });
    }

    function addBadge(container, text) {
        const span = document.createElement('span');
        span.className = 'feature-badge';
        span.textContent = text;
        container.appendChild(span);
    }
})();