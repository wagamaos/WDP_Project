(function () {
  'use strict';

  var DATABASE_NAME = 'landed-local';
  var DATABASE_VERSION = 2;
  var SESSION_KEY = 'landed-user-email';
  var databasePromise;

  function openDatabase() {
    if (!window.indexedDB) {
      return Promise.reject(new Error('This browser does not support the local database.'));
    }

    if (!databasePromise) {
      databasePromise = new Promise(function (resolve, reject) {
        var request = window.indexedDB.open(DATABASE_NAME, DATABASE_VERSION);

        request.onupgradeneeded = function () {
          var database = request.result;
          if (!database.objectStoreNames.contains('users')) {
            database.createObjectStore('users', { keyPath: 'email' });
          }
          if (!database.objectStoreNames.contains('forumPosts')) {
            database.createObjectStore('forumPosts', { keyPath: 'id' });
          }
        };
        request.onsuccess = function () { resolve(request.result); };
        request.onerror = function () {
          databasePromise = null;
          reject(request.error || new Error('Could not open the local database.'));
        };
      });
    }

    return databasePromise;
  }

  function runTransaction(mode, operation) {
    return openDatabase().then(function (database) {
      return new Promise(function (resolve, reject) {
        var transaction;
        var result;
        var settled = false;

        function fail(error) {
          if (!settled) {
            settled = true;
            reject(error || new Error('The local database operation failed.'));
          }
        }

        try {
          transaction = database.transaction('users', mode);
          var request = operation(transaction.objectStore('users'));
          request.onsuccess = function () { result = request.result; };
          request.onerror = function () { fail(request.error); };
          transaction.oncomplete = function () {
            if (!settled) {
              settled = true;
              resolve(result);
            }
          };
          transaction.onerror = function () { fail(transaction.error); };
          transaction.onabort = function () { fail(transaction.error); };
        } catch (error) {
          fail(error);
        }
      });
    });
  }

  function toHex(bytes) {
    return Array.from(new Uint8Array(bytes)).map(function (byte) {
      return byte.toString(16).padStart(2, '0');
    }).join('');
  }

  function hashPassword(password, salt) {
    if (!window.crypto || !window.crypto.subtle) {
      return Promise.reject(new Error('Password protection requires a secure browser context. Open this site through localhost or HTTPS.'));
    }

    var encoder = new TextEncoder();
    return window.crypto.subtle.importKey(
      'raw',
      encoder.encode(password),
      'PBKDF2',
      false,
      ['deriveBits']
    ).then(function (key) {
      return window.crypto.subtle.deriveBits({
        name: 'PBKDF2',
        salt: salt,
        iterations: 210000,
        hash: 'SHA-256'
      }, key, 256);
    }).then(toHex);
  }

  function createPasswordSalt() {
    var salt = new Uint8Array(16);
    window.crypto.getRandomValues(salt);
    return salt;
  }

  function publicUser(user) {
    if (!user) return null;
    return {
      email: user.email,
      name: user.name,
      country: user.country,
      major: user.major,
      bio: user.bio,
      languages: user.languages,
      university: user.university || '',
      studentType: user.studentType || '',
      studyStartDate: user.studyStartDate || '',
      helpfulAnswers: user.helpfulAnswers || 0,
      points: user.points,
      completedQuests: user.completedQuests || [],
      createdAt: user.createdAt
    };
  }

  function getUser(email) {
    return runTransaction('readonly', function (store) {
      return store.get(email);
    });
  }

  function saveUser(user) {
    return runTransaction('readwrite', function (store) {
      return store.put(user);
    });
  }

  function createId(prefix) {
    return prefix + '-' + Date.now().toString(36) + '-' +
      Math.random().toString(36).slice(2, 10);
  }

  function seedForumPosts(store) {
    var now = Date.now();
    [
      {
        id: 'post-1',
        category: 'Housing',
        title: 'Is there a good place to find affordable shared apartments?',
        body: 'I am looking for a shared apartment close to campus for the next semester. Which websites or groups have worked well for you?',
        author: 'Landed Community',
        authorEmail: 'community@landed.local',
        createdAt: new Date(now - 2 * 60 * 60 * 1000).toISOString(),
        likes: ['community@landed.local'],
        comments: [
          { id: 'comment-1', author: 'Landed Community', authorEmail: 'community@landed.local', body: 'Try checking your university housing board and always view a place in person before paying a deposit.', createdAt: new Date(now - 90 * 60 * 1000).toISOString(), likes: [], helpfulBy: [] }
        ],
        reports: []
      },
      {
        id: 'post-2',
        category: 'Food',
        title: 'Best food spots near campus?',
        body: 'What are your favorite affordable places to eat near campus? Bonus points for late-night options.',
        author: 'Landed Community',
        authorEmail: 'community@landed.local',
        createdAt: new Date(now - 4 * 60 * 60 * 1000).toISOString(),
        likes: [],
        comments: [],
        reports: []
      },
      {
        id: 'post-3',
        category: 'Visas',
        title: 'Do I need to apply for a visa extension for summer?',
        body: 'My current visa expires during the summer break. Has anyone completed an extension recently, and what documents did you need?',
        author: 'Landed Community',
        authorEmail: 'community@landed.local',
        createdAt: new Date(now - 6 * 60 * 60 * 1000).toISOString(),
        likes: [],
        comments: [],
        reports: []
      },
      {
        id: 'post-4',
        category: 'Other',
        title: 'How do you deal with homesickness?',
        body: 'I would appreciate practical ideas for building a routine and meeting people while adjusting to a new country.',
        author: 'Landed Community',
        authorEmail: 'community@landed.local',
        createdAt: new Date(now - 8 * 60 * 60 * 1000).toISOString(),
        likes: [],
        comments: [],
        reports: []
      },
      {
        id: 'post-5',
        category: 'Money',
        title: "What's the best student bank account here?",
        body: 'Which banks have been easiest for international students to open an account with?',
        author: 'Landed Community',
        authorEmail: 'community@landed.local',
        createdAt: new Date(now - 24 * 60 * 60 * 1000).toISOString(),
        likes: [],
        comments: [],
        reports: []
      },
      {
        id: 'post-6',
        category: 'Study',
        title: 'Tips for studying in the library during peak hours?',
        body: 'How early do you arrive to get a seat, and are there quieter areas you recommend?',
        author: 'Landed Community',
        authorEmail: 'community@landed.local',
        createdAt: new Date(now - 2 * 24 * 60 * 60 * 1000).toISOString(),
        likes: [],
        comments: [],
        reports: []
      }
    ].forEach(function (post) { store.add(post); });
  }

  function copyForumPost(post) {
    return post ? JSON.parse(JSON.stringify(post)) : null;
  }

  function runForumTransaction(mode, operation) {
    return openDatabase().then(function (database) {
      return new Promise(function (resolve, reject) {
        var transaction;
        var result;
        var settled = false;

        function fail(error) {
          if (!settled) {
            settled = true;
            reject(error || new Error('The forum database operation failed.'));
          }
        }

        try {
          transaction = database.transaction('forumPosts', mode);
          var request = operation(transaction.objectStore('forumPosts'));
          request.onsuccess = function () { result = request.result; };
          request.onerror = function () { fail(request.error); };
          transaction.oncomplete = function () {
            if (!settled) {
              settled = true;
              resolve(result);
            }
          };
          transaction.onerror = function () { fail(transaction.error); };
          transaction.onabort = function () { fail(transaction.error); };
        } catch (error) {
          fail(error);
        }
      });
    });
  }

  function requireForumUser() {
    return getCurrentUser().then(function (user) {
      if (!user) throw new Error('Please log in to participate in the forum.');
      return user;
    });
  }

  function getForumPost(id) {
    return runForumTransaction('readonly', function (store) {
      return store.get(id);
    }).then(copyForumPost);
  }

  function listForumPosts() {
    return runForumTransaction('readonly', function (store) {
      return store.getAll();
    }).then(function (posts) {
      return posts.map(copyForumPost).sort(function (a, b) {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
    });
  }

  function createForumPost(details) {
    return requireForumUser().then(function (user) {
      var categories = ['Housing', 'Visas', 'Money', 'Food', 'Study', 'Other'];
      if (categories.indexOf(details.category) === -1 || !details.title || details.title.trim().length < 8 ||
          details.title.trim().length > 100 || !details.body ||
          details.body.trim().length < 20 || details.body.trim().length > 2000) {
        throw new Error('Please provide a valid channel, an 8–100 character title, and 20–2000 characters of detail.');
      }
      var post = {
        id: createId('post'),
        category: details.category,
        title: details.title.trim(),
        body: details.body.trim(),
        author: user.name,
        authorEmail: user.email,
        createdAt: new Date().toISOString(),
        likes: [],
        comments: [],
        reports: []
      };
      return runForumTransaction('readwrite', function (store) {
        return store.add(post);
      }).then(function () { return copyForumPost(post); });
    });
  }

  function addForumComment(postId, body) {
    return requireForumUser().then(function (user) {
      if (!body || body.trim().length < 2 || body.trim().length > 1000) {
        throw new Error('Comments must be between 2 and 1000 characters.');
      }
      return getForumPost(postId).then(function (post) {
        if (!post) throw new Error('This post is no longer available.');
        post.comments.push({
          id: createId('comment'),
          author: user.name,
          authorEmail: user.email,
          body: body.trim(),
          createdAt: new Date().toISOString(),
          likes: []
        });
        return runForumTransaction('readwrite', function (store) {
          return store.put(post);
        }).then(function () { return copyForumPost(post); });
      });
    });
  }

  function toggleForumLike(postId, commentId) {
    return requireForumUser().then(function (user) {
      return getForumPost(postId).then(function (post) {
        if (!post) throw new Error('This post is no longer available.');
        var target = commentId
          ? post.comments.find(function (comment) { return comment.id === commentId; })
          : post;
        if (!target) throw new Error('This comment is no longer available.');
        target.likes = Array.isArray(target.likes) ? target.likes : [];
        var index = target.likes.indexOf(user.email);
        if (index === -1) target.likes.push(user.email);
        else target.likes.splice(index, 1);
        return runForumTransaction('readwrite', function (store) {
          return store.put(post);
        }).then(function () { return copyForumPost(post); });
      });
    });
  }

  function reportForumPost(postId, reason, details) {
    return requireForumUser().then(function (user) {
      if (!reason || (details && details.trim().length > 1000)) {
        throw new Error('Please choose a report reason and keep details under 1000 characters.');
      }

      return getForumPost(postId).then(function (post) {
        if (!post) throw new Error('This post is no longer available.');
        if (post.reports.some(function (report) { return report.email === user.email; })) {
          throw new Error('You have already reported this post.');
        }

        post.reports.push({
          email: user.email,
          reason: reason,
          details: details.trim(),
          createdAt: new Date().toISOString()
        });
        return runForumTransaction('readwrite', function (store) {
          return store.put(post);
        }).then(function () { return copyForumPost(post); });
      });
    });
  }

  function markForumCommentHelpful(postId, commentId) {
    return requireForumUser().then(function (user) {
      return getForumPost(postId).then(function (post) {
        if (!post) throw new Error('This post is no longer available.');
        if (post.authorEmail !== user.email) {
          throw new Error('Only the post author can mark an answer helpful.');
        }
        var comment = post.comments.find(function (item) { return item.id === commentId; });
        if (!comment) throw new Error('This comment is no longer available.');
        comment.helpfulBy = comment.helpfulBy || [];
        if (comment.helpfulBy.indexOf(user.email) !== -1) {
          throw new Error('This answer is already marked helpful.');
        }
        return getUser(comment.authorEmail).then(function (commentAuthor) {
          if (commentAuthor) {
            commentAuthor.helpfulAnswers = (commentAuthor.helpfulAnswers || 0) + 1;
            return saveUser(commentAuthor);
          }
        }).then(function () {
          comment.helpfulBy.push(user.email);
          return runForumTransaction('readwrite', function (store) {
            return store.put(post);
          });
        }).then(function () { return copyForumPost(post); });
      });
    });
  }

  function getCurrentUser() {
    var email = window.localStorage.getItem(SESSION_KEY);
    if (!email) return Promise.resolve(null);

    return getUser(email).then(function (user) {
      if (!user) {
        window.localStorage.removeItem(SESSION_KEY);
        return null;
      }
      return publicUser(user);
    });
  }

  function createAccount(details) {
    if (!window.crypto || !window.crypto.subtle) {
      return Promise.reject(new Error('Password protection requires a secure browser context. Open this site through localhost or HTTPS.'));
    }

    var email = details.email.trim().toLowerCase();
    var studyStartDate = details.studyStartDate;
    var startDate = new Date(studyStartDate + 'T00:00:00');
    if (!details.university || !details.studentType ||
        !studyStartDate || Number.isNaN(startDate.getTime()) || startDate > new Date()) {
      return Promise.reject(new Error('Please provide your student type, university, and a valid study start date.'));
    }
    var salt = createPasswordSalt();

    return hashPassword(details.password, salt).then(function (passwordHash) {
      var user = {
        email: email,
        name: details.name.trim(),
        country: details.country.trim(),
        major: '',
        bio: '',
        languages: '',
        university: details.university,
        studentType: details.studentType,
        studyStartDate: studyStartDate,
        helpfulAnswers: 0,
        points: 50,
        completedQuests: [],
        createdAt: new Date().toISOString(),
        passwordSalt: toHex(salt),
        passwordHash: passwordHash
      };

      return runTransaction('readwrite', function (store) {
        return store.get(email);
      }).then(function (existingUser) {
        if (existingUser) {
          var existingSalt = new Uint8Array(existingUser.passwordSalt.match(/.{2}/g).map(function (pair) {
            return parseInt(pair, 16);
          }));
          return hashPassword(details.password, existingSalt).then(function (existingPasswordHash) {
            if (existingPasswordHash !== existingUser.passwordHash) {
              throw new Error('An account with that email already exists. Log in instead.');
            }
            var completedUser = Object.assign({}, existingUser, {
              name: user.name,
              country: user.country,
              university: user.university,
              studentType: user.studentType,
              studyStartDate: user.studyStartDate
            });
            delete completedUser.studentId;
            return saveUser(completedUser).then(function () {
              window.localStorage.setItem(SESSION_KEY, email);
              return publicUser(completedUser);
            });
          });
        }
        return runTransaction('readwrite', function (store) {
          return store.add(user);
        }).then(function () {
          window.localStorage.setItem(SESSION_KEY, email);
          return publicUser(user);
        });
      });
    });
  }

  function authenticate(email, password) {
    var normalizedEmail = email.trim().toLowerCase();
    return getUser(normalizedEmail).then(function (user) {
      if (!user) throw new Error('Email or password is incorrect.');

      var salt = new Uint8Array(user.passwordSalt.match(/.{2}/g).map(function (pair) {
        return parseInt(pair, 16);
      }));
      return hashPassword(password, salt).then(function (passwordHash) {
        if (passwordHash !== user.passwordHash) {
          throw new Error('Email or password is incorrect.');
        }
        window.localStorage.setItem(SESSION_KEY, normalizedEmail);
        return publicUser(user);
      });
    });
  }

  function updateCurrentUser(changes) {
    return getCurrentUser().then(function (currentUser) {
      if (!currentUser) throw new Error('Please log in again to update your profile.');

      return getUser(currentUser.email).then(function (storedUser) {
        var updatedUser = Object.assign({}, storedUser, changes);
        return saveUser(updatedUser).then(function () {
          return publicUser(updatedUser);
        });
      });
    });
  }

  function updateProgress(completedQuests, points) {
    return updateCurrentUser({
      completedQuests: completedQuests,
      points: points
    });
  }

  function getBadgeStatus(user) {
    var start = user.studyStartDate ? new Date(user.studyStartDate + 'T00:00:00') : null;
    var now = new Date();
    var oneYearAgo = new Date(now);
    oneYearAgo.setFullYear(now.getFullYear() - 1);
    var threeMonthsAgo = new Date(now);
    threeMonthsAgo.setMonth(now.getMonth() - 3);
    var hasStudiedForOneYear = Boolean(start && start <= oneYearAgo);
    var establishedHelpfulMember = Boolean(
      user.createdAt && new Date(user.createdAt) <= threeMonthsAgo &&
      (user.helpfulAnswers || 0) >= 5
    );
    var verified = Boolean(
      user.university && user.studentType &&
      (hasStudiedForOneYear || establishedHelpfulMember)
    );
    return {
      verified: verified,
      verificationLabel: verified
        ? 'Verified · ' + user.university + ' · ' +
          (user.studentType === 'exchange' ? 'Exchange student (Sem 1, 2026)' : 'Local student')
        : 'Verification unlocks after 1 year of study or 3 months and 5 helpful answers',
      campusGuide: verified && establishedHelpfulMember
    };
  }

  function logout() {
    window.localStorage.removeItem(SESSION_KEY);
  }

  window.LandedAuth = {
    authenticate: authenticate,
    createAccount: createAccount,
    getCurrentUser: getCurrentUser,
    logout: logout,
    updateCurrentUser: updateCurrentUser,
    updateProgress: updateProgress,
    getBadgeStatus: function (user) {
      return getBadgeStatus(user);
    },
    listForumPosts: listForumPosts,
    getForumPost: getForumPost,
    createForumPost: createForumPost,
    addForumComment: addForumComment,
    toggleForumLike: toggleForumLike,
    reportForumPost: reportForumPost
    ,
    markForumCommentHelpful: markForumCommentHelpful
  };
})();
