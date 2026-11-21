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

    document.getElementById('home-streak').textContent = '0';
    document.getElementById('home-rank').textContent = '—';
    document.getElementById('home-events').textContent = '0';

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

  function showError(error) {
    window.alert(error.message || 'Could not load your account.');
  }

  window.LandedAuth.getCurrentUser().then(function (user) {
    if (!user) {
      window.location.replace('login.html');
      return;
    }

    renderProgress(user);
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
