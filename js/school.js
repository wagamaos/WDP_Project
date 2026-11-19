(function () {
  'use strict';

  var deadlinesList = document.getElementById('deadline-list');
  var classesList = document.getElementById('classes-list');
  var classesCard = classesList.closest('.card');
  var grid = document.querySelector('.mini-cal-grid');
  var filter = 'all';
  var assignments = [];
  var adminDeadlines = [];
  var weekdayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  function formatDate(value) {
    if (!value) return 'Date not set';
    var date = new Date(value);
    if (isNaN(date.getTime())) return 'Date not set';
    return date.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
  }

  function daysUntil(value) {
    if (!value) return null;
    var due = new Date(value);
    if (isNaN(due.getTime())) return null;
    due.setHours(0, 0, 0, 0);
    var today = new Date();
    today.setHours(0, 0, 0, 0);
    return Math.ceil((due.getTime() - today.getTime()) / 86400000);
  }

  function createDeadline(item, category, organization) {
    var li = document.createElement('li');
    var icon = document.createElement('div');
    var info = document.createElement('div');
    var name = document.createElement('div');
    var meta = document.createElement('div');
    var badge = document.createElement('span');
    var due = daysUntil(item.dueAt);

    li.className = 'school-deadline-item';
    li.dataset.category = category;
    li.dataset.dueAt = item.dueAt || '';
    icon.className = 'school-deadline-icon';
    icon.style.background = category === 'admin' ? 'var(--gold-light)' : 'var(--pale-blue-1)';
    icon.setAttribute('aria-hidden', 'true');
    icon.innerHTML = category === 'admin'
      ? '<svg viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>'
      : '<svg viewBox="0 0 24 24"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>';
    info.className = 'school-deadline-info';
    name.className = 'school-deadline-name';
    name.textContent = item.title;
    meta.className = 'school-deadline-meta';
    meta.textContent = formatDate(item.dueAt) + (organization ? ' · ' + organization : '');
    badge.className = 'school-days-badge' + (due !== null && due <= 2 ? ' urgent' : '');
    badge.textContent = due === null ? 'No date' : due < 0
      ? Math.abs(due) + ' days overdue'
      : due === 0 ? 'Due today' : due + ' days';
    if (due !== null) badge.setAttribute('aria-label', due < 0
      ? 'Overdue by ' + Math.abs(due) + ' days'
      : due === 0 ? 'Due today' : 'Due in ' + due + ' days');
    info.appendChild(name);
    info.appendChild(meta);
    li.appendChild(icon);
    li.appendChild(info);
    li.appendChild(badge);
    return li;
  }

  function renderDeadlines() {
    deadlinesList.innerHTML = '';
    var items = [];
    if (filter !== 'admin') {
      assignments.forEach(function (item) {
        items.push(createDeadline(item, 'class', item.courseName));
      });
    }
    if (filter !== 'class') {
      adminDeadlines.forEach(function (item) {
        items.push(createDeadline(item, 'admin', item.organization));
      });
    }
    items.sort(function (a, b) {
      var first = a.dataset.dueAt ? new Date(a.dataset.dueAt).getTime() : Number.MAX_SAFE_INTEGER;
      var second = b.dataset.dueAt ? new Date(b.dataset.dueAt).getTime() : Number.MAX_SAFE_INTEGER;
      return first - second;
    });
    if (!items.length) {
      var empty = document.createElement('li');
      empty.textContent = filter === 'admin'
        ? 'No administrative deadlines.'
        : 'No upcoming assignments.';
      deadlinesList.appendChild(empty);
    } else {
      items.forEach(function (item) { deadlinesList.appendChild(item); });
    }
  }

  function renderClasses(classes) {
    classesList.innerHTML = '';
    if (!classes.length) {
      var empty = document.createElement('li');
      empty.textContent = 'No class schedules.';
      classesList.appendChild(empty);
      return;
    }
    classes.forEach(function (item) {
      var li = document.createElement('li');
      var icon = document.createElement('div');
      var info = document.createElement('div');
      var name = document.createElement('div');
      var meta = document.createElement('div');
      li.className = 'school-class-item';
      icon.className = 'school-class-icon';
      icon.setAttribute('aria-hidden', 'true');
      icon.innerHTML = '<svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>';
      name.className = 'school-class-name';
      name.textContent = item.courseName;
      meta.className = 'school-class-meta';
      meta.textContent = weekdayNames[item.dayOfWeek - 1] + ' · ' + item.startTime + '–' +
        item.endTime + (item.location ? ' · ' + item.location : '');
      info.appendChild(name);
      info.appendChild(meta);
      li.appendChild(icon);
      li.appendChild(info);
      classesList.appendChild(li);
    });
  }

  function renderCalendar() {
    var now = new Date();
    var year = now.getFullYear();
    var month = now.getMonth();
    var firstDay = new Date(year, month, 1);
    var lastDay = new Date(year, month + 1, 0);
    var deadlineDays = {};
    assignments.concat(adminDeadlines).forEach(function (item) {
      if (!item.dueAt) return;
      var due = new Date(item.dueAt);
      if (due.getFullYear() === year && due.getMonth() === month) {
        deadlineDays[due.getDate()] = true;
      }
    });

    document.getElementById('cal-heading').textContent =
      now.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
    document.querySelector('.mini-cal').setAttribute(
      'aria-label', now.toLocaleDateString(undefined, { month: 'long', year: 'numeric' }) + ' calendar'
    );
    grid.innerHTML = '';
    ['M', 'T', 'W', 'T', 'F', 'S', 'S'].forEach(function (day) {
      var header = document.createElement('span');
      header.className = 'cal-day-hdr';
      header.textContent = day;
      grid.appendChild(header);
    });
    var offset = (firstDay.getDay() + 6) % 7;
    for (var blank = 0; blank < offset; blank += 1) {
      var empty = document.createElement('span');
      empty.className = 'cal-day empty';
      grid.appendChild(empty);
    }
    for (var dayNumber = 1; dayNumber <= lastDay.getDate(); dayNumber += 1) {
      var day = document.createElement('span');
      day.className = 'cal-day';
      day.textContent = String(dayNumber);
      if (dayNumber === now.getDate()) {
        day.classList.add('cal-today');
        day.setAttribute('aria-label', 'Today, ' + dayNumber);
      } else if (deadlineDays[dayNumber]) {
        day.classList.add('cal-deadline');
        day.setAttribute('aria-label', 'Deadline, ' + dayNumber);
      }
      grid.appendChild(day);
    }
  }

  document.querySelectorAll('[data-school-filter]').forEach(function (tab) {
    tab.addEventListener('click', function () {
      filter = tab.dataset.schoolFilter;
      document.querySelectorAll('[data-school-filter]').forEach(function (button) {
        button.classList.toggle('active', button === tab);
        button.setAttribute('aria-selected', String(button === tab));
      });
      classesCard.style.display = filter === 'admin' ? 'none' : '';
      renderDeadlines();
    });
  });

  window.LandedAuth.getSchoolData().then(function (data) {
    assignments = data.assignments;
    adminDeadlines = data.administrativeDeadlines;
    renderDeadlines();
    renderClasses(data.classes);
    renderCalendar();
  }).catch(function (error) {
    deadlinesList.innerHTML = '';
    classesList.innerHTML = '';
    var message = document.createElement('li');
    message.textContent = error.message || 'Could not load school data.';
    deadlinesList.appendChild(message);
  });
})();
