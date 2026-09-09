// The manifest is generated from the curated videos_using directory. It holds
// each card's source/edited videos and its actual multimodal instruction data.
var UMAS3D_TASKS = [];

var umas3dCurrentTaskIndex = 0;
var umas3dVideoObserver = null;
var umas3dVideoQueue = [];
var umas3dVideoLoading = false;
var umas3dVideoGeneration = 0;
var umas3dVideoAbortController = null;

function escapeUMAS3DHtml(value) {
    return String(value).replace(/[&<>'"]/g, function (character) {
        return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[character];
    });
}

function renderUMAS3DDemoCard(sample, taskIndex, sampleIndex) {
    var alt = escapeUMAS3DHtml(sample.alt);
    var modality = escapeUMAS3DHtml(sample.modality);
    return `<div class="demo-group">
        <article class="demo-card" role="button" tabindex="0"
        aria-label="View editing instruction for ${alt}"
        onclick="openInstructionModal(UMAS3D_TASKS[${taskIndex}].samples[${sampleIndex}])"
        onkeydown="if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); openInstructionModal(UMAS3D_TASKS[${taskIndex}].samples[${sampleIndex}]); }">
        <div class="demo-card-combination"><span>${modality}</span></div>
        <div class="demo-card-pair">
            <div class="source-panel"><div class="demo-view-label">Source 3D</div><video muted loop playsinline preload="none" data-src="${sample.source_video}" poster="${sample.source_poster}" aria-label="${alt} source result"></video></div>
            <div class="edited-panel"><div class="demo-view-label">Edited 3D</div><video muted loop playsinline preload="none" data-src="${sample.edited_video}" poster="${sample.edited_poster}" aria-label="${alt} edited result"></video></div>
        </div>
        </article>
    </div>`;
}

function renderTask(taskIndex) {
    stopUMAS3DVideoLoading();
    var task = UMAS3D_TASKS[taskIndex];
    document.getElementById('task-title').textContent = task.task;
    document.getElementById('demo-grid').innerHTML = task.samples.map(function (sample, sampleIndex) {
        return renderUMAS3DDemoCard(sample, taskIndex, sampleIndex);
    }).join('');
    renderTaskNavigation();
    startUMAS3DVideoLoading();
}

function stopUMAS3DVideoLoading() {
    umas3dVideoGeneration += 1;
    umas3dVideoQueue = [];
    umas3dVideoLoading = false;
    if (umas3dVideoAbortController) {
        umas3dVideoAbortController.abort();
        umas3dVideoAbortController = null;
    }
    if (umas3dVideoObserver) {
        umas3dVideoObserver.disconnect();
        umas3dVideoObserver = null;
    }
    document.querySelectorAll('#demo-grid video[data-src]').forEach(function (video) {
        video.pause();
        video.removeAttribute('src');
        if (video.dataset.blobUrl) {
            URL.revokeObjectURL(video.dataset.blobUrl);
            delete video.dataset.blobUrl;
        }
        video.load();
    });
}

function enqueueUMAS3DVideo(video) {
    if (!video || video.dataset.queued === 'true' || video.dataset.loaded === 'true') return;
    video.dataset.queued = 'true';
    umas3dVideoQueue.push(video);
    loadNextUMAS3DVideo(umas3dVideoGeneration);
}

function loadNextUMAS3DVideo(generation) {
    if (umas3dVideoLoading || generation !== umas3dVideoGeneration) return;
    var video = umas3dVideoQueue.shift();
    if (!video) return;
    umas3dVideoLoading = true;
    var requestController = new AbortController();
    umas3dVideoAbortController = requestController;
    var completed = false;
    var finish = function () {
        if (completed) return;
        completed = true;
        // A callback from the previous task must never unlock this task's queue.
        if (generation !== umas3dVideoGeneration) return;
        if (umas3dVideoAbortController === requestController) {
            umas3dVideoAbortController = null;
        }
        umas3dVideoLoading = false;
        window.setTimeout(function () { loadNextUMAS3DVideo(generation); }, 250);
    };
    // Fetch to a Blob first.  Resolving response.blob() means this one complete
    // file has arrived before the next video request is allowed to begin.
    fetch(video.dataset.src, { signal: requestController.signal })
        .then(function (response) {
            if (!response.ok) throw new Error('Unable to load demo video.');
            return response.blob();
        })
        .then(function (blob) {
            if (generation !== umas3dVideoGeneration) return;
            var blobUrl = URL.createObjectURL(blob);
            video.dataset.blobUrl = blobUrl;
            video.dataset.loaded = 'true';
            video.addEventListener('canplay', function () {
                video.play().catch(function () {});
            }, { once: true });
            video.src = blobUrl;
            video.load();
            finish();
        })
        .catch(finish);
}

function startUMAS3DVideoLoading() {
    var generation = umas3dVideoGeneration;
    var cards = document.querySelectorAll('#demo-grid .demo-card');
    var queueCardVideos = function (card) {
        card.querySelectorAll('video[data-src]').forEach(enqueueUMAS3DVideo);
    };
    if (!('IntersectionObserver' in window)) {
        cards.forEach(queueCardVideos);
        return;
    }
    umas3dVideoObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
            if (entry.isIntersecting && generation === umas3dVideoGeneration) {
                queueCardVideos(entry.target);
                umas3dVideoObserver.unobserve(entry.target);
            }
        });
    }, { rootMargin: '240px 0px', threshold: 0.01 });
    cards.forEach(function (card) { umas3dVideoObserver.observe(card); });
}

function renderTaskNavigation() {
    var navigation = document.getElementById('task-navigation');
    var html = '<button type="button" class="task-nav-arrow" aria-label="Previous editing task" onclick="goPrevTask()">&#8592;</button>';
    html += '<div class="task-nav-list">';
    UMAS3D_TASKS.forEach(function (task, taskIndex) {
        html += `<button type="button" class="task-nav-item${taskIndex === umas3dCurrentTaskIndex ? ' active' : ''}" onclick="goToTask(${taskIndex})">${task.task}</button>`;
    });
    html += '</div>';
    html += '<button type="button" class="task-nav-arrow" aria-label="Next editing task" onclick="goNextTask()">&#8594;</button>';
    navigation.innerHTML = html;
}

function goToTask(taskIndex) {
    umas3dCurrentTaskIndex = taskIndex;
    renderTask(umas3dCurrentTaskIndex);
}

function goPrevTask() {
    goToTask((umas3dCurrentTaskIndex - 1 + UMAS3D_TASKS.length) % UMAS3D_TASKS.length);
}

function goNextTask() {
    goToTask((umas3dCurrentTaskIndex + 1) % UMAS3D_TASKS.length);
}

function initUMAS3DDemo() {
    document.getElementById('task-title').textContent = 'Loading results…';
    fetch('assets/own_results/demo_manifest.json?v=20260908c')
        .then(function (response) {
            if (!response.ok) throw new Error('Unable to load the demo manifest.');
            return response.json();
        })
        .then(function (manifest) {
            UMAS3D_TASKS = manifest.tasks;
            umas3dCurrentTaskIndex = 0;
            renderTask(umas3dCurrentTaskIndex);
        })
        .catch(function () {
            document.getElementById('task-title').textContent = 'Demo results are unavailable.';
        });
}
