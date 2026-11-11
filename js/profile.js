(function () {
  'use strict';

  var dialog = document.getElementById('profile-dialog');
  var editForm = document.getElementById('profile-edit-form');
  var status = document.getElementById('profile-message');
  var currentUser;
  var badgeIcons = {
    Welcome: '<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>',
    Explorer: '<path d="M12 2l3 7 7 .5-5.3 4.5 1.7 7-6.4-3.8L5.6 21l1.7-7L2 9.5 9 9z"/>',
    Helper: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
    Verified: '<polyline points="20 6 9 17 4 12"/>',
    'Campus Guide': '<path d="M12 2l3 7 7 .5-5.3 4.5 1.7 7-6.4-3.8L5.6 21l1.7-7L2 9.5 9 9z"/>',
    Pathfinder: '<path d="M12 2v20M2 12h20M5 5l14 14M19 5L5 19"/>',
    Scholar: '<path d="M3 7l9-4 9 4-9 4-9-4zM5 10v6l7 3 7-3v-6"/>',
    'Community Champion': '<path d="M12 21s-7-4.4-9.2-9A5.2 5.2 0 0 1 12 6a5.2 5.2 0 0 1 9.2 6c-2.2 4.6-9.2 9-9.2 9z"/>',
    'Landed Legend': '<circle cx="12" cy="8" r="6"/><path d="M15.5 13L17 22l-5-3-5 3 1.5-9"/>'
  };

  function initials(name) {
    return name.trim().split(/\s+/).slice(0, 2).map(function (part) {
      return part.charAt(0).toUpperCase();
    }).join('');
  }

  function renderProfile(user) {
    currentUser = user;
    document.getElementById('profile-name').textContent = user.name;
    document.getElementById('profile-avatar').textContent = initials(user.name);
    document.getElementById('profile-sub').textContent =
      [user.email, user.country].filter(Boolean).join(' · ');
    document.getElementById('profile-bio').textContent =
      user.bio || 'Add a short introduction with the Edit profile button.';
    document.getElementById('profile-country').textContent = user.country || 'Not set';
    document.getElementById('profile-major').textContent = user.major || 'Not set';
    document.getElementById('profile-student-status').textContent =
      user.studentType === 'exchange' ? 'Exchange student · ' + (user.university || 'Not set') :
        user.studentType === 'local' ? 'Local student · ' + (user.university || 'Not set') : 'Not set';

    var level = Math.floor(user.points / 400) + 1;
    var progress = user.points % 400;
    document.getElementById('profile-xp-label').textContent =
      'Level ' + level + ' · ' + user.points + ' / 400 XP';
    document.getElementById('profile-xp-track').setAttribute('aria-valuenow', String(progress / 4));
    document.getElementById('profile-xp-fill').style.width = (progress / 4) + '%';
    document.getElementById('profile-points').textContent = String(user.points);
    var badgeCatalog = window.LandedAuth.getBadgeCatalog(user);
    var badgeGrid = document.getElementById('profile-badges-grid');
    var earnedCount = badgeCatalog.filter(function (badge) { return badge.earned; }).length;
    document.getElementById('profile-badge-count').textContent =
      '· ' + earnedCount + ' of ' + badgeCatalog.length;
    badgeGrid.innerHTML = '';
    badgeCatalog.forEach(function (badge) {
      var item = document.createElement('div');
      var icon = document.createElement('div');
      var label = document.createElement('span');
      item.className = 'badge-item';
      icon.className = 'badge-hex ' + (badge.earned
        ? (badge.name === 'Campus Guide' ? 'earned-gold' : 'earned')
        : 'locked');
      icon.setAttribute('role', 'img');
      icon.setAttribute('aria-label', badge.name + ' badge — ' + (badge.earned ? 'earned' : 'locked'));
      icon.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true">' +
        badgeIcons[badge.name] + '</svg>';
      label.className = 'badge-label' + (badge.earned ? '' : ' locked-lbl');
      label.textContent = badge.name;
      item.appendChild(icon);
      item.appendChild(label);
      if (badge.name === 'Verified' || badge.name === 'Campus Guide') {
        var detail = document.createElement('span');
        detail.className = 'badge-detail' + (badge.earned ? ' earned-detail' : '');
        detail.textContent = badge.detail;
        item.appendChild(detail);
      }
      badgeGrid.appendChild(item);
    });
  }

  function showError(error) {
    status.textContent = error.message || 'Could not update your profile.';
    status.classList.add('is-error');
    status.hidden = false;
  }

  window.LandedAuth.getCurrentUser().then(function (user) {
    if (!user) {
      window.location.replace('login.html');
      return;
    }
    renderProfile(user);

    document.getElementById('edit-profile-btn').addEventListener('click', function () {
      editForm.elements.name.value = currentUser.name;
      editForm.elements.country.value = currentUser.country || '';
      editForm.elements.major.value = currentUser.major || '';
      editForm.elements.bio.value = currentUser.bio || '';
      status.hidden = true;
      dialog.showModal();
    });

    document.getElementById('close-profile-dialog').addEventListener('click', function () {
      dialog.close();
    });

    editForm.addEventListener('submit', function (event) {
      event.preventDefault();
      if (!editForm.reportValidity()) return;

      var saveButton = document.getElementById('save-profile-btn');
      saveButton.disabled = true;
      window.LandedAuth.updateCurrentUser({
        name: editForm.elements.name.value.trim(),
        country: editForm.elements.country.value.trim(),
        major: editForm.elements.major.value.trim(),
        bio: editForm.elements.bio.value.trim()
      }).then(function (updatedUser) {
        renderProfile(updatedUser);
        dialog.close();
      }).catch(showError).finally(function () {
        saveButton.disabled = false;
      });
    });

  }).catch(showError);
})();
