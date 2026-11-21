(function () {
  'use strict';

  var grid = document.getElementById('events-grid');
  var message = document.getElementById('events-message');
  var events = [];
  var timeFilter = 'upcoming';
  var typeFilter = 'all';
  var gradients = [
    'linear-gradient(135deg, var(--mid-blue-1) 0%, var(--royal) 100%)',
    'linear-gradient(135deg, var(--mid-blue-2) 0%, var(--mid-blue-1) 100%)',
    'linear-gradient(135deg, var(--mid-blue-3) 0%, var(--mid-blue-2) 100%)',
    'linear-gradient(135deg, var(--navy) 0%, var(--royal) 100%)'
  ];

  function isPast(event) {
    return new Date(event.endAt || event.startAt).getTime() < Date.now();
  }

  function formatDate(value) {
    var date = new Date(value);
    if (isNaN(date.getTime())) return 'Date to be announced';
    return date.toLocaleString(undefined, {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  function renderEvent(event, index) {
    var card = document.createElement('article');
    var image = document.createElement('div');
    var points = document.createElement('span');
    var body = document.createElement('div');
    var title = document.createElement('h2');
    var meta = document.createElement('div');
    var button = document.createElement('button');
    var isEventPast = isPast(event);

    card.className = 'event-card';
    card.dataset.type = event.eventType || 'Other';
    card.dataset.eventId = String(event.id);
    image.className = 'event-card-img';
    image.style.background = gradients[index % gradients.length];
    points.className = 'event-pts-badge';
    points.textContent = event.pointsAwarded > 0 ? '+' + event.pointsAwarded + ' pts' : 'Campus event';
    image.appendChild(points);
    body.className = 'event-card-body';
    title.className = 'event-card-title';
    title.textContent = event.title;
    meta.className = 'event-card-meta';
    var details = [formatDate(event.startAt), event.location, event.eventType].filter(Boolean);
    if (event.capacity !== null) {
      details.push(event.registeredCount + ' / ' + event.capacity + ' registered');
    }
    meta.textContent = details.join(' · ');
    button.type = 'button';
    button.className = 'btn btn-full event-rsvp-btn ' +
      (event.registered ? 'btn-gold' : 'btn-royal');
    button.textContent = isEventPast ? 'Event ended' : (event.registered ? '✓ RSVPed' : 'RSVP');
    button.disabled = isEventPast || (!event.registered &&
      event.capacity !== null && event.registeredCount >= event.capacity);
    button.setAttribute('aria-label', (event.registered ? 'Cancel RSVP for ' : 'RSVP for ') + event.title);
    button.addEventListener('click', function () {
      button.disabled = true;
      window.LandedAuth.toggleEventRegistration(event.id).then(function (result) {
        event.registered = result.registered;
        if (result.registered) event.registeredCount += 1;
        else event.registeredCount = Math.max(0, event.registeredCount - 1);
        renderAll();
      }).catch(function (error) {
        window.alert(error.message);
        button.disabled = false;
      });
    });
    body.appendChild(title);
    body.appendChild(meta);
    body.appendChild(button);
    card.appendChild(image);
    card.appendChild(body);
    return card;
  }

  function matchesFilters(event) {
    var past = isPast(event);
    var matchesTime = timeFilter === 'past' ? past :
      timeFilter === 'rsvps' ? event.registered && !past : !past;
    var matchesType = typeFilter === 'all' || event.eventType === typeFilter;
    var query = document.getElementById('events-search').value.trim().toLowerCase();
    var matchesSearch = !query ||
      event.title.toLowerCase().indexOf(query) !== -1 ||
      event.location.toLowerCase().indexOf(query) !== -1;
    return matchesTime && matchesType && matchesSearch;
  }

  function renderAll() {
    grid.querySelectorAll('.event-card').forEach(function (card) { card.remove(); });
    var visible = events.filter(matchesFilters);
    message.hidden = visible.length > 0;
    message.textContent = events.length === 0
      ? 'No published events are available yet.'
      : 'No events match these filters.';
    visible.forEach(function (event) {
      grid.appendChild(renderEvent(event, events.indexOf(event)));
    });
  }

  document.querySelectorAll('.forum-filter-tabs button[data-filter]').forEach(function (button) {
    button.addEventListener('click', function () {
      timeFilter = button.dataset.filter;
      document.querySelectorAll('.forum-filter-tabs button[data-filter]').forEach(function (tab) {
        tab.classList.toggle('active', tab === button);
        tab.setAttribute('aria-pressed', String(tab === button));
      });
      renderAll();
    });
  });

  document.querySelectorAll('.events-type-btn').forEach(function (button) {
    button.addEventListener('click', function () {
      typeFilter = button.dataset.type;
      document.querySelectorAll('.events-type-btn').forEach(function (tab) {
        tab.classList.toggle('active', tab === button);
      });
      renderAll();
    });
  });

  document.getElementById('events-search').addEventListener('input', renderAll);

  window.LandedAuth.listEvents().then(function (result) {
    events = result;
    renderAll();
  }).catch(function (error) {
    message.textContent = error.message || 'Could not load events.';
    message.hidden = false;
  });
})();
