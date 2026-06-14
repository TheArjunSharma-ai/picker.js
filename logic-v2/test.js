function bindNumericInput(input, {
    min = 0,
    max = 999,
    range = [],
    onChange = null
} = {}) {

    const allowedKeys = ['Backspace','Delete','ArrowLeft','ArrowRight','Tab','Enter'];

    // input.addEventListener('keydown', e => {

    //     if (allowedKeys.includes(e.key))
    //         return;

    //     if (!/^\d$/.test(e.key))
    //         e.preventDefault();
    // });

    input.addEventListener('input', e => {
        if (allowedKeys.includes(e.key))
            return;

        if (!/^\d$/.test(e.key))
            e.preventDefault();
        let value = e.target.value.replace(/\D/g, '');

        if (value !== '') {

            let num = parseInt(value, 10);

            if (num > max) num = max;
            if (num < min) num = min;

            value = num;
        }

        e.target.value = value;
    });

    const applyValue = e => {

        let value = parseInt(e.target.value, 10);

        if (isNaN(value))
            value = min;

        value = Math.max(min, Math.min(max, value));

        e.target.value = value;

        if (typeof onChange === 'function')
            onChange(value, e.target);
    };

    input.addEventListener('focusout', applyValue);

    input.addEventListener('keyup', e => {
        if (e.key === 'Enter')
            applyValue(e);
    });
}
function createDataList(id, values) {

    const dl = document.createElement('datalist');
    dl.id = id;

    values.forEach(v => {
        const option = document.createElement('option');
        option.value = v;
        dl.appendChild(option);
    });

    document.body.appendChild(dl);

    return id;
}
function setupAutocomplete(inputSelector, data, options = {}, onselectedCallback) {
    const listClass = options.listClass || 'autocomplete-list';
    const itemClass = options.itemClass || 'autocomplete-item';
    const activeClass = options.activeClass || 'active'; // Class for highlighting active item
    const renderText = options.renderText || 'label';
    const hidefunction = options.hideList;

    const $input = $(inputSelector);
    const $list = $('<div>').addClass(listClass).hide();
    $input.after($list);

    let currentIndex = -1;
    let filteredData = [];

    function renderList() {
        $list.empty();
        filteredData.forEach((item, index) => {
            const label = typeof item === "string" ? item : item[renderText];
            const hiddenId = typeof item === "string" ? null : item.hiddenId;

            const $item = $('<div>')
                .addClass(itemClass)
                .toggleClass(activeClass, index === currentIndex)
                .text(label)
                .on('click', function () {
                    selectItem(index);
                });

            $list.append($item);
        });
    }
    function hideList() {
        if (typeof hidefunction === 'function') {
            hidefunction();
        }
        $list.empty().hide();
    }
    function selectItem(index) {
        if (index >= 0 && index < filteredData.length) {
            const item = filteredData[index];
            const label = typeof item === "string" ? item : item[renderText];
            const hiddenId = typeof item === "string" ? null : item.hiddenId;

            $input.val(label);
            hideList();
            if (typeof onselectedCallback === 'function') {
                onselectedCallback({ label, hiddenId });
            }
        }
    }

    $input.on('input', debounce(async function () {
        const query = $input.val().toLowerCase();
        currentIndex = -1;

        if (query === '' || data == null) {
            hideList();
            return;
        }
        if (typeof data === 'function') {
            filteredData = await data(query);
            if (filteredData && filteredData.length > 0) {
                renderList();
                $list.show();
            } else {
                hideList();
            }
            return;
        }
        filteredData = data.filter(item => {
            const label = typeof item === "string" ? item : item.label;
            return label.toLowerCase().includes(query);
        });

        if (filteredData && filteredData.length > 0) {
            renderList();
            $list.show();
        } else {
            hideList();
        }
    }, 300));

    $input.on('keydown', function (e) {
        if (!$list.is(':visible')) return;

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            currentIndex = (currentIndex + 1) % filteredData.length;
            renderList();
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            currentIndex = (currentIndex - 1 + filteredData.length) % filteredData.length;
            renderList();
        } else if (e.key === 'Enter') {
            e.preventDefault();
            selectItem(currentIndex);
        }
    });

    $(document).on('click', function (e) {
        if (!$(e.target).closest(inputSelector).length && !$(e.target).closest($list).length) {
            hideList();
        }
    });
}
const id = createDataList(
    'hours24',
    Array.from({ length: 24 }, (_, i) => i)
);

hourInput.setAttribute('list', id);

"use strict";

// ─── Constants ──────────────────────────────────────────────────────────
const MONTHS_LONG  = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const MONTHS_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const DAYS         = ['S','M','T','W','T','F','S'];

// ─── State ──────────────────────────────────────────────────────────────
const today        = new Date(); today.setHours(0,0,0,0);
let selectedDate   = new Date(today);
let viewMonth      = today.getMonth();
let viewYear       = today.getFullYear();

let clockMode      = 'hour';   // 'hour' | 'minute'
let selHour        = 10;
let selMinute      = 0;
let isAM           = true;

// ─── DOM refs ────────────────────────────────────────────────────────────
const $ = (id) => document.getElementById(id);

const summaryDate  = $('summary-date');
const summaryTime  = $('summary-time');
const monthLabel   = $('month-label');
const daysGrid     = $('days-grid');
const dowRow       = $('dow-row');

const dispHour     = $('disp-hour');
const dispMin      = $('disp-min');
const btnAM        = $('btn-am');
const btnPM        = $('btn-pm');
const modeHour     = $('mode-hour');
const modeMin      = $('mode-min');
const clockFace    = $('clock-face');
const clockHand    = $('clock-hand');
const clockNums    = $('clock-nums');

// ─── Helpers ────────────────────────────────────────────────────────────
const pad      = (v) => String(v).padStart(2,'0');
const midnight = (d) => { const x=new Date(d); x.setHours(0,0,0,0); return x; };

// ─── Summary bar update ─────────────────────────────────────────────────
function updateSummary() {
  summaryDate.textContent = selectedDate
    ? `${MONTHS_SHORT[selectedDate.getMonth()]} ${selectedDate.getDate()}, ${selectedDate.getFullYear()}`
    : '—';
  summaryTime.textContent = `${pad(selHour)}:${pad(selMinute)} ${isAM?'AM':'PM'}`;
}

// ═══════════════════════════════════════════════════════════════════════
// CALENDAR
// ═══════════════════════════════════════════════════════════════════════

// Build day-of-week header once
function buildDowRow() {
  DAYS.forEach((d) => {
    const el = document.createElement('div');
    el.className   = 'appt-dow';
    el.textContent = d;
    dowRow.appendChild(el);
  });
}

// Render calendar grid for current viewMonth/viewYear
function renderCalendar() {
  monthLabel.textContent = `${MONTHS_LONG[viewMonth]} ${viewYear}`;
  daysGrid.innerHTML = '';

  const firstDay  = new Date(viewYear, viewMonth, 1).getDay();
  const totalDays = new Date(viewYear, viewMonth + 1, 0).getDate();
  const prevTotal = new Date(viewYear, viewMonth, 0).getDate();

  // Trailing days of previous month
  for (let i = firstDay; i > 0; i--) {
    appendDay(prevTotal - i + 1, ['appt-day','appt-day--other'], null);
  }

  // Days of this month
  for (let d = 1; d <= totalDays; d++) {
    const date     = midnight(new Date(viewYear, viewMonth, d));
    const isToday  = date.getTime() === today.getTime();
    const isSel    = selectedDate && date.getTime() === selectedDate.getTime();

    const cls = ['appt-day'];
    if (isToday) cls.push('appt-day--today');
    if (isSel)   cls.push('appt-day--selected');

    appendDay(d, cls, () => {
      selectedDate = date;
      renderCalendar();
      updateSummary();
    });
  }
}

function appendDay(label, classes, onClick) {
  const el = document.createElement('div');
  el.className   = classes.join(' ');
  el.textContent = label;
  if (onClick) el.addEventListener('click', (e) => { e.stopPropagation(); onClick(); });
  daysGrid.appendChild(el);
}

// Month navigation
function changeMonth(dir) {
  viewMonth += dir;
  if (viewMonth > 11) { viewMonth = 0; viewYear++; }
  if (viewMonth < 0)  { viewMonth = 11; viewYear--; }
  renderCalendar();
}

$('prev-month').addEventListener('click', () => changeMonth(-1));
$('next-month').addEventListener('click', () => changeMonth(1));

// ═══════════════════════════════════════════════════════════════════════
// CLOCK
// ═══════════════════════════════════════════════════════════════════════

// Update digital display and rotate hand
function updateClockDisplay() {
  dispHour.textContent = pad(selHour);
  dispMin.textContent  = pad(selMinute);

  // Active digit highlight
  dispHour.classList.toggle('appt-digit--active', clockMode === 'hour');
  dispMin.classList.toggle('appt-digit--active',  clockMode === 'minute');

  // Rotate hand
  const angle = clockMode === 'hour' ? selHour * 30 : selMinute * 6;
  clockHand.style.transform = `rotate(${angle}deg)`;
  clockHand.style.height    = clockMode === 'hour' ? '38%' : '43%';

  // Mode button styles
  modeHour.classList.toggle('appt-mode-btn--active', clockMode === 'hour');
  modeMin.classList.toggle('appt-mode-btn--active',  clockMode === 'minute');

  // AM/PM buttons
  btnAM.classList.toggle('appt-ampm-btn--active',  isAM);
  btnPM.classList.toggle('appt-ampm-btn--active', !isAM);

  updateSummary();
  renderClockNumbers();
}

// Render number nodes around the clock face
function renderClockNumbers() {
  clockNums.innerHTML = '';
  const size   = clockFace.offsetWidth || 280;
  const cx     = size / 2;
  const cy     = size / 2;
  const radius = size * 0.39;

  for (let i = 1; i <= 12; i++) {
    const rad  = (i * 30 - 90) * (Math.PI / 180);
    const x    = cx + radius * Math.cos(rad);
    const y    = cy + radius * Math.sin(rad);

    const node = document.createElement('div');
    node.className = 'appt-clock-num';
    node.style.left = `${x}px`;
    node.style.top  = `${y}px`;

    const isHour = clockMode === 'hour';
    node.textContent = isHour ? i : ((i * 5) % 60 === 0 ? '00' : (i * 5) % 60);

    const isActive = isHour
      ? i === selHour
      : (i * 5) % 60 === selMinute;

    if (isActive) node.classList.add('appt-clock-num--active');
    clockNums.appendChild(node);
  }
}

// Convert pointer position to angle, then snap to hour or minute
function handleClockPointer(e) {
  const rect = clockFace.getBoundingClientRect();
  const cx   = rect.left + rect.width  / 2;
  const cy   = rect.top  + rect.height / 2;
  const px   = e.touches ? e.touches[0].clientX : e.clientX;
  const py   = e.touches ? e.touches[0].clientY : e.clientY;
  let angle  = Math.atan2(py - cy, px - cx) * (180 / Math.PI) + 90;
  if (angle < 0) angle += 360;

  if (clockMode === 'hour') {
    let h = Math.round(angle / 30);
    if (h === 0) h = 12;
    if (h > 12)  h = 12;
    selHour = h;
  } else {
    selMinute = Math.round(angle / 6) % 60;
  }
  updateClockDisplay();
}

// Drag on the clock face
function bindClockDrag() {
  const onMove = (e) => { e.preventDefault(); handleClockPointer(e); };
  const onUp   = () => {
    window.removeEventListener('mousemove', onMove);
    window.removeEventListener('mouseup',   onUp);
    window.removeEventListener('touchmove', onMove);
    window.removeEventListener('touchend',  onUp);
    // Auto-advance hour → minute
    if (clockMode === 'hour') setTimeout(() => { clockMode = 'minute'; updateClockDisplay(); }, 300);
  };

  clockFace.addEventListener('mousedown', (e) => {
    handleClockPointer(e);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup',   onUp);
  });
  clockFace.addEventListener('touchstart', (e) => {
    handleClockPointer(e);
    window.addEventListener('touchmove', onMove, { passive: false });
    window.addEventListener('touchend',  onUp);
  }, { passive: false });
}

// Click hour digit → switch to hour mode
dispHour.addEventListener('click', () => { clockMode = 'hour';   updateClockDisplay(); });
dispMin.addEventListener('click',  () => { clockMode = 'minute'; updateClockDisplay(); });

// Mode buttons
modeHour.addEventListener('click', () => { clockMode = 'hour';   updateClockDisplay(); });
modeMin.addEventListener('click',  () => { clockMode = 'minute'; updateClockDisplay(); });

// AM / PM
btnAM.addEventListener('click', () => { isAM = true;  updateClockDisplay(); });
btnPM.addEventListener('click', () => { isAM = false; updateClockDisplay(); });

// ═══════════════════════════════════════════════════════════════════════
// CONFIRM / CANCEL
// ═══════════════════════════════════════════════════════════════════════

function onConfirm() {
  const dateStr = selectedDate
    ? `${MONTHS_SHORT[selectedDate.getMonth()]} ${selectedDate.getDate()}, ${selectedDate.getFullYear()}`
    : 'No date selected';
  const timeStr = `${pad(selHour)}:${pad(selMinute)} ${isAM?'AM':'PM'}`;
  alert(`Appointment confirmed!\n\n📅 ${dateStr}\n🕐 ${timeStr}`);
}

function onCancel() {
  if (confirm('Cancel appointment selection?')) {
    selectedDate = new Date(today);
    viewMonth    = today.getMonth();
    viewYear     = today.getFullYear();
    selHour = 10; selMinute = 0; isAM = true; clockMode = 'hour';
    renderCalendar();
    updateClockDisplay();
  }
}

['header-confirm','header-confirm-m','footer-confirm'].forEach(id => $( id)?.addEventListener('click', onConfirm));
['header-cancel', 'header-cancel-m', 'footer-cancel' ].forEach(id => $(id)?.addEventListener('click', onCancel));

// ═══════════════════════════════════════════════════════════════════════
// INIT
// ═══════════════════════════════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', () => {
  buildDowRow();
  renderCalendar();
  bindClockDrag();
  updateClockDisplay();
});