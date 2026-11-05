(function () {
  'use strict';

  /* ═══════════════════════════════════════════
     GATE — admin password check
     Admin password: Admin@Landed1
     ═══════════════════════════════════════════ */
  var gateEl = document.getElementById('admin-gate');
  var shellEl = document.getElementById('admin-shell');
  var gateMsg = document.getElementById('gate-message');

  function showGateError(msg) {
    gateMsg.textContent = msg;
    gateMsg.hidden = false;
  }

  function enterAdminView() {
    gateEl.hidden = true;
    gateEl.style.display = 'none';
    shellEl.hidden = false;
    shellEl.style.display = 'grid';
    loadSection('rewards');
  }

  function exitAdminView() {
    gateEl.hidden = false;
    gateEl.style.display = 'grid';
    shellEl.hidden = true;
    shellEl.style.display = 'none';
    var btn = document.getElementById('gate-btn');
    if (btn) {
      btn.disabled = false;
      btn.textContent = 'Enter Admin Panel';
    }
  }

  /* Show/hide password on gate */
  var gateInput = document.getElementById('gate-password');
  var gateToggle = document.getElementById('gate-pw-toggle');
  gateToggle.addEventListener('click', function () {
    var isText = gateInput.type === 'text';
    gateInput.type = isText ? 'password' : 'text';
    gateToggle.setAttribute('aria-label', isText ? 'Show password' : 'Hide password');
  });

  document.getElementById('gate-form').addEventListener('submit', function (e) {
    e.preventDefault();
    var pw = gateInput.value.trim();
    var btn = document.getElementById('gate-btn');

    if (!pw) {
      showGateError('Please enter the admin password.');
      return;
    }

    btn.disabled = true;
    btn.textContent = 'Checking…';
    gateMsg.hidden = true;

    if (!window.LandedAuth || typeof window.LandedAuth.adminLogin !== 'function') {
      showGateError('Authentication service not ready. Please refresh the page.');
      btn.disabled = false;
      btn.textContent = 'Enter Admin Panel';
      return;
    }

    window.LandedAuth.adminLogin(pw)
      .then(function () {
        enterAdminView();
      })
      .catch(function (err) {
        showGateError(err.message || 'Incorrect password.');
        btn.disabled = false;
        btn.textContent = 'Enter Admin Panel';
      });
  });

  /* If already authenticated, skip gate */
  try {
    if (window.LandedAuth && window.LandedAuth.adminIsLoggedIn()) {
      enterAdminView();
    } else {
      exitAdminView();
    }
  } catch (e) {
    exitAdminView();
  }

  /* Logout */
  document.getElementById('admin-logout-btn').addEventListener('click', function () {
    window.LandedAuth.adminLogout();
    window.location.reload();
  });

  /* ═══════════════════════════════════════════
     NAVIGATION
     ═══════════════════════════════════════════ */
  document.querySelectorAll('.admin-nav-item').forEach(function (btn) {
    btn.addEventListener('click', function () {
      loadSection(btn.dataset.section);
    });
  });

  function loadSection(name) {
    /* Nav highlight */
    document.querySelectorAll('.admin-nav-item').forEach(function (b) {
      b.classList.toggle('active', b.dataset.section === name);
    });
    /* Section visibility */
    document.querySelectorAll('.admin-section').forEach(function (s) {
      s.classList.toggle('active', s.id === 'section-' + name);
    });
    if (name === 'rewards') renderRewards();
    if (name === 'reports') renderReports();
  }

  /* ═══════════════════════════════════════════
     HELPERS
     ═══════════════════════════════════════════ */
  function showAdminMsg(id, msg, type) {
    var el = document.getElementById(id);
    if (!el) return;
    el.textContent = msg || '';
    el.className = 'admin-message' + (type ? ' is-' + type : '');
    el.hidden = !msg;
  }

  function formatDate(iso) {
    if (!iso) return '—';
    var d = new Date(iso);
    return isNaN(d) ? iso : d.toLocaleDateString('en-KR', { year: 'numeric', month: 'short', day: 'numeric' });
  }

  /* ═══════════════════════════════════════════
     REWARDS
     ═══════════════════════════════════════════ */
  var editingRewardId = null;

  function renderRewards() {
    var grid = document.getElementById('rewards-grid');
    grid.innerHTML = '<div class="admin-loading">Loading…</div>';
    showAdminMsg('rewards-message', '', '');

    window.LandedAuth.listRewards().then(function (rewards) {
      if (!rewards.length) {
        grid.innerHTML = '<div class="admin-empty"><svg viewBox="0 0 24 24"><polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/></svg><p>No rewards yet. Add one above.</p></div>';
        return;
      }
      grid.innerHTML = '';
      rewards.forEach(function (r) {
        grid.appendChild(buildRewardCard(r));
      });
    }).catch(function (err) {
      grid.innerHTML = '';
      showAdminMsg('rewards-message', err.message, 'error');
    });
  }

  function stockClass(stock) {
    if (stock === 0) return 'stock-out';
    if (stock <= 3) return 'stock-low';
    return 'stock-ok';
  }
  function stockLabel(stock) {
    if (stock === 0) return 'Out of stock';
    if (stock <= 3) return stock + ' left';
    return stock + ' in stock';
  }

  function buildRewardCard(r) {
    var card = document.createElement('div');
    card.className = 'reward-card';
    card.innerHTML =
      '<div class="reward-card-name">' + esc(r.name) + '</div>' +
      '<div class="reward-card-meta">' +
      '<span class="reward-stock-pill ' + stockClass(r.stock) + '">' + stockLabel(r.stock) + '</span>' +
      '&nbsp;&nbsp;<span>' + r.cost + ' pts</span>' +
      '</div>' +
      '<div class="reward-card-desc">' + esc(r.description || '') + '</div>' +
      '<div class="reward-card-collection">📍 ' + esc(r.collectionDetails || '') + '</div>' +
      '<div class="reward-card-meta" style="font-size:.75rem">Donated by: ' + esc(r.donatedBy || '—') + ' · Added ' + formatDate(r.donatedAt) + '</div>' +
      '<div class="reward-card-actions">' +
      '<button class="reward-edit-btn"   data-id="' + r.id + '">Edit</button>' +
      '<button class="reward-delete-btn" data-id="' + r.id + '">Delete</button>' +
      '</div>';

    card.querySelector('.reward-edit-btn').addEventListener('click', function () {
      openRewardDialog(r);
    });
    card.querySelector('.reward-delete-btn').addEventListener('click', function () {
      if (!confirm('Delete "' + r.name + '"? This cannot be undone.')) return;
      window.LandedAuth.adminDeleteReward(r.id).then(function () {
        showAdminMsg('rewards-message', '"' + r.name + '" deleted.', 'success');
        renderRewards();
      }).catch(function (err) {
        showAdminMsg('rewards-message', err.message, 'error');
      });
    });
    return card;
  }

  /* Add reward button */
  document.getElementById('add-reward-btn').addEventListener('click', function () {
    openRewardDialog(null);
  });

  function openRewardDialog(reward) {
    editingRewardId = reward ? reward.id : null;
    var dialog = document.getElementById('reward-dialog');
    var title = document.getElementById('reward-dialog-title');
    var saveBtn = document.getElementById('save-reward-btn');
    title.textContent = reward ? 'Edit Reward' : 'Add Reward';
    saveBtn.textContent = reward ? 'Save Changes' : 'Save Reward';
    showAdminMsg('reward-form-message', '', '');

    /* Pre-fill or clear */
    document.getElementById('r-name').value = reward ? reward.name : '';
    document.getElementById('r-cost').value = reward ? reward.cost : '';
    document.getElementById('r-stock').value = reward ? reward.stock : '';
    document.getElementById('r-description').value = reward ? reward.description : '';
    document.getElementById('r-donated-by').value = reward ? (reward.donatedBy || '') : '';
    document.getElementById('r-collection').value = reward ? reward.collectionDetails : '';

    clearDialogErrors();
    dialog.showModal();
  }

  document.getElementById('close-reward-dialog').addEventListener('click', function () {
    document.getElementById('reward-dialog').close();
  });
  document.getElementById('cancel-reward-btn').addEventListener('click', function () {
    document.getElementById('reward-dialog').close();
  });

  document.getElementById('reward-form').addEventListener('submit', function (e) {
    e.preventDefault();
    clearDialogErrors();

    var name = document.getElementById('r-name').value.trim();
    var cost = document.getElementById('r-cost').value;
    var stock = document.getElementById('r-stock').value;
    var desc = document.getElementById('r-description').value.trim();
    var donor = document.getElementById('r-donated-by').value.trim();
    var coll = document.getElementById('r-collection').value.trim();
    var valid = true;

    if (name.length < 2) { setDialogError('r-name', 'Name must be at least 2 characters.'); valid = false; }
    if (!Number.isInteger(Number(cost)) || Number(cost) < 1) { setDialogError('r-cost', 'Enter a whole number ≥ 1.'); valid = false; }
    if (!Number.isInteger(Number(stock)) || Number(stock) < 0) { setDialogError('r-stock', 'Enter a whole number ≥ 0.'); valid = false; }
    if (!coll) { setDialogError('r-collection', 'Collection details are required.'); valid = false; }
    if (!valid) return;

    var details = { name: name, cost: cost, stock: stock, description: desc, donatedBy: donor, collectionDetails: coll };
    var btn = document.getElementById('save-reward-btn');
    btn.disabled = true;

    var promise = editingRewardId
      ? window.LandedAuth.adminUpdateReward(editingRewardId, details)
      : window.LandedAuth.adminAddReward(details);

    promise.then(function () {
      document.getElementById('reward-dialog').close();
      showAdminMsg('rewards-message', editingRewardId ? 'Reward updated.' : 'Reward added successfully.', 'success');
      renderRewards();
    }).catch(function (err) {
      showAdminMsg('reward-form-message', err.message, 'error');
    }).finally(function () {
      btn.disabled = false;
    });
  });

  function setDialogError(inputId, msg) {
    var input = document.getElementById(inputId);
    var err = document.getElementById(inputId + '-error');
    if (input) input.classList.add('has-error');
    if (err) err.textContent = msg;
  }
  function clearDialogErrors() {
    ['r-name', 'r-cost', 'r-stock', 'r-collection'].forEach(function (id) {
      var el = document.getElementById(id);
      var er = document.getElementById(id + '-error');
      if (el) el.classList.remove('has-error');
      if (er) er.textContent = '';
    });
  }

  /* ═══════════════════════════════════════════
     REPORTS
     ═══════════════════════════════════════════ */
  var activeReportPostId = null;

  function renderReports() {
    var list = document.getElementById('reports-list');
    list.innerHTML = '<div class="admin-loading">Loading…</div>';
    showAdminMsg('reports-message', '', '');

    window.LandedAuth.adminListReportedPosts().then(function (posts) {
      /* Update sidebar badge */
      var badge = document.getElementById('reports-count');
      if (posts.length > 0) {
        badge.textContent = posts.length;
        badge.hidden = false;
      } else {
        badge.hidden = true;
      }

      if (!posts.length) {
        list.innerHTML = '<div class="admin-empty"><svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg><p>No reported posts. All clear!</p></div>';
        return;
      }
      list.innerHTML = '';
      posts.forEach(function (post) {
        list.appendChild(buildReportCard(post));
      });
    }).catch(function (err) {
      list.innerHTML = '';
      showAdminMsg('reports-message', err.message, 'error');
    });
  }

  document.getElementById('refresh-reports-btn').addEventListener('click', renderReports);

  function buildReportCard(post) {
    var card = document.createElement('div');
    card.className = 'report-card';
    var reasons = post.reports.map(function (r) { return r.reason; });
    var uniqueReasons = reasons.filter(function (v, i, a) { return a.indexOf(v) === i; });

    card.innerHTML =
      '<div class="report-card-head">' +
      '<div class="report-card-icon"><svg viewBox="0 0 24 24"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg></div>' +
      '<div class="report-card-info">' +
      '<div class="report-card-title">' + esc(post.title) + '</div>' +
      '<div class="report-card-meta">' + esc(post.category) + ' · by ' + esc(post.author) + ' · <strong>' + post.reports.length + ' report' + (post.reports.length !== 1 ? 's' : '') + '</strong></div>' +
      '</div>' +
      '</div>' +
      '<div class="report-reasons">' +
      uniqueReasons.map(function (r) { return '<span class="reason-pill">' + esc(r) + '</span>'; }).join('') +
      '</div>' +
      '<div class="report-card-actions">' +
      '<button class="btn-admin-ghost view-report-btn" data-id="' + post.id + '" style="flex:1">View full post</button>' +
      '<button class="btn-admin-ghost dismiss-btn" data-id="' + post.id + '">Dismiss</button>' +
      '<button class="btn-admin-danger delete-btn" data-id="' + post.id + '">Delete</button>' +
      '</div>';

    card.querySelector('.view-report-btn').addEventListener('click', function () {
      openReportDialog(post);
    });
    card.querySelector('.dismiss-btn').addEventListener('click', function () {
      dismissReports(post.id, post.title);
    });
    card.querySelector('.delete-btn').addEventListener('click', function () {
      deleteReportedPost(post.id, post.title);
    });
    return card;
  }

  function openReportDialog(post) {
    activeReportPostId = post.id;
    var body = document.getElementById('report-dialog-body');
    body.innerHTML =
      '<div class="report-post-view">' +
      '<div class="report-post-title">' + esc(post.title) + '</div>' +
      '<div class="report-post-meta">' + esc(post.category) + ' · by ' + esc(post.author) + ' · ' + formatDate(post.createdAt) + '</div>' +
      '<div class="report-post-body">' + esc(post.body) + '</div>' +
      '<div class="report-list-title">' + post.reports.length + ' Report' + (post.reports.length !== 1 ? 's' : '') + '</div>' +
      post.reports.map(function (r) {
        return '<div class="report-entry">' +
          '<div class="report-entry-reason">' + esc(r.reason) + '</div>' +
          (r.details ? '<div class="report-entry-detail">' + esc(r.details) + '</div>' : '') +
          '<div class="report-entry-by">Reported by ' + esc(r.email) + ' · ' + formatDate(r.createdAt) + '</div>' +
          '</div>';
      }).join('') +
      '</div>';

    document.getElementById('report-dialog').showModal();
  }

  document.getElementById('close-report-dialog').addEventListener('click', function () {
    document.getElementById('report-dialog').close();
  });

  document.getElementById('dismiss-reports-btn').addEventListener('click', function () {
    if (activeReportPostId) dismissReports(activeReportPostId, null, true);
  });
  document.getElementById('delete-post-btn').addEventListener('click', function () {
    if (activeReportPostId) deleteReportedPost(activeReportPostId, null, true);
  });

  function dismissReports(postId, title, fromDialog) {
    var label = title ? '"' + title + '"' : 'this post';
    if (!confirm('Dismiss all reports for ' + label + '?')) return;
    window.LandedAuth.adminDismissReports(postId).then(function () {
      if (fromDialog) document.getElementById('report-dialog').close();
      showAdminMsg('reports-message', 'Reports dismissed for ' + label + '.', 'success');
      renderReports();
    }).catch(function (err) {
      showAdminMsg('reports-message', err.message, 'error');
    });
  }

  function deleteReportedPost(postId, title, fromDialog) {
    var label = title ? '"' + title + '"' : 'this post';
    if (!confirm('Permanently delete ' + label + '? This cannot be undone.')) return;
    var btn = fromDialog ? document.getElementById('delete-post-btn') : null;
    if (btn) btn.disabled = true;
    window.LandedAuth.adminDeleteForumPost(postId).then(function () {
      if (fromDialog) document.getElementById('report-dialog').close();
      showAdminMsg('reports-message', label + ' has been deleted.', 'success');
      renderReports();
    }).catch(function (err) {
      showAdminMsg('reports-message', err.message, 'error');
      if (btn) btn.disabled = false;
    });
  }

  /* ── XSS-safe text escape ── */
  function esc(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

})();

