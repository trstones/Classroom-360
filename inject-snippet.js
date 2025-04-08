window.addEventListener("load", function () {
    console.log("Simple script loaded successfully! Step 6.");

    const textContent = "Content Added! This is dynamically added plain text.";

    // Insert the text right before the script tag (or other specific location)
    document.currentScript.insertAdjacentHTML('beforebegin', `<p>${textContent}</p>`);
});
