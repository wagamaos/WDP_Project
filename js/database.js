(function () {
  'use strict';

  var DATABASE_NAME = 'landed-sqlite-files';
  var DATABASE_VERSION = 1;
  var DATABASE_KEY = 'main';
  var LEGACY_DATABASE_NAME = 'landed-local';
  var SQL_JS_URL = 'https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.10.3/sql-wasm.js';
  var SQL_WASM_BASE_URL = 'https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.10.3/';
  var COLLECTIONS = {
    users: true,
    forum_posts: true,
    rewards: true,
    budget_entries: true,
    budget_settings: true
  };
  var database;
  var sqlPromise;
  var storagePromise;
  var queue = Promise.resolve();

  function loadSqlJs() {
    if (window.initSqlJs) return Promise.resolve(window.initSqlJs);
    if (!sqlPromise) {
      sqlPromise = new Promise(function (resolve, reject) {
        var script = document.createElement('script');
        script.src = SQL_JS_URL;
        script.onload = function () {
          if (window.initSqlJs) resolve(window.initSqlJs);
          else reject(new Error('SQLite could not be initialized.'));
        };
        script.onerror = function () {
          reject(new Error('Could not load the SQLite library. Check your internet connection and reload.'));
        };
        document.head.appendChild(script);
      });
    }
    return sqlPromise;
  }

  function openStorage() {
    if (!window.indexedDB) {
      return Promise.reject(new Error('This browser does not support persistent database storage.'));
    }
    if (!storagePromise) {
      storagePromise = new Promise(function (resolve, reject) {
        var request = window.indexedDB.open(DATABASE_NAME, DATABASE_VERSION);
        request.onupgradeneeded = function () {
          request.result.createObjectStore('files');
        };
        request.onsuccess = function () { resolve(request.result); };
        request.onerror = function () {
          storagePromise = null;
          reject(request.error || new Error('Could not open database storage.'));
        };
      });
    }
    return storagePromise;
  }

  function readStoredFile() {
    return openStorage().then(function (storage) {
      return new Promise(function (resolve, reject) {
        var transaction = storage.transaction('files', 'readonly');
        var request = transaction.objectStore('files').get(DATABASE_KEY);
        request.onsuccess = function () { resolve(request.result || null); };
        request.onerror = function () { reject(request.error || new Error('Could not read the saved database.')); };
        transaction.onerror = function () { reject(transaction.error || new Error('Could not read the saved database.')); };
      });
    });
  }

  function writeStoredFile(bytes) {
    return openStorage().then(function (storage) {
      return new Promise(function (resolve, reject) {
        var transaction = storage.transaction('files', 'readwrite');
        transaction.objectStore('files').put(bytes, DATABASE_KEY);
        transaction.oncomplete = function () { resolve(); };
        transaction.onerror = function () { reject(transaction.error || new Error('Could not save the database.')); };
        transaction.onabort = function () { reject(transaction.error || new Error('Saving the database was cancelled.')); };
      });
    });
  }

  function persistOrRestore(previousBytes) {
    return writeStoredFile(database.export()).catch(function (error) {
      database.close();
      return loadSqlJs().then(function (initSqlJs) {
        return initSqlJs({ locateFile: function (file) { return SQL_WASM_BASE_URL + file; } });
      }).then(function (SQL) {
        database = new SQL.Database(previousBytes);
        throw error;
      });
    });
  }

  function ensureSchema(sqlDatabase) {
    sqlDatabase.run('CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, payload TEXT NOT NULL)');
    sqlDatabase.run('CREATE TABLE IF NOT EXISTS forum_posts (id TEXT PRIMARY KEY, payload TEXT NOT NULL)');
    sqlDatabase.run('CREATE TABLE IF NOT EXISTS rewards (id TEXT PRIMARY KEY, payload TEXT NOT NULL)');
    sqlDatabase.run('CREATE TABLE IF NOT EXISTS budget_entries (id TEXT PRIMARY KEY, payload TEXT NOT NULL)');
    sqlDatabase.run('CREATE TABLE IF NOT EXISTS budget_settings (id TEXT PRIMARY KEY, payload TEXT NOT NULL)');
    sqlDatabase.run('CREATE TABLE IF NOT EXISTS app_metadata (key TEXT PRIMARY KEY, value TEXT NOT NULL)');
    sqlDatabase.run('INSERT OR REPLACE INTO app_metadata (key, value) VALUES (?, ?)', ['application', 'landed']);
    sqlDatabase.run('PRAGMA user_version = 1');
  }

  function hasCurrentSchema(sqlDatabase) {
    try {
      var version = sqlDatabase.exec('PRAGMA user_version');
      var marker = sqlDatabase.exec("SELECT value FROM app_metadata WHERE key = 'application'");
      return version.length && version[0].values[0][0] === 1 &&
        marker.length && marker[0].values[0][0] === 'landed';
    } catch (error) {
      return false;
    }
  }

  function readLegacyDatabase() {
    return new Promise(function (resolve, reject) {
      var request = window.indexedDB.open(LEGACY_DATABASE_NAME);
      request.onupgradeneeded = function () {
        var legacy = request.result;
        ['users', 'forumPosts', 'rewards'].forEach(function (name) {
          if (!legacy.objectStoreNames.contains(name)) {
            legacy.createObjectStore(name, { keyPath: name === 'users' ? 'email' : 'id' });
          }
        });
      };
      request.onerror = function () {
        reject(request.error || new Error('Could not check the previous database for records.'));
      };
      request.onsuccess = function () {
        var legacy = request.result;
        var names = ['users', 'forumPosts', 'rewards'].filter(function (name) {
          return legacy.objectStoreNames.contains(name);
        });
        if (!names.length) {
          legacy.close();
          resolve({ users: [], forum_posts: [], rewards: [] });
          return;
        }

        var values = { users: [], forum_posts: [], rewards: [] };
        var transaction;
        try {
          transaction = legacy.transaction(names, 'readonly');
          names.forEach(function (name) {
            var request = transaction.objectStore(name).getAll();
            request.onsuccess = function () {
              values[name === 'forumPosts' ? 'forum_posts' : name] = request.result || [];
            };
          });
          transaction.oncomplete = function () {
            legacy.close();
            resolve(values);
          };
          transaction.onerror = function () {
            legacy.close();
            reject(transaction.error || new Error('Could not migrate records from the previous database.'));
          };
          transaction.onabort = function () {
            legacy.close();
            reject(transaction.error || new Error('The previous database migration was cancelled.'));
          };
        } catch (error) {
          legacy.close();
          reject(error);
        }
      };
    });
  }

  function insertRecords(sqlDatabase, collection, records, idField) {
    records.forEach(function (record) {
      var id = record[idField];
      if (id === undefined || id === null) return;
      sqlDatabase.run(
        'INSERT OR REPLACE INTO ' + collection + ' (id, payload) VALUES (?, ?)',
        [String(id), JSON.stringify(record)]
      );
    });
  }

  function initializeDatabase() {
    return loadSqlJs().then(function (initSqlJs) {
      return initSqlJs({
        locateFile: function (file) { return SQL_WASM_BASE_URL + file; }
      });
    }).then(function (SQL) {
      return readStoredFile().then(function (storedFile) {
        if (storedFile) {
          try {
            database = new SQL.Database(new Uint8Array(storedFile));
            if (hasCurrentSchema(database)) return;
            ensureSchema(database);
            return writeStoredFile(database.export());
          } catch (error) {
            throw new Error('The saved SQLite database is invalid: ' + error.message);
          }
        }

        database = new SQL.Database();
        ensureSchema(database);
        return readLegacyDatabase().then(function (legacy) {
          insertRecords(database, 'users', legacy.users, 'email');
          insertRecords(database, 'forum_posts', legacy.forum_posts, 'id');
          insertRecords(database, 'rewards', legacy.rewards, 'id');
          return writeStoredFile(database.export());
        });
      });
    });
  }

  var ready = initializeDatabase();

  function checkCollection(collection) {
    if (!COLLECTIONS[collection]) {
      return Promise.reject(new Error('Unknown database collection: ' + collection));
    }
    return ready;
  }

  function enqueue(operation) {
    var result = queue.then(function () { return ready.then(operation); });
    queue = result.catch(function () {});
    return result;
  }

  function all(collection) {
    return checkCollection(collection).then(function () {
      return enqueue(function () {
        var rows = database.exec('SELECT payload FROM ' + collection);
        return rows.length ? rows[0].values.map(function (row) { return JSON.parse(row[0]); }) : [];
      });
    });
  }

  function get(collection, id) {
    return checkCollection(collection).then(function () {
      return enqueue(function () {
        var statement = database.prepare('SELECT payload FROM ' + collection + ' WHERE id = ?');
        try {
          statement.bind([String(id)]);
          return statement.step() ? JSON.parse(statement.getAsObject().payload) : null;
        } finally {
          statement.free();
        }
      });
    });
  }

  function write(collection, id, value, insertOnly) {
    return checkCollection(collection).then(function () {
      return enqueue(function () {
        var before = database.export();
        database.run('BEGIN IMMEDIATE');
        try {
          database.run(
            insertOnly
              ? 'INSERT INTO ' + collection + ' (id, payload) VALUES (?, ?)'
              : 'INSERT INTO ' + collection + ' (id, payload) VALUES (?, ?) ON CONFLICT(id) DO UPDATE SET payload = excluded.payload',
            [String(id), JSON.stringify(value)]
          );
          database.run('COMMIT');
        } catch (error) {
          database.run('ROLLBACK');
          throw error;
        }

        return persistOrRestore(before).then(function () { return value; });
      });
    });
  }

  function remove(collection, id) {
    return checkCollection(collection).then(function () {
      return enqueue(function () {
        var before = database.export();
        try {
          database.run('BEGIN IMMEDIATE');
          database.run('DELETE FROM ' + collection + ' WHERE id = ?', [String(id)]);
          database.run('COMMIT');
        } catch (error) {
          database.run('ROLLBACK');
          throw error;
        }
        return persistOrRestore(before);
      });
    });
  }

  function exportFile() {
    return ready.then(function () {
      return enqueue(function () {
        return new Blob([database.export()], { type: 'application/vnd.sqlite3' });
      });
    });
  }

  function importFile(file) {
    return ready.then(function () {
      return file.arrayBuffer();
    }).then(function (buffer) {
      return loadSqlJs().then(function (initSqlJs) {
        return initSqlJs({ locateFile: function (name) { return SQL_WASM_BASE_URL + name; } });
      }).then(function (SQL) {
        var imported;
        try {
          imported = new SQL.Database(new Uint8Array(buffer));
          var integrity = imported.exec('PRAGMA integrity_check');
          if (!integrity.length || integrity[0].values[0][0] !== 'ok') {
            throw new Error('The selected file did not pass SQLite integrity checks.');
          }
          var marker = imported.exec("SELECT value FROM app_metadata WHERE key = 'application'");
          if (!marker.length || marker[0].values[0][0] !== 'landed') {
            throw new Error('The selected SQLite file is not a Landed database backup.');
          }
          ensureSchema(imported);
          var replacement = imported.export();
          return enqueue(function () {
            return writeStoredFile(replacement).then(function () {
              database.close();
              database = imported;
              imported = null;
            });
          });
        } catch (error) {
          if (imported) imported.close();
          throw new Error('Could not import that SQLite database: ' + error.message);
        }
      });
    });
  }

  window.LandedDatabase = {
    ready: ready,
    all: all,
    get: get,
    insert: function (collection, id, value) { return write(collection, id, value, true); },
    put: function (collection, id, value) { return write(collection, id, value, false); },
    remove: remove,
    exportFile: exportFile,
    importFile: importFile
  };
})();
