document.addEventListener("DOMContentLoaded", function () {
  function loadSnippet() {
    var container = document.getElementById("external-snippet");
    if (container) {
      fetch("https://trstones.github.io/Classroom-360/snippet.html")
        .then(response => response.text())
        .then(html => {
          container.innerHTML = html;
        })
        .catch(err => {
          console.error("Error loading snippet:", err);
        });
    } else {
      setTimeout(loadSnippet, 100);
    }
  }
  loadSnippet();
});
