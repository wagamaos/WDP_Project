(function () {
  'use strict';

  var dialog = document.getElementById('profile-dialog');
  var editForm = document.getElementById('profile-edit-form');
  var status = document.getElementById('profile-message');
  var currentUser;

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

    var level = Math.floor(user.points / 400) + 1;
    var progress = user.points % 400;
    document.getElementById('profile-xp-label').textContent =
      'Level ' + level + ' · ' + user.points + ' / 400 XP';
    document.getElementById('profile-xp-track').setAttribute('aria-valuenow', String(progress / 4));
    document.getElementById('profile-xp-fill').style.width = (progress / 4) + '%';
    document.getElementById('profile-points').textContent = String(user.points);
    document.getElementById('profile-badge-count').textContent = '· 0 of 8';
    document.querySelectorAll('.badges-grid .badge-hex').forEach(function (badge) {
      var label = badge.parentElement.querySelector('.badge-label');
      badge.classList.remove('earned', 'earned-gold');
      badge.classList.add('locked');
      badge.setAttribute('aria-label', label.textContent.trim() + ' badge — locked');
      label.classList.add('locked-lbl');
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

    document.getElementById('logout-link').addEventListener('click', function (event) {
      event.preventDefault();
      window.LandedAuth.logout();
      window.location.href = 'login.html';
    });
  }).catch(showError);
})();
