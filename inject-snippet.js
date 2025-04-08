document.addEventListener("DOMContentLoaded", function () {
    console.log("TDx KB Snippet Loader: DOMContentLoaded fired."); // Did the event fire?
    const container = document.getElementById("external-snippet");
    console.log("TDx KB Snippet Loader: Found container:", container); // Did it find the div?

    if (!container) {
        console.error("TDx KB Snippet Loader: Container #external-snippet not found!");
        return;
    }

    const dataUrl = "https://trstones.github.io/Classroom-360/data.json"; // Or the correct path to your HTML content file
    console.log("TDx KB Snippet Loader: Attempting to fetch:", dataUrl);

    fetch(dataUrl)
        .then(response => {
            console.log("TDx KB Snippet Loader: Fetch response status:", response.status); // What was the HTTP status?
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            console.log("TDx KB Snippet Loader: Response OK, reading as text...");
            return response.text();
        })
        .then(html => {
            console.log("TDx KB Snippet Loader: Successfully fetched content (length):", html.length);
            // console.log("TDx KB Snippet Loader: Fetched HTML:", html); // Optional: log fetched HTML, might be very long
            try {
                console.log("TDx KB Snippet Loader: Attempting to set innerHTML...");
                container.innerHTML = html;
                console.log("TDx KB Snippet Loader: innerHTML assignment attempted.");
                // Check if it actually worked or was sanitized away
                if (container.innerHTML.length < 5 && html.length > 5) { // Basic check for sanitization
                   console.warn("TDx KB Snippet Loader: innerHTML seems empty or heavily sanitized after assignment.");
                } else {
                   console.log("TDx KB Snippet Loader: innerHTML appears to be set.");
                }
            } catch (e) {
                console.error("TDx KB Snippet Loader: Error during innerHTML assignment:", e);
                container.textContent = "Error applying fetched content."; // Show error in the container
            }
        })
        .catch(err => {
            console.error("TDx KB Snippet Loader: Error loading snippet (fetch or processing):", err);
            if (container) {
                container.textContent = "Error loading content. See browser console for details."; // Show error in the container
            }
        });
});
