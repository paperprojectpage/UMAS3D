var instructionModalOverlay = null;

function escapeInstructionModalHtml(value) {
    return String(value).replace(/[&<>'"]/g, function (character) {
        return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[character];
    });
}

function initInstructionModal() {
    instructionModalOverlay = document.createElement('div');
    instructionModalOverlay.id = 'instruction-modal-overlay';
    instructionModalOverlay.innerHTML = `
        <div id="instruction-modal" role="dialog" aria-modal="true" aria-labelledby="instruction-modal-title">
            <div class="instruction-modal-header">
                <h2 id="instruction-modal-title">Editing Instruction</h2>
                <button type="button" class="instruction-close" aria-label="Close instruction" onclick="closeInstructionModal()">&#215;</button>
            </div>
            <div id="instruction-modal-content" class="instruction-modal-content"></div>
        </div>`;
    instructionModalOverlay.addEventListener('click', function (event) {
        if (event.target === instructionModalOverlay) closeInstructionModal();
    });
    document.addEventListener('keydown', function (event) {
        if (event.key === 'Escape') closeInstructionModal();
    });
    document.body.appendChild(instructionModalOverlay);
}

function renderInstructionContent(sample) {
    var html = '';
    if (sample.text_prompt) {
        html += `<section class="instruction-section">
            <div class="instruction-section-title">Text</div>
            <div class="instruction-text-box">${escapeInstructionModalHtml(sample.text_prompt)}</div>
        </section>`;
    }
    if (sample.bbox_image) {
        html += `<section class="instruction-section">
            <div class="instruction-section-title">Bounding Box</div>
            <img class="instruction-image" src="${escapeInstructionModalHtml(sample.bbox_image)}" alt="Bounding box instruction placeholder">
        </section>`;
    }
    if (sample.ref_image) {
        html += `<section class="instruction-section">
            <div class="instruction-section-title">Reference Image</div>
            <img class="instruction-image" src="${escapeInstructionModalHtml(sample.ref_image)}" alt="Reference instruction placeholder">
        </section>`;
    }
    return html || '<p class="instruction-empty">No instruction detail is available.</p>';
}

function openInstructionModal(sample) {
    if (!instructionModalOverlay) return;
    instructionModalOverlay.querySelector('#instruction-modal-content').innerHTML = renderInstructionContent(sample);
    instructionModalOverlay.classList.add('is-open');
    document.body.classList.add('instruction-modal-open');
}

function closeInstructionModal() {
    if (!instructionModalOverlay) return;
    instructionModalOverlay.classList.remove('is-open');
    document.body.classList.remove('instruction-modal-open');
}
