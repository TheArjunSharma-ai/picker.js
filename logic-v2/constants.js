// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // MODULE 1 · constants.js
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    const ALLOWED_KEYS = ['Backspace','Delete','ArrowLeft','ArrowRight','Tab','Enter'];
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