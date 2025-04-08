(function waitForContainer() {
  const container = document.getElementById("external-snippet");

  if (!container) {
    setTimeout(waitForContainer, 100);
    return;
  }

  fetch(https://trstones.github.io/Classroom-360/snippet.html")
    .then(response => response.text())
    .then(html => {
      container.innerHTML = html;
    })
    .catch(err => {
      console.error("Error loading snippet:", err);
    });
})();
