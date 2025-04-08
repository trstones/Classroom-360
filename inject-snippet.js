window.addEventListener("load", function () {
    const snippetDiv = document.querySelector('.external-snippet');
    if (snippetDiv) {
        snippetDiv.innerHTML = "New content!";
    } else {
        console.error("Snippet div not found.");
    }
});
