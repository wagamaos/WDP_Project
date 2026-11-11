# SQLite database and device transfer

The site uses SQLite in the browser for account, forum, reward, and budget records. The SQLite file is kept on the current device so the static site can run on GitHub Pages; GitHub Pages cannot run a writable database server or synchronize data between visitors.

## Move records to another device

1. On the current device, open **Database backup** and choose **Download SQLite backup**.
2. Transfer the `.sqlite` file using a method you trust.
3. On the new device, open the same deployed site and go to **Database backup**.
4. Choose **Import SQLite backup**, select the file, and confirm the replacement.
5. Reload the page and log in using an account stored in the imported database.

Import replaces the database on the receiving device. Exported backups contain account data (including password hashes), forum content, rewards, and budget entries; keep the file private and retain a backup before importing over data you need.

The first visit migrates existing account, forum, and reward records from the previous browser database when available. A database backup does not transfer the current login session or display theme; log in again on the receiving device.

The SQLite engine is loaded from CDNJS, so the browser needs an internet connection when the database is first opened. The site must be opened through GitHub Pages or another HTTPS/localhost origin, not directly as a `file://` page.
