// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // MODULE 2 · utils.js
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    const pad = (v) => String(v).padStart(2, '0');
    const isValidDate = (d) => d instanceof Date && !Number.isNaN(d.getTime());
    const isNullOrEmpty = (v) => v == null || v === '' || v === 'null' || v === 'undefined';

    const IsDoubleDigit = (val, checker) =>
        (val + '').toLowerCase().includes((checker + '').toLowerCase())
        ;
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