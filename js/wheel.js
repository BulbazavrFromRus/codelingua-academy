/* =========================================================================
   🎡 КОЛЕСО ФОРТУНЫ  (js/wheel.js)
   -------------------------------------------------------------------------
   Строит SVG-колесо из CONFIG.wheel.segments, крутит его с учётом весов
   (weight), ограничивает число попыток (spinLimit) и блокирует колесо
   на cooldownDays дней. Результаты и промокоды хранятся в localStorage.
   ========================================================================= */
(function(){
    const W = CONFIG.wheel;
    const stage = document.getElementById("wheelStage");
    const spinBtn = document.getElementById("wheelSpinBtn");
    const spinsLeftEl = document.getElementById("wheelSpinsLeft");
    const cooldownNote = document.getElementById("wheelCooldownNote");
    const resultEl = document.getElementById("wheelResult");
    const historyEl = document.getElementById("wheelHistory");

    document.getElementById("wheelTitle").textContent = W.title;
    document.getElementById("wheelSubtitle").textContent = W.subtitle;
    document.getElementById("wheelRules").textContent = W.rulesText;

    // ---------------- state (localStorage) ----------------
    const LS_KEY = "cl_wheel_v1";
    function loadState(){
        try{
            const raw = localStorage.getItem(LS_KEY);
            if(raw) return JSON.parse(raw);
        }catch(e){ /* приватный режим и т.п. */ }
        return { spinsUsed: 0, lockedUntil: 0, history: [] };
    }
    function saveState(st){
        try{ localStorage.setItem(LS_KEY, JSON.stringify(st)); }catch(e){}
    }
    let state = loadState();

    // если срок блокировки прошёл — сбрасываем попытки
    if(state.lockedUntil && Date.now() > state.lockedUntil){
        state.spinsUsed = 0;
        state.lockedUntil = 0;
        saveState(state);
    }

    // ---------------- геометрия колеса ----------------
    const totalWeight = W.segments.reduce((s, seg) => s + seg.weight, 0);
    // границы сегментов в градусах, по часовой стрелке от «12 часов»
    const bounds = [];
    let acc = 0;
    W.segments.forEach(seg => {
        const start = (acc / totalWeight) * 360;
        acc += seg.weight;
        const end = (acc / totalWeight) * 360;
        bounds.push({start, end, mid: (start + end) / 2});
    });

    function polar(cx, cy, r, angleDeg){
        // угол от «12 часов» по часовой стрелке
        const rad = (angleDeg - 90) * Math.PI / 180;
        return [cx + r * Math.cos(rad), cy + r * Math.sin(rad)];
    }

    function buildWheel(){
        const SIZE = 440, C = SIZE / 2, R = C - 6;
        const svgNS = "http://www.w3.org/2000/svg";
        const svg = document.createElementNS(svgNS, "svg");
        svg.setAttribute("viewBox", `0 0 ${SIZE} ${SIZE}`);
        svg.setAttribute("role", "img");
        svg.setAttribute("aria-label", W.title);

        // внешняя обводка
        const ring = document.createElementNS(svgNS, "circle");
        ring.setAttribute("cx", C); ring.setAttribute("cy", C); ring.setAttribute("r", R + 4);
        ring.setAttribute("fill", "#221e1a");
        svg.appendChild(ring);

        W.segments.forEach((seg, i) => {
            const b = bounds[i];
            const [x1, y1] = polar(C, C, R, b.start);
            const [x2, y2] = polar(C, C, R, b.end);
            const largeArc = (b.end - b.start) > 180 ? 1 : 0;

            const path = document.createElementNS(svgNS, "path");
            path.setAttribute("d", `M ${C} ${C} L ${x1} ${y1} A ${R} ${R} 0 ${largeArc} 1 ${x2} ${y2} Z`);
            path.setAttribute("fill", seg.color);
            path.setAttribute("stroke", "#191613");
            path.setAttribute("stroke-width", "2");
            svg.appendChild(path);

            // подпись сегмента вдоль радиуса
            const label = seg.label.replace(/\s*🎉\s*/g, "");
            const [tx, ty] = polar(C, C, R * 0.62, b.mid);
            const text = document.createElementNS(svgNS, "text");
            text.setAttribute("x", tx);
            text.setAttribute("y", ty);
            text.setAttribute("fill", "#191613");
            text.setAttribute("font-family", "'JetBrains Mono', monospace");
            text.setAttribute("font-size", "12.5");
            text.setAttribute("font-weight", "600");
            text.setAttribute("text-anchor", "middle");
            text.setAttribute("dominant-baseline", "middle");
            // поворачиваем текст вдоль радиуса
            let rot = b.mid;
            if(rot > 90 && rot < 270) rot += 180; // не «вверх ногами»
            text.setAttribute("transform", `rotate(${rot} ${tx} ${ty})`);

            // перенос длинных подписей на две строки
            const words = label.split(" ");
            if(words.length > 1 && label.length > 12){
                const mid = Math.ceil(words.length / 2);
                const l1 = words.slice(0, mid).join(" ");
                const l2 = words.slice(mid).join(" ");
                const t1 = document.createElementNS(svgNS, "tspan");
                t1.setAttribute("x", tx); t1.setAttribute("dy", "-0.55em"); t1.textContent = l1;
                const t2 = document.createElementNS(svgNS, "tspan");
                t2.setAttribute("x", tx); t2.setAttribute("dy", "1.15em"); t2.textContent = l2;
                text.append(t1, t2);
            } else {
                text.textContent = label;
            }
            svg.appendChild(text);
        });

        stage.innerHTML = "";
        stage.appendChild(svg);
    }
    buildWheel();

    // ---------------- выбор приза по весам ----------------
    function pickSegment(){
        let r = Math.random() * totalWeight;
        for(let i = 0; i < W.segments.length; i++){
            r -= W.segments[i].weight;
            if(r <= 0) return i;
        }
        return W.segments.length - 1;
    }

    function makeCode(){
        const chars = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
        let s = "";
        for(let i = 0; i < 5; i++) s += chars[Math.floor(Math.random() * chars.length)];
        return `${W.codePrefix}-${s}`;
    }

    // ---------------- UI-состояние ----------------
    function isLocked(){
        return state.lockedUntil && Date.now() < state.lockedUntil;
    }
    function spinsLeft(){
        return Math.max(0, W.spinLimit - state.spinsUsed);
    }
    function fmtDate(ts){
        return new Date(ts).toLocaleDateString("ru-RU", {day:"numeric", month:"long"});
    }

    function renderPanel(){
        if(isLocked()){
            spinsLeftEl.innerHTML = `Попытки закончились`;
            cooldownNote.textContent = `Колесо снова откроется ${fmtDate(state.lockedUntil)}.`;
            spinBtn.disabled = true;
        } else {
            spinsLeftEl.innerHTML = `Осталось попыток: <b>${spinsLeft()} из ${W.spinLimit}</b>`;
            cooldownNote.textContent = "";
            spinBtn.disabled = false;
        }
        renderHistory();
    }

    function renderHistory(){
        historyEl.innerHTML = "";
        if(!state.history.length) return;
        const title = document.createElement("p");
        title.className = "wh-title";
        title.textContent = "Ваши призы";
        historyEl.appendChild(title);
        state.history.slice().reverse().forEach(h => {
            const row = document.createElement("div");
            row.className = "wh-item";
            const icon = h.type === "discount" ? "%" : "+";
            row.innerHTML = `<span>[${icon}] ${escHtml(h.label)}</span><span class="wh-code">${escHtml(h.code)}</span>`;
            historyEl.appendChild(row);
        });
    }

    function escHtml(s){
        return String(s).replace(/[&<>"']/g, m => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]));
    }

    // ---------------- вращение ----------------
    let currentRotation = 0;
    let spinning = false;

    spinBtn.addEventListener("click", () => {
        if(spinning || isLocked()) return;
        if(spinsLeft() <= 0) return;

        spinning = true;
        spinBtn.disabled = true;
        resultEl.classList.add("hidden");

        const idx = pickSegment();
        const b = bounds[idx];
        // случайная точка внутри сегмента (с отступом от краёв)
        const span = b.end - b.start;
        const target = b.start + span * (0.2 + Math.random() * 0.6);
        // сколько нужно повернуть колесо, чтобы target оказался под стрелкой сверху
        const baseTurns = 5 * 360;
        const needed = (360 - target) % 360;
        // добираем до needed от текущего положения, всегда вперёд
        const currentMod = ((currentRotation % 360) + 360) % 360;
        let delta = needed - currentMod;
        if(delta <= 0) delta += 360;
        currentRotation += baseTurns + delta;

        stage.style.transform = `rotate(${currentRotation}deg)`;

        const seg = W.segments[idx];
        const code = makeCode();

        stage.addEventListener("transitionend", function onEnd(){
            stage.removeEventListener("transitionend", onEnd);
            spinning = false;

            state.spinsUsed += 1;
            state.history.push({label: seg.label, type: seg.type, code, ts: Date.now()});
            if(state.spinsUsed >= W.spinLimit){
                state.lockedUntil = Date.now() + W.cooldownDays * 24 * 60 * 60 * 1000;
            }
            saveState(state);

            resultEl.innerHTML = `
              <p class="wr-label">Ваш выигрыш</p>
              <p class="wr-prize">${escHtml(seg.label)}</p>
              <span class="wr-code">${escHtml(code)}</span>
            `;
            resultEl.classList.remove("hidden");
            renderPanel();
        });
    });

    renderPanel();
})();