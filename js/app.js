/* =========================================================================
   РЕНДЕР И ЛОГИКА САЙТА  (js/app.js)
   -------------------------------------------------------------------------
   Читает объект CONFIG (из файла config.js, подключённого раньше этого
   файла в index.html) и строит из него страницу. Обычно менять не нужно —
   для правки текста редактируйте js/config.js.
   ========================================================================= */
function el(tag, attrs = {}, html = ""){
    const node = document.createElement(tag);
    for(const k in attrs) node.setAttribute(k, attrs[k]);
    node.innerHTML = html;
    return node;
}
function esc(s){
    return String(s).replace(/[&<>"']/g, m => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]));
}

// ---- hero ----
document.getElementById("heroTitle").innerHTML = CONFIG.hero.titleHtml;
document.getElementById("heroLede").textContent = CONFIG.hero.lede;
document.title = `${CONFIG.brand.name} — английский язык с репетитором`;
document.getElementById("footerName").textContent = CONFIG.brand.footer;
document.getElementById("contactLede").textContent = CONFIG.contact.lede;

// ---- terminal typing animation ----
function typeSentence(){
    const body = document.getElementById("termBody");
    body.innerHTML = "";
    const line1 = el("div", {class:"term-line term-comment"}, "// анализ предложения");
    const line2 = el("div", {class:"term-line"});
    const output = el("div", {class:"term-line term-output hidden"}, "✓ Fluency.compile() — 0 errors");
    body.append(line1, line2, output);

    const tokens = CONFIG.hero.sentence;
    let i = 0;
    function typeToken(){
        if(i >= tokens.length){
            output.classList.remove("hidden");
            return;
        }
        const tk = tokens[i];
        const cls = tk.t === "plain" ? "" : `tok-${tk.t}`;
        const span = el("span", cls ? {class:cls} : {}, esc(tk.w));
        const oldCursor = line2.querySelector(".cursor");
        if(oldCursor) oldCursor.remove();
        line2.appendChild(span);
        line2.appendChild(document.createTextNode(" "));
        const cur = el("span", {class:"cursor"});
        line2.appendChild(cur);
        i++;
        setTimeout(typeToken, 260);
    }
    typeToken();
}
typeSentence();

// ---- ticker strip (генерируется из названий курсов) ----
(function buildTicker(){
    const track = document.getElementById("tickerTrack");
    if(!track) return;
    const items = CONFIG.courses.map(c => `<b>${esc(c.title)}</b>&nbsp; ${esc(c.level)}`);
    const half = items.map(t => `<span>${t}</span><span class="tick-sep">✳</span>`).join("");
    track.innerHTML = half + half; // дублируем для бесшовной анимации
})();

// ---- about ----
const aboutCard = document.getElementById("aboutCard");
aboutCard.innerHTML = `
  <div class="tutor-name">${esc(CONFIG.tutor.name)}</div>
  <div class="tutor-role">${esc(CONFIG.tutor.role)}</div>
  <dl>${CONFIG.tutor.facts.map(f => `<dt>${esc(f.k)}</dt><dd>${esc(f.v)}</dd>`).join("")}</dl>
`;

document.getElementById("aboutBody").innerHTML = CONFIG.about.paragraphs.map(p => `<p>${esc(p)}</p>`).join("");

// ---- courses ----
const courseGrid = document.getElementById("courseGrid");
CONFIG.courses.forEach((c, idx) => {
    const card = el("div", {class:`course-card${c.featured ? " featured" : ""}`});
    const num = String(idx + 1).padStart(2, "0");
    card.innerHTML = `
    ${c.badge ? `<span class="course-badge">${esc(c.badge)}</span>` : `<span class="course-index">/${num}</span>`}
    <h3 class="course-title">${esc(c.title)}</h3>
    <p class="course-desc">${esc(c.desc)}</p>
    <div class="course-meta"><span>${esc(c.level)}</span><span>${esc(c.duration)}</span></div>
  `;
    courseGrid.appendChild(card);
});

// ---- steps ----
const stepsGrid = document.getElementById("stepsGrid");
CONFIG.steps.forEach((s, idx) => {
    const step = el("div", {class:"step"});
    step.innerHTML = `<div class="step-num">0${idx+1}</div><h3>${esc(s.title)}</h3><p>${esc(s.text)}</p>`;
    stepsGrid.appendChild(step);
});

// ---- reviews ----
const reviewGrid = document.getElementById("reviewGrid");
CONFIG.reviews.forEach(r => {
    const card = el("div", {class:"review-card"});
    const initial = r.name.charAt(0);
    card.innerHTML = `
    <span class="review-log">${esc(r.log)}</span>
    <p class="review-text">«${esc(r.text)}»</p>
    <div class="review-who">
      <span class="avatar" style="background:${esc(r.color)}">${esc(initial)}</span>
      <span>${esc(r.name)} — ${esc(r.role)}</span>
    </div>
  `;
    reviewGrid.appendChild(card);
});

// ---- pricing ----
const priceGrid = document.getElementById("priceGrid");
CONFIG.plans.forEach(p => {
    const card = el("div", {class:`price-card${p.reco ? " reco" : ""}`});
    card.innerHTML = `
    ${p.reco ? `<span class="reco-flag">выгоднее всего</span>` : ""}
    <div class="price-name">${esc(p.name)}</div>
    <div class="price-amount">${esc(p.price)} ₽ <span>/ ${esc(p.unit)}</span></div>
    <ul class="price-list">${p.features.map(f => `<li>${esc(f)}</li>`).join("")}</ul>
    <a href="#contact" class="btn ${p.reco ? "btn-accent" : "btn-ghost"}">Выбрать</a>
  `;
    priceGrid.appendChild(card);
});

// ---- faq ----
const faqList = document.getElementById("faqList");
CONFIG.faq.forEach((f, idx) => {
    const item = el("details", {class:"faq-item"});
    if(idx === 0) item.setAttribute("open", "");
    item.innerHTML = `<summary>${esc(f.q)}</summary><p>${esc(f.a)}</p>`;
    faqList.appendChild(item);
});

// ---- contact channels ----
// SVG-иконки по названию канала (вместо emoji — для единого стиля)
const CHANNEL_ICONS = {
    telegram: `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 2 11 13"/><path d="M22 2 15 22l-4-9-9-4 20-7z"/></svg>`,
    whatsapp: `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>`,
    email: `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-10 6L2 7"/></svg>`,
};
const contactChannels = document.getElementById("contactChannels");
CONFIG.contact.channels.forEach(c => {
    const a = el("a", {class:"channel", href:c.href, target:"_blank", rel:"noopener"});
    const icon = CHANNEL_ICONS[c.label.toLowerCase()] || esc(c.icon);
    a.innerHTML = `<span class="ic">${icon}</span><span><span class="ch-label">${esc(c.label)}</span>${esc(c.value)}</span>`;
    contactChannels.appendChild(a);
});

/* =========================================================================
   ИНТЕРАКТИВНОСТЬ
   ========================================================================= */

// мобильное меню
const burger = document.getElementById("burger");
const tabs = document.getElementById("tabs");
burger.addEventListener("click", () => {
    const open = tabs.classList.toggle("open");
    burger.setAttribute("aria-expanded", String(open));
});
tabs.querySelectorAll("a").forEach(a => a.addEventListener("click", () => {
    tabs.classList.remove("open");
    burger.setAttribute("aria-expanded", "false");
}));

// подсветка активной вкладки при скролле
const sections = ["top","about","courses","process","reviews","pricing","faq","wheel","contact"].map(id => document.getElementById(id));
const navLinks = Array.from(tabs.querySelectorAll("a"));
const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if(entry.isIntersecting){
            const id = entry.target.id;
            navLinks.forEach(a => a.classList.toggle("active", a.getAttribute("href") === `#${id}`));
        }
    });
}, {rootMargin: "-45% 0px -50% 0px"});
sections.forEach(s => s && io.observe(s));

// reveal on scroll
const revealItems = document.querySelectorAll(".reveal");
const revealIO = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if(entry.isIntersecting){
            entry.target.classList.add("in");
            revealIO.unobserve(entry.target);
        }
    });
}, {threshold: 0.15});
revealItems.forEach(item => revealIO.observe(item));

// форма — отправляется в фоне (AJAX) на Formspree, без перехода на другую страницу
const form = document.getElementById("bookingForm");
const status = document.getElementById("formStatus");
const submitBtn = form.querySelector('button[type="submit"]');

form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const name = form.name.value.trim();
    const contact = form.contact.value.trim();
    if(!name || !contact){
        status.textContent = "Заполните имя и контакт, пожалуйста.";
        status.className = "form-status err";
        return;
    }

    const originalBtnText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = "Отправляю…";
    status.textContent = "";
    status.className = "form-status";

    try{
        // таймаут 15 секунд, чтобы форма не «зависала» при медленном ответе
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 15000);

        const response = await fetch(form.action, {
            method: "POST",
            body: new FormData(form),
            headers: { "Accept": "application/json" },
            signal: controller.signal
        });
        clearTimeout(timer);

        if(response.ok){
            status.textContent = "Спасибо! Заявка отправлена — я свяжусь с вами в течение дня.";
            status.className = "form-status ok";
            form.reset();
        } else {
            // Пытаемся вытащить конкретную причину из ответа Formspree
            let reason = "";
            try{
                const data = await response.json();
                if(Array.isArray(data.errors) && data.errors.length){
                    reason = data.errors.map(e => e.message).join("; ");
                } else if(data.error){
                    reason = data.error;
                }
            } catch(_){ /* ответ не в формате JSON — оставляем общее сообщение */ }

            if(response.status === 429){
                status.textContent = "Слишком много попыток подряд — подождите пару минут и отправьте снова, либо напишите в Telegram/WhatsApp.";
            } else if(reason){
                status.textContent = `Не получилось отправить (${reason}). Напишите напрямую в Telegram/WhatsApp.`;
            } else {
                status.textContent = `Не получилось отправить (ошибка ${response.status}). Попробуйте ещё раз или напишите в Telegram/WhatsApp.`;
            }
            status.className = "form-status err";
        }
    } catch(err){
        status.textContent = err.name === "AbortError"
            ? "Сервер долго не отвечает. Попробуйте ещё раз или напишите напрямую в Telegram/WhatsApp."
            : "Нет соединения. Проверьте интернет и попробуйте ещё раз, либо напишите в Telegram/WhatsApp.";
        status.className = "form-status err";
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = originalBtnText;
    }
});