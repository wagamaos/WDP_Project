(function () {
  'use strict';

  var deadlinesList = document.getElementById('deadline-list');
  var classesList = document.getElementById('classes-list');
  var classesCard = classesList.closest('.card');
  var grid = document.querySelector('.mini-cal-grid');
  var dialog = document.getElementById('school-dialog');
  var form = document.getElementById('school-item-form');
  var typeField = document.getElementById('school-item-type');
  var classFields = document.getElementById('school-class-fields');
  var deadlineFields = document.getElementById('school-deadline-fields');
  var status = document.getElementById('school-status');
  var dialogError = document.getElementById('school-dialog-error');
  var filter = 'all';
  var schoolData = null;
  var editingItem = null;
  var calendarMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
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
      schoolData.assignments.forEach(function (item) {
        deadlines.push({ item: item, type: 'assignment' });
      });
    }
    if (filter !== 'class') {
      schoolData.administrativeDeadlines.forEach(function (item) {
        deadlines.push({ item: item, type: 'admin' });
      });
    }
    deadlines.sort(function (left, right) { return sortByDueDate(left.item, right.item); });
    if (!deadlines.length) {
      var empty = document.createElement('li');
      empty.className = 'school-empty';
      empty.textContent = filter === 'admin'
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
    schoolData.assignments.concat(schoolData.administrativeDeadlines).forEach(function (item) {
      if (!item.dueAt || item.completed) return;
      var due = new Date(item.dueAt);
      if (due.getFullYear() === year && due.getMonth() === month) {
        deadlineDays[due.getDate()] = true;
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
      var day = document.createElement('span');
      var dayOfWeek = (date.getDay() + 6) % 7 + 1;
      var hasClass = schoolData.classes.some(function (item) {
        return item.dayOfWeek === dayOfWeek;
      });
      day.className = 'cal-day';
      day.textContent = String(dayNumber);
      day.setAttribute('aria-label', date.toLocaleDateString(undefined, {
        weekday: 'long', month: 'long', day: 'numeric', year: 'numeric'
      }));
      if (isCurrentMonth && dayNumber === today.getDate()) day.classList.add('cal-today');
      if (deadlineDays[dayNumber]) day.classList.add('cal-deadline');
      if (hasClass) day.classList.add('cal-class');
      if (deadlineDays[dayNumber] || hasClass) {
        var details = [];
        if (deadlineDays[dayNumber]) details.push('Deadline');
        if (hasClass) details.push('Class scheduled');
        day.title = details.join(' and ');
        day.setAttribute('aria-label', day.getAttribute('aria-label') + ': ' + details.join(', '));
      }
      grid.appendChild(day);
    }
    var totalCells = offset + lastDay.getDate();
    for (var trailing = totalCells % 7; trailing && trailing < 7; trailing += 1) {
      var trailingEmpty = document.createElement('span');
      trailingEmpty.className = 'cal-day empty';
      trailingEmpty.setAttribute('aria-hidden', 'true');
      grid.appendChild(trailingEmpty);
    }
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
        location: form.elements.location.value.trim()
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
    if (!window.confirm('Delete "' + (item.courseName || item.title) + '"? This cannot be undone.')) return;
    window.LandedAuth.deleteSchoolItem(typeCollections[type], item.id).then(function () {
      return refreshData();
    }).then(function () {
      showStatus('Item deleted.');
    }).catch(function (error) {
      showStatus(error.message || 'Could not delete this item. Please try again.', true);
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

  document.getElementById('add-school-item').addEventListener('click', function () {
    openEditor('class');
  });
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
  document.getElementById('calendar-prev').addEventListener('click', function () {
    calendarMonth = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1);
    if (schoolData) renderCalendar();
  });
  document.getElementById('calendar-next').addEventListener('click', function () {
    calendarMonth = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1);
    if (schoolData) renderCalendar();
  });
  dialog.addEventListener('click', function (event) {
    if (event.target === dialog) {
      dialog.close();
      editingItem = null;
    }
  });

  refreshData().catch(function (error) {
    showStatus(error.message || 'Could not load school data.', true);
    document.getElementById('add-school-item').disabled = true;
    document.querySelectorAll('[data-add-type]').forEach(function (button) {
      button.disabled = true;
    });
  });
})();
