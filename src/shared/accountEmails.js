import { EMAIL_CONFIG, firstName, sendNotification } from './email.js';

// Goodbye email, sent just before the account is removed.
export function emailAccountDeleted(user) {
  if (!user) return Promise.resolve(false);
  return sendNotification({
    to: user.email,
    toName: user.name,
    subject: 'Your Landed account has been deleted',
    heading: `Goodbye for now, ${firstName(user.name)}`,
    intro: 'Your account and its data (posts, comments, points, budget, school tracker and event sign-ups) have been permanently deleted. ' +
      'We are sorry to see you go, and you are always welcome to sign up again.',
    rows: [
      ['Account', user.email],
      ['Points at deletion', `${user.points || 0} pts`]
    ],
    buttonLabel: 'Create a new account',
    buttonPage: 'login.html#signup',
    footer: 'You are receiving this because your Landed account was deleted. If this was not you, contact the Landed team.'
  });
}

// Feedback form on the profile page, sent to the Landed team inbox. Reply goes straight to the student.
export function emailFeedback(user, topic, message) {
  if (!user) return Promise.resolve(false);
  return sendNotification({
    to: EMAIL_CONFIG.teamEmail,
    toName: 'Landed team',
    replyTo: user.email,
    subject: `[Feedback] ${topic} from ${user.name}`,
    heading: `New feedback: ${topic}`,
    intro: `${user.name} sent a message from their profile page. Reply to this email to answer them directly.`,
    quote: message,
    rows: [
      ['From', `${user.name} (${user.email})`],
      ['School', user.university || 'Not set'],
      ['Topic', topic]
    ],
    buttonLabel: 'Open Landed',
    buttonPage: 'index.html',
    footer: 'Sent from the Landed feedback form.'
  });
}
