import { useEffect, useRef, useState } from 'react';
import { api } from '../shared/landed.js';

// Shows the new like state instantly, then saves in the background.
// Only one save runs at a time; extra clicks are combined so the final state always matches the last click.
export default function LikeButton({ postId, commentId, likes, user, onError }) {
  const list = Array.isArray(likes) ? likes : [];
  const likedNow = Boolean(user && list.includes(user.email));

  const saved = useRef({ liked: likedNow, count: list.length });
  const wanted = useRef(likedNow);
  const saving = useRef(false);
  const [view, setView] = useState({ liked: likedNow, count: list.length });

  // New data from the parent (e.g. after a comment was added): take it, unless a save is in progress.
  const likesKey = list.join('|');
  useEffect(() => {
    if (saving.current) return;
    saved.current = { liked: likedNow, count: list.length };
    wanted.current = likedNow;
    setView(saved.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [likesKey, user && user.email]);

  function sync() {
    if (saving.current || wanted.current === saved.current.liked) return;
    saving.current = true;
    api().toggleForumLike(postId, commentId || null).then((post) => {
      const target = commentId ? post.comments.find((comment) => comment.id === commentId) : post;
      const savedLikes = (target && target.likes) || [];
      saved.current = { liked: savedLikes.includes(user.email), count: savedLikes.length };
    }).catch((error) => {
      wanted.current = saved.current.liked;
      if (onError) onError(error.message || 'Could not save your like.');
    }).finally(() => {
      saving.current = false;
      if (wanted.current !== saved.current.liked) sync();
      else setView(saved.current);
    });
  }

  function handleClick() {
    if (!user) {
      window.location.href = 'login.html';
      return;
    }
    wanted.current = !wanted.current;
    const base = saved.current;
    const diff = wanted.current === base.liked ? 0 : (wanted.current ? 1 : -1);
    setView({ liked: wanted.current, count: base.count + diff });
    sync();
  }

  const kind = commentId ? 'comment' : 'post';
  return (
    <button
      type="button"
      className={'forum-like-btn' + (view.liked ? ' liked' : '')}
      aria-pressed={view.liked}
      aria-label={`${kind === 'comment' ? 'Like comment' : 'Like post'} (${view.count})`}
      title={user ? `Like or unlike this ${kind}` : 'Log in to like'}
      onClick={handleClick}
    >
      {(view.liked ? '♥ Liked' : '♡ Like') + ` (${view.count})`}
    </button>
  );
}
