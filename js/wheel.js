/* =========================================================================
   КОЛЕСО ФОРТУНЫ  (js/wheel.js)
   -------------------------------------------------------------------------
   Читает CONFIG.wheel (из config.js) и строит рабочее колесо:
   - рисует SVG-сегменты по весам призов
   - крутит колесо на честный взвешенный случайный приз
   - запоминает попытки в localStorage браузера посетителя (3 прокрута,
     потом блокировка на неделю — настраивается в CONFIG.wheel)
   - показывает результат и промокод, ведёт историю прошлых призов

   Если захотите изменить призы, лимит попыток или срок блокировки —
   правьте CONFIG.wheel в файле config.js, а не этот файл.
   ========================================================================= */

(function(){
    const WHEEL_STORAGE_KEY = "codelinguae_wheel_v1";
    const wheelCfg = CONFIG.wheel;
    const cooldownMs = (wheelCfg.cooldownDays || 7) * 24 * 60 * 60 * 1000;

    // ---- заголовки блока ----
    document.getElementById("wheelTitle").textContent = wheelCfg.title;
    document.getElementById("wheelSubtitle").textContent = wheelCfg.subtitle;
    document.getElementById("wheelRules").textContent = wheelCfg.rulesText;

    // -----------------------------------------------------------------------
    // Хранилище состояния в браузере посетителя
    // -----------------------------------------------------------------------
    function loadState(){
        try{
            const raw = localStorage.getItem(WHEEL_STORAGE_KEY);
            if(!raw) return {spinsUsed:0, cycleStart:null, history:[]};
            const parsed = JSON.parse(raw);
            return {
                spinsUsed: Number(parsed.spinsUsed) || 0,
                cycleStart: parsed.cycleStart || null,
                history: Array.isArray(parsed.history) ? parsed.history : [],
            };
        }catch(e){
            return {spinsUsed:0, cycleStart:null, history:[]};
        }
    }
    function saveState(state){
        try{ localStorage.setItem(WHEEL_STORAGE_KEY, JSON.stringify(state)); }catch(e){ /* хранилище недоступно — просто не сохраняем */ }
    }
    function refreshCooldown(state){
        if(state.cycleStart && (Date.now() - state.cycleStart) >= cooldownMs){
            state.spinsUsed = 0;
            state.cycleStart = null;
            saveState(state);
        }
        return state;
    }

    let state = refreshCooldown(loadState());

    // -----------------------------------------------------------------------
    // Построение SVG-колеса из сегментов
    // -----------------------------------------------------------------------
    const segments = wheelCfg.segments;
    const totalWeight = segments.reduce((sum, s) => sum + s.weight, 0);

    const SVG_NS = "http://www.w3.org/2000/svg";
    const CX = 200, CY = 200, R = 192;

    function polarPoint(radius, angleDeg){
        const rad = (angleDeg * Math.PI) / 180;
        return {
            x: CX + radius * Math.sin(rad),
            y: CY - radius * Math.cos(rad),
        };
    }

    function buildWheelSvg(){
        const svg = document.createElementNS(SVG_NS, "svg");
        svg.setAttribute("viewBox", "0 0 400 400");
        svg.setAttribute("id", "wheelSvg");

        let cursor = 0;
        segments.forEach((seg) => {
            const angleSize = (seg.weight / totalWeight) * 360;
            const start = cursor;
            const end = cursor + angleSize;
            const mid = start + angleSize / 2;
            cursor = end;

            const p1 = polarPoint(R, start);
            const p2 = polarPoint(R, end);
            const largeArc = angleSize > 180 ? 1 : 0;

            const path = document.createElementNS(SVG_NS, "path");
            const d = `M ${CX},${CY} L ${p1.x.toFixed(2)},${p1.y.toFixed(2)} A ${R},${R} 0 ${largeArc} 1 ${p2.x.toFixed(2)},${p2.y.toFixed(2)} Z`;
            path.setAttribute("d", d);
            path.setAttribute("fill", seg.color);
            path.setAttribute("stroke", "#141a17");
            path.setAttribute("stroke-width", "2");
            svg.appendChild(path);

            // текст сегмента — вдоль радиуса, читается от центра наружу
            const textRadius = angleSize < 28 ? R * 0.82 : R * 0.66;
            const tp = polarPoint(textRadius, mid);
            const text = document.createElementNS(SVG_NS, "text");
            text.setAttribute("x", tp.x.toFixed(2));
            text.setAttribute("y", tp.y.toFixed(2));
            text.setAttribute("text-anchor", "middle");
            text.setAttribute("transform", `rotate(${mid.toFixed(2)} ${tp.x.toFixed(2)} ${tp.y.toFixed(2)})`);
            text.setAttribute("fill", "#141a17");
            text.setAttribute("font-family", "JetBrains Mono, monospace");
            text.setAttribute("font-weight", "700");
            text.setAttribute("font-size", angleSize < 22 ? "11" : "13.5");

            // если фраза длинная — переносим в два тспана
            const words = seg.label.split(" ");
            if(words.length > 1 && seg.label.length > 12){
                const mid1 = Math.ceil(words.length / 2);
                const line1 = words.slice(0, mid1).join(" ");
                const line2 = words.slice(mid1).join(" ");
                const tspan1 = document.createElementNS(SVG_NS, "tspan");
                tspan1.setAttribute("x", tp.x.toFixed(2));
                tspan1.setAttribute("dy", "-4");
                tspan1.textContent = line1;
                const tspan2 = document.createElementNS(SVG_NS, "tspan");
                tspan2.setAttribute("x", tp.x.toFixed(2));
                tspan2.setAttribute("dy", "13");
                tspan2.textContent = line2;
                text.appendChild(tspan1);
                text.appendChild(tspan2);
            } else {
                text.textContent = seg.label;
            }

            svg.appendChild(text);
        });

        return svg;
    }

    const stage = document.getElementById("wheelStage");
    stage.appendChild(buildWheelSvg());
    const wheelSvg = document.getElementById("wheelSvg");

    // -----------------------------------------------------------------------
    // Взвешенный случайный выбор приза (сегменты с меньшим "weight" реже выпадают)
    // -----------------------------------------------------------------------
    function pickSegmentIndex(){
        let r = Math.random() * totalWeight;
        for(let i = 0; i < segments.length; i++){
            if(r < segments[i].weight) return i;
            r -= segments[i].weight;
        }
        return segments.length - 1;
    }

    function segmentAngles(index){
        let cursor = 0;
        for(let i = 0; i < index; i++){
            cursor += (segments[i].weight / totalWeight) * 360;
        }
        const size = (segments[index].weight / totalWeight) * 360;
        return {start: cursor, size};
    }

    function generateCode(){
        const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
        let suffix = "";
        for(let i = 0; i < 4; i++) suffix += chars[Math.floor(Math.random() * chars.length)];
        return `${wheelCfg.codePrefix}-${suffix}`;
    }

    // -----------------------------------------------------------------------
    // UI: индикатор оставшихся попыток, состояние кнопки, история
    // -----------------------------------------------------------------------
    const spinBtn = document.getElementById("wheelSpinBtn");
    const spinsLeftEl = document.getElementById("wheelSpinsLeft");
    const cooldownNoteEl = document.getElementById("wheelCooldownNote");
    const resultEl = document.getElementById("wheelResult");
    const historyEl = document.getElementById("wheelHistory");

    function formatDate(ts){
        return new Date(ts).toLocaleDateString("ru-RU", {day:"numeric", month:"long"});
    }

    function renderSpinsLeft(){
        const total = wheelCfg.spinLimit;
        const used = Math.min(state.spinsUsed, total);
        let dots = "";
        for(let i = 0; i < total; i++){
            dots += `<span class="wheel-dot ${i < used ? "used" : ""}"></span>`;
        }
        spinsLeftEl.innerHTML = `<span class="wheel-dots">${dots}</span><span class="wheel-dots-label">${total - used} из ${total} попыток осталось</span>`;
    }

    function renderHistory(){
        if(!state.history.length){
            historyEl.innerHTML = "";
            return;
        }
        const items = state.history.slice(0, 5).map(h => `
      <div class="wheel-history-item">
        <span class="wheel-history-label">${escapeHtml(h.label)}</span>
        <span class="wheel-history-code">${escapeHtml(h.code)}</span>
      </div>
    `).join("");
        historyEl.innerHTML = `<div class="wheel-history-title">Ваши призы</div>${items}`;
    }

    function escapeHtml(s){
        return String(s).replace(/[&<>"']/g, m => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]));
    }

    function updateLockUI(){
        const locked = state.spinsUsed >= wheelCfg.spinLimit;
        spinBtn.disabled = locked;
        if(locked && state.cycleStart){
            const nextDate = state.cycleStart + cooldownMs;
            cooldownNoteEl.textContent = `Попытки закончились. Колесо снова будет доступно ${formatDate(nextDate)}.`;
            spinBtn.textContent = "Колесо заблокировано";
        } else {
            cooldownNoteEl.textContent = "";
            spinBtn.textContent = "Крутить колесо";
        }
    }

    renderSpinsLeft();
    renderHistory();
    updateLockUI();

    // -----------------------------------------------------------------------
    // Вращение
    // -----------------------------------------------------------------------
    let totalRotation = 0;
    let spinning = false;

    spinBtn.addEventListener("click", () => {
        if(spinning || state.spinsUsed >= wheelCfg.spinLimit) return;
        spinning = true;
        spinBtn.disabled = true;
        resultEl.classList.add("hidden");
        resultEl.innerHTML = "";

        const index = pickSegmentIndex();
        const {start, size} = segmentAngles(index);
        const jitter = (Math.random() - 0.5) * size * 0.6; // небольшое смещение внутри сектора, но не выходя за его границы
        const segMid = start + size / 2 + jitter;

        const rotationMod = (360 - segMid + 360) % 360;
        const currentMod = ((totalRotation % 360) + 360) % 360;
        const deltaToAdd = (rotationMod - currentMod + 360) % 360;
        const extraSpins = 360 * (5 + Math.floor(Math.random() * 2)); // 5-6 полных оборотов для эффекта

        totalRotation += extraSpins + deltaToAdd;

        wheelSvg.style.transition = "transform 4.2s cubic-bezier(0.14, 0.72, 0.12, 1)";
        wheelSvg.style.transform = `rotate(${totalRotation}deg)`;

        setTimeout(() => {
            spinning = false;
            const seg = segments[index];
            const code = generateCode();

            state.spinsUsed += 1;
            if(!state.cycleStart) state.cycleStart = Date.now();
            state.history.unshift({label: seg.label, code, at: Date.now()});
            state.history = state.history.slice(0, 5);
            saveState(state);

            resultEl.innerHTML = `
        <div class="wheel-result-title">🎉 Ваш приз: ${escapeHtml(seg.label)}</div>
        <div class="wheel-result-code">
          <span>${escapeHtml(code)}</span>
          <button type="button" class="wheel-copy-btn" id="wheelCopyBtn">Скопировать</button>
        </div>
        <p class="wheel-result-note">Назовите этот код или покажите скриншот при записи на занятие — я применю приз вручную.</p>
        <a href="#contact" class="btn btn-ghost wheel-result-cta">Записаться и использовать приз →</a>
      `;
            resultEl.classList.remove("hidden");

            const copyBtn = document.getElementById("wheelCopyBtn");
            copyBtn.addEventListener("click", async () => {
                try{
                    await navigator.clipboard.writeText(code);
                    copyBtn.textContent = "Скопировано ✓";
                    setTimeout(() => { copyBtn.textContent = "Скопировать"; }, 2000);
                }catch(e){
                    copyBtn.textContent = "Скопируйте вручную";
                }
            });

            renderSpinsLeft();
            renderHistory();
            updateLockUI();
        }, 4300);
    });
})();