(function pollForSnippetTarget(retries = 0) {
  const MAX_RETRIES = 50; // Try for ~5 seconds
  const container = document.getElementById("external-snippet");

  if (!container) {
    if (retries < MAX_RETRIES) {
      setTimeout(() => pollForSnippetTarget(retries + 1), 100);
    } else {
      console.error("TDx Snippet Loader: Timed out waiting for container.");
    }
    return;
  }

  // Now fetch and inject the snippet
  fetch("https://user.github.io/project/snippet.html")
    .then(res => res.text())
    .then(html => {
      container.innerHTML = html;
    })
    .catch(err => {
      console.error("TDx Snippet Loader: Failed to load snippet:", err);
      container.innerText = "Error loading content.";
    });
})();
