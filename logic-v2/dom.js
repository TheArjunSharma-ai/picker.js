
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // MODULE 4 · dom.js  (reusable DOM helpers)
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    const closeOthers = (keepEl) =>
        document.querySelectorAll('.pickr-dropdown.open').forEach((el) => { if (el !== keepEl) el.classList.remove('open'); });

    const onClickOutside = (trigEl, dropEl, cb) =>
        document.addEventListener('click', (e) => { if (!trigEl.contains(e.target) && !dropEl.contains(e.target)) cb(); });

    const createDropdown = (input, cls) => {
        const drop = document.createElement('div');
        drop.className = `pickr-dropdown ${cls}`;
        input.parentElement.style.position = 'relative';
        input.parentElement.appendChild(drop);
        return drop;
    };

    const bindInputToggle = (input, drop, onOpen) =>
        input.addEventListener('click', (e) => {
            e.stopPropagation(); closeOthers(drop); drop.classList.toggle('open');
            if (drop.classList.contains('open') && onOpen) onOpen();
        });
    const dateHeaderHTML = (label, date, year = '') => `
        <div class="cal-header-display">
            <div class="cal-header-label">${label}</div>
            <div class="cal-header-date pickr-hd">${date}</div>
            <div class="cal-header-year pickr-hy">${year}</div>
        </div>
      `;
    const timeToggleHTML = (is12) => {
        if (is12) return `<div class="tp-ampm-toggle"><button class="tp-ampm-btn active" data-ampm="am">AM</button><button class="tp-ampm-btn" data-ampm="pm">PM</button></div>`
        return ''
    }
    const timeHeaderHTML = (label, hour, minute, is12, innerHeader = '', format) => {
        const hour2Digit = IsDoubleDigit(format, 'hh');
        const min2Digit = IsDoubleDigit(format, 'mm');
        const minHour = hour2Digit ? is12 ? '01' : '00' : is12 ? 1 : 0;
        const maxHour = is12 ? 12 : 23;
        return `
            <div class="tp-header">
                <div class="tp-header-label">${label}</div>
                <div class="tp-display-row">
                    <span class="tp-display-part" >
                    <input type="text" data-part="hour" min=${minHour} value='${hour2Digit ? pad(hour) : hour + ''}' max=${maxHour} />
                    </span>
                    <span class="tp-display-colon">:</span>
                    <span class="tp-display-part tp-dim" >
                    <input type="text" data-part="min" min="${min2Digit ? '00' : '0'}" value='${min2Digit ? pad(minute) : minute + ''}' max="59" />
                    </span>
                    ${timeToggleHTML(is12)}
                </div>
                ${innerHeader}
            </div>
      `}
    const rangeHeaderHTML = () => `
            <div class="rp-header">
                <div class="rp-header-label">Select Date Range</div>
                <div class="rp-header-dates">
                    <div class="rp-header-slot rp-start-slot"><span class="rp-slot-label">Start</span><span class="rp-slot-value rp-start-val">—</span></div>
                    <div class="rp-header-arrow">${RANGE_SPLITTER}</div>
                    <div class="rp-header-slot rp-end-slot"><span class="rp-slot-label">End</span><span class="rp-slot-value rp-end-val">—</span></div>
                </div>
            </div>
        `
    const footerHTML = (cancel = 'Cancel', set = 'Set') => `
    <div class="cal-footer">
       <button class="btn-cancel" data-action="cancel">${cancel}</button>
       <button class="btn-set"    data-action="set">${set}</button>
     </div>`;

    const bindFooter = (drop, onCancel, onSet) => {
        drop.querySelector('[data-action="cancel"]').addEventListener('click', (e) => { e.stopPropagation(); onCancel(); });
        drop.querySelector('[data-action="set"]').addEventListener('click', (e) => { e.stopPropagation(); onSet(); });
    };

    const navRowHTML = (cls = '') =>
        `<div class="cal-nav-row ${cls}">
       <span class="cal-month-title pickr-nav-title"></span>
       <div class="cal-nav-btns">
         <button class="cal-nav-btn" data-dir="-1" aria-label="Prev">chevron_left</button>
         <button class="cal-nav-btn" data-dir="1"  aria-label="Next">chevron_right</button>
       </div>
     </div>`;

    const bindNavButtons = (drop, sel, onChange) =>
        drop.querySelectorAll(`${sel} .cal-nav-btn`).forEach((btn) =>
            btn.addEventListener('click', (e) => { e.stopPropagation(); onChange(parseInt(btn.dataset.dir)); })
        );

    const dowRowHTML = () =>
        `<div class="cal-dow-row">${DAYS_FIRST.map((d) => `<div class="cal-dow">${d}</div>`).join('')}</div>`;
