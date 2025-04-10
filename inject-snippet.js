window.addEventListener("load", function () {
    console.log("Script loaded.");

    // --- Configuration ---
    const csvUrl = "https://trstones.github.io/Classroom-360/room-data.csv";
    const excludedColumns = ["ID"]; // Add column names to hide here

    const snippetDiv = document.querySelector(".external-snippet");
    if (!snippetDiv) {
        console.error("Snippet container not found.");
        return;
    }

    // Try to extract ID from HTML comment like <!--ID=2-->
    
    // Try to find the RoomID value from the <p> tag in the div
    const roomIdElement = snippetDiv.querySelector('p');
    const roomIdMatch = roomIdElement ? roomIdElement.innerHTML.match(/RoomID=(\d+)/i) : null;

    if (!roomIdMatch) {
        snippetDiv.innerHTML = "<p><em>Error: No RoomID found in the page.</em></p>";
        return;
    }

    const roomId = roomIdMatch[1]; // Extracted RoomID value

    console.log("Room ID:", roomId);

    // --- Main Program ---
    fetch(csvUrl)
        .then(response => response.text())
        .then(csvText => {
            const lines = csvText.trim().split("\n");
            const headers = parseCSVLine(lines[0]);

            for (let i = 1; i < lines.length; i++) {
                const row = parseCSVLine(lines[i]);
                const rowData = Object.fromEntries(headers.map((h, idx) => [h, row[idx]]));

                if (rowData["ID"] === targetId) {
                    let html = "";
                    for (const [key, value] of Object.entries(rowData)) {
                        if (!excludedColumns.includes(key)) {
                            html += `<p><strong>${key}:</strong> ${value}</p>`;
                        }
                    }
                    snippetDiv.innerHTML = html;
                    return;
                }
            }

            snippetDiv.innerHTML = "<p><em>Error: No matching ID found.</em></p>";
        })
        .catch(error => {
            console.error("Fetch error:", error);
            snippetDiv.innerHTML = "<p><em>Error loading data.</em></p>";
        });

    // Simple CSV line parser (handles quoted commas)
    function parseCSVLine(line) {
        const result = [];
        let current = '';
        let insideQuotes = false;

        for (let char of line) {
            if (char === '"') {
                insideQuotes = !insideQuotes;
            } else if (char === ',' && !insideQuotes) {
                result.push(current.trim());
                current = '';
            } else {
                current += char;
            }
        }
        result.push(current.trim());
        return result;
    }
});
