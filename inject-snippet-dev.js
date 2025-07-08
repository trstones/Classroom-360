window.addEventListener("load", function () {
    const snippetDiv = document.querySelector('.external-snippet');

    fetch("https://trstones.github.io/Classroom-360/classroom-database-May16-2025.csv")
        .then(response => response.text())
        .then(csv => {
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

            excludeFields(labels, values, excludeList);

            console.log("Labels:", labels);
            console.log("Values:", values);

            //if (labels.length !== values.length) {
            //    snippetDiv.innerHTML = "<p>Error: CSV column mismatch.</p>";
            //    return;
            //}

            const info = ["Classroom", "Room Type", "Seating"];
            const feat = ["Technology Details", "Wireless Projection (Solstice)", "Record / Stream", "Video Conferencing (Zoom Room)", "Optical Drive"];
            const equip = ["Technology/Equipment Additional Notes", "System", "Operating System", "PC CCID", "Number of Lab Computers"];

            let html = "";
            html += '<p><h3>Information:</h3></p>';
            html += '<ul>';
            for (let i = 0; i < labels.length; i++) {
                const value = values[i];
                if (info.includes(labels[i]) && value != null && value !== "") {
                    html += `<li><strong>${labels[i]}:</strong> ${value}</li>`;
                }
            }
            html += '</ul>';
            html += '<hr>';
            html += '<p><h3>Features:</h3></p>';
            html += '<ul>';
            for (let i = 0; i < labels.length; i++) {
                const value = values[i];
                if (feat.includes(labels[i]) && value != null && value !== "") {
                    html += `<li><strong>${labels[i]}:</strong> ${value}</li>`;
                }
            }
            html += '</ul>';
            html += '<hr>';
            html += '<p><h3>Equipment:</h3></p>';
            html += '<ul>';
            for (let i = 0; i < labels.length; i++) {
                const value = values[i];
                if (equip.includes(labels[i]) && value != null && value !== "") {
                    html += `<li><strong>${labels[i]}:</strong> ${value}</li>`;
                }
            }
            html += '</ul>';
            html += '<hr>';
            

            html += '<center> \
                        <div class="well" style="width: 75%">\
                            <b>\
                                <a href="https://www.colby.edu/acits/wp-content/uploads/sites/178/2017/08/Icon_telefoon.png">\
                                <img alt="" class="alignnone wp-image-7085" height="32" src="https://www.colby.edu/acits/wp-content/uploads/sites/178/2017/08/Icon_telefoon.png" width="32">\
                                </a> Return to the Classroom Catalog</b>\
                                </div>\
                    </center>';
            html += '<br>';
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

/**
function parseCSVLine(line) {
    console.log("Parse line (input):", line);
    const regex = /(".*?"|[^",]*)(?:,|$)/g;
    const matches = [];
    let match;

    while ((match = regex.exec(line)) !== null) {
        let field = match[1];

        if (field.startsWith('"') && field.endsWith('"')) {
             field = field.substring(1, field.length - 1);
             field = field.replace(/""/g, '"');
         }

        matches.push(field.trim());
    }
    console.log("Parse line (output):", matches);
    return matches;
}
*/

