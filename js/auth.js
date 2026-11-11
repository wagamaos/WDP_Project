(function () {
  'use strict';

  var DATABASE_NAME = 'landed-local';
  var DATABASE_VERSION = 5;
  var SESSION_KEY = 'landed-user-email';
  var databasePromise;
  var DEFAULT_REWARDS = [
    { id: 'kaya-singapore', name: 'Kaya (Singapore)', cost: 150, stock: 20, description: 'A sweet coconut and egg spread, popular on toast and breakfast snacks.', donatedBy: 'Landed welcome team', donatedAt: '2026-09-01', collectionDetails: 'Collect from your school office.' },
    { id: 'korean-snack-box', name: 'Korean snack box', cost: 200, stock: 20, description: 'A selection of Korean snacks to enjoy or share with friends.', donatedBy: 'Landed community', donatedAt: '2026-09-15', collectionDetails: 'Collect from your school office.' },
    { id: 'vietnamese-coffee', name: 'Vietnamese coffee', cost: 180, stock: 20, description: 'A locally loved Vietnamese coffee set for a study break.', donatedBy: 'Landed community', donatedAt: '2026-10-01', collectionDetails: 'Collect from your school office.' }
  ];

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
            var forumStore = database.createObjectStore('forumPosts', { keyPath: 'id' });
            seedForumPosts(forumStore);
          }
          if (!database.objectStoreNames.contains('rewards')) {
            var rewards = database.createObjectStore('rewards', { keyPath: 'id' });
            DEFAULT_REWARDS.forEach(function (reward) { rewards.add(reward); });
          }
          if (!database.objectStoreNames.contains('budgetEntries')) {
            database.createObjectStore('budgetEntries', { keyPath: 'id' });
          }
          if (!database.objectStoreNames.contains('budgetSettings')) {
            database.createObjectStore('budgetSettings', { keyPath: 'email' });
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

  function runTransaction(mode, operation, storeName) {
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
          var transaction = database.transaction(storeName || 'users', mode);
          var request = operation(transaction.objectStore(storeName || 'users'));
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
      createdAt: user.createdAt,
      redemptions: user.redemptions || [],
      donations: user.donations || []
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

  function listLeaderboard() {
    return runTransaction('readonly', function (store) {
      return store.getAll();
    }).then(function (users) {
      return users.map(function (user) {
        return { name: user.name, email: user.email, points: user.points || 0 };
      }).sort(function (a, b) {
        return b.points - a.points || a.name.localeCompare(b.name);
      });
    });
  }

  function runRewardTransaction(mode, operation) {
    return openDatabase().then(function (database) {
      return new Promise(function (resolve, reject) {
        var transaction;
        var result;
        try {
          transaction = database.transaction('rewards', mode);
          var request = operation(transaction.objectStore('rewards'));
          request.onsuccess = function () { result = request.result; };
          request.onerror = function () { reject(request.error); };
          transaction.oncomplete = function () { resolve(result); };
          transaction.onerror = function () { reject(transaction.error); };
          transaction.onabort = function () { reject(transaction.error); };
        } catch (error) {
          reject(error);
        }
      });
    });
  }

  function listRewards() {
    return runRewardTransaction('readonly', function (store) {
      return store.getAll();
    }).then(function (rewards) {
      if (rewards.length > 0) return rewards;
      return runRewardTransaction('readwrite', function (store) {
        DEFAULT_REWARDS.slice(0, -1).forEach(function (reward) { store.put(reward); });
        return store.put(DEFAULT_REWARDS[DEFAULT_REWARDS.length - 1]);
      }).then(function () { return DEFAULT_REWARDS.slice(); });
    });
  }

  function addReward(details) {
    if (!details.name || details.name.trim().length < 2 ||
        !Number.isInteger(Number(details.cost)) || Number(details.cost) < 1 ||
        !Number.isInteger(Number(details.stock)) || Number(details.stock) < 0 ||
        !details.collectionDetails || !details.collectionDetails.trim() ||
        !details.image || !details.image.dataUrl) {
      return Promise.reject(new Error('Provide a reward name, whole-number cost, stock, and collection details.'));
    }
    var reward = {
      id: createId('reward'),
      name: details.name.trim(),
      cost: Number(details.cost),
      stock: Number(details.stock),
      description: (details.description || 'A community-donated reward for students.').trim(),
      donatedBy: (details.donatedBy || 'Landed community').trim(),
      donatedAt: details.donatedAt || new Date().toISOString(),
      collectionDetails: details.collectionDetails.trim(),
      image: details.image
    };
    return runRewardTransaction('readwrite', function (store) {
      return store.add(reward);
    }).then(function () { return reward; });
  }

  function redeemReward(rewardId) {
    return getCurrentUser().then(function (currentUser) {
      if (!currentUser) throw new Error('Please log in to redeem a reward.');
      return listRewards().then(function (rewards) {
        var reward = rewards.find(function (item) { return item.id === rewardId; });
        if (!reward) throw new Error('This reward is no longer available.');
        if (reward.stock < 1) throw new Error('This reward is currently out of stock.');
      return getUser(currentUser.email).then(function (user) {
        if ((user.points || 0) < reward.cost) {
          throw new Error('You need ' + (reward.cost - (user.points || 0)) + ' more points for this reward.');
        }
        user.points -= reward.cost;
        user.redemptions = user.redemptions || [];
        var redemption = {
          id: createId('redemption'),
          rewardId: reward.id,
          rewardName: reward.name,
          cost: reward.cost,
          collectionDetails: reward.collectionDetails,
          redeemedAt: new Date().toISOString(),
          collectionDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          email: user.email
        };
        user.redemptions.push(redemption);
        return saveUser(user).then(function () {
          reward.stock -= 1;
          return runRewardTransaction('readwrite', function (store) {
            return store.put(reward);
          }).then(function () {
            return { user: publicUser(user), redemption: redemption };
          });
        });
      });
      });
    });
  }

  function donateReward(details) {
    return getCurrentUser().then(function (currentUser) {
      if (!currentUser) throw new Error('Please log in to donate a reward.');
      if (!details.name || details.name.trim().length < 2 ||
          !details.schoolOffice || !details.schoolOffice.trim() ||
          !details.collectionDate || details.confirmed !== true ||
          !Number.isInteger(Number(details.points)) || Number(details.points) < 1 ||
          Number(details.points) > 500) {
        throw new Error('Enter the reward details, collection date, school office, and confirm that you left the item there.');
      }
      return getUser(currentUser.email).then(function (user) {
        var donation = {
          id: createId('donation'),
          name: details.name.trim(),
          description: (details.description || '').trim(),
          points: Number(details.points) > 0 ? Number(details.points) : 50,
          schoolOffice: details.schoolOffice.trim(),
          collectionDate: details.collectionDate,
          donatedAt: new Date().toISOString()
        };
        user.points = (user.points || 0) + donation.points;
        user.donations = user.donations || [];
        user.donations.push(donation);
        return saveUser(user).then(function () {
          return { user: publicUser(user), donation: donation };
        });
      });
    });
  }

  function getBadgeCatalog(user) {
    var status = getBadgeStatus(user);
    return [
      { name: 'Welcome', earned: (user.points || 0) >= 50, detail: 'Earn 50 total points' },
      { name: 'Explorer', earned: (user.points || 0) >= 400, detail: 'Earn 400 total points' },
      { name: 'Helper', earned: (user.helpfulAnswers || 0) >= 5, detail: 'Give 5 helpful answers' },
      { name: 'Verified', earned: status.verified, detail: status.verificationLabel },
      { name: 'Campus Guide', earned: status.campusGuide, detail: '3+ months and 5 helpful answers' },
      { name: 'Pathfinder', earned: (user.points || 0) >= 800, detail: 'Earn 800 total points' },
      { name: 'Scholar', earned: (user.points || 0) >= 1200, detail: 'Earn 1,200 total points' },
      { name: 'Community Champion', earned: (user.helpfulAnswers || 0) >= 10, detail: 'Give 10 helpful answers' },
      { name: 'Landed Legend', earned: (user.points || 0) >= 2000, detail: 'Earn 2,000 total points' }
    ];
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
      }).then(function () {
        return updateCurrentUser({ points: (user.points || 0) + 10 }).then(function () {
          return copyForumPost(post);
        });
      });
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
        }).then(function () {
          return updateCurrentUser({ points: (user.points || 0) + 5 }).then(function () {
            return copyForumPost(post);
          });
        });
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
            commentAuthor.points = (commentAuthor.points || 0) + 25;
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

      return getUser(email).then(function (existingUser) {
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

  function requireCurrentUser() {
    return getCurrentUser().then(function (user) {
      if (!user) throw new Error('Please log in to use the budget tracker.');
      return user;
    });
  }

  function listBudgetEntries() {
    return requireCurrentUser().then(function (user) {
      return runTransaction('readonly', function (store) {
        return store.getAll();
      }, 'budgetEntries').then(function (entries) {
        return entries.filter(function (entry) {
          return entry.ownerEmail === user.email;
        }).sort(function (a, b) {
          return b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt);
        });
      });
    });
  }

  function getMonthlyBudget() {
    return requireCurrentUser().then(function (user) {
      return runTransaction('readonly', function (store) {
        return store.get(user.email);
      }, 'budgetSettings').then(function (settings) {
        return settings ? settings.monthlyBudget : 1000;
      });
    });
  }

  function updateMonthlyBudget(amount) {
    var budget = Number(amount);
    if (!Number.isFinite(budget) || budget <= 0 || budget > 1000000) {
      return Promise.reject(new Error('Enter a monthly budget greater than 0 and no more than 1,000,000.'));
    }
    return requireCurrentUser().then(function (user) {
      var settings = {
        email: user.email,
        monthlyBudget: Math.round(budget * 100) / 100
      };
      return runTransaction('readwrite', function (store) {
        return store.put(settings);
      }, 'budgetSettings').then(function () {
        return settings.monthlyBudget;
      });
    });
  }

  function addBudgetEntry(details) {
    var amount = Number(details.amount);
    var categories = ['Food', 'Transport', 'Housing', 'Study', 'Entertainment', 'Other'];
    var dateParts = (details.date || '').split('-');
    var date = new Date(Number(dateParts[0]), Number(dateParts[1]) - 1, Number(dateParts[2]));
    if (!details.name || details.name.trim().length < 2 || details.name.trim().length > 100 ||
        !Number.isFinite(amount) || amount <= 0 || amount > 1000000 ||
        categories.indexOf(details.category) === -1 ||
        dateParts.length !== 3 || isNaN(date.getTime()) ||
        date.getFullYear() !== Number(dateParts[0]) ||
        date.getMonth() !== Number(dateParts[1]) - 1 ||
        date.getDate() !== Number(dateParts[2])) {
      return Promise.reject(new Error('Enter a name, valid amount, category, and date for this expense.'));
    }
    return requireCurrentUser().then(function (user) {
      var entry = {
        id: createId('expense'),
        ownerEmail: user.email,
        name: details.name.trim(),
        category: details.category,
        amount: Math.round(amount * 100) / 100,
        date: details.date,
        createdAt: new Date().toISOString()
      };
      return runTransaction('readwrite', function (store) {
        return store.add(entry);
      }, 'budgetEntries').then(function () {
        return entry;
      });
    });
  }

  function deleteBudgetEntry(entryId) {
    return requireCurrentUser().then(function (user) {
      return runTransaction('readonly', function (store) {
        return store.get(entryId);
      }, 'budgetEntries').then(function (entry) {
        if (!entry || entry.ownerEmail !== user.email) {
          throw new Error('This expense is no longer available.');
        }
        return runTransaction('readwrite', function (store) {
          return store.delete(entryId);
        }, 'budgetEntries');
      });
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

  /* ── Admin helpers ── */
  var ADMIN_KEY = 'landed-admin';

  function adminLogin(password) {
    if (password === 'Admin@Landed1') {
      window.localStorage.setItem(ADMIN_KEY, '1');
      return Promise.resolve(true);
    }
    return Promise.reject(new Error('Incorrect admin password.'));
  }

  function adminLogout() {
    window.localStorage.removeItem(ADMIN_KEY);
  }

  function adminIsLoggedIn() {
    return window.localStorage.getItem(ADMIN_KEY) === '1';
  }

  function adminListReportedPosts() {
    return listForumPosts().then(function (posts) {
      return posts.filter(function (p) { return p.reports && p.reports.length > 0; });
    });
  }

  function adminDismissReports(postId) {
    return getForumPost(postId).then(function (post) {
      if (!post) throw new Error('Post not found.');
      post.reports = [];
      return runForumTransaction('readwrite', function (store) {
        return store.put(post);
      }).then(function () { return copyForumPost(post); });
    });
  }

  function adminDeleteForumPost(postId) {
    return runForumTransaction('readwrite', function (store) {
      return store.delete(postId);
    });
  }

  function adminAddReward(details) {
    if (!details.name || details.name.trim().length < 2 ||
        !Number.isInteger(Number(details.cost))  || Number(details.cost)  < 1 ||
        !Number.isInteger(Number(details.stock)) || Number(details.stock) < 0 ||
        !details.collectionDetails || !details.collectionDetails.trim()) {
      return Promise.reject(new Error('Provide a name, point cost, stock and collection details.'));
    }
    var reward = {
      id: createId('reward'),
      name: details.name.trim(),
      cost: Number(details.cost),
      stock: Number(details.stock),
      description: (details.description || 'A community reward for students.').trim(),
      donatedBy: (details.donatedBy || 'Admin').trim(),
      donatedAt: new Date().toISOString(),
      collectionDetails: details.collectionDetails.trim()
    };
    return runRewardTransaction('readwrite', function (store) {
      return store.add(reward);
    }).then(function () { return reward; });
  }

  function adminDeleteReward(rewardId) {
    return runRewardTransaction('readwrite', function (store) {
      return store.delete(rewardId);
    });
  }

  function adminUpdateReward(rewardId, changes) {
    return runRewardTransaction('readonly', function (store) {
      return store.get(rewardId);
    }).then(function (reward) {
      if (!reward) throw new Error('Reward not found.');
      var updated = Object.assign({}, reward, {
        name:  changes.name  ? changes.name.trim()  : reward.name,
        cost:  Number.isInteger(Number(changes.cost))  ? Number(changes.cost)  : reward.cost,
        stock: Number.isInteger(Number(changes.stock)) ? Number(changes.stock) : reward.stock,
        description:       changes.description       ? changes.description.trim()       : reward.description,
        collectionDetails: changes.collectionDetails ? changes.collectionDetails.trim() : reward.collectionDetails
      });
      return runRewardTransaction('readwrite', function (store) {
        return store.put(updated);
      }).then(function () { return updated; });
    });
  }

  window.LandedAuth = {
    authenticate: authenticate,
    createAccount: createAccount,
    getCurrentUser: getCurrentUser,
    logout: logout,
    updateCurrentUser: updateCurrentUser,
    updateProgress: updateProgress,
    listBudgetEntries: listBudgetEntries,
    getMonthlyBudget: getMonthlyBudget,
    updateMonthlyBudget: updateMonthlyBudget,
    addBudgetEntry: addBudgetEntry,
    deleteBudgetEntry: deleteBudgetEntry,
    listLeaderboard: listLeaderboard,
    listRewards: listRewards,
    addReward: addReward,
    donateReward: donateReward,
    redeemReward: redeemReward,
    getBadgeCatalog: getBadgeCatalog,
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
    markForumCommentHelpful: markForumCommentHelpful,
    adminLogin: adminLogin,
    adminLogout: adminLogout,
    adminIsLoggedIn: adminIsLoggedIn,
    adminListReportedPosts: adminListReportedPosts,
    adminDismissReports: adminDismissReports,
    adminDeleteForumPost: adminDeleteForumPost,
    adminAddReward: adminAddReward,
    adminDeleteReward: adminDeleteReward,
    adminUpdateReward: adminUpdateReward
  };

  Array.prototype.forEach.call(document.querySelectorAll('.logout-link'), function (link) {
    link.addEventListener('click', function (event) {
      event.preventDefault();
      logout();
      window.location.href = link.href;
    });

    getCurrentUser().then(function (user) {
      link.hidden = !user;
    }).catch(function (error) {
      link.hidden = true;
      console.error('Could not verify the current user before showing the log out link.', error);
    });
  });
})();