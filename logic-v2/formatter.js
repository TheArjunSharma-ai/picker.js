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
