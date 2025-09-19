window.addEventListener("load", function () {
    const snippetDiv = document.querySelector('.external-snippet');

    fetch("https://trstones.github.io/Classroom-360/classroom-database-Aug6-2025-dev.csv")
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.text();
        })
        .then(csv => {
            const roomID = getRoomID();
            if (!roomID) {
                throw new Error("Room ID not found");
            }

            // Parse CSV and create dictionary upfront
            const roomData = parseCSVToDict(csv, roomID);
            if (!roomData) {
                throw new Error("Room data not found for the specified Room ID");
            }

            // Field categories - these stay static but tied to CSV headers
            const fieldCategories = {
                info: ["Classroom", "Room Type", "Seating Capacity"],
                feat: ["Technology Details", "Wireless Projection (Solstice)", "Record / Stream", "Video Conferencing (Zoom Room)", "Optical Drive (DVD/Blu-Ray)"],
                equip: ["Technology/Equipment Additional Notes", "Computer System", "Operating System", "PC CCID", "Number of Lab Computers"],
                venue: ["Description", "Equipment", "Features", "Seating (Fixed/Open)", "Seating (capacity)", "Microphones"],
                img360: ["360 Image Page"],
                venue_img: ["Venue_Image_1", "Venue_Image_2", "Venue_Image_3", "Venue_Image_4", "Venue_Image_5", "Venue_Image_6", "Venue_Image_7", "Venue_Image_8"]
            };

            const isVenue = roomData["Is Venue"] === "Yes";
            
            //console.log("9/18/25 11:10a");
            
            // Generate HTML - combined into cleaner blocks
            let html = `
                <center>
                    <a class="btn btn-default btn-block" style="width:75%" href="https://colby.teamdynamix.com/TDClient/1928/Portal/Requests/ServiceDet?ID=55250" role="button">
                        Return to Classroom Catalog
                    </a>
                    ${isVenue ? `
                        <a class="btn btn-default btn-block" style="width:75%; margin:3px 0;" href="https://colby.teamdynamix.com/TDClient/1928/Portal/Requests/ServiceDet?ID=55467" role="button">
                            Return to Venue Lookup
                        </a>
                    ` : ''}
                </center>
                <hr>
            `;

            // 360 Image section
            const img360Value = getFieldValue(roomData, fieldCategories.img360);
            if (img360Value) {
                html += `
                    <h3>360 Image</h3>
                    <p><i>Click and drag to rotate</i></p>
                    <p>
                        <iframe allow-same-origin="" height="300" src="https://trstones.github.io/Classroom-360/ImagePages/${img360Value}" width="100%"></iframe>
                    </p>
                    <hr>
                `;
            }

            // Venue Images section (dynamic from CSV)
            const venueImageHtml = generateVenueImages(roomData, fieldCategories.venue_img);
            if (venueImageHtml) {
                html += `
                    <h3>Venue Images</h3>
                    <p><i>Click to enlarge</i></p>
                    <div style="display:flex; flex-wrap:nowrap; justify-content:center; max-width:100%; max-height:200px;">
                        ${venueImageHtml}
                    </div>
                    <p>&nbsp;</p>
                    <hr>
                `;
            }

            // General Information section
            html += `
                <h3>General Information</h3>
                <ul>
                    ${generateFieldList(roomData, fieldCategories.info)}
                </ul>
                <hr>
            `;

            // Venue Information section (only if venue)
            if (isVenue) {
                html += `
                    <h3>Venue Information</h3>
                    <ul>
                        ${generateFieldList(roomData, fieldCategories.venue)}
                    </ul>
                    <br>
                    <a href="https://www.colby.edu/people/offices-directory/events/all-forms/event-request-form/">
                        <em>Book This Venue For An Event</em>
                    </a>
                    <br>
                    <a href="https://colby.teamdynamix.com/TDClient/1928/Portal/Home/">
                        <em>ITS Technical Support</em>
                    </a>
                    <hr>
                `;
            }

            // Features section
            html += `
                <h3>Features</h3>
                <ul>
                    ${generateFieldList(roomData, fieldCategories.feat)}
                </ul>
                <hr>
            `;

            // Equipment section
            html += `
                <h3>Equipment</h3>
                <ul>
                    ${generateFieldList(roomData, fieldCategories.equip)}
                </ul>
            `;

            snippetDiv.innerHTML = html;
        })
        .catch(error => {
            console.error("Error loading CSV:", error);
            let errorMessage = "Unable to load room data. ";
            
            if (error.message.includes("Room ID not found")) {
                errorMessage += "Please check that the room ID is specified correctly.";
            } else if (error.message.includes("Room data not found")) {
                errorMessage += "The specified room was not found in our database.";
            } else if (error.message.includes("HTTP error")) {
                errorMessage += "There was a problem connecting to our database.";
            } else {
                errorMessage += "Please try again later or contact support.";
            }
            
            snippetDiv.innerHTML = `<p>${errorMessage}</p>`;
        });
});

function getRoomID() {
    const paragraphs = document.querySelectorAll('.external-snippet p');

    for (const p of paragraphs) {
        if (p.textContent.includes('RoomID=')) {
            return p.textContent.replace('RoomID=', '').trim();
        }
    }

    return "";
}

function parseCSVToDict(csv, roomID) {
    const lines = csv.trim().split('\n');
    if (lines.length < 2) {
        throw new Error("CSV file appears to be empty or invalid");
    }

    const headerLine = lines[0];
    const dataLine = lines.slice(1).find(line => {
        const firstValue = line.split(',')[0].trim();
        return firstValue === roomID;
    });

    if (!dataLine) {
        return null;
    }

    const labels = headerLine.split(',').map(h => h.trim());
    const values = parseCSVLine(dataLine);

    // Create dictionary immediately
    const dict = {};
    for (let i = 0; i < labels.length && i < values.length; i++) {
        dict[labels[i]] = values[i];
    }

    return dict;
}

function generateFieldList(data, fieldNames) {
    return fieldNames
        .map(fieldName => {
            const value = data[fieldName];
            if (value != null && value !== "") {
                return `<li><strong>${fieldName}:</strong> ${value}</li>`;
            }
            return "";
        })
        .filter(item => item !== "")
        .join("");
}

function getFieldValue(data, fieldNames) {
    for (const fieldName of fieldNames) {
        const value = data[fieldName];
        if (value != null && value !== "") {
            return value;
        }
    }
    return null;
}

function parseCSVLine(line) {
    const result = [];
    let inQuotes = false;
    let currentField = '';

    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        
        if (char === '"') {
            // Check if this is an escaped quote (double quote) inside a quoted field
            if (inQuotes && i + 1 < line.length && line[i + 1] === '"') {
                currentField += '"';
                i++; // Skip the next quote character
            } else {
                // Toggle the inQuotes flag
                inQuotes = !inQuotes;
            }
        } else if (char === ',' && !inQuotes) {
            // End of field
            result.push(currentField.trim());
            currentField = '';
        } else {
            currentField += char;
        }
    }
    
    // Add the last field
    result.push(currentField.trim());
    
    return result;
}

function generateVenueImages(data, venueImageFields) {
    const baseUrl = "https://trstones.github.io/Classroom-360/ImagesFlat/";
    
    return venueImageFields
        .map(fieldName => {
            const filename = data[fieldName];
            if (filename != null && filename !== "") {
                return `
                    <div data-modal-image="${baseUrl}${filename}" 
                         style="flex:1; margin:5px; height:150px; overflow:hidden; min-width:20px; cursor:pointer;">
                        <img src="${baseUrl}${filename}" 
                             style="width:100%; height:100%; object-fit:cover;" />
                    </div>
                `;
            }
            return "";
        })
        .filter(imageDiv => imageDiv !== "")
        .join("");
}