window.addEventListener("load", function () {
    console.log("Simple script loaded successfully! Step 4.");

    const existingDiv = document.getElementById("external-snippet");
    if (existingDiv) {
        existingDiv.innerText = "<h2>Content Added!</h2><p>This is dynamically added content.</p>";
    } else {
        console.error("Element not found.");
    }
});
