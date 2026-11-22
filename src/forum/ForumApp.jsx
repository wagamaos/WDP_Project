import { useCallback, useEffect, useMemo, useState } from 'react';
import { api } from '../shared/landed.js';
import { timeAgo } from '../shared/dates.js';
import { CATEGORIES, CategoryIcon, FormMessage } from './forumUtils.jsx';
import NewPostDialog from './NewPostDialog.jsx';
import ReportDialog from './ReportDialog.jsx';
import ThreadDialog from './ThreadDialog.jsx';
import { emailHelpfulAnswer, emailReplyToAuthor, emailReportReceived } from './forumEmails.js';

function sortNewestFirst(posts) {
  return [...posts].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

export default function ForumApp() {
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pageMessage, setPageMessage] = useState(null);
  const [category, setCategory] = useState('all');

  const [thread, setThread] = useState(null);          // post shown in the thread dialog
  const [threadNotice, setThreadNotice] = useState(null);
  const [drafts, setDrafts] = useState({});            // unsent comment text, per post id
  const [newPostOpen, setNewPostOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);

  const refreshPosts = useCallback(() => (
    api().listForumPosts()
      .then((list) => setPosts(sortNewestFirst(list)))
      .catch((error) => setPageMessage({ text: error.message, isError: true }))
  ), []);

  useEffect(() => {
    api().getCurrentUser()
      .then((current) => { setUser(current); return refreshPosts(); })
      .catch((error) => setPageMessage({ text: error.message, isError: true }))
      .finally(() => setLoading(false));
  }, [refreshPosts]);

  const visiblePosts = useMemo(
    () => posts.filter((post) => category === 'all' || post.category === category),
    [posts, category]
  );

  const channelCounts = useMemo(() => {
    const counts = {};
    CATEGORIES.forEach((name) => { counts[name] = 0; });
    posts.forEach((post) => { counts[post.category] = (counts[post.category] || 0) + 1; });
    return counts;
  }, [posts]);

  function openThread(postId) {
    setThreadNotice(null);
    api().getForumPost(postId).then((post) => {
      if (!post) throw new Error('This post is no longer available.');
      setThread(post);
    }).catch((error) => setPageMessage({ text: error.message, isError: true }));
  }

  function requireLogin() {
    if (user) return true;
    window.location.href = 'login.html';
    return false;
  }

  function createPost(details) {
    return api().createForumPost(details).then((post) => {
      setNewPostOpen(false);
      return refreshPosts().then(() => openThread(post.id));
    });
  }

  function addComment(text) {
    const postId = thread.id;
    return api().addForumComment(postId, text).then((post) => {
      emailReplyToAuthor(post, user, text);
      setDrafts((current) => {
        const next = { ...current };
        delete next[postId];
        return next;
      });
      setThread(post);
      setThreadNotice(null);
      refreshPosts();
    }).catch((error) => setThreadNotice({ text: error.message, isError: true }));
  }

  function markHelpful(commentId) {
    const before = thread.comments.find((comment) => comment.id === commentId);
    const alreadyMarked = Boolean(before && (before.helpfulBy || []).includes(user.email));
    api().markForumCommentHelpful(thread.id, commentId)
      .then((post) => {
        setThread(post);
        if (!alreadyMarked) {
          emailHelpfulAnswer(post, post.comments.find((comment) => comment.id === commentId), user);
        }
      })
      .catch((error) => setThreadNotice({ text: error.message, isError: true }));
  }

  function deletePost() {
    if (!window.confirm(`Delete "${thread.title}"? This removes the post and all its comments. This cannot be undone.`)) return;
    const postId = thread.id;
    api().deleteForumPost(postId).then(() => {
      setDrafts((current) => {
        const next = { ...current };
        delete next[postId];
        return next;
      });
      setThread(null);
      setThreadNotice(null);
      setPageMessage({ text: 'Your post was deleted.', isError: false });
      refreshPosts();
    }).catch((error) => setThreadNotice({ text: error.message, isError: true }));
  }

  function deleteComment(commentId) {
    if (!window.confirm('Delete your comment? This cannot be undone.')) return;
    api().deleteForumComment(thread.id, commentId).then((post) => {
      setThread(post);
      setThreadNotice({ text: 'Your comment was deleted.', isError: false });
      refreshPosts();
    }).catch((error) => setThreadNotice({ text: error.message, isError: true }));
  }

  function openReport() {
    if (!requireLogin()) return;
    if ((thread.reports || []).some((report) => report.email === user.email)) {
      setThreadNotice({ text: 'You have already reported this post. Moderators will review it.', isError: false });
      return;
    }
    setReportOpen(true);
  }

  function submitReport(reason, details) {
    const postId = thread.id;
    const reported = thread;
    return api().reportForumPost(postId, reason, details).then(() => {
      setReportOpen(false);
      setThreadNotice({ text: 'Thanks. Your report was sent to the moderators.', isError: false });
      emailReportReceived(reported, user, reason, details).then((sent) => {
        if (!sent) return;
        setThreadNotice((current) => (current && current.text.startsWith('Thanks. Your report')
          ? { ...current, text: `${current.text} A confirmation was emailed to ${user.email}.` }
          : current));
      });
      return api().getForumPost(postId).then((post) => { if (post) setThread(post); });
    });
  }

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Forum</h1>
          <p className="page-sub">Ask questions, share advice, get trusted answers. Open to everyone.</p>
        </div>
        <button type="button" className="btn btn-royal" id="new-post-btn" aria-label="Create a new post"
          onClick={() => { if (requireLogin()) setNewPostOpen(true); }}>
          <svg viewBox="0 0 24 24" aria-hidden="true" style={{ width: 16, height: 16, stroke: 'currentColor', fill: 'none', strokeWidth: 2.5, strokeLinecap: 'round', strokeLinejoin: 'round' }}>
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          New Post
        </button>
      </div>

      <div className="forum-guest-banner" role="status" aria-label={user ? 'Signed-in forum notice' : 'Guest browsing notice'}>
        <div className="forum-guest-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
        </div>
        <div className="forum-guest-text">
          <strong>{user ? `You are signed in as ${user.name}` : 'You are browsing as a guest'}</strong>
          <span>{user
            ? 'Create posts, join discussions, and earn points for helpful answers.'
            : 'Log in to post, reply, and earn points for helpful answers.'}</span>
        </div>
        {!user && (
          <div className="forum-guest-actions">
            <a href="login.html" className="btn btn-gold btn-sm" id="forum-login-btn">Log in</a>
            <a href="login.html#signup" className="btn btn-outline btn-sm" id="forum-signup-btn"
              style={{ borderColor: 'rgba(255,255,255,.4)', color: '#fff' }}>Sign up</a>
          </div>
        )}
      </div>

      <FormMessage id="forum-page-message" message={pageMessage} />

      <div className="forum-layout">
        <div>
          <div className="forum-filter-tabs" role="tablist" aria-label="Filter by category">
            {['all', ...CATEGORIES].map((name) => (
              <button key={name} type="button" role="tab" id={`tab-${name.toLowerCase()}`}
                className={'forum-tab' + (category === name ? ' active' : '')}
                aria-selected={category === name} data-category={name}
                onClick={() => setCategory(name)}>
                {name === 'all' ? 'All' : name}
              </button>
            ))}
          </div>

          <div className="card forum-card" aria-label="Forum posts">
            <ul className="forum-post-list" id="forum-post-list" aria-live="polite">
              {visiblePosts.map((post) => (
                <li className="forum-post-item" data-category={post.category} key={post.id}>
                  <CategoryIcon category={post.category} />
                  <div className="forum-post-body">
                    <button type="button" className="forum-post-title" onClick={() => openThread(post.id)}>{post.title}</button>
                    <div className="forum-post-meta">
                      {post.category} · {post.comments.length} {post.comments.length === 1 ? 'reply' : 'replies'} · {timeAgo(post.createdAt)}
                    </div>
                  </div>
                  <span className={'forum-post-pill ' + (post.comments.length ? 'answered' : 'chat')}>
                    {post.comments.length ? 'Answered' : 'Chat'}
                  </span>
                </li>
              ))}
            </ul>
            {loading && <p className="forum-empty-state">Loading posts…</p>}
            <p className="forum-empty-state" id="forum-empty-state" hidden={loading || visiblePosts.length > 0}>
              No posts match this channel yet.
            </p>
          </div>
        </div>

        <aside className="forum-aside" aria-label="Forum sidebar">
          <div className="card">
            <div className="card-title">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
              Channels
            </div>
            <ul className="channel-list" aria-label="Forum channels">
              {CATEGORIES.map((name) => (
                <li className="channel-item" key={name}>
                  <span className="channel-name">{name}</span>
                  <span className="channel-count">{channelCounts[name]}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="card forum-verified-card">
            <div className="forum-verified-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12" /></svg>
            </div>
            <div>
              <div className="forum-verified-title">Verified answers</div>
              <p className="forum-verified-sub">Checked by moderators and tagged with a badge. Helpful answers earn points once you log in.</p>
            </div>
          </div>
        </aside>
      </div>

      <NewPostDialog open={newPostOpen} onClose={() => setNewPostOpen(false)} onCreate={createPost} />

      <ThreadDialog
        post={thread}
        user={user}
        draft={thread ? drafts[thread.id] || '' : ''}
        onDraftChange={(text) => setDrafts((current) => ({ ...current, [thread.id]: text }))}
        notice={threadNotice}
        onNotice={setThreadNotice}
        onClose={() => { setThread(null); setThreadNotice(null); refreshPosts(); }}
        onComment={addComment}
        onHelpful={markHelpful}
        onReport={openReport}
        onDeletePost={deletePost}
        onDeleteComment={deleteComment}
      />

      <ReportDialog open={reportOpen} onClose={() => setReportOpen(false)} onSubmit={submitReport} />
    </>
  );
}
