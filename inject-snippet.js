window.addEventListener("load", function () {
    console.log("Simple script loaded successfully! Step 2.");
    const newDiv = document.createElement("div"); // Create a new div
    newDiv.innerHTML = "<h2>Welcome to the page!</h2><p>This content was added dynamically using JavaScript.</p>";
    document.body.appendChild(newDiv); // Append the new div to the body
});
