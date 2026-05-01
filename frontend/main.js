/**
 * NovaHub — Dashboard + Chat Logic (Shells Architecture)
 */
const API_URL = 'http://localhost:8000';

let rightsData = {};

// === Navigation ===
function navigateTo(pageId) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
  const page = document.getElementById('page' + pageId.charAt(0).toUpperCase() + pageId.slice(1));
  const tab = document.querySelector(`.nav-tab[data-page="${pageId}"]`);
  if (page) page.classList.add('active');
  if (tab) tab.classList.add('active');
  
  const footer = document.getElementById('mainFooter');
  if (footer) footer.style.display = pageId === 'chat' ? 'none' : '';
  window.scrollTo(0, 0);
}

// === Data Fetching & Rendering ===
async function fetchRightsData() {
    try {
        const res = await fetch(`${API_URL}/api/rights`);
        if (res.ok) {
            rightsData = await res.json();
            renderShells();
            renderNefeshAchatChecklist();
        }
    } catch (e) {
        console.error("Failed to load rights data", e);
    }
}

function toggleShell(shellId) {
    const el = document.getElementById(`shell-content-${shellId}`);
    const arrow = document.getElementById(`shell-arrow-${shellId}`);
    if (el.style.display === 'block') {
        el.style.display = 'none';
        if (arrow) arrow.style.transform = 'rotate(0deg)';
    } else {
        el.style.display = 'block';
        if (arrow) arrow.style.transform = 'rotate(90deg)';
    }
}

function renderShells() {
    const grid = document.getElementById('shellsGrid');
    if (!grid || !rightsData.shells) return;
    
    grid.innerHTML = rightsData.shells.map(shell => `
        <div class="shell-card" style="cursor: pointer; display: block; height: auto;" onclick="toggleShell('${shell.shell_id}')">
            <div style="display: flex; align-items: center; justify-content: space-between; padding: 16px;">
                <div style="display: flex; align-items: center; gap: 16px;">
                    <div class="shell-icon">${shell.icon}</div>
                    <div class="shell-info">
                        <h3>${shell.shell_name}</h3>
                        <span class="shell-count">${shell.rights.length} פעולות זמינות</span>
                    </div>
                </div>
                <div class="shell-arrow" id="shell-arrow-${shell.shell_id}" style="transition: transform 0.2s;">↓</div>
            </div>
            <div id="shell-content-${shell.shell_id}" style="display: none; padding: 0 16px 16px; border-top: 1px solid var(--border); margin-top: 8px; cursor: default;" onclick="event.stopPropagation()">
                ${shell.rights.map(r => `
                    <div style="padding: 12px 0; border-bottom: 1px dashed var(--border); position: relative;">
                        <button onclick="openEditModal('${shell.shell_id}', '${r.id}')" style="position: absolute; left: 0; top: 12px; background: none; border: none; font-size: 1.2rem; cursor: pointer; color: var(--text-muted);" title="ערוך תוכן">✏️</button>
                        <h4 style="margin: 0 0 4px; color: var(--primary-700); padding-left: 30px;">${r.title}</h4>
                        <p style="margin: 0 0 8px; font-size: 0.9rem; color: var(--text2);">${r.simple_description}</p>
                        <div style="font-size: 0.85rem; color: var(--text-muted);">
                            <strong>זכאות:</strong> ${r.eligibility}<br>
                            <strong>איך להגיש:</strong> ${r.how_to_apply}
                        </div>
                        ${r.offline_tips && r.offline_tips.length > 0 ? 
                            `<div style="margin-top: 8px; background: var(--warning-100); padding: 8px; border-radius: 4px; font-size: 0.85rem; color: #856404;">💡 ${r.offline_tips.join('<br>💡 ')}</div>` : ''}
                    </div>
                `).join('')}
            </div>
        </div>
    `).join('');
}

// === Editor Modal ===
function openEditModal(shellId, rightId) {
    const shell = rightsData.shells.find(s => s.shell_id === shellId);
    const right = shell.rights.find(r => r.id === rightId);
    
    document.getElementById('editShellId').value = shellId;
    document.getElementById('editRightId').value = rightId;
    document.getElementById('editTitle').value = right.title;
    document.getElementById('editDesc').value = right.simple_description;
    document.getElementById('editElig').value = right.eligibility;
    document.getElementById('editApply').value = right.how_to_apply;
    document.getElementById('editTips').value = (right.offline_tips || []).join(', ');
    
    document.getElementById('editRightModal').classList.add('active');
}

function closeEditModal() {
    document.getElementById('editRightModal').classList.remove('active');
}

async function saveEditedRight() {
    const shellId = document.getElementById('editShellId').value;
    const rightId = document.getElementById('editRightId').value;
    
    const shell = rightsData.shells.find(s => s.shell_id === shellId);
    const right = shell.rights.find(r => r.id === rightId);
    
    right.title = document.getElementById('editTitle').value;
    right.simple_description = document.getElementById('editDesc').value;
    right.eligibility = document.getElementById('editElig').value;
    right.how_to_apply = document.getElementById('editApply').value;
    
    const tipsStr = document.getElementById('editTips').value;
    right.offline_tips = tipsStr ? tipsStr.split(',').map(t => t.trim()).filter(t => t) : [];
    
    try {
        const res = await fetch(`${API_URL}/api/rights/update`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(rightsData)
        });
        
        if (res.ok) {
            closeEditModal();
            renderShells(); // Re-render to show changes
            
            // Re-open the shell that was just edited so the user sees the change
            const content = document.getElementById(`shell-content-${shellId}`);
            const arrow = document.getElementById(`shell-arrow-${shellId}`);
            if (content) content.style.display = 'block';
            if (arrow) arrow.style.transform = 'rotate(90deg)';
        } else {
            alert('שגיאה בשמירת הנתונים');
        }
    } catch(e) {
        alert('שגיאה בתקשורת עם השרת');
    }
}

function toggleShortcutModal() {
    const modal = document.getElementById('nefeshModal');
    modal.classList.toggle('active');
}

function renderNefeshAchatChecklist() {
    const list = document.getElementById('nefeshChecklist');
    const treatments = document.getElementById('nefeshTreatments');
    if (!list || !treatments || !rightsData.shortcuts || !rightsData.shortcuts.nefesh_achat) return;
    
    list.innerHTML = rightsData.shortcuts.nefesh_achat.checklist.map((item, i) => `
        <label class="cl-item">
            <input type="checkbox" id="cl_${i}">
            <span class="cl-text">${item}</span>
        </label>
    `).join('');
    
    treatments.innerHTML = rightsData.shortcuts.nefesh_achat.treatment_basket.map(item => `
        <div style="margin-bottom: 6px;">• ${item}</div>
    `).join('');
}

// === Chat ===
let isLoading = false;
function initChat() {
  const input = document.getElementById('messageInput');
  const sendBtn = document.getElementById('sendBtn');
  if (!input || !sendBtn) return;

  input.addEventListener('input', () => {
    input.style.height = 'auto';
    input.style.height = Math.min(input.scrollHeight, 100) + 'px';
    sendBtn.disabled = !input.value.trim() || isLoading;
  });
  input.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendChat(); }
  });
  sendBtn.addEventListener('click', sendChat);

  document.querySelectorAll('.cw-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      input.value = btn.dataset.query;
      input.dispatchEvent(new Event('input'));
      sendChat();
    });
  });
  checkHealth();
}

const routeLabels = {
  official_rights:'📋 זכויות',
  community_events:'🤝 קהילה',
  emotional_support:'💙 תמיכה'
};

async function sendChat() {
  const input = document.getElementById('messageInput');
  const msg = input.value.trim();
  if (!msg || isLoading) return;

  const welcome = document.getElementById('chatWelcome');
  if (welcome) welcome.style.display = 'none';

  appendMsg('user', msg);
  input.value = ''; input.style.height = 'auto';
  document.getElementById('sendBtn').disabled = true;

  const thread_id = localStorage.getItem('novahub_thread_id') || Math.random().toString(36).substring(2, 15);
  localStorage.setItem('novahub_thread_id', thread_id);

  const typing = showTyping();
  isLoading = true;
  try {
    const res = await fetch(`${API_URL}/chat`, {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({message: msg, thread_id: thread_id})
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    removeTyping(typing);
    appendMsg('assistant', data.response, { route: data.route, sources: data.sources });
  } catch(e) {
    removeTyping(typing);
    appendMsg('error', 'מצטערים, השרת נפל או מתעדכן כרגע. נסה שוב עוד רגע.');
    console.error(e);
  } finally {
    isLoading = false;
    const sendBtn = document.getElementById('sendBtn');
    sendBtn.disabled = !input.value.trim();
  }
}

function appendMsg(type, content, meta={}) {
  const list = document.getElementById('messagesList');
  const el = document.createElement('div');
  el.className = `message ${type}`;
  const avatar = type === 'user' ? '👤' : type === 'error' ? '⚠️' : '✨';
  let badges = '';
  if (type === 'assistant' && meta.route) {
    badges = `<div class="route-badge ${meta.route}">${routeLabels[meta.route]||meta.route}</div>`;
  }
  let sources = '';
  if (meta.sources && meta.sources.length) {
    sources = `<div class="message-sources"><strong>מקורות:</strong> ${meta.sources.map(s=>`📎 ${s.title||s.source}`).join(' | ')}</div>`;
  }
  el.innerHTML = `
    <div class="message-avatar">${avatar}</div>
    <div class="message-content">${badges}${formatText(content)}${sources}</div>
  `;
  list.appendChild(el);
  const container = document.getElementById('chatMessages');
  container.scrollTop = container.scrollHeight;
}

function formatText(t) {
  if (!t) return '';
  return t.replace(/\*\*(.*?)\*\*/g,'<strong>$1</strong>')
    .replace(/^[•\-]\s(.+)$/gm,'<li>$1</li>')
    .replace(/(<li>.*?<\/li>\n?)+/gs,'<ul>$&</ul>')
    .replace(/\n/g,'<br>');
}

function showTyping() {
  const list = document.getElementById('messagesList');
  const el = document.createElement('div');
  el.className = 'message assistant';
  el.innerHTML = `<div class="message-avatar">✨</div><div class="message-content"><div class="typing-indicator"><span class="typing-dot"></span><span class="typing-dot"></span><span class="typing-dot"></span></div></div>`;
  list.appendChild(el);
  document.getElementById('chatMessages').scrollTop = 99999;
  return el;
}
function removeTyping(el) { if (el && el.parentNode) el.remove(); }

async function checkHealth() {
  try {
    const r = await fetch(`${API_URL}/health`);
    setStatus(r.ok ? 'on' : 'off');
  } catch { setStatus('off'); }
}
function setStatus(s) {
  const dot = document.querySelector('.chat-status .status-dot');
  const txt = document.querySelector('.chat-status .status-text');
  if (!dot || !txt) return;
  if (s === 'on') { dot.style.background='var(--primary-500)'; txt.textContent='מחובר'; }
  else { dot.style.background='var(--neutral-400)'; txt.textContent='לא מחובר'; }
}

// === Admin Functions ===
async function triggerResearchAgent(btn) {
    btn.disabled = true;
    btn.textContent = 'סורק...';
    document.getElementById('researchStatus').textContent = 'הסוכן רץ ברקע...';
    try {
        const res = await fetch(`${API_URL}/api/trigger-research`, {method: 'POST'});
        if (res.ok) {
            document.getElementById('researchStatus').textContent = '✅ נשלח לסריקה בהצלחה!';
        }
    } catch(e) {
        document.getElementById('researchStatus').textContent = '❌ שגיאה בהפעלת הסוכן';
    } finally {
        setTimeout(() => { btn.disabled = false; btn.textContent = 'הפעל סריקה עכשיו 🔍'; }, 3000);
    }
}

// === Calculator ===
function initCalculator() {
    const slider = document.getElementById('calcPercent');
    const label = document.getElementById('percentLabel');
    const result = document.getElementById('calcResult');
    if (!slider || !label || !result) return;
    
    const btlRates = {
        10: 0,
        20: 1161,
        30: 1742,
        40: 2323,
        50: 2904,
        60: 3484,
        70: 4065,
        80: 4646,
        90: 5227,
        100: 5807
    };
    
    function updateCalc() {
        let percent = parseInt(slider.value, 10);
        label.textContent = percent + '%';
        const allowance = btlRates[percent] || 0;
        
        let addonHtml = '';
        if (percent >= 50) {
            addonHtml = `<div style="font-size: 0.85rem; color: var(--primary-600); margin-top: 8px;">+ תוספות נסתרות: ניידות, עזרת הזולת, ודמי חימום עשויים להוסיף סכומים משמעותיים!</div>`;
        }
        
        result.innerHTML = '₪' + allowance.toLocaleString() + addonHtml;
    }
    
    slider.addEventListener('input', updateCalc);
    updateCalc();
}

// === Init ===
document.addEventListener('DOMContentLoaded', () => {
  // Nav tabs
  document.querySelectorAll('.nav-tab').forEach(tab => {
    tab.addEventListener('click', () => navigateTo(tab.dataset.page));
  });
  
  fetchRightsData();
  initChat();
  initCalculator();
});
