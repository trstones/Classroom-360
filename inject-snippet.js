window.addEventListener("load", function () {
    const snippetDiv = document.querySelector('.external-snippet');
    if (snippetDiv) {
        const roomType = "Auditorium";
        const seating = 125;
        const technology = "Projector, cinema projector, surround sound";
        const computer = "Mac Mini";
        const ccid = "220265";
        const os = "both";
        const optDrive = "Yes";
        const wireless = "Yes";
        const vidRecord = "Yes";        
        
        snippetDiv.innerHTML =
            "<p><strong>Room Type:</strong> " + roomType + "</p>" +
            "<p><strong>Seating:</strong> " + seating + "</p>" + 
            "<p><strong>Technology:</strong> " + technology + "</p>" +
            "<p><strong>Computer System:</strong> " + computer + "</p>" + 
            "<ul>" + 
            "<li>CCID: " + ccid + "</li>" +
            "<li>Operating System: " + os + "</li>" + 
            "</ul>" + 
            "<p><strong>Optical Drive:</strong> " + optDrive + "</p>" +
            "<p><strong>Wireless Projection:</strong> " + wireless + "</p>" + 
            "<p><strong>Video Recording / Streaming:</strong> " + vidRecord + "</p>";
    } else {
        console.error("Data not found.");
    }
});
