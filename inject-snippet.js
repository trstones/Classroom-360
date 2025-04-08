window.addEventListener("load", function () {
    console.log("Simple script loaded successfully! Step 2.");

    const existingDiv = document.getElementById("external-snippet");
    if (existingDiv) {
        existingDiv.innerHTML = "<h2>Content Added!</h2><p>This is dynamically added content.</p>";
    } else {
        console.error("Element not found.");
    }
});
