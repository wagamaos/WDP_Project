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

// Thank-you with a record of where and when the student left the item.
export function emailDonationThanks(user, details, result) {
  return sendNotification({
    to: user.email,
    toName: user.name,
    subject: `Thank you for donating ${details.name}`,
    heading: `Thank you, ${firstName(user.name)}! 💛`,
    intro: 'Your donation is now listed for other students to redeem. Keep this email as your record of the item you left with the school office.',
    rows: [
      ['Item', details.name],
      ['Left at', details.schoolOffice],
      ['Date left', longDate(details.collectionDate)],
      ['Points earned', '+' + pts(result.donation.points)],
      ['New balance', pts(result.user.points)]
    ],
    buttonLabel: 'View rewards',
    buttonPage: 'rewards.html',
    footer: 'You are receiving this because you donated a reward on Landed.'
  });
}
