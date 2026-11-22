import { firstName, sendNotification } from './email.js';

function reasonsFor(post) {
  const reasons = [...new Set((post.reports || []).map((report) => report.reason).filter(Boolean))];
  return reasons.length ? reasons.join(', ') : 'Did not follow the community guidelines';
}

function snippet(text, max = 280) {
  const clean = String(text || '').trim();
  return clean.length > max ? clean.slice(0, max - 1).trimEnd() + '…' : clean;
}

// To the author when an admin removes their post.
export function emailPostRemoved(post) {
  if (!post || !post.authorEmail) return Promise.resolve(false);
  return sendNotification({
    to: post.authorEmail,
    toName: post.author,
    subject: 'Your forum post was removed',
    heading: `A note from the moderators, ${firstName(post.author)}`,
    intro: 'One of your posts was removed from the Landed forum, along with its comments. ' +
      'Please review the community guidelines before posting again.',
    quote: snippet(post.body),
    rows: [
      ['Post', post.title],
      ['Channel', post.category],
      ['Reason', reasonsFor(post)]
    ],
    buttonLabel: 'Back to the forum',
    buttonPage: 'forum.html',
    footer: 'You are receiving this because a moderator removed your post on Landed.'
  });
}

// To the author when an admin removes one of their comments.
export function emailCommentRemoved(post, comment) {
  if (!post || !comment || !comment.authorEmail) return Promise.resolve(false);
  return sendNotification({
    to: comment.authorEmail,
    toName: comment.author,
    subject: 'Your forum comment was removed',
    heading: `A note from the moderators, ${firstName(comment.author)}`,
    intro: `Your comment on "${post.title}" was removed because it did not follow the community guidelines.`,
    quote: snippet(comment.body),
    rows: [['Post', post.title], ['Channel', post.category]],
    buttonLabel: 'Back to the forum',
    buttonPage: 'forum.html',
    footer: 'You are receiving this because a moderator removed your comment on Landed.'
  });
}
