window.addEventListener("load", function () {
    const snippetDiv = document.querySelector('.external-snippet');

    fetch("https://trstones.github.io/Classroom-360/room-data.csv")
        .then(response => response.text())
        .then(csv => {
            const [headerLine, dataLine] = csv.trim().split('\n');
            
            // Parse CSV correctly by handling quotes properly
            const labels = headerLine.split(',').map(h => h.trim());
            const values = parseCSVLine(dataLine);

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

function parseCSVLine(line) {
    const regex = /(".*?"|[^",\n]+)(?=\s*,|\s*$)/g;
    const matches = [];
    let match;
    
    while (match = regex.exec(line)) {
        matches.push(match[0].replace(/"/g, '').trim());
    }
    
    return matches;
}
