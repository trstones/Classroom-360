function loadSnippet() {
  const container = document.getElementById("external-snippet");
  if (!container) {
    // Retry in 100ms if the container isn't there yet
    return setTimeout(loadSnippet, 100);
  }


  fetch("https://trstones.github.io/Classroom-360/snippet.html")
    .then(response => response.text())
    .then(html => {
      container.innerHTML = html;
    })
    .catch(err => {
      console.error("Error loading snippet:", err);
    });
}

loadSnippet();
