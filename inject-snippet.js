window.addEventListener("load", function () {
    const snippetDiv = document.querySelector('.external-snippet');

    fetch("https://trstones.github.io/Classroom-360/room-data.csv")
        .then(response => response.text())
        .then(csv => {
            const roomID = getRoomID();
            const excludeList = ["ID", "CCID"];
            const lines = csv.trim().split('\n');
            const headerLine = lines[0];
            const dataLine = lines.slice(1).find(line => {
                const firstValue = line.split(',')[0].trim();
                return firstValue === roomID;
            });

            excludeFields(headerLine, dataLine, excludeList);
            //const [headerLine, dataLine] = csv.trim().split('\n');
            
            // Parse CSV correctly by handling quotes properly
            const labels = headerLine.split(',').map(h => h.trim());
            const values = parseCSVLine(dataLine);

            console.log("Labels:", labels);
            console.log("Values:", values);

            if (labels.length !== values.length) {
                snippetDiv.innerHTML = "<p>Error: CSV column mismatch.</p>";
                return;
            }

            let html = "";
            for (let i = 0; i < labels.length; i++) {
                html += `<p><strong>${labels[i]}:</strong> ${values[i]}</p>`;
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
    console.log("*****");
    console.log("Exclude:", exclude);
    console.log("Headers:", headers);
    console.log("Values:", values);
    console.log("*****");
    for (let i = headers.length - 1; i >= 0; i--) {
        console.log("Checking:", headerLine[i], "against excludeList");
        
        if (exclude.includes(headers[i])) {
            console.log("Excluding:", headerLine[i]);
            headers.splice(i, 1);
            values.splice(i, 1);
        }
    }
    console.log("Headers:", headers);
    console.log("Values:", values);
}

function parseCSVLine(line) {
    const regex = /(".*?"|[^",\n]+)(?=\s*,|\s*$)/g;
    const matches = [];
    let match;
    
    while (match = regex.exec(line)) {
        matches.push(match[0].replace(/"/g, '').trim());
    }
    
    return matches;
}
