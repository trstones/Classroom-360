window.addEventListener("load", function () {
    // === CONFIGURATION ===
    const csvUrl = "https://trstones.github.io/Classroom-360/room-data.csv";
    const keyColumn = "ID"; // This must match the header name in CSV
    const columnsToIgnore = ["ID"]; // Add any header labels to hide in the KB

    // === SCRIPT START ===
    console.log("Looking for .external-snippet...");
    const snippetDiv = document.querySelector(".external-snippet");
    console.log("Found element:", snippetDiv);
    console.log("Data ID:", snippetDiv?.dataset.id);
    
    if (!snippetDiv) return;

    const targetId = snippetDiv.getAttribute("data-id");
    if (!targetId) {
        snippetDiv.innerHTML = "<p>Error: data-id attribute missing.</p>";
        return;
    }

    fetch(csvUrl)
        .then(response => response.text())
        .then(csv => {
            const rows = csv.trim().split("\n").map(row => {
                // Handle commas inside quoted values
                const values = [];
                let current = '', insideQuotes = false;
                for (let char of row) {
                    if (char === '"' && insideQuotes) {
                        insideQuotes = false;
                    } else if (char === '"' && !insideQuotes) {
                        insideQuotes = true;
                    } else if (char === ',' && !insideQuotes) {
                        values.push(current.trim());
                        current = '';
                    } else {
                        current += char;
                    }
                }
                values.push(current.trim());
                return values;
            });

            const headers = rows[0];
            const targetIndex = headers.indexOf(keyColumn);
            if (targetIndex === -1) {
                snippetDiv.innerHTML = "<p>Error: Key column not found.</p>";
                return;
            }

            const targetRow = rows.find((row, i) => i > 0 && row[targetIndex] === targetId);
            if (!targetRow) {
                snippetDiv.innerHTML = "<p>No matching data found for ID " + targetId + ".</p>";
                return;
            }

            let html = "";
            for (let i = 0; i < headers.length; i++) {
                const label = headers[i];
                const value = targetRow[i];
                if (!columnsToIgnore.includes(label)) {
                    html += `<p><strong>${label}:</strong> ${value}</p>`;
                }
            }

            snippetDiv.innerHTML = html;
        })
        .catch(error => {
            console.error("Error loading CSV:", error);
            snippetDiv.innerHTML = "<p>Error loading data.</p>";
        });
});
