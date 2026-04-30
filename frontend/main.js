/**
 * NovaHub — Dashboard + Chat Logic
 */
const API_URL = 'http://localhost:8000';

// === Rights Data (local copy for display) ===
const rightsData = [
  {
    id:"R001", title:"הכרה כנפגע פעולת איבה", category:"recognition",
    description:"הכרה רשמית ע\"י ביטוח לאומי כנפגע פעולת איבה, המקנה זכאות למגוון הטבות.",
    eligibility:"מי שנפגע פיזית או נפשית מפעולת איבה, כולל שורדי נובה.",
    how_to_apply:"הגשת תביעה לביטוח לאומי עם ת.ז., תיעוד רפואי ואישורים. באתר btl.gov.il או בסניף.",
    source_url:"https://btl.gov.il", min_percent:0
  },
  {
    id:"R002", title:"טיפולים נפשיים מסובסדים", category:"mental_health",
    description:"טיפולים פסיכולוגיים ופסיכיאטריים מסובסדים דרך קופות החולים ומרכזי החוסן.",
    eligibility:"מוכרים כנפגעי איבה. ניתן לקבל טיפול ראשוני גם לפני השלמת ההכרה.",
    how_to_apply:"פנייה לקופת החולים או למרכז חוסן אזורי.",
    source_url:"https://health.gov.il", min_percent:0
  },
  {
    id:"R003", title:"מענק חד פעמי לנפגעי איבה", category:"financial",
    description:"מענק כספי חד פעמי לנפגעי פעולות איבה מוכרים. הסכום נקבע ע\"י ביטוח לאומי.",
    eligibility:"מי שהוכר כנפגע פעולת איבה.",
    how_to_apply:"משולם אוטומטית לאחר ההכרה. אם לא התקבל — פנייה לסניף ביטוח לאומי.",
    source_url:"https://btl.gov.il", min_percent:0
  },
  {
    id:"R004", title:"קצבת נכות חודשית", category:"financial",
    description:"קצבה חודשית לנפגעי איבה שנקבעה להם דרגת נכות ע\"י ועדה רפואית.",
    eligibility:"נפגעי איבה עם נכות רפואית מ-10% ומעלה.",
    how_to_apply:"הגשת בקשה לוועדה רפואית דרך ביטוח לאומי.",
    source_url:"https://btl.gov.il", min_percent:10
  },
  {
    id:"R005", title:"תוספת לקצבה — נכות 20%+", category:"financial",
    description:"תוספת לקצבת הנכות החודשית עבור נכות של 20% ומעלה.",
    eligibility:"נפגעי איבה עם דרגת נכות 20% ומעלה.",
    how_to_apply:"משולם אוטומטית לאחר קביעת דרגת הנכות.",
    source_url:"https://btl.gov.il", min_percent:20
  },
  {
    id:"R006", title:"שיקום תעסוקתי", category:"employment",
    description:"הכשרה מקצועית, ליווי בחיפוש עבודה, והתאמת מקום עבודה.",
    eligibility:"נפגעי איבה מוכרים שזקוקים לסיוע בחזרה לשוק העבודה.",
    how_to_apply:"פנייה לאגף שיקום בביטוח לאומי.",
    source_url:"https://btl.gov.il", min_percent:10
  },
  {
    id:"R007", title:"סיוע בדיור", category:"housing",
    description:"סבסוד שכירות והתאמת דיור לנפגעי איבה עם נכות משמעותית.",
    eligibility:"נפגעי איבה עם נכות 40% ומעלה וצורך מוכח.",
    how_to_apply:"פנייה למשרד הבינוי והשיכון או לביטוח לאומי.",
    source_url:"https://gov.il", min_percent:40
  },
  {
    id:"R008", title:"ליווי משפטי חינם", category:"legal",
    description:"ייעוץ וליווי משפטי חינם כולל ייצוג בוועדות רפואיות.",
    eligibility:"נפגעי איבה מוכרים.",
    how_to_apply:"פנייה ללשכת הסיוע המשפטי, משרד המשפטים.",
    source_url:"https://justice.gov.il", min_percent:0
  },
  {
    id:"R009", title:"פטור מארנונה", category:"financial",
    description:"הנחה משמעותית או פטור מלא מארנונה לנפגעי איבה עם נכות גבוהה.",
    eligibility:"נפגעי איבה עם דרגת נכות 60% ומעלה.",
    how_to_apply:"פנייה לרשות המקומית עם אישור ביטוח לאומי.",
    source_url:"https://gov.il", min_percent:60
  },
  {
    id:"R010", title:"רכב רפואי", category:"financial",
    description:"זכאות להלוואה/מענק לרכישת רכב מותאם לנפגעי איבה עם מוגבלות בניידות.",
    eligibility:"נפגעי איבה עם נכות 80% ומעלה ומוגבלות בניידות.",
    how_to_apply:"פנייה לאגף שיקום בביטוח לאומי.",
    source_url:"https://btl.gov.il", min_percent:80
  },
  {
    id:"R011", title:"הנצחה והכרה ממלכתית", category:"recognition",
    description:"הכרה ממלכתית, השתתפות בטקסים ממלכתיים וזכויות הנצחה.",
    eligibility:"כלל שורדי נובה ומשפחות הנספים.",
    how_to_apply:"מידע באתר tribeofnova.com",
    source_url:"https://gov.il", min_percent:0
  },
  {
    id:"R012", title:"מענק שנתי — נכות 40%+", category:"financial",
    description:"מענק כספי שנתי נוסף לנפגעי איבה עם נכות 40% ומעלה.",
    eligibility:"נפגעי איבה עם דרגת נכות 40% ומעלה.",
    how_to_apply:"משולם אוטומטית ע\"י ביטוח לאומי.",
    source_url:"https://btl.gov.il", min_percent:40
  }
];

const catLabels = {
  financial:"כספי", mental_health:"בריאות הנפש", employment:"תעסוקה",
  housing:"דיור", legal:"משפטי", recognition:"הכרה"
};

const routeLabels = {
  official_rights:'📋 זכויות רשמיות',
  community_events:'🤝 אירועים קהילתיים',
  emotional_support:'💙 תמיכה רגשית'
};

// === Navigation ===
function navigateTo(pageId) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
  const page = document.getElementById('page' + pageId.charAt(0).toUpperCase() + pageId.slice(1));
  const tab = document.querySelector(`.nav-tab[data-page="${pageId}"]`);
  if (page) page.classList.add('active');
  if (tab) tab.classList.add('active');
  // Show/hide footer on chat page
  const footer = document.getElementById('mainFooter');
  if (footer) footer.style.display = pageId === 'chat' ? 'none' : '';
  window.scrollTo(0, 0);
}

// === Rights Rendering ===
function renderRights(filter) {
  const grid = document.getElementById('rightsGrid');
  if (!grid) return;
  let filtered = rightsData;
  if (filter && filter !== 'all') {
    const pct = parseInt(filter);
    filtered = rightsData.filter(r => r.min_percent <= pct + 19 && r.min_percent >= 0);
    // Show rights available at this percentage level
    if (pct === 10) filtered = rightsData.filter(r => r.min_percent <= 19);
    else if (pct === 20) filtered = rightsData.filter(r => r.min_percent <= 39);
    else if (pct === 40) filtered = rightsData.filter(r => r.min_percent <= 59);
    else if (pct === 60) filtered = rightsData.filter(r => r.min_percent <= 79);
    else if (pct === 80) filtered = rightsData.filter(r => r.min_percent <= 100);
  }
  grid.innerHTML = filtered.map(r => `
    <div class="right-card">
      <span class="rc-cat ${r.category}">${catLabels[r.category] || r.category}</span>
      ${r.min_percent > 0 ? `<span class="rc-percent-badge">${r.min_percent}%+</span>` : ''}
      <h3>${r.title}</h3>
      <p>${r.description}</p>
      <p><strong>זכאות:</strong> ${r.eligibility}</p>
      <div class="rc-apply">📝 ${r.how_to_apply}</div>
      <div class="rc-source">מקור: <a href="${r.source_url}" target="_blank">${r.source_url}</a></div>
    </div>
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

async function sendChat() {
  const input = document.getElementById('messageInput');
  const msg = input.value.trim();
  if (!msg || isLoading) return;

  const welcome = document.getElementById('chatWelcome');
  if (welcome) welcome.style.display = 'none';

  appendMsg('user', msg);
  input.value = ''; input.style.height = 'auto';
  document.getElementById('sendBtn').disabled = true;

  const typing = showTyping();
  isLoading = true;
  try {
    const res = await fetch(`${API_URL}/chat`, {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({message: msg})
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    removeTyping(typing);
    appendMsg('assistant', data.response, { route: data.route, sources: data.sources });
  } catch(e) {
    removeTyping(typing);
    appendMsg('error', 'מצטערים, אירעה שגיאה. אנא נסו שוב או פנו לקו הסיוע 1201.');
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

// === Init ===
document.addEventListener('DOMContentLoaded', () => {
  // Nav tabs
  document.querySelectorAll('.nav-tab').forEach(tab => {
    tab.addEventListener('click', () => navigateTo(tab.dataset.page));
  });
  // Rights tabs
  document.querySelectorAll('.disability-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.disability-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      renderRights(tab.dataset.percent);
    });
  });
  // Initial render
  renderRights('all');
  initChat();
});
