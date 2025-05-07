window.addEventListener("load", function () {
    const snippetDiv = document.querySelector('.external-snippet');

    // Function to extract RoomID from the div content
    function getRoomID(divElement) {
        if (!divElement) return null;
        const paragraphs = divElement.getElementsByTagName('p');
        for (let p of paragraphs) {
            if (p.textContent.startsWith("RoomID=")) {
                return p.textContent.split('=')[1].trim();
            }
        }
        return null; // Return null if RoomID paragraph is not found
    }

    const targetRoomID = getRoomID(snippetDiv);

    if (!targetRoomID) {
        snippetDiv.innerHTML = "<p>Error: RoomID not found in the HTML snippet.</p>";
        console.error("RoomID paragraph not found within .external-snippet");
        return;
    }

    
    fetch("https://trstones.github.io/Classroom-360/room-data.csv")
        .then(response => response.text())
        .then(csv => {
            const lines = csv.trim().split('\n');
            if (lines.length < 2) {
                snippetDiv.innerHTML = "<p>Error: CSV has no data rows.</p>";
                return;
            }

            const headerLine = lines[0];
            const dataLines = lines.slice(1);

            const labels = headerLine.split(',').map(h => h.trim());

            // **IMPORTANT**: Adjust 'RoomID' if your CSV uses a different column name for the ID
            const idColumnName = 'ID';
            const roomIDColumnIndex = labels.indexOf(idColumnName);

            console.log("Labels:", labels);
            console.log("Values:", values);

           if (roomIDColumnIndex === -1) {
                snippetDiv.innerHTML = `<p>Error: ID column "${idColumnName}" not found in CSV header.</p>`;
                console.error(`ID column "${idColumnName}" not found. CSV Headers:`, labels);
                return;
            }

            let selectedDataLine = null;
            for (let line of dataLines) {
                const tempValues = parseCSVLine(line);
                if (tempValues.length > roomIDColumnIndex && tempValues[roomIDColumnIndex] === targetRoomID) {
                    selectedDataLine = line;
                    break;
                }
            }

            if (!selectedDataLine) {
                snippetDiv.innerHTML = `<p>Error: RoomID ${targetRoomID} not found in CSV data.</p>`;
                console.log("Target RoomID:", targetRoomID);
                console.log("Available RoomIDs in CSV at column index", roomIDColumnIndex, ":");
                dataLines.forEach(line => {
                    const vals = parseCSVLine(line);
                    if (vals.length > roomIDColumnIndex) console.log(vals[roomIDColumnIndex]);
                });
                return;
            }

            const values = parseCSVLine(selectedDataLine);

            console.log("Labels:", labels);
            console.log("Selected Values for RoomID " + targetRoomID + ":", values);

            if (labels.length !== values.length) {
                snippetDiv.innerHTML = "<p>Error: CSV column mismatch for selected row.</p>";
                return;
            }

            let html = "";

            const existingRoomIDPara = Array.from(snippetDiv.getElementsByTagName('p')).find(p => p.textContent.startsWith("RoomID="));
            if (existingRoomIDPara) existingRoomIDPara.remove();
            
            // Remove "Loading classroom data..." if it exists
            //const loadingPara = Array.from(snippetDiv.getElementsByTagName('p')).find(p => p.textContent.includes("Loading classroom data..."));
            //if(loadingPara) loadingPara.remove();


            for (let i = 0; i < labels.length; i++) {
                // Optionally, skip displaying the RoomID itself if it's redundant
                // if (labels[i] === idColumnName) continue;
                html += `<p><strong>${labels[i]}:</strong> ${values[i]}</p>`;
            }

            snippetDiv.innerHTML = html; // This will replace "Loading..." and "RoomID=X"
        })
        .catch(error => {
            console.error("Error loading or processing CSV:", error);
            snippetDiv.innerHTML = "<p>Error loading or processing data.</p>";
        });
});

function parseCSVLine(line) {
    const regex = /(".*?"|[^",\n]+)(?=\s*,|\s*$)/g;
    const matches = [];
    let match;
    
    while (match = regex.exec(line)) {
        let value = match[0].trim();
        if (value.startsWith('"') && value.endsWith('"')) {
            value = value.substring(1, value.length - 1).replace(/""/g, '"');
        }
        matches.push(value);
    }
    return matches;
}
