document.addEventListener('DOMContentLoaded', () => {
    renderTopics();
    renderWorks();
    renderArguments();
    setupTopicModal();
});

function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, ch => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[ch]));
}

// Для каждой темы указаны два подходящих аргумента из банка.
const topicArgumentMap = [
    ['arg3','arg1'], ['arg2','arg6'], ['arg3','arg8'], ['arg6','arg7'],
    ['arg1','arg3'], ['arg5','arg7'], ['arg1','arg4'], ['arg5','arg7'],
    ['arg5','arg7'], ['arg6','arg7'], ['arg4','arg2'], ['arg1','arg4'],
    ['arg4','arg6'], ['arg8','arg3'], ['arg1','arg3'], ['arg4','arg5'],
    ['arg1','arg4'], ['arg4','arg6'], ['arg5','arg7'], ['arg8','arg5']
];

function renderTopics() {
    const container = document.getElementById('topics-list');
    if (!container) return;
    container.innerHTML = topics.map((topic, index) => `
        <button class="topic-card topic-button" type="button" data-topic-index="${index}"
            aria-label="Открыть аргументы по теме: ${escapeHtml(topic)}">
            <span class="topic-num">${index + 1}</span>
            <span class="topic-text">${escapeHtml(topic)}</span>
            <span class="topic-open">Открыть аргументы <span aria-hidden="true">↗</span></span>
        </button>
    `).join('');
}

function renderWorks() {
    const container = document.getElementById('works-list');
    if (!container) return;
    container.innerHTML = works.map(work => `
        <article class="work-card">
            <div class="work-author">${escapeHtml(work.author)}</div>
            <h3 class="work-title">${escapeHtml(work.title)}</h3>
            <p class="work-why">${escapeHtml(work.why)}</p>
        </article>
    `).join('');
}

function renderArguments() {
    const container = document.getElementById('arguments-list');
    if (!container) return;
    container.innerHTML = argumentsData.map(arg => `
        <article class="argument-card" id="${escapeHtml(arg.id)}">
            <div class="argument-header">
                <div><span class="argument-work">${escapeHtml(arg.work)}</span>
                <span class="argument-author"> — ${escapeHtml(arg.author)}</span></div>
                <div class="argument-tags">${(arg.tags || []).map(tag => `<span class="tag">${escapeHtml(tag)}</span>`).join('')}</div>
            </div>
            <div class="argument-text">${escapeHtml(arg.text)}</div>
            ${arg.audio ? `<div class="argument-audio"><span class="audio-label">Озвучка:</span>
                <audio controls preload="none"><source src="${escapeHtml(arg.audio)}"></audio></div>` : ''}
        </article>
    `).join('');
}

function setupTopicModal() {
    const modal = document.getElementById('topic-modal');
    const closeButton = document.getElementById('modal-close');
    const content = document.getElementById('modal-arguments');
    const title = document.getElementById('modal-topic-title');
    const downloadButton = document.getElementById('download-topic');
    if (!modal || !content) return;

    let selectedTopic = '';
    let selectedArguments = [];

    document.getElementById('topics-list').addEventListener('click', event => {
        const button = event.target.closest('[data-topic-index]');
        if (!button) return;
        const index = Number(button.dataset.topicIndex);
        selectedTopic = topics[index];
        const ids = topicArgumentMap[index] || ['arg1', 'arg2'];
        selectedArguments = ids.map(id => argumentsData.find(arg => arg.id === id)).filter(Boolean);
        title.textContent = selectedTopic;
        content.innerHTML = selectedArguments.map((arg, i) => `
            <article class="modal-argument">
                <div class="modal-argument-top">
                    <span class="modal-argument-number">Аргумент ${i + 1}</span>
                    <span class="argument-work">${escapeHtml(arg.work)}</span>
                    <span class="argument-author">— ${escapeHtml(arg.author)}</span>
                </div>
                <p>${escapeHtml(arg.text)}</p>
                <div class="speech-controls">
                    <button class="secondary-button speak-button" type="button" data-speak-index="${i}">🔊 Прослушать аргумент</button>
                    <span class="speech-note">${arg.audio ? 'Доступна аудиозапись ниже.' : 'Озвучка синтезируется браузером.'}</span>
                    ${arg.audio ? `<audio controls preload="none"><source src="${escapeHtml(arg.audio)}"></audio>` : ''}
                </div>
            </article>
        `).join('');
        modal.hidden = false;
        document.body.classList.add('modal-open');
        closeButton.focus();
    });

    content.addEventListener('click', event => {
        const speak = event.target.closest('[data-speak-index]');
        if (!speak) return;
        if (!('speechSynthesis' in window)) {
            alert('В этом браузере озвучка не поддерживается. Попробуйте открыть сайт в Chrome или Edge.');
            return;
        }
        window.speechSynthesis.cancel();
        const arg = selectedArguments[Number(speak.dataset.speakIndex)];
        const utterance = new SpeechSynthesisUtterance(arg.text);
        utterance.lang = 'ru-RU';
        utterance.rate = 0.92;
        utterance.pitch = 1;
        window.speechSynthesis.speak(utterance);
    });

    function closeModal() {
        modal.hidden = true;
        document.body.classList.remove('modal-open');
        if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    }
    closeButton.addEventListener('click', closeModal);
    modal.addEventListener('click', event => { if (event.target === modal) closeModal(); });
    document.addEventListener('keydown', event => { if (event.key === 'Escape' && !modal.hidden) closeModal(); });

    downloadButton.addEventListener('click', () => {
        const printable = `<!DOCTYPE html>
<html lang="ru"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escapeHtml(selectedTopic)}</title>
<style>
body{font:16px/1.65 Arial,sans-serif;color:#17231b;max-width:850px;margin:40px auto;padding:0 24px}
h1{font-size:25px;line-height:1.3;border-bottom:2px solid #4b8b5a;padding-bottom:14px}
.argument{margin:28px 0;page-break-inside:avoid}.argument h2{font-size:19px;margin-bottom:8px}
.meta{color:#526458;margin-bottom:12px}.footer{margin-top:36px;color:#657269;font-size:12px}
@media print{body{margin:15mm auto;padding:0}button{display:none}}
</style></head><body>
<h1>${escapeHtml(selectedTopic)}</h1>
${selectedArguments.map((arg,i)=>`<section class="argument"><h2>Аргумент ${i+1}. ${escapeHtml(arg.work)}</h2>
<div class="meta">${escapeHtml(arg.author)}</div><p>${escapeHtml(arg.text)}</p></section>`).join('')}
<div class="footer">Материал для подготовки к итоговому сочинению · Природа и человек</div>
</body></html>`;
        const blob = new Blob([printable], { type: 'text/html;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'argumenty-po-teme.html';
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(url);
    });
}
