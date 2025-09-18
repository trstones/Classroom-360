document.addEventListener('click', function(e) {
    const modalTrigger = e.target.closest('[data-modal-image]');
    if (modalTrigger) {
        const imageSrc = modalTrigger.getAttribute('data-modal-image');
        openModal(imageSrc);
    }
});

function openModal(imageSrc) {
    const modal = document.createElement('div');
    modal.innerHTML = `
        <div style="position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.8); z-index:9999; display:flex; justify-content:center; align-items:center; cursor:pointer;" onclick="closeModal(this)">
            <img src="${imageSrc}" style="max-width:90%; max-height:90%; object-fit:contain; cursor:default;" onclick="event.stopPropagation();">
            <div style="position:absolute; top:20px; right:30px; color:white; font-size:40px; cursor:pointer; user-select:none;" onclick="closeModal(this.parentNode.parentNode)">×</div>
        </div>
    `;
    document.body.appendChild(modal);
    document.body.style.overflow = 'hidden';
    
    const escapeHandler = function(event) {
        if (event.key === 'Escape') {
            closeModal(modal);
        }
    };
    document.addEventListener('keydown', escapeHandler);
    modal.escapeHandler = escapeHandler;
}

function closeModal(modal) {
    if (modal.escapeHandler) {
        document.removeEventListener('keydown', modal.escapeHandler);
    }
    modal.remove();
    document.body.style.overflow = 'auto';
}