window.addEventListener("load", function () {
    console.log("Simple script loaded successfully! Step 8.");

    document.currentScript.insertAdjacentHTML('beforebegin', "Content Added! This is dynamically added plain text.");

});
