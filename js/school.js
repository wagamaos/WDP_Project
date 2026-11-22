(function () {
  'use strict';

  var deadlinesList = document.getElementById('deadline-list');
  var classesList = document.getElementById('classes-list');
  var classesCard = classesList.closest('.card');
  var grid = document.querySelector('.mini-cal-grid');
  var selectedDayList = document.getElementById('selected-day-list');
  var dialog = document.getElementById('school-dialog');
  var confirmDialog = document.getElementById('school-confirm-dialog');
  var timetableDialog = document.getElementById('timetable-import-dialog');
  var timetableRows = document.getElementById('timetable-import-rows');
  var timetableProgress = document.getElementById('timetable-import-progress');
  var timetableError = document.getElementById('timetable-import-error');
  var form = document.getElementById('school-item-form');
  var typeField = document.getElementById('school-item-type');
  var classFields = document.getElementById('school-class-fields');
  var deadlineFields = document.getElementById('school-deadline-fields');
  var status = document.getElementById('school-status');
  var dialogError = document.getElementById('school-dialog-error');
  var pendingConfirmation = null;
  var filter = 'all';
  var deadlineStatusFilter = 'all';
  var schoolData = null;
  var currentUser = null;
  var editingItem = null;
  var calendarMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  var selectedDate = new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate());
  var reminderTimer = null;
  var remindersEnabled = false;
  var weekdayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  var typeCollections = {
    class: 'classes',
    assignment: 'assignments',
    admin: 'administrativeDeadlines'
  };

  function showStatus(message, isError) {
    status.textContent = message;
    status.classList.toggle('is-error', Boolean(isError));
    status.hidden = !message;
  }

  function requestConfirmation(message, label, callback, isDanger) {
    pendingConfirmation = callback;
    document.getElementById('school-confirm-message').textContent = message;
    var confirmButton = document.getElementById('school-confirm-action');
    confirmButton.textContent = label;
    confirmButton.classList.toggle('is-danger', Boolean(isDanger));
    confirmDialog.showModal();
  }

  function formatDate(value, options) {
    if (!value) return 'Date not set';
    var date = new Date(value);
    if (isNaN(date.getTime())) return 'Date not set';
    return date.toLocaleDateString(undefined, options || { day: 'numeric', month: 'short', year: 'numeric' });
  }

  function daysUntil(value) {
    if (!value) return null;
    var due = new Date(value);
    if (isNaN(due.getTime())) return null;
    due.setHours(0, 0, 0, 0);
    var today = new Date();
    today.setHours(0, 0, 0, 0);
    return Math.round((due.getTime() - today.getTime()) / 86400000);
  }

  function localDateKey(date) {
    return date.getFullYear() + '-' +
      String(date.getMonth() + 1).padStart(2, '0') + '-' +
      String(date.getDate()).padStart(2, '0');
  }

  function classOccursOn(item, date) {
    var key = localDateKey(date);
    var dayOfWeek = (date.getDay() + 6) % 7 + 1;
    return Number(item.dayOfWeek) === dayOfWeek &&
      (!item.startDate || key >= item.startDate) &&
      (!item.endDate || key <= item.endDate) &&
      (item.holidays || []).indexOf(key) === -1;
  }

  function getTrackerAssignments() {
    var hiddenIds = schoolData.defaultAssignmentIds || [];
    return schoolData.assignments.filter(function (item) {
      return hiddenIds.indexOf(item.id) === -1;
    });
  }

  function sortByDueDate(left, right) {
    return new Date(left.dueAt).getTime() - new Date(right.dueAt).getTime();
  }

  function createAction(label, className, handler) {
    var button = document.createElement('button');
    button.type = 'button';
    button.className = 'school-action-button' + (className ? ' ' + className : '');
    button.textContent = label;
    button.addEventListener('click', handler);
    return button;
  }

  function createActions(item, type) {
    var actions = document.createElement('div');
    actions.className = 'school-item-actions';
    if (type !== 'class') {
      actions.appendChild(createAction(item.completed ? 'Reopen' : 'Complete', '', function () {
        toggleComplete(item, type);
      }));
    }
    actions.appendChild(createAction('Edit', '', function () {
      openEditor(type, item);
    }));
    actions.appendChild(createAction('Delete', 'is-danger', function () {
      deleteItem(item, type);
    }));
    return actions;
  }

  function createDeadline(item, type) {
    var row = document.createElement('li');
    var icon = document.createElement('div');
    var info = document.createElement('div');
    var name = document.createElement('div');
    var meta = document.createElement('div');
    var due = daysUntil(item.dueAt);
    var relationship = type === 'assignment' ? item.courseName : item.organization;

    row.className = 'school-deadline-item' + (item.completed ? ' is-completed' : '');
    icon.className = 'school-deadline-icon ' + (type === 'admin' ? 'is-admin' : 'is-class');
    icon.setAttribute('aria-hidden', 'true');
    icon.innerHTML = type === 'admin'
      ? '<svg viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>'
      : '<svg viewBox="0 0 24 24"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>';
    info.className = 'school-deadline-info';
    name.className = 'school-deadline-name';
    name.textContent = item.title;
    meta.className = 'school-deadline-meta';
    meta.textContent = formatDate(item.dueAt) +
      (item.dueAt ? ' · ' + new Date(item.dueAt).toLocaleTimeString(undefined, {
        hour: '2-digit', minute: '2-digit'
      }) : '') +
      (relationship ? ' · ' + relationship : '');
    info.append(name, meta);
    row.append(icon, info);

    if (item.completed) {
      var completed = document.createElement('span');
      completed.className = 'school-completed-badge';
      completed.textContent = 'Completed';
      row.appendChild(completed);
    } else {
      var badge = document.createElement('span');
      badge.className = 'school-days-badge' + (due !== null && due <= 2 ? ' urgent' : '');
      badge.textContent = due === null ? 'No date' : due < 0
        ? Math.abs(due) + (Math.abs(due) === 1 ? ' day' : ' days') + ' overdue'
        : due === 0 ? 'Due today' : due === 1 ? '1 day' : due + ' days';
      row.appendChild(badge);
    }
    row.appendChild(createActions(item, type));
    return row;
  }

  function renderDeadlines() {
    deadlinesList.textContent = '';
    var deadlines = [];
    if (filter !== 'admin') {
      getTrackerAssignments().forEach(function (item) {
        deadlines.push({ item: item, type: 'assignment' });
      });
    }
    if (filter !== 'class') {
      schoolData.administrativeDeadlines.forEach(function (item) {
        deadlines.push({ item: item, type: 'admin' });
      });
    }
    deadlines = deadlines.filter(function (entry) {
      var due = daysUntil(entry.item.dueAt);
      if (deadlineStatusFilter === 'completed') return Boolean(entry.item.completed);
      if (deadlineStatusFilter === 'upcoming') {
        return !entry.item.completed && due !== null && due >= 0;
      }
      if (deadlineStatusFilter === 'overdue') {
        return !entry.item.completed && due !== null && due < 0;
      }
      return true;
    });
    deadlines.sort(function (left, right) { return sortByDueDate(left.item, right.item); });
    if (!deadlines.length) {
      var empty = document.createElement('li');
      empty.className = 'school-empty';
      empty.textContent = deadlineStatusFilter === 'completed'
        ? 'No completed deadlines.'
        : deadlineStatusFilter === 'overdue'
          ? 'No overdue deadlines.'
          : deadlineStatusFilter === 'upcoming'
            ? 'No upcoming deadlines.'
            : filter === 'admin'
              ? 'No visa or administrative deadlines yet.'
              : 'No assignments or deadlines yet.';
      deadlinesList.appendChild(empty);
      return;
    }
    deadlines.forEach(function (entry) {
      deadlinesList.appendChild(createDeadline(entry.item, entry.type));
    });
  }

  function renderClasses() {
    classesList.textContent = '';
    if (!schoolData.classes.length) {
      var empty = document.createElement('li');
      empty.className = 'school-empty';
      empty.textContent = 'No class schedules yet. Add a class to get started.';
      classesList.appendChild(empty);
      return;
    }
    schoolData.classes.slice().sort(function (left, right) {
      return left.dayOfWeek - right.dayOfWeek ||
        left.startTime.localeCompare(right.startTime) ||
        left.courseName.localeCompare(right.courseName);
    }).forEach(function (item) {
      var row = document.createElement('li');
      var icon = document.createElement('div');
      var info = document.createElement('div');
      var name = document.createElement('div');
      var meta = document.createElement('div');
      row.className = 'school-class-item';
      icon.className = 'school-class-icon';
      icon.setAttribute('aria-hidden', 'true');
      icon.innerHTML = '<svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>';
      info.className = 'school-class-info';
      name.className = 'school-class-name';
      name.textContent = item.courseName;
      meta.className = 'school-class-meta';
      meta.textContent = weekdayNames[item.dayOfWeek - 1] + ' · ' + item.startTime + '–' +
        item.endTime + (item.location ? ' · ' + item.location : '');
      info.append(name, meta);
      row.append(icon, info, createActions(item, 'class'));
      classesList.appendChild(row);
    });
  }

  function renderCalendar() {
    var year = calendarMonth.getFullYear();
    var month = calendarMonth.getMonth();
    var firstDay = new Date(year, month, 1);
    var lastDay = new Date(year, month + 1, 0);
    var deadlineDays = {};
    var eventDays = {};
    getTrackerAssignments().concat(schoolData.administrativeDeadlines).forEach(function (item) {
      if (!item.dueAt || item.completed) return;
      var due = new Date(item.dueAt);
      if (due.getFullYear() === year && due.getMonth() === month) {
        deadlineDays[due.getDate()] = true;
      }
    });
    (schoolData.registeredEvents || []).forEach(function (event) {
      var start = new Date(event.startAt);
      if (!isNaN(start.getTime()) && start.getFullYear() === year && start.getMonth() === month) {
        eventDays[start.getDate()] = true;
      }
    });

    var monthLabel = calendarMonth.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
    document.getElementById('cal-heading').textContent = monthLabel;
    document.querySelector('.mini-cal').setAttribute('aria-label', monthLabel + ' calendar');
    grid.textContent = '';
    ['M', 'T', 'W', 'T', 'F', 'S', 'S'].forEach(function (day) {
      var header = document.createElement('span');
      header.className = 'cal-day-hdr';
      header.setAttribute('aria-hidden', 'true');
      header.textContent = day;
      grid.appendChild(header);
    });

    var offset = (firstDay.getDay() + 6) % 7;
    for (var blank = 0; blank < offset; blank += 1) {
      var empty = document.createElement('span');
      empty.className = 'cal-day empty';
      empty.setAttribute('aria-hidden', 'true');
      grid.appendChild(empty);
    }

    var today = new Date();
    var isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;
    for (var dayNumber = 1; dayNumber <= lastDay.getDate(); dayNumber += 1) {
      var date = new Date(year, month, dayNumber);
      var day = document.createElement('button');
      var hasClass = schoolData.classes.some(function (item) {
        return classOccursOn(item, date);
      });
      day.type = 'button';
      day.className = 'cal-day';
      day.textContent = String(dayNumber);
      day.setAttribute('aria-label', date.toLocaleDateString(undefined, {
        weekday: 'long', month: 'long', day: 'numeric', year: 'numeric'
      }));
      day.setAttribute('aria-pressed', localDateKey(date) === localDateKey(selectedDate) ? 'true' : 'false');
      if (localDateKey(date) === localDateKey(selectedDate)) day.classList.add('cal-selected');
      if (isCurrentMonth && dayNumber === today.getDate()) day.classList.add('cal-today');
      if (deadlineDays[dayNumber]) day.classList.add('cal-deadline');
      if (eventDays[dayNumber]) day.classList.add('cal-event');
      if (hasClass) day.classList.add('cal-class');
      if (deadlineDays[dayNumber] || hasClass || eventDays[dayNumber]) {
        var details = [];
        if (deadlineDays[dayNumber]) details.push('Deadline');
        if (hasClass) details.push('Class scheduled');
        if (eventDays[dayNumber]) details.push('RSVP event');
        day.title = details.join(' and ');
        day.setAttribute('aria-label', day.getAttribute('aria-label') + ': ' + details.join(', '));
      }
      day.addEventListener('click', (function (dateValue) {
        return function () {
          selectedDate = dateValue;
          renderCalendar();
        };
      })(new Date(year, month, dayNumber)));
      grid.appendChild(day);
    }
    var totalCells = offset + lastDay.getDate();
    for (var trailing = totalCells % 7; trailing && trailing < 7; trailing += 1) {
      var trailingEmpty = document.createElement('span');
      trailingEmpty.className = 'cal-day empty';
      trailingEmpty.setAttribute('aria-hidden', 'true');
      grid.appendChild(trailingEmpty);
    }
    renderSelectedDay();
  }

  function renderSelectedDay() {
    var heading = document.getElementById('selected-day-heading');
    heading.textContent = selectedDate.toLocaleDateString(undefined, {
      weekday: 'long', month: 'long', day: 'numeric', year: 'numeric'
    });
    selectedDayList.textContent = '';
    var entries = [];
    schoolData.classes.forEach(function (item) {
      if (classOccursOn(item, selectedDate)) {
        entries.push({
          type: 'class',
          item: item,
          label: item.courseName + ' · ' + item.startTime + '–' + item.endTime +
            (item.location ? ' · ' + item.location : '')
        });
      }
    });
    var assignments = getTrackerAssignments();
    assignments.concat(schoolData.administrativeDeadlines).forEach(function (item) {
      if (item.dueAt && localDateKey(new Date(item.dueAt)) === localDateKey(selectedDate)) {
        entries.push({
          type: assignments.indexOf(item) !== -1 ? 'assignment' : 'admin',
          item: item,
          label: item.title + (item.completed ? ' · Completed' : ' · Deadline')
        });
      }
    });
    (schoolData.registeredEvents || []).forEach(function (event) {
      var start = new Date(event.startAt);
      if (!isNaN(start.getTime()) && localDateKey(start) === localDateKey(selectedDate)) {
        var end = new Date(event.endAt);
        var eventTime = start.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
        if (!isNaN(end.getTime()) && localDateKey(end) === localDateKey(start)) {
          eventTime += '–' + end.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
        }
        entries.push({
          type: 'event',
          item: event,
          label: 'RSVP · ' + event.title + ' · ' + eventTime +
            (event.location ? ' · ' + event.location : '')
        });
      }
    });
    entries.sort(function (left, right) {
      if (left.type === 'class' && right.type === 'class') {
        return left.item.startTime.localeCompare(right.item.startTime);
      }
      if (left.type === 'class') return -1;
      if (right.type === 'class') return 1;
      var leftTime = left.type === 'event' ? left.item.startAt : left.item.dueAt;
      var rightTime = right.type === 'event' ? right.item.startAt : right.item.dueAt;
      return new Date(leftTime) - new Date(rightTime);
    });
    if (!entries.length) {
      var empty = document.createElement('li');
      empty.className = 'school-empty';
      empty.textContent = 'Nothing scheduled for this day.';
      selectedDayList.appendChild(empty);
      return;
    }
    entries.forEach(function (entry) {
      var row = document.createElement('li');
      var label = document.createElement('span');
      label.textContent = entry.label;
      row.appendChild(label);
      if (entry.type === 'assignment' || entry.type === 'admin') {
        row.appendChild(createAction('Edit', '', function () {
          openEditor(entry.type, entry.item);
        }));
      }
      selectedDayList.appendChild(row);
    });
  }

  function render() {
    renderDeadlines();
    renderClasses();
    renderCalendar();
    classesCard.hidden = filter === 'admin';
  }

  function setFormType() {
    var isClass = typeField.value === 'class';
    var isAdmin = typeField.value === 'admin';
    classFields.hidden = !isClass;
    deadlineFields.hidden = isClass;
    document.getElementById('school-course-name').required = isClass;
    document.getElementById('school-day').required = isClass;
    document.getElementById('school-start-time').required = isClass;
    document.getElementById('school-end-time').required = isClass;
    document.getElementById('school-deadline-title').required = !isClass;
    document.getElementById('school-due-at').required = !isClass;
    document.getElementById('school-related-label').textContent = isAdmin ? 'Organization' : 'Course';
    document.getElementById('school-related-to').placeholder = isAdmin
      ? 'e.g. Immigration Office' : 'e.g. Computer Science';
  }

  function localDateTimeValue(value) {
    var date = new Date(value);
    if (isNaN(date.getTime())) return '';
    var pad = function (number) { return String(number).padStart(2, '0'); };
    return date.getFullYear() + '-' + pad(date.getMonth() + 1) + '-' +
      pad(date.getDate()) + 'T' + pad(date.getHours()) + ':' + pad(date.getMinutes());
  }

  function openEditor(type, item) {
    editingItem = item ? { type: type, item: item } : null;
    form.reset();
    typeField.value = type;
    typeField.disabled = Boolean(item);
    setFormType();
    if (item && type === 'class') {
      form.elements.courseName.value = item.courseName;
      form.elements.dayOfWeek.value = String(item.dayOfWeek);
      form.elements.startTime.value = item.startTime;
      form.elements.endTime.value = item.endTime;
      form.elements.location.value = item.location || '';
      form.elements.startDate.value = item.startDate || '';
      form.elements.endDate.value = item.endDate || '';
      form.elements.holidays.value = (item.holidays || []).join('\n');
    } else if (item) {
      form.elements.title.value = item.title;
      form.elements.dueAt.value = localDateTimeValue(item.dueAt);
      form.elements.relatedTo.value = type === 'assignment'
        ? item.courseName || '' : item.organization || '';
    }
    document.getElementById('school-dialog-title').textContent =
      item ? 'Edit schedule or deadline' :
        type === 'class' ? 'Add class schedule' :
          type === 'assignment' ? 'Add assignment deadline' : 'Add visa or admin deadline';
    document.getElementById('save-school-item').textContent = item ? 'Save changes' : 'Add item';
    dialogError.hidden = true;
    dialogError.textContent = '';
    showStatus('', false);
    dialog.showModal();
  }

  function getFormDetails(type) {
    if (type === 'class') {
      return {
        courseName: form.elements.courseName.value.trim(),
        dayOfWeek: Number(form.elements.dayOfWeek.value),
        startTime: form.elements.startTime.value,
        endTime: form.elements.endTime.value,
        location: form.elements.location.value.trim(),
        startDate: form.elements.startDate.value,
        endDate: form.elements.endDate.value,
        holidays: form.elements.holidays.value.split(/[\n,]+/)
          .map(function (date) { return date.trim(); })
          .filter(Boolean)
      };
    }
    return {
      title: form.elements.title.value.trim(),
      dueAt: new Date(form.elements.dueAt.value).toISOString(),
      completed: editingItem && editingItem.type === type ? Boolean(editingItem.item.completed) : false,
      courseName: type === 'assignment' ? form.elements.relatedTo.value.trim() : undefined,
      organization: type === 'admin' ? form.elements.relatedTo.value.trim() : undefined
    };
  }

  function refreshData() {
    return window.LandedAuth.getSchoolData().then(function (data) {
      schoolData = data;
      render();
    });
  }

  function submitItem(event) {
    event.preventDefault();
    if (!form.reportValidity()) return;

    var type = typeField.value;
    var details;
    try {
      details = getFormDetails(type);
    } catch (error) {
      dialogError.textContent = error.message || 'Enter valid school item details.';
      dialogError.hidden = false;
      return;
    }
    var collection = typeCollections[type];
    var submitButton = document.getElementById('save-school-item');
    submitButton.disabled = true;
    dialogError.hidden = true;
    var operation = editingItem
      ? window.LandedAuth.updateSchoolItem(collection, editingItem.item.id, details)
      : window.LandedAuth.createSchoolItem(collection, details);

    operation.then(function () {
      return refreshData();
    }).then(function () {
      dialog.close();
      showStatus(editingItem ? 'Changes saved.' : 'Item added.');
      editingItem = null;
    }).catch(function (error) {
      dialogError.textContent = error.message || 'Could not save this item. Please try again.';
      dialogError.hidden = false;
    }).finally(function () {
      submitButton.disabled = false;
    });
  }

  function deleteItem(item, type) {
    requestConfirmation(
      'Delete "' + (item.courseName || item.title) + '"? This cannot be undone.',
      'Delete',
      function () {
        window.LandedAuth.deleteSchoolItem(typeCollections[type], item.id).then(function () {
          return refreshData();
        }).then(function () {
          showStatus('Item deleted.');
        }).catch(function (error) {
          showStatus(error.message || 'Could not delete this item. Please try again.', true);
        });
      },
      true
    );
  }

  function addTimetablePreviewRow(item) {
    var row = document.createElement('tr');
    var includeCell = document.createElement('td');
    var nameCell = document.createElement('td');
    var dayCell = document.createElement('td');
    var startCell = document.createElement('td');
    var endCell = document.createElement('td');
    var locationCell = document.createElement('td');
    var include = document.createElement('input');
    var name = document.createElement('input');
    var day = document.createElement('select');
    var start = document.createElement('input');
    var end = document.createElement('input');
    var location = document.createElement('input');

    include.type = 'checkbox';
    include.checked = true;
    include.setAttribute('aria-label', 'Import ' + item.courseName);
    name.type = 'text';
    name.className = 'school-import-name';
    name.value = item.courseName;
    name.maxLength = 100;
    name.setAttribute('aria-label', 'Class name');
    weekdayNames.forEach(function (weekday, index) {
      var option = document.createElement('option');
      option.value = String(index + 1);
      option.textContent = weekday;
      day.appendChild(option);
    });
    day.value = String(item.dayOfWeek);
    day.setAttribute('aria-label', 'Day of week');
    start.type = 'time';
    start.value = item.startTime;
    start.setAttribute('aria-label', 'Start time');
    end.type = 'time';
    end.value = item.endTime;
    end.setAttribute('aria-label', 'End time');
    location.type = 'text';
    location.value = item.location || '';
    location.maxLength = 100;
    location.setAttribute('aria-label', 'Location');
    row.dataset.startDate = item.startDate || '';
    row.dataset.endDate = item.endDate || '';
    row.dataset.holidays = (item.holidays || []).join(',');
    includeCell.appendChild(include);
    nameCell.appendChild(name);
    dayCell.appendChild(day);
    startCell.appendChild(start);
    endCell.appendChild(end);
    locationCell.appendChild(location);
    row.append(includeCell, nameCell, dayCell, startCell, endCell, locationCell);
    timetableRows.appendChild(row);
  }

  function importTimetableFile(event) {
    var file = event.target.files && event.target.files[0];
    event.target.value = '';
    if (!file) return;
    var importButton = document.getElementById('import-timetable');
    importButton.disabled = true;
    showStatus('Reading the timetable locally in this browser…');
    window.LandedTimetableImport.read(file, function (message) {
      showStatus(message);
    }).then(function (entries) {
      if (!entries.length) {
        throw new Error('No recurring classes were detected. Try a clearer timetable or add classes manually.');
      }
      timetableRows.textContent = '';
      entries.forEach(addTimetablePreviewRow);
      timetableProgress.textContent = 'Check the detected details, then import the selected recurring classes.';
      timetableError.textContent = '';
      timetableError.hidden = true;
      showStatus('');
      timetableDialog.showModal();
    }).catch(function (error) {
      showStatus(error.message || 'Could not read this timetable.', true);
    }).finally(function () {
      importButton.disabled = false;
    });
  }

  function submitTimetableImport(event) {
    event.preventDefault();
    var selectedRows = Array.from(timetableRows.querySelectorAll('tr')).filter(function (row) {
      return row.querySelector('input[type="checkbox"]').checked;
    });
    var classes = selectedRows.map(function (row) {
      var inputs = row.querySelectorAll('input');
      return {
        courseName: inputs[1].value.trim(),
        dayOfWeek: Number(row.querySelector('select').value),
        startTime: inputs[2].value,
        endTime: inputs[3].value,
        location: inputs[4].value.trim(),
        startDate: row.dataset.startDate,
        endDate: row.dataset.endDate,
        holidays: row.dataset.holidays ? row.dataset.holidays.split(',') : []
      };
    });
    if (!classes.length) {
      timetableError.textContent = 'Select at least one class to import.';
      timetableError.hidden = false;
      return;
    }
    var saveButton = document.getElementById('save-timetable-import');
    saveButton.disabled = true;
    timetableError.hidden = true;
    window.LandedAuth.importSchoolClasses(classes).then(function () {
      return refreshData();
    }).then(function () {
      timetableDialog.close();
      showStatus(classes.length + (classes.length === 1 ? ' recurring class imported.' : ' recurring classes imported.'));
    }).catch(function (error) {
      timetableError.textContent = error.message || 'Could not import these classes.';
      timetableError.hidden = false;
    }).finally(function () {
      saveButton.disabled = false;
    });
  }

  function toggleComplete(item, type) {
    var details = {
      title: item.title,
      dueAt: item.dueAt,
      completed: !item.completed
    };
    if (type === 'assignment') details.courseName = item.courseName || '';
    else details.organization = item.organization || '';
    window.LandedAuth.updateSchoolItem(typeCollections[type], item.id, details).then(function () {
      return refreshData();
    }).then(function () {
      showStatus(item.completed ? 'Deadline reopened.' : 'Deadline completed.');
    }).catch(function (error) {
      showStatus(error.message || 'Could not update this deadline.', true);
    });
  }

  function reminderPreferenceKey() {
    return 'landed.schoolReminders.' + currentUser.email;
  }

  function reminderSentKey() {
    return reminderPreferenceKey() + '.sent';
  }

  function updateReminderButton() {
    document.getElementById('enable-reminders').textContent =
      remindersEnabled ? 'Disable deadline reminders' : 'Enable deadline reminders';
  }

  function checkDeadlineReminders() {
    if (!remindersEnabled || !schoolData || !window.Notification ||
        window.Notification.permission !== 'granted') return;

    try {
      var notified = JSON.parse(window.localStorage.getItem(reminderSentKey()) || '{}');
      var now = Date.now();
      getTrackerAssignments().concat(schoolData.administrativeDeadlines).forEach(function (item) {
        if (item.completed || !item.dueAt) return;
        var dueAt = new Date(item.dueAt).getTime();
        var remaining = dueAt - now;
        var notificationId = item.id + ':' + item.dueAt;
        if (remaining < 0 || remaining > 86400000 || notified[notificationId]) return;

        var notification = new window.Notification('Deadline coming up', {
          body: item.title + ' is due ' + formatDate(item.dueAt, {
            weekday: 'short', month: 'short', day: 'numeric'
          }) + ' at ' + new Date(item.dueAt).toLocaleTimeString(undefined, {
            hour: '2-digit', minute: '2-digit'
          }) + '.'
        });
        notification.onclick = function () {
          window.focus();
          notification.close();
        };
        notified[notificationId] = now;
      });
      window.localStorage.setItem(reminderSentKey(), JSON.stringify(notified));
    } catch (error) {
      showStatus('Could not save reminder settings in this browser.', true);
    }
  }

  function setDeadlineReminders() {
    if (remindersEnabled) {
      remindersEnabled = false;
      window.clearInterval(reminderTimer);
      reminderTimer = null;
      try {
        window.localStorage.removeItem(reminderPreferenceKey());
      } catch (error) {
        showStatus('Could not update reminder settings in this browser.', true);
      }
      updateReminderButton();
      showStatus('Deadline reminders disabled.');
      return;
    }

    if (!window.Notification) {
      showStatus('This browser does not support desktop notifications.', true);
      return;
    }
    var permission = window.Notification.permission === 'granted'
      ? Promise.resolve('granted')
      : window.Notification.requestPermission();
    permission.then(function (result) {
      if (result !== 'granted') {
        showStatus('Notifications were not enabled. You can change this in your browser settings.', true);
        return;
      }
      try {
        window.localStorage.setItem(reminderPreferenceKey(), 'enabled');
      } catch (error) {
        showStatus('Could not save reminder settings in this browser.', true);
        return;
      }
      remindersEnabled = true;
      updateReminderButton();
      checkDeadlineReminders();
      reminderTimer = window.setInterval(checkDeadlineReminders, 60000);
      showStatus('Deadline reminders enabled while this page is open.');
    }).catch(function () {
      showStatus('Could not enable notifications. Check your browser settings.', true);
    });
  }

  document.getElementById('add-school-item').addEventListener('click', function () {
    openEditor('class');
  });
  document.getElementById('deadline-status-filter').addEventListener('change', function (event) {
    deadlineStatusFilter = event.target.value;
    renderDeadlines();
  });
  document.getElementById('enable-reminders').addEventListener('click', setDeadlineReminders);
  document.getElementById('import-timetable').addEventListener('click', function () {
    document.getElementById('timetable-file').click();
  });
  document.getElementById('timetable-file').addEventListener('change', importTimetableFile);
  document.getElementById('cancel-timetable-import').addEventListener('click', function () {
    timetableDialog.close();
  });
  document.getElementById('timetable-import-form').addEventListener('submit', submitTimetableImport);
  document.querySelectorAll('[data-add-type]').forEach(function (button) {
    button.addEventListener('click', function () { openEditor(button.dataset.addType); });
  });
  document.querySelectorAll('[data-school-filter]').forEach(function (tab) {
    tab.addEventListener('click', function () {
      filter = tab.dataset.schoolFilter;
      document.querySelectorAll('[data-school-filter]').forEach(function (otherTab) {
        var selected = otherTab === tab;
        otherTab.classList.toggle('active', selected);
        otherTab.setAttribute('aria-selected', String(selected));
      });
      render();
    });
  });
  typeField.addEventListener('change', setFormType);
  form.addEventListener('submit', submitItem);
  document.getElementById('cancel-school-item').addEventListener('click', function () {
    dialog.close();
    editingItem = null;
  });
  document.getElementById('school-confirm-action').addEventListener('click', function () {
    var action = pendingConfirmation;
    pendingConfirmation = null;
    confirmDialog.close();
    if (action) action();
  });
  confirmDialog.addEventListener('close', function () {
    pendingConfirmation = null;
  });
  confirmDialog.addEventListener('click', function (event) {
    if (event.target === confirmDialog) confirmDialog.close();
  });
  document.getElementById('calendar-prev').addEventListener('click', function () {
    calendarMonth = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1);
    selectedDate = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), 1);
    if (schoolData) renderCalendar();
  });
  document.getElementById('calendar-next').addEventListener('click', function () {
    calendarMonth = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1);
    selectedDate = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), 1);
    if (schoolData) renderCalendar();
  });
  window.addEventListener('storage', function (event) {
    if (event.key !== 'landed-demo-state-v1') return;
    window.LandedAuth.refreshState().then(refreshData).catch(function (error) {
      showStatus(error.message || 'Could not refresh RSVP events.', true);
    });
  });
  dialog.addEventListener('click', function (event) {
    if (event.target === dialog) {
      dialog.close();
      editingItem = null;
    }
  });

  Promise.all([
    window.LandedAuth.getCurrentUser(),
    refreshData()
  ]).then(function (results) {
    currentUser = results[0];
    if (!currentUser) throw new Error('Please log in to use the School Tracker.');
    try {
      remindersEnabled = window.localStorage.getItem(reminderPreferenceKey()) === 'enabled' &&
        Boolean(window.Notification) && window.Notification.permission === 'granted';
    } catch (error) {
      showStatus('Could not load reminder settings from this browser.', true);
    }
    updateReminderButton();
    if (remindersEnabled) {
      checkDeadlineReminders();
      reminderTimer = window.setInterval(checkDeadlineReminders, 60000);
    }
  }).catch(function (error) {
    showStatus(error.message || 'Could not load school data.', true);
    document.getElementById('add-school-item').disabled = true;
    document.querySelectorAll('[data-add-type]').forEach(function (button) {
      button.disabled = true;
    });
    document.getElementById('enable-reminders').disabled = true;
  });
})();
