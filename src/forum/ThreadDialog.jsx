import { useState } from 'react';
import { useDialog } from '../shared/useDialog.js';
import { timeAgo } from '../shared/dates.js';
import LikeButton from './LikeButton.jsx';
import { FieldError, FormMessage, fieldProps, validateField } from './forumUtils.jsx';

export default function ThreadDialog({
  post, user, draft, onDraftChange, notice, onNotice, onClose, onComment, onHelpful, onReport
}) {
  const [commentError, setCommentError] = useState('');
  const [busy, setBusy] = useState(false);
  const ref = useDialog(Boolean(post), () => {
    setCommentError('');
    onClose();
  });

  function handleSubmit(event) {
    event.preventDefault();
    if (!user) {
      window.location.href = 'login.html';
      return;
    }
    const error = validateField('comment', draft);
    setCommentError(error);
    if (error) {
      document.getElementById('comment-body').focus();
      return;
    }
    setBusy(true);
    onComment(draft.trim()).finally(() => setBusy(false));
  }

  const showError = (text) => onNotice({ text, isError: true });

  return (
    <dialog className="forum-dialog forum-thread-dialog" id="thread-dialog" aria-labelledby="thread-dialog-title" ref={ref}>
      {post && (
        <div>
          <div className="forum-dialog-heading">
            <h2 id="thread-dialog-title">{post.title}</h2>
            <button type="button" className="forum-dialog-close" id="close-thread-dialog"
              aria-label="Close thread" onClick={() => ref.current.close()}>×</button>
          </div>

          <div id="thread-content">
            <article>
              <span className="forum-thread-category">{post.category}</span>
              <h2>{post.title}</h2>
              <p className="forum-thread-meta">{post.category} · {post.author} · {timeAgo(post.createdAt)}</p>
              <p className="forum-thread-body">{post.body}</p>
              <div className="forum-thread-actions">
                <LikeButton key={`like-${post.id}`} postId={post.id} likes={post.likes} user={user} onError={showError} />
              </div>
            </article>
          </div>

          <div className="forum-comments-heading">
            <h3>Comments</h3>
            <button type="button" className="btn btn-outline btn-sm" id="report-post-btn" onClick={onReport}>Report post</button>
          </div>

          <div className="forum-comments" id="thread-comments">
            {!post.comments.length && <p className="forum-no-comments">No comments yet. Start the conversation.</p>}
            {post.comments.map((comment) => {
              const canMarkHelpful = user && user.email === post.authorEmail && user.email !== comment.authorEmail;
              const marked = (comment.helpfulBy || []).includes(user && user.email);
              return (
                <article className="forum-comment" key={comment.id}>
                  <div className="forum-comment-header">
                    <strong>{comment.author}</strong>
                    <span>{timeAgo(comment.createdAt)}</span>
                  </div>
                  <p>{comment.body}</p>
                  <LikeButton key={`like-${comment.id}`} postId={post.id} commentId={comment.id}
                    likes={comment.likes} user={user} onError={showError} />
                  {canMarkHelpful && (
                    <button type="button" className="forum-helpful-btn" disabled={marked}
                      onClick={() => onHelpful(comment.id)}>
                      {marked ? 'Helpful ✓' : 'Mark helpful'}
                    </button>
                  )}
                </article>
              );
            })}
          </div>

          <form className="forum-comment-form" id="comment-form" noValidate onSubmit={handleSubmit}>
            <label htmlFor="comment-body">Add a comment</label>
            <textarea {...fieldProps('comment-body', commentError)} name="body" maxLength={1000}
              placeholder={user ? 'Be respectful and constructive.' : 'Log in to join the conversation.'}
              value={draft}
              onChange={(e) => {
                onDraftChange(e.target.value);
                setCommentError(validateField('comment', e.target.value));
              }} />
            <FieldError id="comment-body-error" message={commentError} />
            <FormMessage id="comment-message" message={notice} />
            <button type="submit" className="btn btn-royal" id="submit-comment-btn" disabled={busy}>
              {user ? 'Post comment' : 'Log in to comment'}
            </button>
          </form>
        </div>
      )}
    </dialog>
  );
}
