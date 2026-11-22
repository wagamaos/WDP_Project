(function () {
  'use strict';

  function levelFor(points) {
    var levels = ['Newcomer', 'Explorer', 'Navigator', 'Local'];
    var index = Math.floor(points / 400);
    return {
      number: index + 1,
      title: levels[Math.min(index, levels.length - 1)],
      progress: points % 400,
      remaining: 400 - (points % 400)
    };
  }

  function renderProgress(user) {
    var points = user.points || 0;
    var level = levelFor(points);
    var progressPercent = Math.round(level.progress / 4);
    var pointsElement = document.getElementById('home-points');
    var levelElement = document.getElementById('home-level');
    var nextLevelElement = document.getElementById('home-next-level');
    var progressBar = document.getElementById('home-progress-bar');
    var greeting = document.getElementById('home-greeting');

    greeting.textContent = 'Welcome, ' + user.name + '!';
    pointsElement.textContent = points + ' / 400';
    levelElement.textContent = 'Level ' + level.number + ' · ' + level.title;
    nextLevelElement.textContent = level.remaining + ' XP to your next level';
    progressBar.setAttribute('aria-valuenow', String(progressPercent));
    progressBar.style.width = progressPercent + '%';
    window.LandedAuth.getContributionStats().then(function (stats) {
      document.getElementById('home-events').textContent =
        String(stats.eventsAttended);
    });

    document.getElementById('home-streak').textContent = '0';
    document.getElementById('home-rank').textContent = '—';

    var completed = user.completedQuests || [];
    document.querySelectorAll('[data-quest-id]').forEach(function (button) {
      var isDone = completed.indexOf(button.dataset.questId) !== -1;
      var label = button.nextElementSibling;
      button.classList.toggle('done', isDone);
      label.classList.toggle('done-text', isDone);
      button.setAttribute('aria-pressed', String(isDone));
      button.disabled = isDone;
      if (isDone && !button.querySelector('svg')) {
        button.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>';
      }
    });

    var completedCount = completed.length;
    document.getElementById('quest-count').textContent =
      '· ' + completedCount + ' of 3';
    var bonusItem = document.getElementById('quest-bonus');
    var bonusEarned = completedCount === 3;
    bonusItem.querySelector('.quest-label').classList.toggle('done-text', bonusEarned);
    bonusItem.querySelector('.pts-tag').textContent = bonusEarned ? 'Earned +25 pts' : '+25 pts';
  }


  function renderUpcomingEvents() {
    var container = document.getElementById('home-upcoming-events');

    if (!container) return;

    container.textContent = 'Loading events...';

    window.LandedAuth.listEvents()
      .then(function (events) {
        var upcoming = events
          .filter(function (event) {
            var endDate = new Date(event.endAt || event.startAt);
            return !isNaN(endDate.getTime()) && endDate.getTime() >= Date.now();
          })
          .sort(function (a, b) {
            return new Date(a.startAt) - new Date(b.startAt);
          })
          .slice(0, 3);

        container.replaceChildren();

        if (upcoming.length === 0) {
          container.textContent = 'No upcoming events right now.';
          return;
        }

        upcoming.forEach(function (event) {
          var item = document.createElement('div');
          item.className = 'event-item';

          var iconWrap = document.createElement('div');
          iconWrap.className = 'event-icon-wrap';
          iconWrap.setAttribute('aria-hidden', 'true');

          iconWrap.innerHTML =
            '<svg viewBox="0 0 24 24">' +
            '<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>' +
            '<circle cx="12" cy="10" r="3"/>' +
            '</svg>';

          var info = document.createElement('div');
          info.className = 'event-info';

          var name = document.createElement('div');
          name.className = 'event-name';
          name.textContent = event.title;

          var meta = document.createElement('div');
          meta.className = 'event-meta';

          var date = new Date(event.startAt).toLocaleDateString(
            undefined,
            { day: 'numeric', month: 'short' }
          );

          meta.textContent = [
            date,
            event.location,
            event.organiserType
          ].filter(Boolean).join(' · ');

          info.appendChild(name);
          info.appendChild(meta);

          item.appendChild(iconWrap);
          item.appendChild(info);

          if (Number(event.pointsAwarded) > 0) {
            var points = document.createElement('span');
            points.className = 'event-pts';
            points.textContent = '+' + event.pointsAwarded;
            points.setAttribute(
              'aria-label',
              'Earn ' + event.pointsAwarded + ' points'
            );
            item.appendChild(points);
          }

          container.appendChild(item);
        });
      })
      .catch(function () {
        container.textContent = 'Unable to load upcoming events.';
      });
  }


  function showError(error) {
    window.alert(error.message || 'Could not load your account.');
  }

  window.LandedAuth.getCurrentUser().then(function (user) {
    if (!user) {
      window.location.replace('login.html');
      return;
    }

    renderProgress(user);
    renderUpcomingEvents();

    document.querySelectorAll('[data-quest-id]').forEach(function (button) {
      button.addEventListener('click', function () {
        var current = button.disabled;
        if (current) return;

        var accountQuests = user.completedQuests || [];
        if (accountQuests.indexOf(button.dataset.questId) !== -1) return;

        var updatedQuests = accountQuests.concat(button.dataset.questId);
        var earnedBonus = updatedQuests.length === 3;
        var updatedPoints = user.points + Number(button.dataset.xp) + (earnedBonus ? 25 : 0);
        button.disabled = true;

        window.LandedAuth.updateProgress(updatedQuests, updatedPoints).then(function (updatedUser) {
          user = updatedUser;
          renderProgress(user);
        }).catch(function (error) {
          button.disabled = false;
          showError(error);
        });
      });
    });

  }).catch(showError);
})();
