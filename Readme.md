# pickr.js

Lightweight JavaScript Date, Time, DateRange, Timer, and DateTime picker library with zero dependencies.

## Features

* Calendar picker
* Date range picker
* Clock picker (12h / 24h)
* Timer picker
* DateTime picker
* Min / Max date support
* Custom date formatting
* Custom callbacks
* No external dependencies
* Lightweight and customizable

---

## Installation

Include the stylesheet and script:

```html
<link rel="stylesheet" href="pickr.css">
<script src="v4/pickr.js"></script>
```

---

## Calendar Picker

```html
<input type="text" id="date-input" readonly>
```

```javascript
pickr.calendar({
    selector: '#date-input',
    format: 'MMM dd, yyyy',
    min: new Date(),
    max: new Date(2099, 11, 31),
    onChange: date => {
        console.log(date);
    }
});
```

### Options

| Option   | Type     | Default      |
| -------- | -------- | ------------ |
| selector | string   | required     |
| format   | string   | MMM dd, yyyy |
| min      | Date     | null         |
| max      | Date     | null         |
| onChange | function | null         |

---

## Date Range Picker

```html
<input type="text" id="range-input" readonly>
```

```javascript
pickr.dateRange({
    selector: '#range-input',
    format: 'MMM dd, yyyy',
    min: new Date(),
    max: new Date(2099, 11, 31),
    onChange: ({start,end}) => {
        console.log(start,end);
    }
});
```

### Callback

```javascript
{
    start: Date,
    end: Date
}
```

---

## Clock Picker

```html
<input type="text" id="clock-input" readonly>
```

```javascript
pickr.clock({
    selector:'#clock-input',
    format:'12',
    onChange:({hour,minute,isAM})=>{
        console.log(hour,minute,isAM);
    }
});
```

### Formats

```javascript
format:'12'
format:'24'
```

---

## Timer Picker

```html
<input type="text" id="timer-input" readonly>
```

```javascript
pickr.timer({
    selector:'#timer-input',
    format:'24'
});
```

---

## DateTime Picker

```html
<input type="text" id="datetime-input" readonly>
```

```javascript
pickr.dateTime({
    selector:'#datetime-input',
    dateFormat:'MMM dd, yyyy',
    timeFormat:'12',
    min:new Date(),
    max:new Date(2099,11,31),
    onChange:({date,hour,minute,isAM})=>{
        console.log(date,hour,minute,isAM);
    }
});
```

---

## DateTime Picker (24 Hour)

```javascript
pickr.dateTime({
    selector:'#datetime-input',
    dateFormat:'MMM dd, yyyy',
    timeFormat:'24'
});
```

---

## Supported Date Tokens

| Token | Output |
| ----- | ------ |
| d     | 7      |
| dd    | 07     |
| MMM   | Jun    |
| MMMM  | June   |
| yy    | 26     |
| yyyy  | 2026   |

Example:

```javascript
'MMM dd, yyyy'
```

Output:

```text
Jun 07, 2026
```

---

## Supported Time Tokens

| Token | Output |
| ----- | ------ |
| h     | 5      |
| hh    | 05     |
| H     | 17     |
| HH    | 17     |
| mm    | 09     |
| a     | am     |
| A     | AM     |

Example:

```javascript
'hh:mm A'
```

Output:

```text
05:09 PM
```

---

## Public API

```javascript
pickr.calendar(options)

pickr.dateRange(options)

pickr.clock(options)

pickr.timer(options)

pickr.dateTime(options)
```

---

## Browser Support

* Chrome
* Edge
* Firefox
* Safari

---

## License

MIT License
