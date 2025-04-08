window.addEventListener("load", function () {
    const content = "<div><h2>Dynamic Content</h2><p>This is added via an external script.</p></div>";
    document.body.insertAdjacentHTML('beforeend', content);
});
