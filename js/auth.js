(function () {
  'use strict';

  var DATABASE_NAME = 'landed-local';
  var DATABASE_VERSION = 1;
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
    var salt = createPasswordSalt();

    return hashPassword(details.password, salt).then(function (passwordHash) {
      var user = {
        email: email,
        name: details.name.trim(),
        country: details.country.trim(),
        major: '',
        bio: '',
        languages: '',
        points: 50,
        completedQuests: [],
        createdAt: new Date().toISOString(),
        passwordSalt: toHex(salt),
        passwordHash: passwordHash
      };

      return runTransaction('readwrite', function (store) {
        return store.add(user);
      }).then(function () {
        window.localStorage.setItem(SESSION_KEY, email);
        return publicUser(user);
      }).catch(function (error) {
        if (error && error.name === 'ConstraintError') {
          throw new Error('An account with that email already exists. Log in instead.');
        }
        throw error;
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

  function logout() {
    window.localStorage.removeItem(SESSION_KEY);
  }

  window.LandedAuth = {
    authenticate: authenticate,
    createAccount: createAccount,
    getCurrentUser: getCurrentUser,
    logout: logout,
    updateCurrentUser: updateCurrentUser,
    updateProgress: updateProgress
  };
})();
