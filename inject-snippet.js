window.addEventListener("load", function () {
    console.log("Simple script loaded successfully! Step 5.");

    const textContent = "Content Added! This is dynamically added plain text.";

    // Append plain text to the body
    document.body.insertAdjacentHTML('beforeend', `<p>${textContent}</p>`);
});
