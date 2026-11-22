import { api } from '../shared/landed.js';
import { longDate } from '../shared/dates.js';
import { firstName, sendNotification } from '../shared/email.js';

const HELPFUL_BADGES = [
  { name: 'Helper', needed: 5 },
  { name: 'Community Champion', needed: 10 }
];

function snippet(text, max = 280) {
  const clean = String(text || '').trim();
  return clean.length > max ? clean.slice(0, max - 1).trimEnd() + '…' : clean;
}

function findUser(email) {
  return api().listLeaderboard().then((users) => users.find(
    (user) => String(user.email).toLowerCase() === String(email).toLowerCase()
  ) || null);
}

// To the post's author when someone else comments.
export function emailReplyToAuthor(post, commenter, commentBody) {
  if (!post || !commenter || !post.authorEmail || post.authorEmail === commenter.email) return Promise.resolve(false);
  const replies = post.comments.length;
  return sendNotification({
    to: post.authorEmail,
    toName: post.author,
    subject: `${commenter.name} replied to "${snippet(post.title, 60)}"`,
    heading: `You have a new reply, ${firstName(post.author)}`,
    intro: `${commenter.name} commented on your ${post.category} post "${post.title}".`,
    quote: snippet(commentBody),
    rows: [
      ['Post', post.title],
      ['Replies so far', String(replies)]
    ],
    buttonLabel: 'Read the reply',
    buttonPage: 'forum.html',
    footer: 'You are receiving this because someone replied to your post on the Landed forum.'
  });
}

// To the comment's author when the post owner marks their answer helpful.
export function emailHelpfulAnswer(post, comment, markedBy) {
  if (!post || !comment) return Promise.resolve(false);
  return findUser(comment.authorEmail).then((author) => {
    const count = author ? author.helpfulAnswers || 0 : null;
    const rows = [['Post', post.title]];
    let intro = `${markedBy.name} marked your answer on "${post.title}" as helpful. Thanks for helping a fellow student!`;

    if (count != null) {
      rows.push(['Helpful answers', String(count)]);
      const unlocked = HELPFUL_BADGES.find((badge) => badge.needed === count);
      const next = HELPFUL_BADGES.find((badge) => badge.needed > count);
      if (unlocked) {
        intro += ` That makes ${count} helpful answers, so you just unlocked the ${unlocked.name} badge!`;
        rows.push(['Badge unlocked', unlocked.name]);
      } else if (next) {
        rows.push(['Next badge', `${next.name} (${next.needed - count} more)`]);
      }
    }

    return sendNotification({
      to: comment.authorEmail,
      toName: comment.author,
      subject: 'Your answer was marked helpful 🎉',
      heading: `Nice one, ${firstName(comment.author)}!`,
      intro,
      quote: snippet(comment.body),
      rows,
      buttonLabel: 'See your badges',
      buttonPage: 'rewards.html',
      footer: 'You are receiving this because your answer was marked helpful on the Landed forum.'
    });
  });
}

// To the reporter, confirming moderators received the report.
export function emailReportReceived(post, reporter, reason, details) {
  if (!post || !reporter) return Promise.resolve(false);
  const rows = [
    ['Post', post.title],
    ['Reason', reason],
    ['Submitted', longDate(new Date().toISOString())]
  ];
  if (details) rows.push(['Your notes', snippet(details, 200)]);
  return sendNotification({
    to: reporter.email,
    toName: reporter.name,
    subject: 'We received your report',
    heading: `Thanks for flagging this, ${firstName(reporter.name)}`,
    intro: 'Our moderators will review the post against the community guidelines. ' +
      'You do not need to do anything else, and the author is not told who reported it.',
    rows,
    buttonLabel: 'Back to the forum',
    buttonPage: 'forum.html',
    footer: 'You are receiving this because you reported a post on the Landed forum.'
  });
}
