
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
