window.addEventListener("load", function () {
    const snippetDiv = document.querySelector('.external-snippet');

    fetch("https://trstones.github.io/Classroom-360/classroom-database-Aug6-2025.csv")
        .then(response => response.text())
        .then(csv => {
            console.log("Rev: Aug6 C");
            const roomID = getRoomID();
            const excludeList = ["ID", "Building", "Room Number", "WD Room Type", "Department", "Phone in Room", "Photo Index", "Photo URL", "Photo 360 View"];
            //const excludeList = ["ID"]
            const lines = csv.trim().split('\n');
            const headerLine = lines[0];
            const dataLine = lines.slice(1).find(line => {
                const firstValue = line.split(',')[0].trim();
                return firstValue === roomID;
            });
            
            const labels = headerLine.split(',').map(h => h.trim());
            const values = parseCSVLine(dataLine);
            let is_venue = false;

            excludeFields(labels, values, excludeList);

            console.log("Labels:", labels);
            console.log("Values:", values);

            const dict = createDict(labels, values);
            console.log(dict);

            if (dict["Is Venue"] == "Yes") {
                is_venue = true;
            }

            //if (labels.length !== values.length) {
            //    snippetDiv.innerHTML = "<p>Error: CSV column mismatch.</p>";
            //    return;
            //}

            const info = ["Classroom", "Room Type", "Seating Capacity"];
            const feat = ["Technology Details", "Wireless Projection (Solstice)", "Record / Stream", "Video Conferencing (Zoom Room)", "Optical Drive (DVD/Blu-Ray)"];
            const equip = ["Technology/Equipment Additional Notes", "Computer System", "Operating System", "PC CCID", "Number of Lab Computers"];
            const venue = ["Description", "Equipment", "Features", "Seating (Fixed/Open)", "Seating (capacity)", "Microphones"];
            const venue_bool = ["Is Venue"];

            //for (let i = 0; i < labels.length; i++) {
            //    const value = values[i];
            //    if (is_venue.includes(labels[i]) && value != null && value !== "") {
            //        if labels[i] = "Yes" {
            //            is_venue = true;
            //    }
            //}
            console.log("is_venue:", is_venue);
            
            let html = "";
            html += '<center><a class="btn btn-default btn-block" style="width:75%" href="https://colby.teamdynamix.com/TDClient/1928/Portal/Requests/ServiceDet?ID=55250" role="button">Return to Classroom Catalog</a></center>'
            html += '<p><h3>General Information</h3></p>';
            html += '<ul>';
            for (let i = 0; i < labels.length; i++) {
                const value = values[i];
                if (info.includes(labels[i]) && value != null && value !== "") {
                    html += `<li><strong>${labels[i]}:</strong> ${value}</li>`;
                }
            }
            html += '</ul>';
            html += '<hr>';

            if (is_venue == true) {    
                html += '<p><h3>Venue Information</h3></p>';
                html += '<ul>';
                for (let i = 0; i < labels.length; i++) {
                    const value = values[i];
                    if (venue.includes(labels[i]) && value != null && value !== "") {
                        html += `<li><strong>${labels[i]}:</strong> ${value}</li>`;
                    }
                }
                html += '</ul>';
                html += '<hr>';
            }
                
            
            html += '<p><h3>Features</h3></p>';
            html += '<ul>';
            for (let i = 0; i < labels.length; i++) {
                const value = values[i];
                if (feat.includes(labels[i]) && value != null && value !== "") {
                    html += `<li><strong>${labels[i]}:</strong> ${value}</li>`;
                }
            }
            html += '</ul>';
            html += '<hr>';

                
            html += '<p><h3>Equipment</h3></p>';
            html += '<ul>';
            for (let i = 0; i < labels.length; i++) {
                const value = values[i];
                if (equip.includes(labels[i]) && value != null && value !== "") {
                    html += `<li><strong>${labels[i]}:</strong> ${value}</li>`;
                }
            }
            html += '</ul>';
            html += '<hr>';
            
            html += '<h3>360 Image</strong></h3>';
            html += '<p><i>Click and drag to rotate</i></p>';

            snippetDiv.innerHTML = html;
        })
        .catch(error => {
            console.error("Error loading CSV:", error);
            snippetDiv.innerHTML = "<p>Error loading data.</p>";
        });
});

function getRoomID() {
    const paragraphs = document.querySelectorAll('.external-snippet p');

    for (const p of paragraphs) {
        if (p.textContent.includes('RoomID=')) {
            return p.textContent.replace('RoomID=', '');
        }
    }

    return "";
}

function excludeFields(headers, values, exclude) {
    for (let i = headers.length - 1; i >= 0; i--) {
        if (exclude.includes(headers[i])) {
            headers.splice(i, 1);
            values.splice(i, 1);
        }
    }
}

function createDict(labels, values) {
  const result = {};
  for (let i = 0; i < labels.length; i++) {
    result[labels[i]] = values[i];
  }
  return result;
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
