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
        // remove previous cursor
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

// ---- about ----
const aboutCard = document.getElementById("aboutCard");
aboutCard.innerHTML = `<div style="font-size:16px; font-weight:700; color:var(--text-on-ink); margin-bottom:2px;">${esc(CONFIG.tutor.name)}</div>
<div style="color:var(--green); font-size:12px; margin-bottom:10px;">${esc(CONFIG.tutor.role)}</div>` +
    CONFIG.tutor.facts.map(f => `<dt>${esc(f.k)}</dt><dd>${esc(f.v)}</dd>`).join("");

document.getElementById("aboutBody").innerHTML = CONFIG.about.paragraphs.map(p => `<p>${esc(p)}</p>`).join("");

// ---- courses ----
const courseGrid = document.getElementById("courseGrid");
CONFIG.courses.forEach(c => {
    const card = el("div", {class:`course-card${c.featured ? " featured" : ""}`});
    card.innerHTML = `
    ${c.badge ? `<span class="course-badge">${esc(c.badge)}</span>` : `<span class="course-icon">${esc(c.icon)}</span>`}
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
    <a href="#contact" class="btn btn-primary" style="justify-content:center;">Выбрать</a>
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
const contactChannels = document.getElementById("contactChannels");
CONFIG.contact.channels.forEach(c => {
    const a = el("a", {class:"channel", href:c.href, target:"_blank", rel:"noopener"});
    a.innerHTML = `<span class="ic">${esc(c.icon)}</span><span>${esc(c.label)}: ${esc(c.value)}</span>`;
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
const sections = ["top","about","courses","process","reviews","pricing","faq","contact"].map(id => document.getElementById(id));
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

