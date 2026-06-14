(function (window) {
  "use strict";

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // MODULE 1 · constants.js
  // NEW: ALLOWED_KEYS, DEFAULT_INTERVAL, Is12(), IsDoubleDigit()
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const ALLOWED_KEYS           = ['Backspace','Delete','ArrowLeft','ArrowRight','Tab','Enter'];
  const MONTHS_LONG            = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const MONTHS_SHORT           = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const DAYS_FIRST             = ['S','M','T','W','T','F','S'];
  const DEFAULT_DATE_FORMAT    = 'MMM dd, yyyy';
  const DEFAULT_TIME_FORMAT_12 = '12';
  const DEFAULT_INTERVAL       = 1;
  const RANGE_SPLITTER         = '→';
  const Is12          = (fmt) => fmt === '12' || fmt.includes('h');
  const IsDoubleDigit = (val, checker) => (val + '').toLowerCase().includes((checker + '').toLowerCase());

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // MODULE 2 · utils.js
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const pad           = (v) => String(v).padStart(2, '0');
  const isValidDate   = (d) => d instanceof Date && !Number.isNaN(d.getTime());
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

  const debounce = (fn, wait = 20) => {
    let t;
    return function (...args) { clearTimeout(t); t = setTimeout(() => fn.apply(this, args), wait); };
  };

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // MODULE 3 · formatter.js
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const FORMAT_TOKENS = [
    ['yyyy','(\\d{4})','yyyy'],['yy','(\\d{2})','yy'],
    ['MMMM','([A-Za-z]+)','MMMM'],['MMM','([A-Za-z]{3})','MMM'],
    ['MM','(\\d{1,2})','MM'],['M','(\\d{1,2})','M'],
    ['DD','(\\d{1,2})','DD'],['dd','(\\d{1,2})','dd'],['d','(\\d{1,2})','d'],
    ['HH','(\\d{1,2})','HH'],['H','(\\d{1,2})','H'],
    ['hh','(\\d{1,2})','hh'],['h','(\\d{1,2})','h'],
    ['mm','(\\d{1,2})','mm'],
    ['SSS','(\\d{1,3})','SSS'],['SS','(\\d{1,2})','SS'],
    ['ss','(\\d{1,2})','ss'],['s','(\\d{1,2})','s'],
    ['A','(AM|PM|am|pm)','A'],['a','(AM|PM|am|pm)','a'],['Z','(Z)','Z'],
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
      if (!matched) { regexStr += format[i].replace(/[-\/\\^$*+?.()|[\]{}]/g,'\\$&'); i++; }
    }
    regexStr += '$';
    try { const re = new RegExp(regexStr,'i'); return (_regexCache[format] = { re, groupNames }); }
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
    const mo=d.getMonth(), yr=d.getFullYear(), dt=d.getDate();
    const h24=d.getHours(), h12=h24%12||12, mi=d.getMinutes(), se=d.getSeconds(), ms=d.getMilliseconds();
    const ampm=h24>=12?'PM':'AM', sy=String(yr%100).padStart(2,'0');
    const T = {
      YYYY:String(yr), yyyy:String(yr), yy:sy,
      MMMM:MONTHS_LONG[mo], MMM:MONTHS_SHORT[mo], MM:pad(mo+1), M:String(mo+1),
      DD:pad(dt), dd:pad(dt), d:String(dt),
      HH:pad(h24), H:String(h24), hh:pad(h12), h:String(h12),
      mm:pad(mi), SSS:String(ms).padStart(3,'0'), SS:pad(se), ss:pad(se), s:String(se),
      A:ampm, a:ampm,
    };
    return formatStr.replace(/YYYY|yyyy|yy|MMMM|MMM|MM|M|DD|dd|d|HH|H|hh|h|mm|SSS|SS|ss|s|A|a/g, (m) => T[m]??m);
  };
  const parseDateTime = (str, format) => {
    if (!str || !format) return null;
    const v = _execFormat(str.trim(), format); if (!v) return null;
    let mo = 0;
    if (v.MMMM)     { mo = MONTHS_LONG.indexOf(v.MMMM);            if (mo<0) mo=0; }
    else if (v.MMM) { mo = MONTHS_SHORT.indexOf(v.MMM.slice(0,3)); if (mo<0) mo=0; }
    else            { const r=v.MM??v.M; mo=r?Math.max(0,Math.min(11,parseInt(r)-1)):0; }
    const now = new Date();
    const yr  = v.yyyy?parseInt(v.yyyy):v.yy?2000+parseInt(v.yy):now.getFullYear();
    const day = parseInt(v.DD??v.dd??v.d??'1');
    const mi  = parseInt(v.mm??'0'), se=parseInt(v.ss??'0');
    const ms  = v.SSS?parseInt(String(v.SSS).padEnd(3,'0')):0;
    let hr = 0;
    if (v.HH||v.H) { hr=parseInt(v.HH??v.H); }
    else if (v.hh||v.h) { hr=parseInt(v.hh??v.h)%12; if((v.A&&/pm/i.test(v.A))||(v.a&&/pm/i.test(v.a)))hr+=12; }
    try { return v.Z?new Date(Date.UTC(yr,mo,day,hr,mi,se,ms)):new Date(yr,mo,day,hr,mi,se,ms); }
    catch { return null; }
  };

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // MODULE 4 · dom.js
  // NEW: dateHeaderHTML, timeToggleHTML, timeHeaderHTML, rangeHeaderHTML,
  //      modeToggleHTML, changeAmpm, changeMode, changeInput,
  //      bindStepEvent, createStepper, renderCalendarHTML,
  //      renderClockHTML, renderTimer, timeBodyHTML
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const closeOthers = (keepEl) =>
    document.querySelectorAll('.pickr-dropdown.open').forEach((el) => { if (el!==keepEl) el.classList.remove('open'); });

  const onClickOutside = (trigEl, dropEl, cb) =>
    document.addEventListener('click', (e) => { if (!trigEl.contains(e.target)&&!dropEl.contains(e.target)) cb(); });

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

  const footerHTML = (cancel='Cancel', set='Set') =>
    `<div class="cal-footer">
       <button class="btn-cancel" data-action="cancel">${cancel}</button>
       <button class="btn-set"    data-action="set">${set}</button>
     </div>`;

  const bindFooter = (drop, onCancel, onSet) => {
    drop.querySelector('[data-action="cancel"]').addEventListener('click',(e)=>{e.stopPropagation();onCancel();});
    drop.querySelector('[data-action="set"]').addEventListener('click',   (e)=>{e.stopPropagation();onSet();});
  };

  const navRowHTML = (cls='') =>
    `<div class="cal-nav-row ${cls}">
       <span class="cal-month-title pickr-nav-title"></span>
       <div class="cal-nav-btns">
         <button class="cal-nav-btn" data-dir="-1" aria-label="Prev">chevron_left</button>
         <button class="cal-nav-btn" data-dir="1"  aria-label="Next">chevron_right</button>
       </div>
     </div>`;

  const bindNavButtons = (drop, sel, onChange) =>
    drop.querySelectorAll(`${sel} .cal-nav-btn`).forEach((btn) =>
      btn.addEventListener('click',(e)=>{e.stopPropagation();onChange(parseInt(btn.dataset.dir));})
    );

  const dowRowHTML = () =>
    `<div class="cal-dow-row">${DAYS_FIRST.map((d)=>`<div class="cal-dow">${d}</div>`).join('')}</div>`;

  // NEW from doc6/doc9
  const dateHeaderHTML = (label, date, year='') => `
    <div class="cal-header-display">
      <div class="cal-header-label">${label}</div>
      <div class="cal-header-date pickr-hd">${date}</div>
      <div class="cal-header-year pickr-hy">${year}</div>
    </div>`;

  const timeToggleHTML = (is12) =>
    is12 ? `<div class="tp-ampm-toggle"><button class="tp-ampm-btn active" data-ampm="am">AM</button><button class="tp-ampm-btn" data-ampm="pm">PM</button></div>` : '';

  const timeHeaderHTML = (label, hour, minute, is12, innerHeader='', format='hh:mm') => {
    const h2 = IsDoubleDigit(format,'hh'), m2 = IsDoubleDigit(format,'mm');
    const minH = h2 ? (is12?'01':'00') : (is12?1:0);
    const maxH = is12 ? 12 : 23;
    return `
      <div class="tp-header">
        <div class="tp-header-label">${label}</div>
        <div class="tp-display-row">
          <span class="tp-display-part">
            <input type="text" data-part="hour" min="${minH}" value="${h2?pad(hour):hour}" max="${maxH}" />
          </span>
          <span class="tp-display-colon">:</span>
          <span class="tp-display-part tp-dim">
            <input type="text" data-part="min" min="${m2?'00':'0'}" value="${m2?pad(minute):minute}" max="59" />
          </span>
          ${timeToggleHTML(is12)}
        </div>
        ${innerHeader}
      </div>`;
  };

  const rangeHeaderHTML = () => `
    <div class="rp-header">
      <div class="rp-header-label">Select Date Range</div>
      <div class="rp-header-dates">
        <div class="rp-header-slot rp-start-slot"><span class="rp-slot-label">Start</span><span class="rp-slot-value rp-start-val">—</span></div>
        <div class="rp-header-arrow">${RANGE_SPLITTER}</div>
        <div class="rp-header-slot rp-end-slot"><span class="rp-slot-label">End</span><span class="rp-slot-value rp-end-val">—</span></div>
      </div>
    </div>`;

  const modeToggleHTML = () => `
    <div class="tp-mode-row">
      <button class="tp-mode-btn active" data-mode="hour">Hour</button>
      <button class="tp-mode-btn"        data-mode="minute">Minute</button>
    </div>`;

  // NEW: helpers to mutate existing DOM rather than re-render
  const changeAmpm = (drop, isAM) => {
    drop.querySelector('button[data-ampm=am]')?.classList.toggle('active',  isAM);
    drop.querySelector('button[data-ampm=pm]')?.classList.toggle('active', !isAM);
  };
  const changeMode = (drop, mode) => {
    drop.querySelector('button[data-mode=hour]')?.classList.toggle('active',   mode==='hour');
    drop.querySelector('button[data-mode=minute]')?.classList.toggle('active', mode==='minute');
  };
  const changeInput = (drop, mode, hour, minute, format='hh:mm') => {
    const hIn = drop.querySelector('input[data-part=hour]');
    const mIn = drop.querySelector('input[data-part=min]');
    if (!hIn||!mIn) return;
    hIn.value = IsDoubleDigit(format,'hh') ? pad(hour)   : hour;
    mIn.value = IsDoubleDigit(format,'mm') ? pad(minute) : minute;
    hIn.classList.toggle('active', mode==='hour');
    mIn.classList.toggle('active', mode==='minute');
  };

  // NEW: generic step event binder
  const bindStepEvent = (el, cb) => {
    if (!el) return;
    el.addEventListener('click', (e) => { e.stopPropagation(); cb(e.currentTarget.dataset.dir); });
  };

  // NEW: generic stepper factory (used in dateTime timer mode)
  const createStepper = ({ value, min, max, display, onOverflow, onUnderflow, formatter=v=>v, onshow }) => {
    return (dir) => {
      value += Number(dir);
      if (value > max) { value = min; onOverflow?.(); }
      if (value < min) { value = max; onUnderflow?.(); }
      display.textContent = formatter(value);
      onshow(display.textContent);
    };
  };

  // NEW: calendar section HTML for dateTime dropdown
  const renderCalendarHTML = () => `
    <div class="cal-section">
      <div class="cal-nav-row">
        <span class="cal-month-title"></span>
        <div class="cal-nav-btns">
          <button class="cal-nav-btn" data-dir="-1" aria-label="Prev">chevron_left</button>
          <button class="cal-nav-btn" data-dir="1"  aria-label="Next">chevron_right</button>
        </div>
      </div>
      <div class="cal-grid-wrap">
        ${dowRowHTML()}
        <div class="cal-days-grid pdt-grid"></div>
      </div>
    </div>`;

  // NEW: time input row (used inside dateTime clock section)
  const timeBodyHTML = (hour, minute, is12, format='hh:mm') => {
    const h2 = IsDoubleDigit(format,'hh'), m2 = IsDoubleDigit(format,'mm');
    const minH = h2?(is12?'01':'00'):(is12?1:0), maxH = is12?12:23;
    return `
      <div class="tp-display-row">
        <span class="tp-display-part">
          <input type="text" data-part="hour" min="${minH}" value="${h2?pad(hour):hour}" max="${maxH}" />
        </span>
        <span class="tp-display-colon">:</span>
        <span class="tp-display-part tp-dim">
          <input type="text" data-part="min" min="${m2?'00':'0'}" value="${m2?pad(minute):minute}" max="59" />
        </span>
        ${timeToggleHTML(is12)}
      </div>`;
  };

  // NEW: clock section HTML for dateTime dropdown
  const renderClockHTML = (is12) => `
    <div class="pdt-section pdt-section--time">
      <div class="pdt-section-toolbar">
        <span class="pdt-section-title">Time</span>
      </div>
      <div class="pdt-time-body">
        ${timeBodyHTML(10, 0, is12)}
        ${modeToggleHTML()}
      </div>
      <div class="timer-body">
        ${clockFaceHTML()}
      </div>
    </div>`;

  // NEW: timer body HTML (scroll columns) for dateTime timer mode
  const renderTimerHTML = (hour, minute, is12, ampm='AM') => {
    const col = (field, val) => `
      <div class="timer-row">
        <button class="timer-step-btn" data-field="${field}" data-dir="1">▲</button>
        <span class="timer-val" data-val="${field}">${val}</span>
        <button class="timer-step-btn" data-field="${field}" data-dir="-1">▼</button>
      </div>`;
    return `
      <div class="timer-body">
        ${col('hour',hour)}<div class="timer-colon-sep">:</div>${col('min',minute)}
        ${is12?`<div class="timer-colon-sep"></div>${col('ampm',ampm)}`:''}
      </div>`;
  };

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // MODULE 5 · calGrid.js
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const renderCalGrid = (grid, viewYear, viewMonth, selectedDate, today, minD, maxD, onPick) => {
    const firstDay=new Date(viewYear,viewMonth,1).getDay();
    const totalDays=new Date(viewYear,viewMonth+1,0).getDate();
    const prevTotal=new Date(viewYear,viewMonth,0).getDate();
    grid.innerHTML='';
    for (let i=firstDay;i>0;i--) {
      const c=document.createElement('div'); c.className='cal-day other-month'; c.textContent=prevTotal-i+1; grid.appendChild(c);
    }
    for (let d=1;d<=totalDays;d++) {
      const date=midnight(new Date(viewYear,viewMonth,d));
      const disabled=(minD&&date<minD)||(maxD&&date>maxD);
      const c=document.createElement('div');
      c.className=['cal-day',
        date.getTime()===today.getTime()&&'today',
        selectedDate&&date.getTime()===selectedDate.getTime()&&'selected',
        disabled&&'disabled'
      ].filter(Boolean).join(' ');
      c.textContent=d;
      if (!disabled) c.addEventListener('click',(e)=>{e.stopPropagation();onPick(date);});
      grid.appendChild(c);
    }
  };

  // NEW: renderDate helper for dateTime (uses .cal-month-title + .pdt-grid)
  const renderDate = (drop, sel, today, minD, maxD, vm, vy, onPick) => {
    drop.querySelector('.cal-month-title').textContent = `${MONTHS_LONG[vm]} ${vy}`;
    renderCalGrid(drop.querySelector('.pdt-grid'), vy, vm, sel, today, minD, maxD, onPick);
  };

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // MODULE 6 · clockFace.js
  // UPDATED: updateClockDisplay now uses input .value (not .textContent)
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
    const face=drop.querySelector('.tp-clock-face');
    const handEl=drop.querySelector('.tp-clock-hand');
    const numbersEl=drop.querySelector('.tp-numbers');
    if (!face) return;
    handEl.style.transform=`rotate(${mode==='hour'?hour*30:minute*6}deg)`;
    handEl.style.height=mode==='hour'?'38%':'43%';
    numbersEl.innerHTML='';
    const size=face.offsetWidth||240, cx=size/2, cy=size/2, r=size*0.38;
    for (let i=1;i<=12;i++) {
      const rad=(i*30-90)*(Math.PI/180);
      const node=document.createElement('div'); node.className='tp-number';
      node.style.left=`${cx+r*Math.cos(rad)}px`; node.style.top=`${cy+r*Math.sin(rad)}px`;
      const isHour=mode==='hour';
      node.textContent=isHour?i:((i*5)%60===0?'00':(i*5)%60);
      if (isHour?i===hour:(i*5)%60===minute) node.classList.add('active');
      numbersEl.appendChild(node);
    }
  };

  const getClockAngle = (e, face) => {
    const rect=face.getBoundingClientRect();
    const cx=rect.left+rect.width/2, cy=rect.top+rect.height/2;
    const px=e.touches?e.touches[0].clientX:e.clientX, py=e.touches?e.touches[0].clientY:e.clientY;
    let a=Math.atan2(py-cy,px-cx)*(180/Math.PI)+90; if (a<0) a+=360; return a;
  };

  const angleToTime = (angle, mode) => {
    if (mode==='hour'){let h=Math.round(angle/30);if(h===0)h=12;if(h>12)h=12;return h;}
    return Math.round(angle/6)%60;
  };

  const bindClockDrag = (drop, getMode, onUpdate, onRelease) => {
    const face=drop.querySelector('.tp-clock-face');
    const onMove=(e)=>{const a=getClockAngle(e,face);onUpdate(angleToTime(a,getMode()),getMode());};
    const onUp=()=>{
      window.removeEventListener('mousemove',onMove); window.removeEventListener('mouseup',onUp);
      window.removeEventListener('touchmove',onMove); window.removeEventListener('touchend',onUp);
      if (onRelease) onRelease(getMode());
    };
    face.addEventListener('mousedown',(e)=>{onMove(e);window.addEventListener('mousemove',onMove);window.addEventListener('mouseup',onUp);});
    face.addEventListener('touchstart',(e)=>{e.preventDefault();onMove(e);window.addEventListener('touchmove',onMove,{passive:false});window.addEventListener('touchend',onUp);},{passive:false});
  };

  // UPDATED: uses input .value instead of textContent (inputs in header)
  const updateClockDisplay = (drop, mode, hour, minute, isAM, is12) => {
    const hIn=drop.querySelector('[data-part="hour"]');
    const mIn=drop.querySelector('[data-part="min"]');
    if (hIn) { hIn.value=pad(hour); hIn.classList.toggle('tp-dim',mode!=='hour'); }
    if (mIn) { mIn.value=pad(minute); mIn.classList.toggle('tp-dim',mode!=='minute'); }
    drop.querySelectorAll('.tp-mode-btn').forEach((b)=>b.classList.toggle('active',b.dataset.mode===mode));
    if (is12) drop.querySelectorAll('.tp-ampm-btn').forEach((b)=>b.classList.toggle('active',(b.dataset.ampm==='am')===isAM));
  };

  const clockHeaderHTML = (label) => timeHeaderHTML(label, 10, '00', true, modeToggleHTML(), 'hh:mm');

  const bindClockControls = (drop, is12, getMode, setMode, setAM, render) => {
    drop.querySelectorAll('.tp-mode-btn').forEach((b)=>b.addEventListener('click',(e)=>{e.stopPropagation();setMode(b.dataset.mode);render();}));
    if (is12) drop.querySelectorAll('.tp-ampm-btn').forEach((b)=>b.addEventListener('click',(e)=>{e.stopPropagation();setAM(b.dataset.ampm==='am');render();}));
  };

  // NEW: shared input editing handler for clock/timer inputs
  const bindTimeInputs = (drop, is12, getHour, setHour, getMinute, setMinute, render) => {
    drop.querySelectorAll('input[data-part=hour],input[data-part=min]').forEach(inp =>
      ['focusout','keyup'].forEach(ev => inp.addEventListener(ev, (e) => {
        if (e.type==='keyup'&&e.key!=='Enter') return;
        e.stopPropagation();
        const val=parseInt(e.currentTarget.value), field=e.currentTarget.dataset.part;
        const [mn,mx]=is12?[1,12]:[0,23];
        if (field==='hour') setHour(val>mx?mn:val<mn?mx:val);
        else if (field==='min') setMinute((val+60)%60);
        render();
      }))
    );
  };

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // MODULE 7 · calendar()
  // UPDATED: uses dateHeaderHTML instead of inline html
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  function calendar(options) {
    const cfg=Object.assign({selector:'',format:DEFAULT_DATE_FORMAT,min:null,max:null,onChange:null},options);
    const input=document.querySelector(cfg.selector);
    if (!input){console.warn('pickr.calendar: not found:',cfg.selector);return;}
    const minD=cfg.min?midnight(cfg.min):null, maxD=cfg.max?midnight(cfg.max):null;
    const isDefault=cfg.format===DEFAULT_DATE_FORMAT, today=midnight(new Date());
    let sel=parseDateTime(input.value,cfg.format)??today;
    let vm=sel.getMonth(), vy=sel.getFullYear();
    const drop=createDropdown(input,'pickr-calendar');
    drop.innerHTML=`
      ${dateHeaderHTML('Selected Date','—','')}
      ${navRowHTML()}
      <div class="cal-grid-wrap">${dowRowHTML()}<div class="cal-days-grid pickr-grid"></div></div>
      ${footerHTML('Cancel','Set Date')}`;
    const render=()=>{
      drop.querySelector('.pickr-nav-title').textContent=`${MONTHS_LONG[vm]} ${vy}`;
      drop.querySelector('.pickr-hd').textContent=sel?formatValue(sel,isDefault?'MMM dd':cfg.format):'—';
      drop.querySelector('.pickr-hy').textContent=sel&&isDefault?formatValue(sel,'yyyy'):'';
      renderCalGrid(drop.querySelector('.pickr-grid'),vy,vm,sel,today,minD,maxD,(d)=>{sel=d;render();});
    };
    bindNavButtons(drop,'',(dir)=>{vm+=dir;if(vm>11){vm=0;vy++;}if(vm<0){vm=11;vy--;}render();});
    bindFooter(drop,()=>drop.classList.remove('open'),()=>{if(sel){input.value=formatValue(sel,cfg.format);if(cfg.onChange)cfg.onChange(sel);}drop.classList.remove('open');});
    bindInputToggle(input,drop,render);
    onClickOutside(input,drop,()=>drop.classList.remove('open'));
    render();
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // MODULE 8 · dateRange()
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  function dateRange(options) {
    const cfg=Object.assign({selector:'',format:DEFAULT_DATE_FORMAT,min:null,max:null,onChange:null},options);
    const input=document.querySelector(cfg.selector);
    if (!input){console.warn('pickr.dateRange: not found:',cfg.selector);return;}
    const minD=cfg.min?midnight(cfg.min):null, maxD=cfg.max?midnight(cfg.max):null;
    const isDefault=cfg.format===DEFAULT_DATE_FORMAT, today=midnight(new Date());
    const {start,end}=splitRangeValue(input.value);
    let startDate=parseDateTime(start,cfg.format)??null;
    let endDate=parseDateTime(end,cfg.format)??null;
    let hoverDate=null;
    let vm=(startDate??today).getMonth(), vy=(startDate??today).getFullYear();
    const drop=createDropdown(input,'pickr-range');
    const dispFmt=isDefault?'MMM dd':cfg.format;
    drop.innerHTML=`
      ${rangeHeaderHTML()}
      ${navRowHTML()}
      <div class="cal-grid-wrap">${dowRowHTML()}<div class="rp-days-grid rp-grid"></div></div>
      ${footerHTML('Cancel','Apply Range')}`;
    const render=()=>{
      drop.querySelector('.pickr-nav-title').textContent=`${MONTHS_LONG[vm]} ${vy}`;
      drop.querySelector('.rp-start-val').textContent=startDate?formatValue(startDate,dispFmt):'—';
      drop.querySelector('.rp-end-val').textContent=endDate?formatValue(endDate,dispFmt):'—';
      drop.querySelector('.rp-start-slot').classList.toggle('active',!!startDate&&!endDate);
      drop.querySelector('.rp-end-slot').classList.toggle('active',!!endDate);
      const grid=drop.querySelector('.rp-grid');
      const firstDay=new Date(vy,vm,1).getDay(), totalDays=new Date(vy,vm+1,0).getDate(), prevTotal=new Date(vy,vm,0).getDate();
      grid.innerHTML='';
      for(let i=firstDay;i>0;i--){const c=document.createElement('div');c.className='rp-day other-month';c.textContent=prevTotal-i+1;grid.appendChild(c);}
      for(let d=1;d<=totalDays;d++){
        const date=midnight(new Date(vy,vm,d));
        const disabled=(minD&&date<minD)||(maxD&&date>maxD);
        const effEnd=endDate||hoverDate;
        const isStart=startDate&&date.getTime()===startDate.getTime();
        const isEnd=endDate&&date.getTime()===endDate.getTime();
        const isHov=hoverDate&&!endDate&&date.getTime()===hoverDate.getTime();
        const c=document.createElement('div');
        c.className=['rp-day',
          date.getTime()===today.getTime()&&'today',
          isStart&&'rp-start', isEnd&&'rp-end',
          (isHov&&startDate)&&'rp-hover-end',
          (startDate&&effEnd&&date>startDate&&date<effEnd)&&'rp-in-range',
          (isStart&&effEnd)&&'rp-range-left',
          ((isEnd||isHov)&&startDate)&&'rp-range-right',
          disabled&&'disabled'
        ].filter(Boolean).join(' ');
        c.textContent=d;
        if(!disabled){
          c.addEventListener('click',(e)=>{
            e.stopPropagation();
            if(!startDate||(startDate&&endDate)){startDate=date;endDate=null;}
            else if(date<startDate){endDate=startDate;startDate=date;}
            else if(date.getTime()===startDate.getTime()){startDate=null;endDate=null;}
            else{endDate=date;}
            render();
          });
          c.addEventListener('mouseenter',()=>{hoverDate=date;render();});
          c.addEventListener('mouseleave',()=>{hoverDate=null;render();});
        }
        grid.appendChild(c);
      }
    };
    bindNavButtons(drop,'',(dir)=>{vm+=dir;if(vm>11){vm=0;vy++;}if(vm<0){vm=11;vy--;}render();});
    bindFooter(drop,()=>drop.classList.remove('open'),()=>{if(!startDate)return;const e=endDate||startDate;input.value=`${formatValue(startDate,cfg.format)}  ${RANGE_SPLITTER}  ${formatValue(e,cfg.format)}`;if(cfg.onChange)cfg.onChange({start:startDate,end:e});drop.classList.remove('open');});
    bindInputToggle(input,drop,render);
    onClickOutside(input,drop,()=>drop.classList.remove('open'));
    render();
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // MODULE 9 · clock()
  // UPDATED: header now uses <input> fields; supports direct typing
  //          setInputValue respects format double-digit tokens
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  function clock(options) {
    const cfg=Object.assign({selector:'',format:DEFAULT_TIME_FORMAT_12,onChange:null,interval:DEFAULT_INTERVAL},options);
    const input=document.querySelector(cfg.selector);
    if (!input){console.warn('pickr.clock: not found:',cfg.selector);return;}
    const is12=true;
    const setInputValue=(h,m,am)=>{
      const hv=IsDoubleDigit(cfg.format,'hh')?pad(h):h;
      const mv=IsDoubleDigit(cfg.format,'mm')?pad(m):m;
      return Is12(cfg.format)?`${hv}:${mv} ${am?'AM':'PM'}`:am?`${hv}:${mv}`:`${(12+h)===24?0:12+h}:${mv}`;
    };
    let mode='hour', hour=10, minute=30, isAM=true;
    const drop=createDropdown(input,'pickr-clock');
    drop.innerHTML=clockHeaderHTML('Select Time')+clockFaceHTML()+footerHTML('Cancel','Set Time');
    const render=()=>{updateClockDisplay(drop,mode,hour,minute,isAM,is12);renderClockFace(drop,mode,hour,minute);};
    bindClockControls(drop,is12,()=>mode,(m)=>{mode=m;},(a)=>{isAM=a;},render);
    bindClockDrag(drop,()=>mode,(v,m)=>{if(m==='hour')hour=v;else minute=v;render();},(m)=>{if(m==='hour')setTimeout(()=>{mode='minute';render();},250);});
    bindTimeInputs(drop,is12,()=>hour,(h)=>{hour=h;},()=>minute,(m)=>{minute=m;},render);
    bindFooter(drop,()=>drop.classList.remove('open'),()=>{input.value=setInputValue(hour,minute,isAM);if(cfg.onChange)cfg.onChange({hour,minute,isAM});drop.classList.remove('open');});
    bindInputToggle(input,drop,render);
    onClickOutside(input,drop,()=>drop.classList.remove('open'));
    render();
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // MODULE 10 · timer()
  // UPDATED: header uses <input> fields; interval option respected;
  //          supports direct typing in inputs; setInputValue uses format
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  function timer(options) {
    const cfg=Object.assign({selector:'',format:DEFAULT_TIME_FORMAT_12,onChange:null,interval:DEFAULT_INTERVAL},options);
    const input=document.querySelector(cfg.selector);
    if (!input){console.warn('pickr.timer: not found:',cfg.selector);return;}
    const is12=Is12(cfg.format);
    let hour=12, minute=0, isAM=true;
    const setInputValue=(h,m,am)=>{
      const hv=IsDoubleDigit(cfg.format,'hh')?pad(h):h;
      const mv=IsDoubleDigit(cfg.format,'mm')?pad(m):m;
      return is12?`${hv}:${mv} ${am?'AM':'PM'}`:`${hv}:${mv}`;
    };
    const col=(field,val,interval)=>`
      <div class="timer-row">
        <button class="timer-step-btn" data-field="${field}" data-dir="${interval}">▲</button>
        <span class="timer-val" data-val="${field}">${val}</span>
        <button class="timer-step-btn" data-field="${field}" data-dir="-${interval}">▼</button>
      </div>`;
    const drop=createDropdown(input,'pickr-timer');
    drop.innerHTML=`
      ${timeHeaderHTML('Set Time',hour,minute,is12,'',cfg.format)}
      <div class="timer-body">
        ${col('hour',hour,1)}<div class="timer-colon-sep">:</div>${col('min',minute,cfg.interval)}
        ${is12?`<div class="timer-colon-sep"></div>${col('ampm','AM',1)}`:''}
      </div>
      ${footerHTML('Cancel','Set Time')}`;
    const render=()=>{
      drop.querySelector('[data-part="hour"]').value=drop.querySelector('[data-val="hour"]').textContent=IsDoubleDigit(cfg.format,'hh')?pad(hour):hour;
      drop.querySelector('[data-part="min"]').value=drop.querySelector('[data-val="min"]').textContent=IsDoubleDigit(cfg.format,'mm')?pad(minute):minute;
      const ap=drop.querySelector('[data-val="ampm"]'); if(ap)ap.textContent=isAM?'AM':'PM';
      if(is12)drop.querySelectorAll('.tp-ampm-btn').forEach(b=>b.classList.toggle('active',(b.dataset.ampm==='am')===isAM));
    };
    drop.querySelectorAll('.timer-step-btn').forEach(btn=>btn.addEventListener('click',(e)=>{
      e.stopPropagation(); const dir=parseInt(btn.dataset.dir);
      if(btn.dataset.field==='hour'){const[mn,mx]=is12?[1,12]:[0,23];hour=hour+dir>mx?mn:hour+dir<mn?mx:hour+dir;}
      else if(btn.dataset.field==='min'){minute=(minute+dir+60)%60;}
      else if(btn.dataset.field==='ampm'){isAM=!isAM;}
      render();
    }));
    bindTimeInputs(drop,is12,()=>hour,(h)=>{hour=h;},()=>minute,(m)=>{minute=m;},render);
    if(is12)drop.querySelectorAll('.tp-ampm-btn').forEach(b=>b.addEventListener('click',(e)=>{e.stopPropagation();isAM=b.dataset.ampm==='am';render();}));
    bindFooter(drop,()=>drop.classList.remove('open'),()=>{input.value=setInputValue(hour,minute,isAM);if(cfg.onChange)cfg.onChange({hour,minute,isAM});drop.classList.remove('open');});
    bindInputToggle(input,drop,render);
    onClickOutside(input,drop,()=>drop.classList.remove('open'));
    render();
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // MODULE 11 · dateTime()
  // UPDATED: compact dropdown, time:'clock'|'timer' option,
  //          purple summary header, separated cal + time sections,
  //          createStepper used for timer mode
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  function dateTime(options) {
    const cfg=Object.assign({
      selector:'', dateFormat:DEFAULT_DATE_FORMAT, timeFormat:DEFAULT_TIME_FORMAT_12,
      min:null, max:null, time:'clock', onChange:null,
    },options);
    const input=document.querySelector(cfg.selector);
    if (!input){console.warn('pickr.dateTime: not found:',cfg.selector);return;}
    const is12=cfg.timeFormat==='12';
    const isClock=cfg.time==='clock';
    const minD=cfg.min?midnight(cfg.min):null, maxD=cfg.max?midnight(cfg.max):null;
    const today=midnight(new Date());
    let sel=parseDateTime(input.value,cfg.dateFormat)??today;
    let vm=sel.getMonth(), vy=sel.getFullYear();
    let mode='hour', hour=10, minute=0, isAM=true;

    const drop=createDropdown(input,'pickr-datetime');
    drop.innerHTML=`
      <div class="pdt-header">
        <div class="pdt-header-label">Date &amp; Time</div>
        <div class="pdt-summary">
          <span class="pdt-sum-date">—</span>
          <span class="pdt-sum-sep">·</span>
          <span class="pdt-sum-time">—</span>
        </div>
      </div>
      ${renderCalendarHTML()}
      ${isClock ? renderClockHTML(is12) : renderTimerHTML(hour,minute,is12,isAM?'AM':'PM')}
      ${footerHTML('Cancel','Set DateTime')}`;

    const sumDate=drop.querySelector('.pdt-sum-date');
    const sumTime=drop.querySelector('.pdt-sum-time');

    const updateSummary=()=>{
      sumDate.textContent=sel?formatValue(sel,cfg.dateFormat):'—';
      sumTime.textContent=is12?`${pad(hour)}:${pad(minute)} ${isAM?'AM':'PM'}`:`${pad(hour)}:${pad(minute)}`;
    };

    const render=()=>{
      renderDate(drop,sel,today,minD,maxD,vm,vy,(d)=>{sel=d;render();});
      if(isClock){
        renderClockFace(drop,mode,hour,minute);
        changeMode(drop,mode);
        if(is12)changeAmpm(drop,isAM);
        changeInput(drop,mode,hour,minute,'hh:mm');
      }
      updateSummary();
    };

    if(isClock){
      drop.querySelectorAll('.tp-mode-btn').forEach(b=>b.addEventListener('click',(e)=>{e.stopPropagation();mode=b.dataset.mode;render();}));
      if(is12)drop.querySelectorAll('.tp-ampm-btn').forEach(b=>b.addEventListener('click',(e)=>{e.stopPropagation();isAM=b.dataset.ampm==='am';render();}));
      const face=drop.querySelector('.tp-clock-face');
      const getAngle=(e)=>{const rect=face.getBoundingClientRect();const cx=rect.left+rect.width/2,cy=rect.top+rect.height/2;const px=e.touches?e.touches[0].clientX:e.clientX,py=e.touches?e.touches[0].clientY:e.clientY;let a=Math.atan2(py-cy,px-cx)*(180/Math.PI)+90;if(a<0)a+=360;return a;};
      const applyAngle=(a)=>{if(mode==='hour'){let h=Math.round(a/30);if(h===0)h=12;if(h>12)h=12;hour=h;}else minute=Math.round(a/6)%60;render();};
      const onMove=(e)=>{e.preventDefault();applyAngle(getAngle(e));};
      const onUp=()=>{window.removeEventListener('mousemove',onMove);window.removeEventListener('mouseup',onUp);window.removeEventListener('touchmove',onMove);window.removeEventListener('touchend',onUp);if(mode==='hour')setTimeout(()=>{mode='minute';render();},280);};
      face.addEventListener('mousedown',(e)=>{applyAngle(getAngle(e));window.addEventListener('mousemove',onMove);window.addEventListener('mouseup',onUp);});
      face.addEventListener('touchstart',(e)=>{e.preventDefault();applyAngle(getAngle(e));window.addEventListener('touchmove',onMove,{passive:false});window.addEventListener('touchend',onUp);},{passive:false});
      bindTimeInputs(drop,is12,()=>hour,(h)=>{hour=h;},()=>minute,(m)=>{minute=m;},render);
    } else {
      // Timer mode — createStepper pattern
      const hourDigit=drop.querySelector('span[data-val=hour]');
      const minDigit=drop.querySelector('span[data-val=min]');
      const ampmEl=drop.querySelector('span[data-val=ampm]');
      const updateAMPM=()=>{isAM=!isAM;if(ampmEl)ampmEl.textContent=isAM?'AM':'PM';render();};
      const updateHour=createStepper({value:hour,min:is12?1:0,max:is12?12:23,display:hourDigit,onOverflow:is12?updateAMPM:null,onUnderflow:is12?updateAMPM:null,onshow:(h)=>{hour=parseInt(h);render();}});
      const updateMinute=createStepper({value:minute,min:0,max:59,display:minDigit,onOverflow:()=>updateHour(1),onUnderflow:()=>updateHour(-1),formatter:v=>String(v).padStart(2,'0'),onshow:(m)=>{minute=parseInt(m);render();}});
      drop.querySelectorAll('button[data-field=hour]').forEach(e=>bindStepEvent(e,updateHour));
      drop.querySelectorAll('button[data-field=min]').forEach(e=>bindStepEvent(e,updateMinute));
      if(is12){
        drop.querySelectorAll('button[data-field=ampm]').forEach(e=>bindStepEvent(e,()=>updateAMPM()));
        if(ampmEl)bindStepEvent(ampmEl,()=>updateAMPM());
      }
    }

    bindNavButtons(drop,'',(dir)=>{vm+=dir;if(vm>11){vm=0;vy++;}if(vm<0){vm=11;vy--;}render();});
    bindFooter(drop,()=>drop.classList.remove('open'),()=>{
      if(!sel)return;
      const t=is12?`${pad(hour)}:${pad(minute)} ${isAM?'AM':'PM'}`:`${pad(hour)}:${pad(minute)}`;
      input.value=`${formatValue(sel,cfg.dateFormat)}  ${t}`;
      if(cfg.onChange)cfg.onChange({date:sel,hour,minute,isAM});
      drop.classList.remove('open');
    });
    bindInputToggle(input,drop,render);
    onClickOutside(input,drop,()=>drop.classList.remove('open'));
    render();
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // MODULE 12 · export — dual API
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  function pickr(selector) {
    if (typeof selector === 'string') {
      return {
        calendar : (o) => calendar ({ ...o, selector }),
        dateRange: (o) => dateRange({ ...o, selector }),
        dateTime : (o) => dateTime ({ ...o, selector }),
        clock    : (o) => clock    ({ ...o, selector }),
        timer    : (o) => timer    ({ ...o, selector }),
      };
    }
    console.warn('pickr: pass a CSS selector string, e.g. pickr("#el")');
  }
  pickr.calendar  = calendar;
  pickr.dateRange = dateRange;
  pickr.dateTime  = dateTime;
  pickr.clock     = clock;
  pickr.timer     = timer;
  window.pickr    = pickr;

})(window);