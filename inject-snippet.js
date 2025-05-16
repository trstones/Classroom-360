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

            let html = "";
            for (let i = 0; i < labels.length; i++) {
                const value = values[i];
                if (value != null && value !== "") {
                    html += `<p><strong>${labels[i]}:</strong> ${value}</p>`;
                }
            }

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
