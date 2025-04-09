window.addEventListener("load", function () {
    const snippetDiv = document.querySelector('.external-snippet');
    if (snippetDiv) {
        const roomType = "Auditorium";
        const seating = 125;
        
        snippetDiv.innerHTML =
            "<p><strong>Room Type:</strong> " + roomType + "</p>" +
            "<p><strong>Seating:</strong> " + seating + "</p>";
    } else {
        console.error("Data not found.");
    }
});
