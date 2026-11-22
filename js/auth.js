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
      eventAttendance: {},
      eventPointAwards: {},
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
        classes: [],
        administrativeDeadlines: [
          { title: 'Residence permit renewal', dueAt: future(14), organization: 'Immigration Office' }
        ]
      },
      forumPosts: seedForumPosts(),
      forumSeedVersion: FORUM_SEED_VERSION
    };
  }

  // Demo forum content. Authors use @landed.demo addresses, so no real account owns them
  // (only an admin can delete them). Bump FORUM_SEED_VERSION when adding posts so existing
  // browsers receive the new ones once; posts an admin already deleted are not brought back.
  var FORUM_SEED_VERSION = 2;

  function seedForumPosts() {
    var ago = function (days, hours) {
      return new Date(Date.now() - (days * 86400000) - ((hours || 0) * 3600000)).toISOString();
    };
    var comment = function (id, author, handle, body, createdAt, likes, helpfulBy) {
      return {
        id: id, body: body, author: author, authorEmail: handle + '@landed.demo',
        createdAt: createdAt, likes: likes || [], helpfulBy: helpfulBy || []
      };
    };
    return [
      {
        id: 'welcome-post',
        category: 'Housing',
        title: 'Tips for finding student housing near campus',
        body: 'I am looking for a convenient and affordable place near Gachon University. What areas and websites would you recommend?',
        author: 'Landed Community',
        authorEmail: '',
        createdAt: ago(2),
        likes: ['minji@landed.demo', 'arjun@landed.demo'],
        comments: [
          comment('seed-c-housing-1', 'Minji Park', 'minji',
            'Look around Bokjeong-dong, it is a 5 minute walk from the main gate. Try the Zigbang and Dabang apps for one-room listings, and ask for the deposit to be under 5 million won.',
            ago(1, 20), ['arjun@landed.demo', 'sofia@landed.demo']),
          comment('seed-c-housing-2', 'Arjun Mehta', 'arjun',
            'If you are only here for one semester, the dorm is much easier than a private lease. Applications open about two months before the semester starts.',
            ago(1, 6))
        ],
        reports: []
      },
      {
        id: 'seed-visa-arc',
        category: 'Visas',
        title: 'How long did your ARC (residence card) take?',
        body: 'I booked my Alien Registration Card appointment at the immigration office through HiKorea. How long did it take for everyone to receive the card, and can I travel before it arrives?',
        author: 'Sofia Rossi',
        authorEmail: 'sofia@landed.demo',
        createdAt: ago(4),
        likes: ['tomas@landed.demo'],
        comments: [
          comment('seed-c-visa-1', 'Tomás García', 'tomas',
            'Mine took about 3 weeks. Keep the receipt they give you, it works as proof while you wait. I would not leave the country before the card arrives though.',
            ago(3, 18), ['sofia@landed.demo', 'minji@landed.demo'], ['sofia@landed.demo']),
          comment('seed-c-visa-2', 'Minji Park', 'minji',
            'Bring a printed copy of your enrolment certificate and housing contract. They turned a friend away for only having it on their phone.',
            ago(3, 2))
        ],
        reports: []
      },
      {
        id: 'seed-money-bank',
        category: 'Money',
        title: 'Best bank account for international students?',
        body: 'Which bank was easiest to open an account with before getting the ARC? I want a card that works for transport and online shopping. Also, how are people tracking spending in won versus their home currency?',
        author: 'Arjun Mehta',
        authorEmail: 'arjun@landed.demo',
        createdAt: ago(6),
        likes: ['sofia@landed.demo', 'lena@landed.demo', 'tomas@landed.demo'],
        comments: [
          comment('seed-c-money-1', 'Lena Schmidt', 'lena',
            'Go to a branch near campus that is used to students, they usually have someone who speaks English. Some will open a basic account with your passport, then raise the limits once the ARC arrives.',
            ago(5, 20), ['arjun@landed.demo'], ['arjun@landed.demo']),
          comment('seed-c-money-2', 'Sofia Rossi', 'sofia',
            'For tracking I use the Budget page here. Set your home currency in the settings and log expenses in won as you go.',
            ago(5, 4), ['lena@landed.demo'])
        ],
        reports: []
      },
      {
        id: 'seed-food-halal',
        category: 'Food',
        title: 'Halal and vegetarian food near Gachon?',
        body: 'Does anyone know good halal or vegetarian places near campus? The cafeteria menu changes every day and it is hard to tell what is inside some of the dishes.',
        author: 'Aisha Rahman',
        authorEmail: 'aisha@landed.demo',
        createdAt: ago(1, 5),
        likes: ['minji@landed.demo'],
        comments: [
          comment('seed-c-food-1', 'Minji Park', 'minji',
            'Search "할랄" (halal) in Naver Map and you will find a few places a short subway ride away. For vegetarian, ask for dishes "gogi ppaego" (without meat).',
            ago(0, 20), ['aisha@landed.demo'])
        ],
        reports: []
      },
      {
        id: 'seed-study-timetable',
        category: 'Study',
        title: 'Uploading my class timetable to the School Tracker',
        body: 'Just found out you can import a photo or PDF of your timetable in the School Tracker instead of typing every class. Has anyone tried it with a screenshot from the university portal? Some of my class times came out wrong.',
        author: 'Tomás García',
        authorEmail: 'tomas@landed.demo',
        createdAt: ago(0, 9),
        likes: ['lena@landed.demo', 'aisha@landed.demo'],
        comments: [
          comment('seed-c-study-1', 'Lena Schmidt', 'lena',
            'It worked for me once I used a sharp, cropped screenshot instead of a phone photo of the screen. Double-check the afternoon times before saving, 1:00 and 13:00 sometimes get mixed up.',
            ago(0, 6), ['tomas@landed.demo'])
        ],
        reports: []
      },
      {
        id: 'seed-other-language',
        category: 'Other',
        title: 'Anyone going to the Korean Language Exchange?',
        body: 'I registered for the Korean Language Exchange on the Events page. Is anyone else going? It would be nice to know a few people before it starts. Points are added once the organisers mark your attendance.',
        author: 'Lena Schmidt',
        authorEmail: 'lena@landed.demo',
        createdAt: ago(0, 3),
        likes: [],
        comments: [],
        reports: []
      }
    ];
  }

  function readState() {
    try {
      var value = window.localStorage.getItem(STATE_KEY);
      var loaded = value ? JSON.parse(value) : seedState();
      loaded.currencies = loaded.currencies || {};
      loaded.eventRegistrations = loaded.eventRegistrations || {};
      loaded.eventAttendance = loaded.eventAttendance || {};
      loaded.eventPointAwards = loaded.eventPointAwards || {};
      loaded.forumPosts = loaded.forumPosts || [];
      if ((loaded.forumSeedVersion || 1) < FORUM_SEED_VERSION) {
        seedForumPosts().forEach(function (post) {
          var exists = loaded.forumPosts.some(function (item) { return item.id === post.id; });
          if (!exists) loaded.forumPosts.push(post);
        });
        loaded.forumSeedVersion = FORUM_SEED_VERSION;
      }
      loaded.users = loaded.users || [];
      loaded.school = loaded.school || seedState().school;
      loaded.schoolDefaults = loaded.schoolDefaults || {
        assignments: clone(loaded.school.assignments || [])
      };
      return loaded;
    } catch (error) {
      return seedState();
    }
  }

  var state = readState();

  var eventDetails = {
    orientation: {
      organiserType: 'Student Union',
      price: 0
    },
    language: {
      organiserType: 'Student Run',
      price: 5000
    },
    career: {
      organiserType: 'Student Union',
      price: 8000
    }
  };

  var updated = false;

  state.events.forEach(function (event) {
    var details = eventDetails[event.id];

    if (details) {
      if (event.organiserType == null) {
        event.organiserType = details.organiserType;
        updated = true;
      }

      if (event.price == null) {
        event.price = details.price;
        updated = true;
      }
    }
  });

  if (updated) {
    save();
  }

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

  function requireAdmin() {
    if (window.localStorage.getItem(ADMIN_KEY) !== '1') {
      return Promise.reject(new Error('Admin access required. Please sign in to the admin panel again.'));
    }
    return Promise.resolve();
  }

  function withoutEmail(list, email) {
    return (list || []).filter(function (item) { return item !== email; });
  }

  // Removes everything stored for one account: the user record, their own data,
  // their forum posts and comments, and their likes, reports and event sign-ups.
  function removeUserData(email) {
    state.users = state.users.filter(function (user) { return user.email !== email; });
    ['budgetEntries', 'monthlyBudgets', 'currencies', 'schoolByUser'].forEach(function (key) {
      if (state[key]) delete state[key][email];
    });
    state.redemptions = (state.redemptions || []).filter(function (item) { return item.email !== email; });

    // Events the user created go away with their sign-up, attendance and award records.
    (state.events || []).filter(function (event) { return event.createdBy === email; }).forEach(function (event) {
      ['eventRegistrations', 'eventAttendance', 'eventPointAwards'].forEach(function (key) {
        if (state[key]) delete state[key][event.id];
      });
    });
    state.events = (state.events || []).filter(function (event) { return event.createdBy !== email; });

    state.events.forEach(function (event) {
      var list = state.eventRegistrations[event.id] || [];
      if (list.indexOf(email) !== -1) {
        state.eventRegistrations[event.id] = withoutEmail(list, email);
        event.registeredCount = Math.max(0, (event.registeredCount || 0) - 1);
      }
      if (state.eventAttendance && state.eventAttendance[event.id]) {
        state.eventAttendance[event.id] = withoutEmail(state.eventAttendance[event.id], email);
      }
      if (state.eventPointAwards && state.eventPointAwards[event.id]) {
        delete state.eventPointAwards[event.id][email];
      }
    });

    state.forumPosts = state.forumPosts.filter(function (post) { return post.authorEmail !== email; });
    state.forumPosts.forEach(function (post) {
      post.likes = withoutEmail(post.likes, email);
      post.reports = (post.reports || []).filter(function (report) { return report.email !== email; });
      post.comments = (post.comments || []).filter(function (comment) { return comment.authorEmail !== email; });
      post.comments.forEach(function (comment) {
        comment.likes = withoutEmail(comment.likes, email);
        comment.helpfulBy = withoutEmail(comment.helpfulBy, email);
      });
    });
  }

  function getUserSchool(user) {
    state.schoolByUser = state.schoolByUser || {};
    if (!state.schoolByUser[user.email]) {
      state.schoolByUser[user.email] = clone(state.school || seedState().school);
      state.schoolByUser[user.email].classes = [];
    }

    var school = state.schoolByUser[user.email];
    school.classes = school.classes || [];
    school.assignments = school.assignments || [];
    school.administrativeDeadlines = school.administrativeDeadlines || [];
    school.classes.forEach(function (item) {
      item.holidays = Array.isArray(item.holidays) ? item.holidays : [];
      item.startDate = item.startDate || '';
      item.endDate = item.endDate || '';
    });
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
      var startDate = details.startDate || '';
      var endDate = details.endDate || '';
      if ((startDate && !isSchoolDate(startDate)) || (endDate && !isSchoolDate(endDate))) {
        throw new Error('Choose valid semester dates.');
      }
      if (startDate && endDate && startDate > endDate) {
        throw new Error('The semester end date must be on or after the start date.');
      }
      if (!Array.isArray(details.holidays) || details.holidays.some(function (date) {
        return !isSchoolDate(date);
      })) {
        throw new Error('Enter valid holiday dates.');
      }
      if (details.holidays.length > 100) {
        throw new Error('A class can have up to 100 skipped dates.');
      }
      return {
        courseName: details.courseName.trim(),
        dayOfWeek: Number(details.dayOfWeek),
        startTime: details.startTime,
        endTime: details.endTime,
        location: details.location.trim(),
        startDate: startDate,
        endDate: endDate,
        holidays: Array.from(new Set(details.holidays))
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

  function isSchoolDate(value) {
    if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    var parts = value.split('-').map(Number);
    var date = new Date(parts[0], parts[1] - 1, parts[2]);
    return date.getFullYear() === parts[0] &&
      date.getMonth() === parts[1] - 1 &&
      date.getDate() === parts[2];
  }

  function hasSharedClassOccurrence(first, second) {
    var today = new Date();
    var startDate = [
      first.startDate || isSchoolDateValue(today),
      second.startDate || isSchoolDateValue(today),
      isSchoolDateValue(today)
    ].sort().pop();
    var endDates = [first.endDate, second.endDate].filter(Boolean).sort();
    var endDate = endDates.length ? endDates[0] : '';
    var parts = startDate.split('-').map(Number);
    var occurrence = new Date(parts[0], parts[1] - 1, parts[2]);
    var targetDay = Number(first.dayOfWeek);
    var daysUntilClass = (targetDay - ((occurrence.getDay() + 6) % 7 + 1) + 7) % 7;
    occurrence.setDate(occurrence.getDate() + daysUntilClass);
    var excludedDates = new Set((first.holidays || []).concat(second.holidays || []));
    var checksRemaining = excludedDates.size + 1;

    while (checksRemaining > 0) {
      var occurrenceKey = isSchoolDateValue(occurrence);
      if (endDate && occurrenceKey > endDate) return false;
      if (!excludedDates.has(occurrenceKey)) return true;
      occurrence.setDate(occurrence.getDate() + 7);
      checksRemaining -= 1;
    }
    return false;
  }

  function isSchoolDateValue(date) {
    var pad = function (value) { return String(value).padStart(2, '0'); };
    return date.getFullYear() + '-' + pad(date.getMonth() + 1) + '-' + pad(date.getDate());
  }

  function ensureNoClassConflict(classes, candidate, itemId) {
    var conflict = classes.find(function (item) {
      return item.id !== itemId &&
        Number(item.dayOfWeek) === candidate.dayOfWeek &&
        candidate.startTime < item.endTime &&
        candidate.endTime > item.startTime &&
        hasSharedClassOccurrence(item, candidate);
    });
    if (conflict) {
      throw new Error(
        'This overlaps with ' + conflict.courseName + ' on ' +
        ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'][candidate.dayOfWeek - 1] +
        '. Adjust the time or semester dates.'
      );
    }
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
    refreshState: function () {
      state = readState();
      return Promise.resolve();
    },
    logout: function () {
      window.localStorage.removeItem(SESSION_KEY);
      window.localStorage.removeItem(ADMIN_KEY);
      return Promise.resolve();
    },
    deleteCurrentAccount: function (password) {
      return requireUser().then(function (user) {
        if (!password || user.password !== password) throw new Error('That password is incorrect.');
        removeUserData(user.email);
        save();
        window.localStorage.removeItem(SESSION_KEY);
      });
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
    createEvent: function (details) {
      var email = window.localStorage.getItem(SESSION_KEY);

      if (!email) {
        return Promise.reject(new Error('Please log in first.'));
      }

      if (!details.title || !details.startAt || !details.location) {
        return Promise.reject(new Error('Please fill in the required event details.'));
      }

      var event = {
        id: uid('event'),
        title: details.title,
        startAt: details.startAt,
        endAt: details.endAt || details.startAt,
        location: details.location,
        eventType: details.eventType || 'Social',
        organiserType: 'Student Run',
        createdBy: email,
        price: Math.max(0, Number(details.price) || 0),
        capacity: details.capacity === '' || details.capacity == null
          ? null
          : Math.max(1, Number(details.capacity)),
        registeredCount: 0,
        pointsAwarded: 0
      };

      state.events.push(event);
      save();

      return Promise.resolve(clone(event));
    },

    updateEvent: function (eventId, details) {
      var email = window.localStorage.getItem(SESSION_KEY);
      var event = state.events.find(function (item) {
        return item.id === eventId;
      });

      if (!email) return Promise.reject(new Error('Please log in first.'));
      if (!event) return Promise.reject(new Error('Event not found.'));
      if (event.createdBy !== email) {
        return Promise.reject(new Error('You can only edit your own events.'));
      }

      if (!details.title || !details.startAt || !details.location) {
        return Promise.reject(new Error('Please fill in the required event details.'));
      }

      event.title = details.title;
      event.startAt = details.startAt;
      event.endAt = details.endAt || details.startAt;
      event.location = details.location;
      event.eventType = details.eventType || 'Social';
      event.price = Math.max(0, Number(details.price) || 0);
      event.capacity = details.capacity === '' || details.capacity == null
        ? null
        : Math.max(1, Number(details.capacity));

      save();
      return Promise.resolve(clone(event));
    },

    deleteEvent: function (eventId) {
      var email = window.localStorage.getItem(SESSION_KEY);
      var event = state.events.find(function (item) {
        return item.id === eventId;
      });

      if (!email) return Promise.reject(new Error('Please log in first.'));
      if (!event) return Promise.reject(new Error('Event not found.'));
      if (event.createdBy !== email) {
        return Promise.reject(new Error('You can only delete your own events.'));
      }

      state.events = state.events.filter(function (item) {
        return item.id !== eventId;
      });

      delete state.eventRegistrations[eventId];

      save();
      return Promise.resolve();
    },

    listMyEvents: function () {
      var email = window.localStorage.getItem(SESSION_KEY);

      if (!email) return Promise.reject(new Error('Please log in first.'));

      return Promise.resolve(clone(state.events.filter(function (event) {
        return event.createdBy === email;
      })));
    },
    
    getSchoolData: function () {
      return requireUser().then(function (user) {
        var school = getUserSchool(user);
        var defaultAssignments = state.schoolDefaults && Array.isArray(state.schoolDefaults.assignments)
          ? state.schoolDefaults.assignments
          : (state.school ? state.school.assignments || [] : []);
        var defaultAssignmentIds = school.assignments.filter(function (item) {
          return defaultAssignments.some(function (defaultItem) {
            return item.title === defaultItem.title &&
              item.courseName === defaultItem.courseName &&
              item.dueAt === defaultItem.dueAt;
          });
        }).map(function (item) { return item.id; });
        var result = clone(school);
        result.defaultAssignmentIds = defaultAssignmentIds;
        result.registeredEvents = (state.events || []).filter(function (event) {
          return (state.eventRegistrations[event.id] || []).indexOf(user.email) !== -1;
        }).map(function (event) {
          return {
            id: event.id,
            title: event.title,
            startAt: event.startAt,
            endAt: event.endAt,
            location: event.location || ''
          };
        });
        return result;
      });
    },
    importSchoolClasses: function (classes) {
      return requireUser().then(function (user) {
        if (!Array.isArray(classes) || !classes.length || classes.length > 100) {
          throw new Error('Choose between 1 and 100 classes to import.');
        }
        var school = getUserSchool(user);
        var prepared = [];
        classes.forEach(function (details) {
          var item = Object.assign({ id: uid('school') }, validateSchoolItem('classes', details));
          ensureNoClassConflict(school.classes.concat(prepared), item, null);
          prepared.push(item);
        });
        school.classes = school.classes.concat(prepared);
        save();
        return clone(prepared);
      });
    },
    createSchoolItem: function (collection, details) {
      return requireUser().then(function (user) {
        var school = getUserSchool(user);
        var validated = validateSchoolItem(collection, details);
        if (collection === 'classes') ensureNoClassConflict(school.classes, validated, null);
        var item = Object.assign(
          { id: uid('school') },
          validated
        );
        school[collection].push(item);
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
        var updated = validateSchoolItem(collection, details);
        if (collection === 'classes') ensureNoClassConflict(school.classes, updated, itemId);
        Object.assign(item, updated);
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
        return (state.eventAttendance[event.id] || []).indexOf(email) !== -1;
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
    deleteForumPost: function (postId) {
      return requireUser().then(function (user) {
        var post = state.forumPosts.find(function (item) { return item.id === postId; });
        if (!post) throw new Error('Post not found.');
        if (post.authorEmail !== user.email) throw new Error('You can only delete your own posts.');
        state.forumPosts = state.forumPosts.filter(function (item) { return item.id !== postId; });
        save();
      });
    },
    deleteForumComment: function (postId, commentId) {
      return requireUser().then(function (user) {
        var post = state.forumPosts.find(function (item) { return item.id === postId; });
        var comment = post && post.comments.find(function (item) { return item.id === commentId; });
        if (!post || !comment) throw new Error('Comment not found.');
        if (comment.authorEmail !== user.email) throw new Error('You can only delete your own comments.');
        // A deleted answer no longer counts toward the author's helpful-answer badges.
        var helpfulCount = (comment.helpfulBy || []).length;
        if (helpfulCount) user.helpfulAnswers = Math.max(0, (user.helpfulAnswers || 0) - helpfulCount);
        post.comments = post.comments.filter(function (item) { return item.id !== commentId; });
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

    adminListEvents: function () {
      if (window.localStorage.getItem(ADMIN_KEY) !== '1') {
        return Promise.reject(new Error('Admin access required.'));
      }

      var events = state.events.map(function (event) {
        var copy = clone(event);
        var registeredEmails = state.eventRegistrations[event.id] || [];
        var attendanceEmails = state.eventAttendance[event.id] || [];

        copy.registeredStudents = registeredEmails.map(function (email) {
          var student = findUser(email);

          return {
            email: email,
            name: student ? student.name : email,
            attended: attendanceEmails.indexOf(email) !== -1
          };
        });

        return copy;
      });

      return Promise.resolve(events);
    },

    adminAddEvent: function (details) {
      if (window.localStorage.getItem(ADMIN_KEY) !== '1') {
        return Promise.reject(new Error('Admin access required.'));
      }

      details = details || {};

      if (!details.title || !details.startAt || !details.location) {
        return Promise.reject(new Error('Please fill in the required event details.'));
      }

      var event = {
        id: uid('event'),
        title: details.title,
        startAt: details.startAt,
        endAt: details.endAt || details.startAt,
        location: details.location,
        eventType: details.eventType || 'Social',
        organiserType: 'Student Union',
        createdBy: 'admin',
        price: Math.max(0, Number(details.price) || 0),
        capacity: details.capacity === '' || details.capacity == null
          ? null
          : Math.max(1, Number(details.capacity)),
        registeredCount: 0,
        pointsAwarded: Math.max(0, Number(details.pointsAwarded) || 0)
      };

      state.events.push(event);
      save();

      return Promise.resolve(clone(event));
    },

    adminUpdateEvent: function (eventId, details) {
      if (window.localStorage.getItem(ADMIN_KEY) !== '1') {
        return Promise.reject(new Error('Admin access required.'));
      }

      details = details || {};

      var event = state.events.find(function (item) {
        return item.id === eventId;
      });

      if (!event) return Promise.reject(new Error('Event not found.'));
      if (event.organiserType !== 'Student Union') {
        return Promise.reject(new Error('Admins can only edit Student Union events.'));
      }

      if (!details.title || !details.startAt || !details.location) {
        return Promise.reject(new Error('Please fill in the required event details.'));
      }

      event.title = details.title;
      event.startAt = details.startAt;
      event.endAt = details.endAt || details.startAt;
      event.location = details.location;
      event.eventType = details.eventType || 'Social';
      event.price = Math.max(0, Number(details.price) || 0);
      event.capacity = details.capacity === '' || details.capacity == null
        ? null
        : Math.max(1, Number(details.capacity));
      event.pointsAwarded = Math.max(0, Number(details.pointsAwarded) || 0);

      save();

      return Promise.resolve(clone(event));
    },

    adminDeleteEvent: function (eventId) {
      if (window.localStorage.getItem(ADMIN_KEY) !== '1') {
        return Promise.reject(new Error('Admin access required.'));
      }

      var event = state.events.find(function (item) {
        return item.id === eventId;
      });

      if (!event) return Promise.reject(new Error('Event not found.'));
      if (event.organiserType !== 'Student Union') {
        return Promise.reject(new Error('Admins can only delete Student Union events.'));
      }

      state.events = state.events.filter(function (item) {
        return item.id !== eventId;
      });

      delete state.eventRegistrations[eventId];
      delete state.eventAttendance[eventId];
      delete state.eventPointAwards[eventId];

      save();

      return Promise.resolve();
    },

    adminMarkAttendance: function (eventId, studentEmail, attended) {
      if (window.localStorage.getItem(ADMIN_KEY) !== '1') {
        return Promise.reject(new Error('Admin access required.'));
      }

      var event = state.events.find(function (item) {
        return item.id === eventId;
      });

      if (!event) {
        return Promise.reject(new Error('Event not found.'));
      }

      if (event.organiserType !== 'Student Union') {
        return Promise.reject(new Error('Attendance can only be managed for Student Union events.'));
      }

      var registered = state.eventRegistrations[eventId] || [];

      if (registered.indexOf(studentEmail) === -1) {
        return Promise.reject(new Error('This student is not registered for the event.'));
      }

      state.eventAttendance[eventId] = state.eventAttendance[eventId] || [];
      state.eventPointAwards[eventId] = state.eventPointAwards[eventId] || {};

      var attendance = state.eventAttendance[eventId];
      var alreadyAttended = attendance.indexOf(studentEmail) !== -1;

      if (attended && !alreadyAttended) {
        var student = findUser(studentEmail);

        if (!student) {
          return Promise.reject(new Error('Student account not found.'));
        }

        var award = Math.max(0, Number(event.pointsAwarded) || 0);

        attendance.push(studentEmail);
        state.eventPointAwards[eventId][studentEmail] = award;
        student.points = (Number(student.points) || 0) + award;

      } else if (!attended && alreadyAttended) {
        attendance.splice(attendance.indexOf(studentEmail), 1);

        var studentToReverse = findUser(studentEmail);

        var previousAward = Object.prototype.hasOwnProperty.call(
          state.eventPointAwards[eventId],
          studentEmail
        )
          ? Number(state.eventPointAwards[eventId][studentEmail]) || 0
          : Number(event.pointsAwarded) || 0;

        if (studentToReverse) {
          studentToReverse.points = Math.max(
            0,
            (Number(studentToReverse.points) || 0) - previousAward
          );
        }

        delete state.eventPointAwards[eventId][studentEmail];
      }

      save();

      return Promise.resolve({
        attended: attended,
        pointsAwarded: attended ? (Number(event.pointsAwarded) || 0) : 0
      });
    },

    adminListReportedPosts: function () {
      return requireAdmin().then(function () {
        return clone(state.forumPosts.filter(function (post) {
          return post.reports && post.reports.length;
        }));
      });
    },
    adminListForumPosts: function () {
      return requireAdmin().then(function () {
        return clone(state.forumPosts).sort(function (a, b) {
          return new Date(b.createdAt) - new Date(a.createdAt);
        });
      });
    },
    adminDismissReports: function (postId) {
      return requireAdmin().then(function () {
        var post = state.forumPosts.find(function (item) { return item.id === postId; });
        if (!post) throw new Error('Post not found.');
        post.reports = [];
        save();
      });
    },
    adminDeleteForumPost: function (postId) {
      return requireAdmin().then(function () {
        state.forumPosts = state.forumPosts.filter(function (post) { return post.id !== postId; });
        save();
      });
    },
    adminDeleteForumComment: function (postId, commentId) {
      return requireAdmin().then(function () {
        var post = state.forumPosts.find(function (item) { return item.id === postId; });
        var comment = post && post.comments.find(function (item) { return item.id === commentId; });
        if (!post || !comment) throw new Error('Comment not found.');
        var author = findUser(comment.authorEmail);
        var helpfulCount = (comment.helpfulBy || []).length;
        if (author && helpfulCount) author.helpfulAnswers = Math.max(0, (author.helpfulAnswers || 0) - helpfulCount);
        post.comments = post.comments.filter(function (item) { return item.id !== commentId; });
        save();
        return clone(post);
      });
    },
    // Unlike listRewards, this includes out-of-stock rewards so admins can restock them.
    adminListRewards: function () {
      return requireAdmin().then(function () { return clone(state.rewards); });
    },
    adminAddReward: function (details) {
      return requireAdmin().then(function () {
        var reward = rewardRequest(details);
        reward.id = uid('reward');
        reward.donatedAt = todayIso();
        reward.image = null;
        state.rewards.push(reward);
        save();
        return clone(reward);
      });
    },
    adminDeleteReward: function (rewardId) {
      return requireAdmin().then(function () {
        state.rewards = state.rewards.filter(function (reward) { return reward.id !== rewardId; });
        save();
      });
    },
    adminUpdateReward: function (rewardId, changes) {
      return requireAdmin().then(function () {
        var reward = state.rewards.find(function (item) { return item.id === rewardId; });
        if (!reward) throw new Error('Reward not found.');
        Object.assign(reward, rewardRequest(changes));
        save();
        return clone(reward);
      });
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
