(function () {
  'use strict';

  var currentUser;
  var badgeGrid = document.getElementById('rewards-badges-grid');
  var leaderboard = document.getElementById('leaderboard-list');
  var successDialog = document.getElementById('redeem-success-dialog');
  var successMessage = document.getElementById('redeem-success-message');
  var rewardList = document.getElementById('redeem-list');
  var rewardsEmpty = document.getElementById('rewards-empty');
  var rewardDetailsDialog = document.getElementById('reward-details-dialog');
  var rewardDetailsContent = document.getElementById('reward-details-content');
  var detailsRedeemButton = document.getElementById('details-redeem-btn');
  var rewards;
  var selectedReward;
  var donateForm = document.getElementById('donate-form');
  var donateMessage = document.getElementById('donate-message');

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

  function syncRewardButtons() {
    if (!rewards) return;
    document.querySelectorAll('.redeem-btn').forEach(function (button) {
      var reward = rewards.find(function (item) { return item.id === button.dataset.rewardId; });
      var cost = reward.cost;
      var affordable = (currentUser.points || 0) >= cost;
      var available = reward.stock > 0;
      button.disabled = !affordable || !available;
      button.textContent = !available ? 'Out of stock' :
        (affordable ? 'Redeem' : 'Need ' + (cost - (currentUser.points || 0)) + ' pts');
      button.title = !available ? 'This reward is out of stock' :
        (affordable ? 'Redeem for ' + cost + ' points' : 'You need ' + (cost - (currentUser.points || 0)) + ' more points');
    });
  }

  function renderRewards() {
    rewardList.innerHTML = '';
    rewardsEmpty.hidden = rewards.length > 0;
    rewards.forEach(function (reward) {
      var item = document.createElement('li');
      item.className = 'redeem-item';
      item.innerHTML = '<button class="reward-details-button" type="button">' +
        '<span class="redeem-visual" aria-hidden="true"></span>' +
        '<span class="redeem-info"><span class="redeem-name"></span><span class="redeem-cost"></span></span>' +
        '</button>';
      item.querySelector('.redeem-name').textContent = reward.name;
      item.querySelector('.redeem-cost').textContent = reward.cost + ' pts';
      if (reward.image && reward.image.dataUrl) {
        var image = document.createElement('img');
        image.className = 'redeem-image';
        image.src = reward.image.dataUrl;
        image.alt = reward.name;
        item.querySelector('.redeem-visual').appendChild(image);
      } else {
        item.querySelector('.redeem-visual').innerHTML =
          '<svg viewBox="0 0 24 24"><polyline points="20 12 20 22 4 22 4 12"/>' +
          '<rect x="2" y="7" width="20" height="5"/></svg>';
      }
      var button = item.querySelector('.reward-details-button');
      button.setAttribute('aria-label', 'View details for ' + reward.name);
      button.addEventListener('click', function () { openRewardDetails(reward); });
      rewardList.appendChild(item);
    });
    syncRewardButtons();
  }

  function openRewardDetails(reward) {
    selectedReward = reward;
    rewardDetailsContent.innerHTML = '';
    var heading = document.createElement('h2');
    var description = document.createElement('p');
    var meta = document.createElement('div');
    var collection = document.createElement('p');
    heading.id = 'reward-details-title';
    heading.textContent = reward.name;
    description.className = 'reward-details-description';
    description.textContent = reward.description || 'A community-donated reward for students.';
    meta.className = 'reward-details-meta';
    meta.innerHTML = '<div><span class="reward-detail-label">Donated by</span><span class="reward-detail-value reward-donor"></span></div>' +
      '<div><span class="reward-detail-label">Donated on</span><span class="reward-detail-value reward-date"></span></div>' +
      '<div><span class="reward-detail-label">Cost</span><span class="reward-detail-value reward-points"></span></div>' +
      '<div><span class="reward-detail-label">Availability</span><span class="reward-detail-value reward-availability"></span></div>';
    meta.querySelector('.reward-donor').textContent = reward.donatedBy || 'Landed community';
    meta.querySelector('.reward-date').textContent = formatRewardDate(reward.donatedAt);
    meta.querySelector('.reward-points').textContent = reward.cost + ' points';
    meta.querySelector('.reward-availability').textContent = reward.stock + ' available';
    collection.className = 'reward-details-collection';
    collection.textContent = reward.collectionDetails;
    rewardDetailsContent.appendChild(heading);
    if (reward.image && reward.image.dataUrl) {
      var image = document.createElement('img');
      image.className = 'reward-details-image';
      image.src = reward.image.dataUrl;
      image.alt = reward.name;
      rewardDetailsContent.appendChild(image);
    }
    rewardDetailsContent.appendChild(description);
    rewardDetailsContent.appendChild(meta);
    rewardDetailsContent.appendChild(collection);
    var affordable = (currentUser.points || 0) >= reward.cost && reward.stock > 0;
    detailsRedeemButton.disabled = !affordable;
    detailsRedeemButton.textContent = reward.stock < 1 ? 'Out of stock' :
      (affordable ? 'Redeem for ' + reward.cost + ' points' : 'Need ' + (reward.cost - currentUser.points) + ' more points');
    rewardDetailsDialog.showModal();
  }

  function formatRewardDate(value) {
    var date = value ? new Date(value) : null;
    return date && !isNaN(date.getTime()) ? date.toLocaleDateString(undefined, {
      year: 'numeric', month: 'long', day: 'numeric'
    }) : 'Date not provided';
  }

  function redeem(button) {
    button.disabled = true;
    window.LandedAuth.redeemReward(button.dataset.rewardId).then(function (result) {
      currentUser = result.user;
      rewards = rewards.map(function (reward) {
        return reward.id === result.redemption.rewardId ? Object.assign({}, reward, { stock: reward.stock - 1 }) : reward;
      });
      renderPoints(currentUser);
      renderBadges(currentUser);
      renderRewards();
      successMessage.textContent = 'Your ' + result.redemption.rewardName +
        ' is ready for collection at your school office on ' +
        new Date(result.redemption.collectionDate).toLocaleDateString() +
        '. A confirmation email will be sent to ' + result.redemption.email +
        ' to track this redemption.';
      successDialog.showModal();
      return window.LandedAuth.listLeaderboard().then(renderLeaderboard);
    }).catch(function (error) {
      syncRewardButtons();
      window.alert(error.message);
    });
  }

  function renderBadges(user) {
    badgeGrid.innerHTML = '';
    window.LandedAuth.getBadgeCatalog(user).forEach(function (badge) {
      var item = document.createElement('div');
      var icon = document.createElement('div');
      var label = document.createElement('span');
      item.className = 'badge-item';
      icon.className = 'badge-hex ' + (badge.earned ? 'earned' : 'locked');
      icon.setAttribute('role', 'img');
      icon.setAttribute('aria-label', badge.name + ' badge - ' + (badge.earned ? 'earned' : 'locked'));
      icon.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true">' +
        (badge.earned ? badgeIcons[badge.name] : '<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>') +
        '</svg>';
      label.className = 'badge-label' + (badge.earned ? '' : ' locked-lbl');
      label.textContent = badge.name;
      item.appendChild(icon);
      item.appendChild(label);
      badgeGrid.appendChild(item);
    });
    document.querySelector('.badge-count').textContent =
      '· ' + window.LandedAuth.getBadgeCatalog(user).filter(function (badge) { return badge.earned; }).length + ' of 9';
  }

  function renderLeaderboard(users) {
    leaderboard.innerHTML = '';
    users.forEach(function (user, index) {
      var item = document.createElement('li');
      item.className = 'lb-item' + (currentUser && user.email === currentUser.email ? ' lb-you' : '');
      item.innerHTML = '<div class="lb-rank" aria-label="Rank ' + (index + 1) + '">' +
        (index + 1) + '</div><span class="lb-name"></span><span class="lb-pts"></span>';
      item.querySelector('.lb-name').textContent = user.name;
      item.querySelector('.lb-pts').textContent = user.points + ' pts';
      leaderboard.appendChild(item);
    });
    var rank = users.findIndex(function (user) { return currentUser && user.email === currentUser.email; });
    document.getElementById('lb-hint').textContent =
      rank < 0 ? 'Your total accumulated points determine your rank.' :
        'Rank #' + (rank + 1) + ' · ' + currentUser.points + ' total accumulated points';
  }

  function setDonateMessage(message, isError) {
    donateMessage.textContent = message || '';
    donateMessage.classList.toggle('is-error', Boolean(isError));
    donateMessage.hidden = !message;
  }

  function setDonateFieldError(field, message) {
    var error = document.getElementById(field.id + '-error');
    field.classList.toggle('has-error', Boolean(message));
    field.setAttribute('aria-invalid', String(Boolean(message)));
    if (message) field.setAttribute('aria-describedby', error.id);
    else field.removeAttribute('aria-describedby');
    error.textContent = message || '';
    return !message;
  }

  function validateDonateField(field) {
    var value = field.type === 'checkbox' ? field.checked : field.value.trim();
    var message = '';
    if (field.required && !value) {
      message = field.type === 'checkbox' ? 'You must confirm the item was left with the school office.' : 'This field is required.';
    } else if (field.id === 'donate-name' && (value.length < 2 || value.length > 100)) {
      message = 'Reward name must be between 2 and 100 characters.';
    } else if (field.id === 'donate-description' && value.length > 1000) {
      message = 'Description must be 1000 characters or fewer.';
    } else if (field.id === 'donate-points' && (!Number.isInteger(Number(value)) || Number(value) < 1 || Number(value) > 500)) {
      message = 'Points must be a whole number between 1 and 500.';
    }
    return setDonateFieldError(field, message);
  }

  function validateDonateForm() {
    var fields = Array.from(donateForm.querySelectorAll('input, textarea'));
    var valid = true;
    fields.forEach(function (field) {
      if (!validateDonateField(field)) valid = false;
    });
    if (!valid) {
      fields.filter(function (field) { return field.classList.contains('has-error'); })[0].focus();
    }
    return valid;
  }

  function renderPoints(user) {
    var points = user.points || 0;
    document.querySelector('.rewards-ring-wrap').setAttribute(
      'aria-label', 'Total accumulated points: ' + points
    );
    document.querySelector('.rewards-xp-pts').textContent = points + ' pts';
    document.querySelector('.rewards-xp-label').textContent = 'Total accumulated points';
    syncRewardButtons();
  }

  window.LandedAuth.getCurrentUser().then(function (user) {
    if (!user) {
      window.location.replace('login.html');
      return;
    }
    currentUser = user;
    renderPoints(user);
    renderBadges(user);
    return Promise.all([
      window.LandedAuth.listLeaderboard(),
      window.LandedAuth.listRewards()
    ]);
  }).then(function (results) {
    if (results) {
      renderLeaderboard(results[0]);
      rewards = results[1];
      renderRewards();
    }
  }).catch(function (error) {
    window.alert(error.message || 'Could not load rewards.');
  });

  document.getElementById('close-redeem-success').addEventListener('click', function () {
    successDialog.close();
  });
  document.getElementById('close-redeem-success-x').addEventListener('click', function () {
    successDialog.close();
  });
  document.getElementById('close-reward-details').addEventListener('click', function () {
    rewardDetailsDialog.close();
  });
  detailsRedeemButton.addEventListener('click', function () {
    if (!selectedReward) return;
    rewardDetailsDialog.close();
    var button = document.createElement('button');
    button.dataset.rewardId = selectedReward.id;
    redeem(button);
  });

  document.getElementById('donate-reward-btn').addEventListener('click', function () {
    document.getElementById('donate-dialog').showModal();
  });
  document.getElementById('close-donate').addEventListener('click', function () {
    document.getElementById('donate-dialog').close();
  });
  document.getElementById('close-donate-x').addEventListener('click', function () {
    document.getElementById('donate-dialog').close();
  });
  donateForm.querySelectorAll('input, textarea').forEach(function (field) {
    field.addEventListener('input', function () { validateDonateField(field); });
    field.addEventListener('change', function () { validateDonateField(field); });
  });
  donateForm.addEventListener('reset', function () {
    window.setTimeout(function () {
      donateForm.querySelectorAll('input, textarea').forEach(function (field) {
        setDonateFieldError(field, '');
      });
      setDonateMessage('', false);
    }, 0);
  });
  donateForm.addEventListener('submit', function (event) {
    event.preventDefault();
    var form = event.currentTarget;
    setDonateMessage('', false);
    if (!validateDonateForm()) return;
    window.LandedAuth.donateReward({
      name: form.elements.name.value,
      description: form.elements.description.value,
      schoolOffice: form.elements.schoolOffice.value,
      collectionDate: form.elements.collectionDate.value,
      points: form.elements.points.value,
      confirmed: form.elements.confirmed.checked
    }).then(function (result) {
      currentUser = result.user;
      renderPoints(currentUser);
      renderBadges(currentUser);
      form.reset();
      document.getElementById('donate-dialog').close();
      window.alert('Donation recorded. ' + result.donation.points + ' points were added to your balance.');
      return window.LandedAuth.listLeaderboard().then(renderLeaderboard);
    }).catch(function (error) {
      setDonateMessage(error.message, true);
    });
  });
})();
