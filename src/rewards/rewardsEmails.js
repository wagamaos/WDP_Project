import { longDate } from '../shared/dates.js';
import { firstName, sendNotification } from '../shared/email.js';

const pts = (value) => `${Number(value) || 0} pts`;

// "Collect from your school office." -> "Your school office"
function collectionPlace(details) {
  const place = String(details || '').replace(/^collect from\s+/i, '').replace(/\.\s*$/, '').trim();
  return place ? place.charAt(0).toUpperCase() + place.slice(1) : 'Your school office';
}

// Receipt the student can show when collecting the reward.
export function emailRedemptionReceipt(user, reward, result) {
  const { redemption } = result;
  return sendNotification({
    to: user.email,
    toName: user.name,
    subject: `Your reward is reserved: ${redemption.rewardName}`,
    heading: `Enjoy your treat, ${firstName(user.name)}!`,
    intro: 'Your reward is reserved. Show this email and your student ID when you collect it.',
    rows: [
      ['Reward', redemption.rewardName],
      ['Points spent', pts(reward.cost)],
      ['Points left', pts(result.user.points)],
      ['Collect from', collectionPlace(redemption.collectionDetails)],
      ['Ready from', longDate(redemption.collectionDate)],
      ['Receipt number', redemption.id]
    ],
    buttonLabel: 'View rewards',
    buttonPage: 'rewards.html',
    footer: 'You are receiving this because you redeemed a reward on Landed.'
  });
}

// Thank-you with the drop-off details the student entered.
export function emailDonationThanks(user, details, result) {
  return sendNotification({
    to: user.email,
    toName: user.name,
    subject: `Thank you for donating ${details.name}`,
    heading: `Thank you, ${firstName(user.name)}! 💛`,
    intro: 'Your donation is now listed for other students. Please drop the item off at the school office on the date below.',
    rows: [
      ['Item', details.name],
      ['Drop off at', details.schoolOffice],
      ['Drop-off date', longDate(details.collectionDate)],
      ['Points earned', '+' + pts(result.donation.points)],
      ['New balance', pts(result.user.points)]
    ],
    buttonLabel: 'View rewards',
    buttonPage: 'rewards.html',
    footer: 'You are receiving this because you donated a reward on Landed.'
  });
}

// Celebrates badges that were not earned before the action but are now.
export function emailNewBadges(user, badgesBefore, badgesAfter) {
  const before = new Set(badgesBefore.filter((badge) => badge.earned).map((badge) => badge.name));
  const unlocked = badgesAfter.filter((badge) => badge.earned && !before.has(badge.name));
  if (!unlocked.length) return Promise.resolve(false);

  const one = unlocked.length === 1;
  return sendNotification({
    to: user.email,
    toName: user.name,
    subject: one ? `You unlocked the ${unlocked[0].name} badge! 🏅` : `You unlocked ${unlocked.length} new badges! 🏅`,
    heading: `New badge${one ? '' : 's'}, ${firstName(user.name)}!`,
    intro: `You now have ${badgesAfter.filter((badge) => badge.earned).length} of ${badgesAfter.length} badges. Keep going!`,
    rows: unlocked.map((badge) => [badge.name, badge.detail]),
    buttonLabel: 'See your badges',
    buttonPage: 'rewards.html',
    footer: 'You are receiving this because you earned a badge on Landed.'
  });
}
