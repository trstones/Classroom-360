window.addEventListener("load", function () {
    const snippetDiv = document.querySelector('.external-snippet');

    fetch("https://trstones.github.io/Classroom-360/room-data.csv")
        .then(response => response.text())
        .then(csv => {
            const [headerLine, dataLine] = csv.trim().split('\n');
            const labels = headerLine.split(',').map(h => h.trim());
            const values = dataLine.split(',').map(v => v.trim());

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
            snippetDiv.innerHTML = "<p>Error loading the data.</p>";
        });
});
