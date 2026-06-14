(function (window) {
    "use strict";

    const ALLOWED_KEYS = ['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab', 'Enter'];
    const MONTHS_LONG = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const DAYS_FIRST = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
    const DEFAULT_DATE_FORMAT = 'MMM dd, yyyy';
    const DEFAULT_TIME_FORMAT_12 = '12';
    const DEFAULT_INTERVAL = 1;
    const RANGE_SPLITTER = '→';
    const Is12 = (format) => {
        return format === '12' || format.includes('h');
    }
    const IsDoubleDigit = (val, checker) => (val + '').toLowerCase().includes((checker + '').toLowerCase());
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // MODULE 2 · utils.js
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    const pad = (v) => String(v).padStart(2, '0');
    const isValidDate = (d) => d instanceof Date && !Number.isNaN(d.getTime());
    const isNullOrEmpty = (v) => v == null || v === '' || v === 'null' || v === 'undefined';

    const toDate = (value) => {
        if (isNullOrEmpty(value)) return null;
        if (value instanceof Date) return isValidDate(value) ? new Date(value) : null;
        const d = new Date(value);
        return isValidDate(d) ? d : null;
    };

    const midnight = (date) => {
        const d = new Date(date); d.setHours(0, 0, 0, 0); return d;
    };

    const splitRangeValue = (value) => {
        if (!value) return { start: null, end: null };
        const parts = value.split(RANGE_SPLITTER).map((s) => s.trim());
        return { start: parts[0] || null, end: parts[1] || null };
    };
    const timeToggleHTML = (is12) => {
        if (is12) return `<div class="tp-ampm-toggle"><button class="tp-ampm-btn active" data-ampm="am">AM</button><button class="tp-ampm-btn" data-ampm="pm">PM</button></div>`
        return ''
    }
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // MODULE 3 · formatter.js  (formatValue + parseDateTime)
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    const FORMAT_TOKENS = [
        ['yyyy', '(\\d{4})', 'yyyy'], ['yy', '(\\d{2})', 'yy'],
        ['MMMM', '([A-Za-z]+)', 'MMMM'], ['MMM', '([A-Za-z]{3})', 'MMM'],
        ['MM', '(\\d{1,2})', 'MM'], ['M', '(\\d{1,2})', 'M'],
        ['DD', '(\\d{1,2})', 'DD'], ['dd', '(\\d{1,2})', 'dd'], ['d', '(\\d{1,2})', 'd'],
        ['HH', '(\\d{1,2})', 'HH'], ['H', '(\\d{1,2})', 'H'],
        ['hh', '(\\d{1,2})', 'hh'], ['h', '(\\d{1,2})', 'h'],
        ['mm', '(\\d{1,2})', 'mm'],
        ['SSS', '(\\d{1,3})', 'SSS'], ['SS', '(\\d{1,2})', 'SS'],
        ['ss', '(\\d{1,2})', 'ss'], ['s', '(\\d{1,2})', 's'],
        ['A', '(AM|PM|am|pm)', 'A'], ['a', '(AM|PM|am|pm)', 'a'], ['Z', '(Z)', 'Z'],
    ];
    const _regexCache = {};
    const _buildRegex = (format) => {
        if (_regexCache[format]) return _regexCache[format];
        const groupNames = []; let regexStr = '^'; let i = 0;
        while (i < format.length) {
            let matched = false;
            for (const [tok, capture, name] of FORMAT_TOKENS) {
                if (format.startsWith(tok, i)) { regexStr += capture; groupNames.push(name); i += tok.length; matched = true; break; }
            }
            if (!matched) { regexStr += format[i].replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'); i++; }
        }
        regexStr += '$';
        try { const re = new RegExp(regexStr, 'i'); return (_regexCache[format] = { re, groupNames }); }
        catch { return null; }
    };
    const _execFormat = (str, format) => {
        const cached = _buildRegex(format); if (!cached) return null;
        const match = cached.re.exec(str); if (!match) return null;
        const values = {};
        cached.groupNames.forEach((name, i) => { if (!(name in values)) values[name] = match[i + 1]; });
        return values;
    };

    const formatValue = (dateInput, formatStr) => {
        const d = toDate(dateInput); if (!d || !formatStr) return '';
        const mo = d.getMonth(), yr = d.getFullYear(), dt = d.getDate();
        const h24 = d.getHours(), h12 = h24 % 12 || 12, mi = d.getMinutes(), se = d.getSeconds(), ms = d.getMilliseconds();
        const ampm = h24 >= 12 ? 'PM' : 'AM', sy = String(yr % 100).padStart(2, '0');
        const T = {
            YYYY: String(yr), yyyy: String(yr), yy: sy,
            MMMM: MONTHS_LONG[mo], MMM: MONTHS_SHORT[mo], MM: pad(mo + 1), M: String(mo + 1),
            DD: pad(dt), dd: pad(dt), d: String(dt),
            HH: pad(h24), H: String(h24), hh: pad(h12), h: String(h12),
            mm: pad(mi), SSS: String(ms).padStart(3, '0'), SS: pad(se), ss: pad(se), s: String(se),
            A: ampm, a: ampm,
        };
        return formatStr.replace(/YYYY|yyyy|yy|MMMM|MMM|MM|M|DD|dd|d|HH|H|hh|h|mm|SSS|SS|ss|s|A|a/g, (m) => T[m] ?? m);
    };

    const parseDateTime = (str, format) => {
        if (!str || !format) return null;
        const v = _execFormat(str.trim(), format); if (!v) return null;
        let mo = 0;
        if (v.MMMM) { mo = MONTHS_LONG.indexOf(v.MMMM); if (mo < 0) mo = 0; }
        else if (v.MMM) { mo = MONTHS_SHORT.indexOf(v.MMM.slice(0, 3)); if (mo < 0) mo = 0; }
        else { const r = v.MM ?? v.M; mo = r ? Math.max(0, Math.min(11, parseInt(r) - 1)) : 0; }
        const now = new Date();
        const yr = v.yyyy ? parseInt(v.yyyy) : v.yy ? 2000 + parseInt(v.yy) : now.getFullYear();
        const day = parseInt(v.DD ?? v.dd ?? v.d ?? '1');
        const mi = parseInt(v.mm ?? '0'), se = parseInt(v.ss ?? '0');
        const ms = v.SSS ? parseInt(String(v.SSS).padEnd(3, '0')) : 0;
        let hr = 0;
        if (v.HH || v.H) { hr = parseInt(v.HH ?? v.H); }
        else if (v.hh || v.h) { hr = parseInt(v.hh ?? v.h) % 12; if ((v.A && /pm/i.test(v.A)) || (v.a && /pm/i.test(v.a))) hr += 12; }
        try { return v.Z ? new Date(Date.UTC(yr, mo, day, hr, mi, se, ms)) : new Date(yr, mo, day, hr, mi, se, ms); }
        catch { return null; }
    };

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // MODULE 5 · calGrid.js  (shared calendar grid renderer)
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    const renderCalGrid = (grid, viewYear, viewMonth, selectedDate, today, minD, maxD, onPick) => {
        const firstDay = new Date(viewYear, viewMonth, 1).getDay();
        const totalDays = new Date(viewYear, viewMonth + 1, 0).getDate();
        const prevTotal = new Date(viewYear, viewMonth, 0).getDate();
        grid.innerHTML = '';
        for (let i = firstDay; i > 0; i--) {
            const c = document.createElement('div'); c.className = 'cal-day other-month'; c.textContent = prevTotal - i + 1; grid.appendChild(c);
        }
        for (let d = 1; d <= totalDays; d++) {
            const date = midnight(new Date(viewYear, viewMonth, d));
            const disabled = (minD && date < minD) || (maxD && date > maxD);
            const c = document.createElement('div');
            c.className = ['cal-day',
                date.getTime() === today.getTime() && 'today',
                selectedDate && date.getTime() === selectedDate.getTime() && 'selected',
                disabled && 'disabled'
            ].filter(Boolean).join(' ');
            c.textContent = d;
            if (!disabled) c.addEventListener('click', (e) => { e.stopPropagation(); onPick(date); });
            grid.appendChild(c);
        }
    };

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // MODULE 4 · dom.js  (reusable DOM helpers)
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
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
    const clockFaceHTML = () =>
        `<div class="tp-clock-wrap">
       <div class="tp-clock-face">
         <div class="tp-clock-center"></div>
         <div class="tp-clock-hand"></div>
         <div class="tp-numbers"></div>
       </div>
     </div>`;
    const bindInputToggle = (input, drop, onOpen) =>
        input.addEventListener('click', (e) => {
            e.stopPropagation(); closeOthers(drop); drop.classList.toggle('open');
            if (drop.classList.contains('open') && onOpen) onOpen();
        });

    const footerHTML = (cancel = 'Cancel', set = 'Set') =>
        `<div class="cal-footer">
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
    function bindStepEvent(element, callback) {

        if (!element) return;

        element.addEventListener('click', e => {
            e.stopPropagation();
            callback(e.currentTarget.dataset.dir);
        });
    }
    /////////////////////////////////////////////////
    const renderTimer = (hour = '12', min = '00', is12 = true, ampm = 'AM') => {
        const colHTML = (field, val) => `<div class="timer-row"><button class="timer-step-btn" data-field="${field}" data-dir="1">▲</button><span class="timer-val" data-val="${field}">${val}</span><button class="timer-step-btn" data-field="${field}" data-dir="-1">▼</button></div>`;
        return `
        <div class="timer-body">
        ${colHTML('hour', hour)}<div class="timer-colon-sep">:</div>${colHTML('min', min)}
        ${is12 ? `<div class="timer-colon-sep"></div>${colHTML('ampm', ampm)}` : ''}
        </div>
      `
    }
    // ── Calendar renderer html ──────────────────────────────────────────────
    const renderCalendarHTML = () => {
        return `
    <div class="cal-section">
        <div class="cal-nav-row">
          <span class="cal-month-title"></span>
            <div class="cal-nav-btns">
              <button class="cal-nav-btn" data-dir="-1" aria-label="Prev">chevron_left</button>
              <button class="cal-nav-btn" data-dir="1" aria-label="Next">chevron_right</button>
            </div>
        </div>
        <div class="cal-grid-wrap">
          <div class="cal-dow-row">${DAYS_FIRST.map(d => `<div class="cal-dow">${d}</div>`).join('')}</div>
          <div class="cal-days-grid pdt-grid"></div>
        </div>
      </div>
        `
    }
    const timeBodyHTML = (label, hour, minute, is12, format) => {
        const hour2Digit = IsDoubleDigit(format, 'hh');
        const min2Digit = IsDoubleDigit(format, 'mm');
        const minHour = hour2Digit ? is12 ? '01' : '00' : is12 ? 1 : 0;
        const maxHour = is12 ? 12 : 23;
        return `
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
    `
    }
    // ── Calendar renderer ──────────────────────────────────────────────
    const renderDate = (drop, sel, today, minD, maxD, viewMonth, viewYear, onPick) => {
        const navTitle = drop.querySelector('.cal-month-title');
        const grid = drop.querySelector('.pdt-grid');
        navTitle.textContent = `${MONTHS_LONG[viewMonth]} ${viewYear}`;
        renderCalGrid(grid, viewYear, viewMonth, sel, today, minD, maxD, onPick);
    };
    const modeToggleHTML = (mode = 'hour') => {
        return `
    <div class="tp-mode-row">
            <button class="tp-mode-btn ${mode === 'hour' ? 'active' : ''}" data-mode="hour">Hour</button>
            <button class="tp-mode-btn ${mode === 'min' ? 'active' : ''}" data-mode="minute">Minute</button>
          </div>
    `
    }
    const changeAmpm = (drop, ampm) => {
        const am = drop.querySelector('button[data-ampm=am]');
        const pm = drop.querySelector('button[data-ampm=pm]');
        if (ampm) {
            am.classList.add('active');
            pm.classList.remove('active'); return;
        }
        am.classList.remove('active');
        pm.classList.add('active');
    }
    const changeMode = (drop, mode) => {
        const hourMode = drop.querySelector('button[data-mode=hour]');
        const minuteMode = drop.querySelector('button[data-mode=minute]');
        if (mode === 'hour') {
            hourMode.classList.add('active');
            minuteMode.classList.remove('active');
        }
        else {
            minuteMode.classList.add('active');
            hourMode.classList.remove('active');
        }
    }
    const changeInput = (drop, mode, hour, minute, format) => {
        const hourInput = drop.querySelector('input[data-part=hour]');
        const minInput = drop.querySelector('input[data-part=min]');
        const hour2Digit = IsDoubleDigit(format, 'hh');
        const min2Digit = IsDoubleDigit(format, 'mm');
        hourInput.value = hour2Digit ? pad(hour) : hour;
        minInput.value = min2Digit ? pad(minute) : minute;
        if (mode === 'hour') {
            hourInput.classList.add('active');
            minInput.classList.remove('active');
            return;
        }
        hourInput.classList.remove('active');
        minInput.classList.add('active');
    }
    const renderClockHTML = (is12) => {
        return `
        <div class="pdt-section pdt-section--time">
        <div class="pdt-section-toolbar">
          <span class="pdt-section-title">Time</span>
        </div>
        <div class="pdt-time-body">
        <!-- Digital display -->
        ${timeBodyHTML('Time', '12', '00', is12, 'hh:mm')}
        <!-- Mode buttons -->
        ${modeToggleHTML()}
        </div>
        <div class="timer-body">
          <!-- Clock face — reuses existing clock CSS -->
          ${clockFaceHTML()}
        </div>
      </div>
        `
    }
    const createStepper = ({
        value,
        min,
        max,
        display,
        onOverflow,
        onUnderflow,
        formatter = v => v,
        onshow
    }) => {

        return dir => {

            value += Number(dir);

            if (value > max) {
                value = min;
                onOverflow?.();
            }

            if (value < min) {
                value = max;
                onUnderflow?.();
            }

            display.textContent = formatter(value);
            onshow(display.textContent);
        };
    };
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // MODULE 11 · dateTime() — compact dropdown (appointment card style)
    // Purple summary header · calendar section · clock section · footer
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    function dateTime(options) {
        const cfg = Object.assign({
            selector: '',
            dateFormat: DEFAULT_DATE_FORMAT,
            timeFormat: DEFAULT_TIME_FORMAT_12,
            min: null,
            max: null,
            time: 'clock',
            onChange: null,
        }, options);

        const input = document.querySelector(cfg.selector);
        if (!input) { console.warn('pickr.dateTime: not found:', cfg.selector); return; }

        const is12 = cfg.timeFormat === '12';
        const minD = cfg.min ? midnight(cfg.min) : null;
        const maxD = cfg.max ? midnight(cfg.max) : null;
        const today = midnight(new Date());
        const isClock = cfg.time === 'clock';

        // ── State ──────────────────────────────────────────────────────────
        let sel = parseDateTime(input.value, cfg.dateFormat) ?? today;
        let vm = sel.getMonth();
        let vy = sel.getFullYear();
        let mode = 'hour';
        let hour = 10;
        let minute = 0;
        let isAM = true;

        // ── Dropdown (same pattern as clock/calendar) ──────────────────────
        const drop = createDropdown(input, 'pickr-dropdown pickr-datetime');
        input.parentElement.style.position = 'relative';

        drop.innerHTML = `
      <!-- Purple summary header -->
      <div class="pdt-header">
        <div class="pdt-header-label">Date &amp; Time</div>
        <div class="pdt-summary">
          <span class="pdt-sum-date">—</span>
          <span class="pdt-sum-sep">·</span>
          <span class="pdt-sum-time">—</span>
        </div>
      </div>

      <!-- ── Date section ── -->
      ${renderCalendarHTML()}

      <!-- ── Time section ── -->
      ${isClock ? renderClockHTML(is12) : renderTimer(hour, minute, is12, isAM ? 'AM' : 'PM')}

      <!-- Footer -->
      ${footerHTML('Cancel', 'Set DateTime')}
    `;

        // ── Element refs ───────────────────────────────────────────────────
        const sumDate = drop.querySelector('.pdt-sum-date');
        const sumTime = drop.querySelector('.pdt-sum-time');

        // ── Summary ────────────────────────────────────────────────────────
        const updateSummary = () => {
            sumDate.textContent = sel ? formatValue(sel, 'MMM dd, yyyy') : '—';
            sumTime.textContent = is12
                ? `${pad(hour)}:${pad(minute)} ${isAM ? 'AM' : 'PM'}`
                : `${pad(hour)}:${pad(minute)}`;
        };

        // ── Combined render ────────────────────────────────────────────────
        const render = () => {
            renderDate(drop, sel, today, minD, maxD, vm, vy, (d) => { sel = d; render(); });
            if (isClock) {
                renderClockFace(drop, mode, hour, minute);
                changeMode(drop, mode);
                changeAmpm(drop, isAM);
                changeInput(drop, mode, hour, minute, cfg.format);
            }

            updateSummary();
        };

        if (isClock) {
            const face = drop.querySelector('.tp-clock-face');
            const digitH = drop.querySelector('input[data-part="hour"]');
            const digitM = drop.querySelector('input[data-part="min"]');
            // ── Clock drag ─────────────────────────────────────────────────────
            const getAngle = (e) => {
                const rect = face.getBoundingClientRect();
                const cx = rect.left + rect.width / 2, cy = rect.top + rect.height / 2;
                const px = e.touches ? e.touches[0].clientX : e.clientX;
                const py = e.touches ? e.touches[0].clientY : e.clientY;
                let a = Math.atan2(py - cy, px - cx) * (180 / Math.PI) + 90;
                if (a < 0) a += 360; return a;
            };
            const applyAngle = (a) => {
                if (mode === 'hour') { let h = Math.round(a / 30); if (h === 0) h = 12; if (h > 12) h = 12; hour = h; }
                else minute = Math.round(a / 6) % 60;
                render();
            };
            const onMove = (e) => { e.preventDefault(); applyAngle(getAngle(e)); };
            const onUp = () => {
                window.removeEventListener('mousemove', onMove);
                window.removeEventListener('mouseup', onUp);
                window.removeEventListener('touchmove', onMove);
                window.removeEventListener('touchend', onUp);
                if (mode === 'hour') setTimeout(() => { mode = 'minute'; render(); }, 280);
            };
            face.addEventListener('mousedown', (e) => {
                applyAngle(getAngle(e));
                window.addEventListener('mousemove', onMove);
                window.addEventListener('mouseup', onUp);
            });
            face.addEventListener('touchstart', (e) => {
                e.preventDefault(); applyAngle(getAngle(e));
                window.addEventListener('touchmove', onMove, { passive: false });
                window.addEventListener('touchend', onUp);
            }, { passive: false });

            // ── Mode + AM/PM buttons ───────────────────────────────────────────
            drop.querySelectorAll('.tp-mode-btn').forEach(b =>
                b.addEventListener('click', (e) => { e.stopPropagation(); mode = b.dataset.mode; render(); })
            );
            if (is12) drop.querySelectorAll('.tp-ampm-btn').forEach(b =>
                b.addEventListener('click', (e) => { e.stopPropagation(); isAM = b.dataset.ampm === 'am'; render(); })
            );
            // ── Digit click → switch mode ──────────────────────────────────────
            digitH.addEventListener('click', (e) => { e.stopPropagation(); mode = 'hour'; render(); });
            digitM.addEventListener('click', (e) => { e.stopPropagation(); mode = 'minute'; render(); });
        }
        else {
            const hourEvent = drop.querySelectorAll('button[data-field=hour]');
            const minEvent = drop.querySelectorAll('button[data-field=min]');
            const hourDigit = drop.querySelector('span[data-val=hour]')
            const minDigit = drop.querySelector('span[data-val=min]')
            const ampm = drop.querySelector('span[data-val=ampm]')
            const IsAMPM = drop.querySelectorAll('button[data-field=ampm]')
            const maxhour = is12 ? 12 : 23;
            const updateAMPM = () => {
                isAM = !isAM;
                ampm.textContent = isAM ? 'AM' : 'PM';
                render();
            };
            
            const updateHour = createStepper({
                value: hour,
                min: is12 ? 1 : 0,
                max: is12 ? 12 : 23,
                display: hourDigit,
                onOverflow: is12 ? updateAMPM : null,
                onUnderflow: is12 ? updateAMPM : null,
                onshow:(h)=>{ hour = h; render();},
            });
            const updateMinute = createStepper({
                value: minute,
                min: 0,
                max: 59,
                display: minDigit,
                onOverflow: () => updateHour(1),
                onUnderflow: () => updateHour(-1),
                formatter: v => String(v).padStart(2, '0'),
                onshow:(m)=>{minute=m; render();},
            });

            hourEvent.forEach(e => bindStepEvent(e, updateHour));
            minEvent.forEach(e => bindStepEvent(e, updateMinute));
            
            if (is12) {
                IsAMPM.forEach(e => bindStepEvent(e, updateAMPM));
                bindStepEvent(ampm,updateAMPM)
            }

        }

        // ── Calendar nav ───────────────────────────────────────────────────
        bindNavButtons(drop, '', (dir) => { vm += dir; if (vm > 11) { vm = 0; vy++; } if (vm < 0) { vm = 11; vy--; } render(); });


        // ── Footer ─────────────────────────────────────────────────────────
        bindFooter(
            drop,
            () => drop.classList.remove('open'),
            () => {
                if (!sel) return;
                const t = is12
                    ? `${pad(hour)}:${pad(minute)} ${isAM ? 'AM' : 'PM'}`
                    : `${pad(hour)}:${pad(minute)}`;
                input.value = `${formatValue(sel, cfg.dateFormat)}  ${t}`;
                if (cfg.onChange) cfg.onChange({ date: sel, hour, minute, isAM });
                drop.classList.remove('open');
            }
        );

        // ── Open / close ───────────────────────────────────────────────────
        bindInputToggle(input, drop, render);
        onClickOutside(input, drop, () => drop.classList.remove('open'));
        render();
    }


    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // MODULE 12 · export — dual API
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━


    pickr.dateTime = dateTime;

    window.pickr = pickr;

})(window);