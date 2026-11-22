(function () {
  'use strict';

  var tesseractUrl = 'https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/tesseract.min.js';
  var pdfjsUrl = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
  var tesseractPromise = null;
  var pdfjsPromise = null;
  var weekdays = [
    { day: 1, names: ['monday', 'mon', '월요일', '월'] },
    { day: 2, names: ['tuesday', 'tue', 'tues', '화요일', '화'] },
    { day: 3, names: ['wednesday', 'wed', '수요일', '수'] },
    { day: 4, names: ['thursday', 'thu', 'thur', 'thurs', '목요일', '목'] },
    { day: 5, names: ['friday', 'fri', '금요일', '금'] },
    { day: 6, names: ['saturday', 'sat', '토요일', '토'] },
    { day: 7, names: ['sunday', 'sun', '일요일', '일'] }
  ];

  function loadScript(source, globalName) {
    if (window[globalName]) return Promise.resolve(window[globalName]);
    return new Promise(function (resolve, reject) {
      var script = document.createElement('script');
      script.src = source;
      script.async = true;
      script.onload = function () {
        if (!window[globalName]) {
          reject(new Error('The timetable reader did not load correctly.'));
          return;
        }
        resolve(window[globalName]);
      };
      script.onerror = function () {
        reject(new Error('Could not load the timetable reader. Check your internet connection and try again.'));
      };
      document.head.appendChild(script);
    });
  }

  function loadTesseract() {
    if (!tesseractPromise) {
      tesseractPromise = loadScript(tesseractUrl, 'Tesseract').catch(function (error) {
        tesseractPromise = null;
        throw error;
      });
    }
    return tesseractPromise;
  }

  function loadPdfjs() {
    if (!pdfjsPromise) {
      pdfjsPromise = loadScript(pdfjsUrl, 'pdfjsLib').catch(function (error) {
        pdfjsPromise = null;
        throw error;
      });
    }
    return pdfjsPromise;
  }

  function normalizeToken(value) {
    return String(value || '').toLowerCase().replace(/[.,:;()]/g, '').trim();
  }

  function findWeekday(text) {
    var tokens = String(text || '').toLowerCase().match(/[a-z]+|[가-힣]+/g) || [];
    for (var index = 0; index < tokens.length; index += 1) {
      var token = normalizeToken(tokens[index]);
      for (var weekdayIndex = 0; weekdayIndex < weekdays.length; weekdayIndex += 1) {
        if (weekdays[weekdayIndex].names.indexOf(token) !== -1) return weekdays[weekdayIndex].day;
      }
    }
    return null;
  }

  function parseClock(value, allowHourOnly) {
    var match = String(value || '').match(/^\s*(\d{1,2})(?:[:.](\d{2}))?\s*(a\.?m\.?|p\.?m\.?)?\s*$/i);
    if (!match) return null;
    if (match[2] === undefined && !match[3] && !allowHourOnly) return null;
    var hour = Number(match[1]);
    var minute = Number(match[2] || 0);
    var meridiem = (match[3] || '').toLowerCase().replace(/\./g, '');
    if (hour > 23 || minute > 59 || (meridiem && (hour < 1 || hour > 12))) return null;
    if (meridiem === 'pm' && hour < 12) hour += 12;
    if (meridiem === 'am' && hour === 12) hour = 0;
    return { minutes: hour * 60 + minute, value: String(hour).padStart(2, '0') + ':' + String(minute).padStart(2, '0') };
  }

  function findTimeRange(text) {
    var pattern = /(\d{1,2}(?:(?:[:.]\d{2})?)\s*(?:a\.?m\.?|p\.?m\.?)?)\s*(?:-|–|—|~|to)\s*(\d{1,2}(?:(?:[:.]\d{2})?)\s*(?:a\.?m\.?|p\.?m\.?)?)/i;
    var match = String(text || '').match(pattern);
    if (!match) return null;
    var start = parseClock(match[1], true);
    var end = parseClock(match[2], true);
    if (!start || !end || start.minutes >= end.minutes) return null;
    return { start: start, end: end, text: match[0] };
  }

  function splitLocation(text) {
    var match = text.match(/\b(?:room|rm|location)\s*[:#-]?\s*([a-z0-9-]+(?:\s+[a-z0-9-]+)?)/i);
    if (!match) return { title: text.trim(), location: '' };
    return {
      title: text.replace(match[0], '').replace(/\s{2,}/g, ' ').trim(),
      location: match[1].trim()
    };
  }

  function cleanTitle(text, day, rangeText) {
    var result = String(text || '');
    result = result.replace(/\b(?:monday|mon|tuesday|tue|tues|wednesday|wed|thursday|thu|thur|thurs|friday|fri|saturday|sat|sunday|sun)\b/ig, ' ');
    result = result.replace(/월요일|화요일|수요일|목요일|금요일|토요일|일요일|월|화|수|목|금|토|일/g, ' ');
    if (rangeText) result = result.replace(rangeText, ' ');
    var parts = splitLocation(result.replace(/[|·•]/g, ' ').replace(/\s{2,}/g, ' ').trim());
    if (day && parts.title.length > 3) return parts;
    return parts;
  }

  function makeEntry(text, day, range) {
    if (!day || !range) return null;
    var parts = cleanTitle(text, day, range.text);
    var title = parts.title.replace(/^[\s:,-]+|[\s:,-]+$/g, '').trim();
    if (title.length < 2 || /^(lunch|break|free|closed|time|day|schedule)$/i.test(title)) return null;
    return {
      courseName: title.slice(0, 100),
      dayOfWeek: day,
      startTime: range.start.value,
      endTime: range.end.value,
      location: parts.location.slice(0, 100),
      startDate: '',
      endDate: '',
      holidays: []
    };
  }

  function extractLineEntries(lines) {
    var entries = [];
    (lines || []).forEach(function (line) {
      var text = line.text || '';
      var day = findWeekday(text);
      var range = findTimeRange(text);
      var entry = makeEntry(text, day, range);
      if (entry) entries.push(entry);
    });
    return entries;
  }

  function lineCenter(line) {
    var box = line.bbox || {};
    return {
      x: (Number(box.x0 || 0) + Number(box.x1 || 0)) / 2,
      y: (Number(box.y0 || 0) + Number(box.y1 || 0)) / 2,
      height: Math.max(1, Number(box.y1 || 0) - Number(box.y0 || 0))
    };
  }

  function clusterHeaderWords(words) {
    var candidates = [];
    (words || []).forEach(function (word) {
      var day = findWeekday(word.text);
      if (!day || !word.bbox) return;
      var center = lineCenter(word);
      candidates.push({ day: day, x: center.x, y: center.y, height: center.height });
    });
    candidates.sort(function (left, right) { return left.y - right.y; });
    var best = [];
    candidates.forEach(function (candidate) {
      var cluster = candidates.filter(function (item) {
        return Math.abs(item.y - candidate.y) <= Math.max(12, candidate.height * 1.5);
      });
      var distinct = new Set(cluster.map(function (item) { return item.day; })).size;
      var bestDistinct = new Set(best.map(function (item) { return item.day; })).size;
      if (distinct > bestDistinct || (distinct === bestDistinct && cluster.length > best.length)) best = cluster;
    });
    var headerY = best.length
      ? best.reduce(function (sum, item) { return sum + item.y; }, 0) / best.length
      : Infinity;
    return { words: best, y: headerY };
  }

  function extractGridEntries(data) {
    var lines = data.lines || [];
    var header = clusterHeaderWords(data.words || []);
    if (header.words.length < 2 || !isFinite(header.y)) return [];
    var dayCenters = {};
    header.words.forEach(function (item) {
      dayCenters[item.day] = dayCenters[item.day] === undefined
        ? item.x : (dayCenters[item.day] + item.x) / 2;
    });
    var days = Object.keys(dayCenters).map(Number).sort(function (left, right) {
      return dayCenters[left] - dayCenters[right];
    });
    var boundaries = {};
    days.forEach(function (day, index) {
      var left = index === 0 ? -Infinity : (dayCenters[days[index - 1]] + dayCenters[day]) / 2;
      var right = index === days.length - 1 ? Infinity : (dayCenters[day] + dayCenters[days[index + 1]]) / 2;
      boundaries[day] = { left: left, right: right };
    });

    var minDayX = Math.min.apply(null, days.map(function (day) { return dayCenters[day]; }));
    var timeLabels = [];
    lines.forEach(function (line) {
      var center = lineCenter(line);
      var time = parseClock(line.text);
      if (time && center.x < minDayX) timeLabels.push({ y: center.y, time: time });
    });
    timeLabels.sort(function (left, right) { return left.y - right.y; });
    if (timeLabels.length < 2) return [];

    var entries = [];
    days.forEach(function (day) {
      var column = boundaries[day];
      var candidates = lines.map(function (line) {
        return { line: line, center: lineCenter(line) };
      }).filter(function (item) {
        return item.center.y > header.y + 8 &&
          item.center.x > column.left && item.center.x <= column.right &&
          !findWeekday(item.line.text) && !parseClock(item.line.text);
      }).sort(function (left, right) { return left.center.y - right.center.y; });

      var groups = [];
      candidates.forEach(function (candidate) {
        var previous = groups[groups.length - 1];
        if (previous && candidate.center.y - previous.bottom < 24) {
          previous.lines.push(candidate.line.text);
          previous.bottom = candidate.center.y;
          previous.center = (previous.center + candidate.center.y) / 2;
        } else {
          groups.push({
            lines: [candidate.line.text],
            center: candidate.center.y,
            bottom: candidate.center.y
          });
        }
      });

      groups.forEach(function (group) {
        var text = group.lines.join(' ').replace(/\s{2,}/g, ' ').trim();
        var explicitRange = findTimeRange(text);
        var range = explicitRange;
        if (!range) {
          var before = timeLabels.filter(function (item) { return item.y <= group.center; }).pop();
          var after = timeLabels.find(function (item) { return item.y > group.center; });
          if (before && after && before.time.minutes < after.time.minutes) {
            range = { start: before.time, end: after.time, text: '' };
          }
        }
        var entry = makeEntry(text, day, range);
        if (entry) entries.push(entry);
      });
    });
    return entries;
  }

  function uniqueEntries(entries) {
    var seen = new Set();
    var unique = entries.filter(function (entry) {
      var key = [
        entry.courseName.toLowerCase(),
        entry.dayOfWeek,
        entry.startTime,
        entry.endTime,
        entry.location.toLowerCase()
      ].join('|');
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
    if (unique.length > 100) {
      throw new Error('More than 100 classes were detected. Import fewer pages at a time.');
    }
    return unique;
  }

  function prepareImage(file) {
    return new Promise(function (resolve, reject) {
      var image = new Image();
      var url = URL.createObjectURL(file);
      image.onload = function () {
        URL.revokeObjectURL(url);
        var scale = Math.min(1, 2000 / image.width);
        var canvas = document.createElement('canvas');
        canvas.width = Math.round(image.width * scale);
        canvas.height = Math.round(image.height * scale);
        canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height);
        resolve(canvas);
      };
      image.onerror = function () {
        URL.revokeObjectURL(url);
        reject(new Error('This image could not be opened. Try a PNG or JPEG timetable image.'));
      };
      image.src = url;
    });
  }

  async function preparePdfPages(file, onProgress) {
    var pdfjs = await loadPdfjs();
    pdfjs.GlobalWorkerOptions.workerSrc =
      'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    var documentData = await pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()) }).promise;
    if (documentData.numPages > 5) {
      throw new Error('For performance, import a PDF with no more than 5 pages at a time.');
    }
    var pages = [];
    for (var pageNumber = 1; pageNumber <= documentData.numPages; pageNumber += 1) {
      onProgress('Preparing PDF page ' + pageNumber + ' of ' + documentData.numPages + '…');
      var page = await documentData.getPage(pageNumber);
      var baseViewport = page.getViewport({ scale: 1 });
      var viewport = page.getViewport({ scale: Math.min(2, 2000 / baseViewport.width) });
      var canvas = document.createElement('canvas');
      canvas.width = Math.ceil(viewport.width);
      canvas.height = Math.ceil(viewport.height);
      await page.render({ canvasContext: canvas.getContext('2d'), viewport: viewport }).promise;
      pages.push(canvas);
    }
    await documentData.destroy();
    return pages;
  }

  async function readTimetable(file, onProgress) {
    if (!file || file.size > 15728640) {
      throw new Error('Choose a timetable file smaller than 15 MB.');
    }
    var isPdf = file.type === 'application/pdf' || /\.pdf$/i.test(file.name);
    if (!isPdf && !file.type.startsWith('image/')) {
      throw new Error('Choose a timetable photo or PDF file.');
    }
    var pages = isPdf ? await preparePdfPages(file, onProgress) : [await prepareImage(file)];
    var tesseract = await loadTesseract();
    onProgress('Starting local OCR. The first run may download the English/Korean recognition data…');
    var worker = await tesseract.createWorker('eng+kor', 1, {
      logger: function (message) {
        if (message.status === 'recognizing text' && typeof message.progress === 'number') {
          onProgress('Reading timetable: ' + Math.round(message.progress * 100) + '%…');
        }
      }
    });
    var entries = [];
    try {
      for (var index = 0; index < pages.length; index += 1) {
        onProgress('Reading timetable page ' + (index + 1) + ' of ' + pages.length + '…');
        var result = await worker.recognize(pages[index]);
        var lineEntries = extractLineEntries(result.data.lines || []);
        entries = entries.concat(lineEntries.length ? lineEntries : extractGridEntries(result.data));
      }
    } finally {
      await worker.terminate();
    }
    return uniqueEntries(entries);
  }

  window.LandedTimetableImport = {
    read: readTimetable
  };
})();
