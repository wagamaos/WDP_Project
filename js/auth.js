(function () {
  'use strict';

  var STATE_KEY = 'landed-demo-state-v1';
  var SESSION_KEY = 'landed-demo-session';
  var ADMIN_KEY = 'landed-admin';
  var ADMIN_PASSWORD = 'landed2026';

  function uid(prefix) {
    return prefix + '-' + Date.now().toString(36) + '-' +
      Math.random().toString(36).slice(2, 8);
  }

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function todayIso() {
    var date = new Date();
    return date.toISOString();
  }

  function seedState() {
    var now = new Date();
    var future = function (days) {
      var date = new Date(now);
      date.setDate(date.getDate() + days);
      return date.toISOString();
    };
    return {
      users: [],
      sessionEmail: null,
      monthlyBudgets: {},
      currencies: {},
      budgetEntries: {},
      rewards: [
        { id: 'kaya', name: 'Kaya (Singapore)', description: 'A sweet coconut and egg spread, popular on toast and breakfast snacks.', cost: 150, stock: 20, collectionDetails: 'Collect from your school office.', donatedBy: 'Landed welcome team', donatedAt: '2026-09-01', image: null },
        { id: 'snack-box', name: 'Korean snack box', description: 'A selection of Korean snacks to enjoy or share with friends.', cost: 200, stock: 20, collectionDetails: 'Collect from your school office.', donatedBy: 'Landed community', donatedAt: '2026-09-15', image: null },
        { id: 'coffee', name: 'Vietnamese coffee', description: 'A locally loved Vietnamese coffee set for a study break.', cost: 180, stock: 20, collectionDetails: 'Collect from your school office.', donatedBy: 'Landed community', donatedAt: '2026-10-01', image: null }
      ],
      redemptions: [],
      donations: [],
      eventRegistrations: {},
      events: [
        { id: 'orientation', title: 'International Student Orientation', startAt: future(7), endAt: future(7), location: 'Gachon University Hall', eventType: 'Orientation', capacity: 120, registeredCount: 34, pointsAwarded: 20 },
        { id: 'language', title: 'Korean Language Exchange', startAt: future(12), endAt: future(12), location: 'Student Lounge', eventType: 'Social', capacity: 40, registeredCount: 18, pointsAwarded: 20 },
        { id: 'career', title: 'Career Networking Meetup', startAt: future(25), endAt: future(25), location: 'Main Auditorium', eventType: 'Career', capacity: 80, registeredCount: 29, pointsAwarded: 30 }
      ],
      school: {
        assignments: [
          { title: 'Korean Language Homework', dueAt: future(3), courseName: 'Beginning Korean' },
          { title: 'Research proposal', dueAt: future(10), courseName: 'Academic Writing' }
        ],
        classes: [
          { courseName: 'Beginning Korean', dayOfWeek: 1, startTime: '09:00', endTime: '10:30', location: 'Room 204' },
          { courseName: 'Academic Writing', dayOfWeek: 3, startTime: '13:00', endTime: '14:30', location: 'Room 318' }
        ],
        administrativeDeadlines: [
          { title: 'Residence permit renewal', dueAt: future(14), organization: 'Immigration Office' }
        ]
      },
      forumPosts: [
        {
          id: 'welcome-post',
          category: 'Housing',
          title: 'Tips for finding student housing near campus',
          body: 'I am looking for a convenient and affordable place near Gachon University. What areas and websites would you recommend?',
          author: 'Landed Community',
          authorEmail: '',
          createdAt: future(-2),
          likes: [],
          comments: [],
          reports: []
        }
      ]
    };
  }

  function readState() {
    try {
      var value = window.localStorage.getItem(STATE_KEY);
      var loaded = value ? JSON.parse(value) : seedState();
      loaded.currencies = loaded.currencies || {};
      loaded.eventRegistrations = loaded.eventRegistrations || {};
      loaded.forumPosts = loaded.forumPosts || [];
      loaded.users = loaded.users || [];
      return loaded;
    } catch (error) {
      return seedState();
    }
  }

  var state = readState();

  function save() {
    window.localStorage.setItem(STATE_KEY, JSON.stringify(state));
  }

  function getCurrentUser() {
    var email = window.localStorage.getItem(SESSION_KEY);
    if (!email) return Promise.resolve(null);
    var user = state.users.find(function (item) { return item.email === email; });
    return Promise.resolve(user ? publicUser(user) : null);
  }

  function publicUser(user) {
    var copy = clone(user);
    delete copy.password;
    return copy;
  }

  function findUser(email) {
    return state.users.find(function (user) {
      return user.email.toLowerCase() === String(email).toLowerCase();
    });
  }

  function requireUser() {
    var email = window.localStorage.getItem(SESSION_KEY);
    var user = email ? findUser(email) : null;
    if (!user) return Promise.reject(new Error('Please log in first.'));
    return Promise.resolve(user);
  }

  function getUserSchool(user) {
    state.schoolByUser = state.schoolByUser || {};
    if (!state.schoolByUser[user.email]) {
      state.schoolByUser[user.email] = clone(state.school || seedState().school);
    }

    var school = state.schoolByUser[user.email];
    school.classes = school.classes || [];
    school.assignments = school.assignments || [];
    school.administrativeDeadlines = school.administrativeDeadlines || [];
    ['classes', 'assignments', 'administrativeDeadlines'].forEach(function (collection) {
      school[collection].forEach(function (item) {
        if (!item.id) item.id = uid('school');
      });
    });
    return school;
  }

  function validateSchoolItem(collection, details) {
    if (!details || typeof details !== 'object') {
      throw new Error('Enter the required school item details.');
    }

    if (collection === 'classes') {
      if (typeof details.courseName !== 'string' || !details.courseName.trim() ||
          details.courseName.length > 100) {
        throw new Error('Enter a class name (up to 100 characters).');
      }
      if (!Number.isInteger(Number(details.dayOfWeek)) ||
          Number(details.dayOfWeek) < 1 || Number(details.dayOfWeek) > 7) {
        throw new Error('Choose a valid class day.');
      }
      if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(details.startTime) ||
          !/^([01]\d|2[0-3]):[0-5]\d$/.test(details.endTime) ||
          details.startTime >= details.endTime) {
        throw new Error('Choose a valid start and end time.');
      }
      if (typeof details.location !== 'string' || details.location.length > 100) {
        throw new Error('Location must be 100 characters or fewer.');
      }
      return {
        courseName: details.courseName.trim(),
        dayOfWeek: Number(details.dayOfWeek),
        startTime: details.startTime,
        endTime: details.endTime,
        location: details.location.trim()
      };
    }

    if (collection !== 'assignments' && collection !== 'administrativeDeadlines') {
      throw new Error('Choose a valid school item type.');
    }
    if (typeof details.title !== 'string' || !details.title.trim() ||
        details.title.length > 100) {
      throw new Error('Enter a title (up to 100 characters).');
    }
    if (typeof details.dueAt !== 'string' || isNaN(new Date(details.dueAt).getTime())) {
      throw new Error('Choose a valid deadline date and time.');
    }

    var deadline = {
      title: details.title.trim(),
      dueAt: details.dueAt
    };
    var label = collection === 'assignments' ? 'courseName' : 'organization';
    if (typeof details[label] !== 'string' || details[label].length > 100) {
      throw new Error('Course or organization must be 100 characters or fewer.');
    }
    deadline[label] = details[label].trim();
    if (typeof details.completed === 'boolean') deadline.completed = details.completed;
    return deadline;
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
    var verified = Boolean(user.university && user.studentType &&
      (hasStudiedForOneYear || establishedHelpfulMember));
    return {
      verified: verified,
      verificationLabel: verified
        ? 'Verified · ' + user.university + ' · ' +
          (user.studentType === 'exchange' ? 'Exchange student' : 'Local student')
        : 'Verification unlocks after 1 year of study or 3 months and 5 helpful answers',
      campusGuide: verified && establishedHelpfulMember
    };
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

  function rewardRequest(details) {
    return Object.assign({}, details, {
      cost: Number(details.cost),
      stock: Number(details.stock)
    });
  }

  window.LandedAuth = {
    authenticate: function (email, password) {
      var user = findUser(email);
      if (!user || user.password !== password) {
        return Promise.reject(new Error('Incorrect email or password.'));
      }
      window.localStorage.setItem(SESSION_KEY, user.email);
      return Promise.resolve(publicUser(user));
    },
    createAccount: function (details) {
      if (findUser(details.email)) {
        return Promise.reject(new Error('An account with that email already exists.'));
      }
      var user = {
        id: uid('user'),
        name: details.name,
        email: details.email,
        country: details.country,
        password: details.password,
        university: details.university,
        studentType: details.studentType,
        studyStartDate: details.studyStartDate,
        major: '',
        bio: '',
        createdAt: todayIso(),
        points: 50,
        helpfulAnswers: 0,
        completedQuests: []
      };
      state.users.push(user);
      save();
      window.localStorage.setItem(SESSION_KEY, user.email);
      return Promise.resolve(publicUser(user));
    },
    getCurrentUser: getCurrentUser,
    logout: function () {
      window.localStorage.removeItem(SESSION_KEY);
      window.localStorage.removeItem(ADMIN_KEY);
      return Promise.resolve();
    },
    updateCurrentUser: function (changes) {
      return requireUser().then(function (user) {
        Object.assign(user, changes);
        save();
        return publicUser(user);
      });
    },
    updateProgress: function (completedQuests, points) {
      return requireUser().then(function (user) {
        user.completedQuests = completedQuests;
        if (Number.isFinite(Number(points))) user.points = Number(points);
        save();
        return publicUser(user);
      });
    },
    listBudgetEntries: function () {
      var email = window.localStorage.getItem(SESSION_KEY);
      return Promise.resolve(clone(state.budgetEntries[email] || []));
    },
    getMonthlyBudget: function () {
      var email = window.localStorage.getItem(SESSION_KEY);
      return Promise.resolve(state.monthlyBudgets[email] || 500);
    },
    getCurrency: function () {
      var email = window.localStorage.getItem(SESSION_KEY);
      return Promise.resolve(state.currencies[email] || 'SGD');
    },
    updateCurrency: function (currency) {
      var email = window.localStorage.getItem(SESSION_KEY);
      if (!email) return Promise.reject(new Error('Please log in first.'));
      state.currencies[email] = String(currency).toUpperCase();
      save();
      return Promise.resolve(state.currencies[email]);
    },
    updateMonthlyBudget: function (amount) {
      var email = window.localStorage.getItem(SESSION_KEY);
      state.monthlyBudgets[email] = Number(amount);
      save();
      return Promise.resolve(Number(amount));
    },
    addBudgetEntry: function (details) {
      var email = window.localStorage.getItem(SESSION_KEY);
      if (!email) return Promise.reject(new Error('Please log in first.'));
      var entry = Object.assign({}, details, { id: uid('entry'), amount: Number(details.amount) });
      state.budgetEntries[email] = state.budgetEntries[email] || [];
      state.budgetEntries[email].push(entry);
      save();
      return Promise.resolve(clone(entry));
    },
    deleteBudgetEntry: function (entryId) {
      var email = window.localStorage.getItem(SESSION_KEY);
      state.budgetEntries[email] = (state.budgetEntries[email] || []).filter(function (entry) {
        return entry.id !== entryId;
      });
      save();
      return Promise.resolve();
    },
    listLeaderboard: function () {
      return Promise.resolve(clone(state.users).map(publicUser).sort(function (a, b) {
        return (b.points || 0) - (a.points || 0);
      }));
    },
    listRewards: function () {
      return Promise.resolve(clone(state.rewards.filter(function (reward) {
        return reward.stock === null || reward.stock > 0;
      })));
    },
    redeemReward: function (rewardId) {
      return requireUser().then(function (user) {
        var reward = state.rewards.find(function (item) { return item.id === rewardId; });
        if (!reward) return Promise.reject(new Error('Reward not found.'));
        if (reward.stock !== null && reward.stock < 1) return Promise.reject(new Error('This reward is out of stock.'));
        if (user.points < reward.cost) return Promise.reject(new Error('You do not have enough points.'));
        user.points -= reward.cost;
        if (reward.stock !== null) reward.stock -= 1;
        var redemption = {
          id: uid('redemption'),
          rewardId: reward.id,
          rewardName: reward.name,
          collectionDetails: reward.collectionDetails,
          collectionDate: new Date(Date.now() + 7 * 86400000).toISOString(),
          email: user.email
        };
        state.redemptions.push(redemption);
        save();
        return { user: publicUser(user), redemption: redemption };
      });
    },
    donateReward: function (details) {
      return requireUser().then(function (user) {
        if (!details.confirmed) return Promise.reject(new Error('Please confirm the donation.'));
        var points = Number(details.points);
        var reward = {
          id: uid('reward'),
          name: details.name,
          description: details.description,
          cost: points,
          stock: 1,
          collectionDetails: 'Collect from ' + details.schoolOffice,
          donatedBy: user.name,
          donatedAt: todayIso(),
          image: null
        };
        state.rewards.push(reward);
        user.points += points;
        state.donations.push(Object.assign({}, reward, { schoolOffice: details.schoolOffice, collectionDate: details.collectionDate }));
        save();
        return { user: publicUser(user), donation: { points: points } };
      });
    },
    listEvents: function () {
      var email = window.localStorage.getItem(SESSION_KEY);
      return Promise.resolve(clone(state.events.map(function (event) {
        var copy = clone(event);
        copy.registered = (state.eventRegistrations[event.id] || []).indexOf(email) !== -1;
        return copy;
      })));
    },
    toggleEventRegistration: function (eventId) {
      var email = window.localStorage.getItem(SESSION_KEY);
      if (!email) return Promise.reject(new Error('Please log in first.'));
      var event = state.events.find(function (item) { return item.id === eventId; });
      if (!event) return Promise.reject(new Error('Event not found.'));
      state.eventRegistrations[eventId] = state.eventRegistrations[eventId] || [];
      var index = state.eventRegistrations[eventId].indexOf(email);
      if (index >= 0) {
        state.eventRegistrations[eventId].splice(index, 1);
        event.registeredCount = Math.max(0, (event.registeredCount || 0) - 1);
      } else {
        if (event.capacity !== null && (event.registeredCount || 0) >= event.capacity) {
          return Promise.reject(new Error('This event is full.'));
        }
        state.eventRegistrations[eventId].push(email);
        event.registeredCount = (event.registeredCount || 0) + 1;
      }
      save();
      return Promise.resolve({ registered: index < 0 });
    },
    getSchoolData: function () {
      return requireUser().then(function (user) {
        return clone(getUserSchool(user));
      });
    },
    createSchoolItem: function (collection, details) {
      return requireUser().then(function (user) {
        var item = Object.assign(
          { id: uid('school') },
          validateSchoolItem(collection, details)
        );
        getUserSchool(user)[collection].push(item);
        save();
        return clone(item);
      });
    },
    updateSchoolItem: function (collection, itemId, details) {
      return requireUser().then(function (user) {
        var school = getUserSchool(user);
        if (['classes', 'assignments', 'administrativeDeadlines'].indexOf(collection) === -1) {
          throw new Error('Choose a valid school item type.');
        }
        var item = school[collection].find(function (entry) { return entry.id === itemId; });
        if (!item) throw new Error('School item not found.');
        Object.assign(item, validateSchoolItem(collection, details));
        save();
        return clone(item);
      });
    },
    deleteSchoolItem: function (collection, itemId) {
      return requireUser().then(function (user) {
        var school = getUserSchool(user);
        if (['classes', 'assignments', 'administrativeDeadlines'].indexOf(collection) === -1) {
          throw new Error('Choose a valid school item type.');
        }
        var index = school[collection].findIndex(function (entry) { return entry.id === itemId; });
        if (index === -1) throw new Error('School item not found.');
        school[collection].splice(index, 1);
        save();
      });
    },
    getBadgeCatalog: getBadgeCatalog,
    getBadgeStatus: getBadgeStatus,
    getContributionStats: function () {
      var email = window.localStorage.getItem(SESSION_KEY);
      if (!email) return Promise.resolve({ forumPosts: 0, comments: 0, eventsAttended: 0, points: 0 });
      var user = findUser(email);
      var forumPosts = state.forumPosts.filter(function (post) {
        return post.authorEmail === email;
      }).length;
      var comments = 0;
      state.forumPosts.forEach(function (post) {
        (post.comments || []).forEach(function (comment) {
          if (comment.authorEmail === email) comments += 1;
        });
      });
      var eventsAttended = state.events.filter(function (event) {
        return (state.eventRegistrations[event.id] || []).indexOf(email) !== -1;
      }).length;
      return Promise.resolve({
        forumPosts: forumPosts,
        comments: comments,
        eventsAttended: eventsAttended,
        points: user ? (user.points || 0) : 0
      });
    },
    listForumPosts: function () {
      return Promise.resolve(clone(state.forumPosts));
    },
    getForumPost: function (postId) {
      return Promise.resolve(clone(state.forumPosts.find(function (post) { return post.id === postId; }) || null));
    },
    createForumPost: function (details) {
      return requireUser().then(function (user) {
        var post = {
          id: uid('post'),
          category: details.category,
          title: details.title,
          body: details.body,
          author: user.name,
          authorEmail: user.email,
          createdAt: todayIso(),
          likes: [],
          comments: [],
          reports: []
        };
        state.forumPosts.unshift(post);
        save();
        return clone(post);
      });
    },
    addForumComment: function (postId, body) {
      return requireUser().then(function (user) {
        var post = state.forumPosts.find(function (item) { return item.id === postId; });
        if (!post) return Promise.reject(new Error('Post not found.'));
        post.comments.push({
          id: uid('comment'),
          body: body,
          author: user.name,
          authorEmail: user.email,
          createdAt: todayIso(),
          likes: [],
          helpfulBy: []
        });
        save();
        return clone(post);
      });
    },
    toggleForumLike: function (postId, commentId) {
      var email = window.localStorage.getItem(SESSION_KEY);
      if (!email) return Promise.reject(new Error('Please log in first.'));
      var post = state.forumPosts.find(function (item) { return item.id === postId; });
      if (!post) return Promise.reject(new Error('Post not found.'));
      var target = commentId ? post.comments.find(function (comment) { return comment.id === commentId; }) : post;
      if (!target) return Promise.reject(new Error('Content not found.'));
      target.likes = target.likes || [];
      var index = target.likes.indexOf(email);
      if (index >= 0) target.likes.splice(index, 1);
      else target.likes.push(email);
      save();
      return Promise.resolve(clone(post));
    },
    reportForumPost: function (postId, reason, details) {
      return requireUser().then(function (user) {
        var post = state.forumPosts.find(function (item) { return item.id === postId; });
        if (!post) return Promise.reject(new Error('Post not found.'));
        post.reports = post.reports || [];
        post.reports.push({ reason: reason, details: details, email: user.email, createdAt: todayIso() });
        save();
      });
    },
    markForumCommentHelpful: function (postId, commentId) {
      return requireUser().then(function (user) {
        var post = state.forumPosts.find(function (item) { return item.id === postId; });
        var comment = post && post.comments.find(function (item) { return item.id === commentId; });
        if (!post || !comment) return Promise.reject(new Error('Comment not found.'));
        if (user.email === comment.authorEmail) return Promise.reject(new Error('You cannot mark your own answer helpful.'));
        comment.helpfulBy = comment.helpfulBy || [];
        if (comment.helpfulBy.indexOf(user.email) < 0) {
          comment.helpfulBy.push(user.email);
          var author = findUser(comment.authorEmail);
          if (author) author.helpfulAnswers = (author.helpfulAnswers || 0) + 1;
        }
        save();
        return clone(post);
      });
    },
    adminLogin: function (password) {
      if (password !== ADMIN_PASSWORD) return Promise.reject(new Error('Incorrect admin password.'));
      window.localStorage.setItem(ADMIN_KEY, '1');
      return Promise.resolve(true);
    },
    adminLogout: function () {
      window.localStorage.removeItem(ADMIN_KEY);
      return Promise.resolve();
    },
    adminIsLoggedIn: function () {
      return window.localStorage.getItem(ADMIN_KEY) === '1';
    },
    adminListReportedPosts: function () {
      return Promise.resolve(clone(state.forumPosts.filter(function (post) {
        return post.reports && post.reports.length;
      })));
    },
    adminDismissReports: function (postId) {
      var post = state.forumPosts.find(function (item) { return item.id === postId; });
      if (post) post.reports = [];
      save();
      return Promise.resolve();
    },
    adminDeleteForumPost: function (postId) {
      state.forumPosts = state.forumPosts.filter(function (post) { return post.id !== postId; });
      save();
      return Promise.resolve();
    },
    adminAddReward: function (details) {
      var reward = rewardRequest(details);
      reward.id = uid('reward');
      reward.donatedAt = todayIso();
      reward.image = null;
      state.rewards.push(reward);
      save();
      return Promise.resolve(clone(reward));
    },
    adminDeleteReward: function (rewardId) {
      state.rewards = state.rewards.filter(function (reward) { return reward.id !== rewardId; });
      save();
      return Promise.resolve();
    },
    adminUpdateReward: function (rewardId, changes) {
      var reward = state.rewards.find(function (item) { return item.id === rewardId; });
      if (!reward) return Promise.reject(new Error('Reward not found.'));
      Object.assign(reward, rewardRequest(changes));
      save();
      return Promise.resolve(clone(reward));
    }
  };

  Array.prototype.forEach.call(document.querySelectorAll('.logout-link'), function (link) {
    link.addEventListener('click', function (event) {
      event.preventDefault();
      window.LandedAuth.logout().then(function () {
        window.location.href = link.href;
      });
    });
    getCurrentUser().then(function (user) {
      link.hidden = !user;
    });
  });
})();
