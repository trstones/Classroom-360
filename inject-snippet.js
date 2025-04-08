(function waitForContainer(attempt = 0) {
    const container = document.getElementById("external-snippet");

    if (!container) {
        if (attempt < 30) { // Try for 3 seconds
            setTimeout(() => waitForContainer(attempt + 1), 100);
        } else {
            console.error("TDx Snippet Loader: Timed out waiting for container.");
        }
        return;
    }

    fetch("https://trstones.github.io/Classroom-360/snippet.html")
        .then(response => response.text())
        .then(html => {
            container.innerHTML = html;
        })
        .catch(err => {
            console.error("TDx Snippet Loader: Error loading snippet:", err);
            container.innerText = "Error loading content.";
        });
})();
