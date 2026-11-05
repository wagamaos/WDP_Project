(function () {
  'use strict';

  var postList = document.getElementById('forum-post-list');
  var emptyState = document.getElementById('forum-empty-state');
  var postDialog = document.getElementById('post-dialog');
  var threadDialog = document.getElementById('thread-dialog');
  var reportDialog = document.getElementById('report-dialog');
  var activeCategory = 'all';
  var activePostId;
  var currentUser;

  function showMessage(element, message, isError) {
    element.textContent = message || '';
    element.classList.toggle('is-error', Boolean(isError));
    element.hidden = !message;
  }

  function setFieldError(field, message) {
    var error = document.getElementById(field.id + '-error');
    field.classList.toggle('has-error', Boolean(message));
    field.setAttribute('aria-invalid', String(Boolean(message)));
    if (message) field.setAttribute('aria-describedby', error.id);
    else field.removeAttribute('aria-describedby');
    error.textContent = message || '';
    return !message;
  }

  function validateField(field) {
    var value = field.value.trim();
    var message = '';
    if (field.required && !value) {
      message = 'This field is required.';
    } else if (field.id === 'post-title' && (value.length < 8 || value.length > 100)) {
      message = 'Title must be between 8 and 100 characters.';
    } else if (field.id === 'post-body' && (value.length < 20 || value.length > 2000)) {
      message = 'Details must be between 20 and 2000 characters.';
    } else if (field.id === 'comment-body' && (value.length < 2 || value.length > 1000)) {
      message = 'Comment must be between 2 and 1000 characters.';
    } else if (field.id === 'report-details' && value.length > 1000) {
      message = 'Additional details must be 1000 characters or fewer.';
    }
    return setFieldError(field, message);
  }

  function validateForm(form, fields) {
    var valid = true;
    fields.forEach(function (field) {
      if (!validateField(field)) valid = false;
    });
    if (!valid) fields.filter(function (field) {
      return field.classList.contains('has-error');
    })[0].focus();
    return valid;
  }

  function bindFieldValidation(form, fields) {
    fields.forEach(function (field) {
      field.addEventListener('input', function () { validateField(field); });
      field.addEventListener('change', function () { validateField(field); });
    });
    form.addEventListener('reset', function () {
      window.setTimeout(function () {
        fields.forEach(function (field) { setFieldError(field, ''); });
      }, 0);
    });
  }

  function formatTime(dateString) {
    var minutes = Math.max(1, Math.floor((Date.now() - new Date(dateString).getTime()) / 60000));
    if (minutes < 60) return minutes + 'm ago';
    if (minutes < 1440) return Math.floor(minutes / 60) + 'h ago';
    return Math.floor(minutes / 1440) + 'd ago';
  }

  function categoryClass(category) {
    return category === 'Food' ? 'gold' : category === 'Money' ? 'mint' : 'blue';
  }

  function iconForCategory(category) {
    var icons = {
      Housing: '<path d="M3 12L12 3l9 9"/><path d="M9 21V12h6v9"/>',
      Food: '<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>',
      Visas: '<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
      Money: '<rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/>',
      Study: '<rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/>',
      Other: '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>'
    };
    return icons[category] || icons.Other;
  }

  function makeLikeButton(postId, commentId, likes) {
    var button = document.createElement('button');
    likes = Array.isArray(likes) ? likes : [];
    var liked = currentUser && likes.indexOf(currentUser.email) !== -1;
    button.type = 'button';
    button.className = 'forum-like-btn' + (liked ? ' liked' : '');
    button.setAttribute('aria-pressed', String(liked));
    button.setAttribute('aria-label', (commentId ? 'Like comment' : 'Like post') + ' (' + likes.length + ')');
    button.title = currentUser ? 'Like or unlike this ' + (commentId ? 'comment' : 'post') : 'Log in to like';
    button.textContent = (liked ? '♥ Liked' : '♡ Like') + ' (' + likes.length + ')';
    button.addEventListener('click', function () {
      window.LandedAuth.toggleForumLike(postId, commentId).then(function (post) {
        renderThread(post);
        refreshPosts();
      }).catch(function (error) {
        showMessage(document.getElementById('comment-message'), error.message, true);
      });
    });
    return button;
  }

  function makeHelpfulButton(post, comment) {
    if (!currentUser || currentUser.email !== post.authorEmail ||
        currentUser.email === comment.authorEmail) return null;
    var button = document.createElement('button');
    var marked = (comment.helpfulBy || []).indexOf(currentUser.email) !== -1;
    button.type = 'button';
    button.className = 'forum-helpful-btn';
    button.textContent = marked ? 'Helpful ✓' : 'Mark helpful';
    button.disabled = marked;
    button.addEventListener('click', function () {
      window.LandedAuth.markForumCommentHelpful(post.id, comment.id).then(function (updatedPost) {
        renderThread(updatedPost);
      }).catch(function (error) {
        showMessage(document.getElementById('comment-message'), error.message, true);
      });
    });
    return button;
  }

  function renderPosts(posts) {
    postList.innerHTML = '';
    var visiblePosts = posts.filter(function (post) {
      return activeCategory === 'all' || post.category === activeCategory;
    });
    emptyState.hidden = visiblePosts.length > 0;

    visiblePosts.forEach(function (post) {
      var item = document.createElement('li');
      var icon = document.createElement('div');
      var body = document.createElement('div');
      var title = document.createElement('button');
      var meta = document.createElement('div');
      var pill = document.createElement('span');

      item.className = 'forum-post-item';
      item.dataset.category = post.category;
      icon.className = 'forum-post-icon ' + categoryClass(post.category);
      icon.setAttribute('aria-hidden', 'true');
      icon.innerHTML = '<svg viewBox="0 0 24 24">' + iconForCategory(post.category) + '</svg>';
      body.className = 'forum-post-body';
      title.type = 'button';
      title.className = 'forum-post-title';
      title.textContent = post.title;
      title.addEventListener('click', function () { openThread(post.id); });
      meta.className = 'forum-post-meta';
      meta.textContent = post.category + ' · ' + post.comments.length + ' replies · ' + formatTime(post.createdAt);
      pill.className = 'forum-post-pill ' + (post.comments.length ? 'answered' : 'chat');
      pill.textContent = post.comments.length ? 'Answered' : 'Chat';
      body.appendChild(title);
      body.appendChild(meta);
      item.appendChild(icon);
      item.appendChild(body);
      item.appendChild(pill);
      postList.appendChild(item);
    });
  }

  function refreshPosts() {
    return window.LandedAuth.listForumPosts().then(renderPosts).catch(function (error) {
      showMessage(document.getElementById('post-message'), error.message, true);
    });
  }

  function renderThread(post) {
    var content = document.getElementById('thread-content');
    var comments = document.getElementById('thread-comments');
    var title = document.getElementById('thread-dialog-title');
    var article = document.createElement('article');
    var heading = document.createElement('h2');
    var meta = document.createElement('p');
    var body = document.createElement('p');
    var actions = document.createElement('div');
    var category = document.createElement('span');

    title.textContent = post.title;
    content.innerHTML = '';
    heading.textContent = post.title;
    meta.className = 'forum-thread-meta';
    meta.textContent = post.category + ' · ' + post.author + ' · ' + formatTime(post.createdAt);
    body.className = 'forum-thread-body';
    body.textContent = post.body;
    category.className = 'forum-thread-category';
    category.textContent = post.category;
    actions.className = 'forum-thread-actions';
    actions.appendChild(makeLikeButton(post.id, null, post.likes));
    article.appendChild(category);
    article.appendChild(heading);
    article.appendChild(meta);
    article.appendChild(body);
    article.appendChild(actions);
    content.appendChild(article);

    comments.innerHTML = '';
    if (!post.comments.length) {
      var empty = document.createElement('p');
      empty.className = 'forum-no-comments';
      empty.textContent = 'No comments yet. Start the conversation.';
      comments.appendChild(empty);
    }
    post.comments.forEach(function (comment) {
      var commentElement = document.createElement('article');
      var commentHeader = document.createElement('div');
      var commentAuthor = document.createElement('strong');
      var commentTime = document.createElement('span');
      var commentBody = document.createElement('p');
      commentElement.className = 'forum-comment';
      commentHeader.className = 'forum-comment-header';
      commentAuthor.textContent = comment.author;
      commentTime.textContent = formatTime(comment.createdAt);
      commentBody.textContent = comment.body;
      commentHeader.appendChild(commentAuthor);
      commentHeader.appendChild(commentTime);
      commentElement.appendChild(commentHeader);
      commentElement.appendChild(commentBody);
      commentElement.appendChild(makeLikeButton(post.id, comment.id, comment.likes));
      var helpfulButton = makeHelpfulButton(post, comment);
      if (helpfulButton) commentElement.appendChild(helpfulButton);
      comments.appendChild(commentElement);
    });
  }

  function openThread(postId) {
    activePostId = postId;
    window.LandedAuth.getForumPost(postId).then(function (post) {
      if (!post) throw new Error('This post is no longer available.');
      renderThread(post);
      threadDialog.showModal();
    }).catch(function (error) {
      showMessage(document.getElementById('comment-message'), error.message, true);
    });
  }

  function bindCategoryTabs() {
    document.querySelectorAll('.forum-tab').forEach(function (tab) {
      tab.addEventListener('click', function () {
        document.querySelectorAll('.forum-tab').forEach(function (item) {
          item.classList.remove('active');
          item.setAttribute('aria-selected', 'false');
        });
        tab.classList.add('active');
        tab.setAttribute('aria-selected', 'true');
        activeCategory = tab.dataset.category;
        refreshPosts();
      });
    });
  }

  function renderUserBanner(user) {
    var banner = document.querySelector('.forum-guest-banner');
    var heading = banner.querySelector('strong');
    var description = banner.querySelector('.forum-guest-text span');
    var actions = banner.querySelector('.forum-guest-actions');
    if (user) {
      banner.setAttribute('aria-label', 'Signed-in forum notice');
      heading.textContent = 'You are signed in as ' + user.name;
      description.textContent = 'Create posts, join discussions, and earn points for helpful answers.';
      actions.hidden = true;
      actions.style.display = 'none';
      return;
    }
    banner.setAttribute('aria-label', 'Guest browsing notice');
    heading.textContent = 'You are browsing as a guest';
    description.textContent = 'Log in to post, reply, and earn points for helpful answers.';
    actions.hidden = false;
    actions.style.display = '';
  }

  document.getElementById('new-post-btn').addEventListener('click', function () {
    if (!currentUser) {
      window.location.href = 'login.html';
      return;
    }
    document.getElementById('post-form').reset();
    showMessage(document.getElementById('post-message'), '', false);
    postDialog.showModal();
  });

  document.getElementById('close-post-dialog').addEventListener('click', function () {
    postDialog.close();
  });
  document.getElementById('close-thread-dialog').addEventListener('click', function () {
    threadDialog.close();
  });
  document.getElementById('report-post-btn').addEventListener('click', function () {
    if (!currentUser) {
      window.location.href = 'login.html';
      return;
    }
    document.getElementById('report-form').reset();
    showMessage(document.getElementById('report-message'), '', false);
    reportDialog.showModal();
  });
  document.getElementById('close-report-dialog').addEventListener('click', function () {
    reportDialog.close();
  });

  document.getElementById('post-form').addEventListener('submit', function (event) {
    event.preventDefault();
    var form = event.target;
    if (!validateForm(form, [
      form.elements.category, form.elements.title, form.elements.body
    ])) return;
    var button = document.getElementById('submit-post-btn');
    button.disabled = true;
    window.LandedAuth.createForumPost({
      category: form.elements.category.value,
      title: form.elements.title.value,
      body: form.elements.body.value
    }).then(function (post) {
      postDialog.close();
      form.reset();
      return refreshPosts().then(function () { openThread(post.id); });
    }).catch(function (error) {
      showMessage(document.getElementById('post-message'), error.message, true);
    }).finally(function () {
      button.disabled = false;
    });
  });

  document.getElementById('comment-form').addEventListener('submit', function (event) {
    event.preventDefault();
    var form = event.target;
    if (!validateForm(form, [form.elements.body])) return;
    var button = document.getElementById('submit-comment-btn');
    button.disabled = true;
    window.LandedAuth.addForumComment(activePostId, form.elements.body.value).then(function (post) {
      form.reset();
      showMessage(document.getElementById('comment-message'), '', false);
      renderThread(post);
      return refreshPosts();
    }).catch(function (error) {
      showMessage(document.getElementById('comment-message'), error.message, true);
    }).finally(function () {
      button.disabled = false;
    });
  });

  document.getElementById('report-form').addEventListener('submit', function (event) {
    event.preventDefault();
    var form = event.target;
    if (!validateForm(form, [form.elements.reason, form.elements.details])) return;
    var button = document.getElementById('submit-report-btn');
    button.disabled = true;
    window.LandedAuth.reportForumPost(
      activePostId,
      form.elements.reason.value,
      form.elements.details.value
    ).then(function () {
      reportDialog.close();
      showMessage(document.getElementById('comment-message'), 'Thanks. Your report was sent to the moderators.', false);
    }).catch(function (error) {
      showMessage(document.getElementById('report-message'), error.message, true);
    }).finally(function () {
      button.disabled = false;
    });
  });

  window.LandedAuth.getCurrentUser().then(function (user) {
    currentUser = user;
    bindFieldValidation(document.getElementById('post-form'), [
      document.getElementById('post-category'),
      document.getElementById('post-title'),
      document.getElementById('post-body')
    ]);
    bindFieldValidation(document.getElementById('comment-form'), [
      document.getElementById('comment-body')
    ]);
    bindFieldValidation(document.getElementById('report-form'), [
      document.getElementById('report-reason'),
      document.getElementById('report-details')
    ]);
    renderUserBanner(user);
    bindCategoryTabs();
    return refreshPosts();
  }).catch(function (error) {
    showMessage(document.getElementById('post-message'), error.message, true);
  });
})();
