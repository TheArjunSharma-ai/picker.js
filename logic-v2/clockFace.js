
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // MODULE 6 · clockFace.js  (shared analog clock face)
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    const clockFaceHTML = () =>
        `<div class="tp-clock-wrap">
       <div class="tp-clock-face">
         <div class="tp-clock-center"></div>
         <div class="tp-clock-hand"></div>
         <div class="tp-numbers"></div>
       </div>
     </div>`;

    const renderClockFace = (drop, mode, hour, minute) => {
        const face = drop.querySelector('.tp-clock-face');
        const handEl = drop.querySelector('.tp-clock-hand');
        const numbersEl = drop.querySelector('.tp-numbers');
        if (!face) return;
        handEl.style.transform = `rotate(${mode === 'hour' ? hour * 30 : minute * 6}deg)`;
        handEl.style.height = mode === 'hour' ? '38%' : '43%';
        numbersEl.innerHTML = '';
        const size = face.offsetWidth || 240, cx = size / 2, cy = size / 2, r = size * 0.38;
        for (let i = 1; i <= 12; i++) {
            const rad = (i * 30 - 90) * (Math.PI / 180);
            const node = document.createElement('div'); node.className = 'tp-number';
            node.style.left = `${cx + r * Math.cos(rad)}px`; node.style.top = `${cy + r * Math.sin(rad)}px`;
            const isHour = mode === 'hour';
            node.textContent = isHour ? i : ((i * 5) % 60 === 0 ? '00' : (i * 5) % 60);
            if (isHour ? i === hour : (i * 5) % 60 === minute) node.classList.add('active');
            numbersEl.appendChild(node);
        }
    };

    const getClockAngle = (e, face) => {
        const rect = face.getBoundingClientRect();
        const cx = rect.left + rect.width / 2, cy = rect.top + rect.height / 2;
        const px = e.touches ? e.touches[0].clientX : e.clientX, py = e.touches ? e.touches[0].clientY : e.clientY;
        let a = Math.atan2(py - cy, px - cx) * (180 / Math.PI) + 90; if (a < 0) a += 360; return a;
    };

    const angleToTime = (angle, mode) => {
        if (mode === 'hour') { let h = Math.round(angle / 30); if (h === 0) h = 12; if (h > 12) h = 12; return h; }
        return Math.round(angle / 6) % 60;
    };

    const bindClockDrag = (drop, getMode, onUpdate, onRelease) => {
        const face = drop.querySelector('.tp-clock-face');
        const onMove = (e) => { const a = getClockAngle(e, face); onUpdate(angleToTime(a, getMode()), getMode()); };
        const onUp = () => {
            window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp);
            window.removeEventListener('touchmove', onMove); window.removeEventListener('touchend', onUp);
            if (onRelease) onRelease(getMode());
        };
        face.addEventListener('mousedown', (e) => { onMove(e); window.addEventListener('mousemove', onMove); window.addEventListener('mouseup', onUp); });
        face.addEventListener('touchstart', (e) => { e.preventDefault(); onMove(e); window.addEventListener('touchmove', onMove, { passive: false }); window.addEventListener('touchend', onUp); }, { passive: false });
    };

    const updateClockDisplay = (drop, mode, hour, minute, isAM, is12) => {
        drop.querySelector('[data-part="hour"]').value = pad(hour);
        drop.querySelector('[data-part="min"]').value = pad(minute);
        drop.querySelector('[data-part="hour"]').classList.toggle('tp-dim', mode !== 'hour');
        drop.querySelector('[data-part="min"]').classList.toggle('tp-dim', mode !== 'minute');
        drop.querySelectorAll('.tp-mode-btn').forEach((b) => b.classList.toggle('active', b.dataset.mode === mode));
        if (is12) drop.querySelectorAll('.tp-ampm-btn').forEach((b) => b.classList.toggle('active', (b.dataset.ampm === 'am') === isAM));
    };
    const btnHeaderClockHTML = `
        <div class="tp-mode-row">
            <button class="tp-mode-btn active" data-mode="hour">Hour</button>
            <button class="tp-mode-btn" data-mode="minute">Minute</button>
        </div>
      `
    const clockHeaderHTML = (label) => timeHeaderHTML(label, 10, '00', true, btnHeaderClockHTML)

    const bindClockControls = (drop, is12, getMode, setMode, setAM, render) => {
        drop.querySelectorAll('.tp-mode-btn').forEach((b) => b.addEventListener('click', (e) => { e.stopPropagation(); setMode(b.dataset.mode); render(); }));
        if (is12) drop.querySelectorAll('.tp-ampm-btn').forEach((b) => b.addEventListener('click', (e) => { e.stopPropagation(); setAM(b.dataset.ampm === 'am'); render(); }));
    };
