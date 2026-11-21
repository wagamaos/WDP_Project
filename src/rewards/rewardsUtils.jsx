// Point milestones that unlock badges; the ring shows progress to the next one.
export const POINT_MILESTONES = [50, 400, 800, 1200, 2000];

export function milestoneProgress(points) {
  const reached = POINT_MILESTONES.filter((milestone) => points >= milestone).length;
  const next = POINT_MILESTONES[reached];
  const previous = reached === 0 ? 0 : POINT_MILESTONES[reached - 1];
  if (next === undefined) {
    return { level: reached, progress: 1, label: 'All point badges unlocked' };
  }
  return {
    level: reached,
    progress: Math.max(0, Math.min(1, (points - previous) / (next - previous))),
    label: `${next - points} pts to your next badge`
  };
}

const BADGE_ICONS = {
  Welcome: <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />,
  Explorer: <path d="M12 2l3 7 7 .5-5.3 4.5 1.7 7-6.4-3.8L5.6 21l1.7-7L2 9.5 9 9z" />,
  Helper: <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />,
  Verified: <polyline points="20 6 9 17 4 12" />,
  'Campus Guide': <path d="M12 2l3 7 7 .5-5.3 4.5 1.7 7-6.4-3.8L5.6 21l1.7-7L2 9.5 9 9z" />,
  Pathfinder: <path d="M12 2v20M2 12h20M5 5l14 14M19 5L5 19" />,
  Scholar: <path d="M3 7l9-4 9 4-9 4-9-4zM5 10v6l7 3 7-3v-6" />,
  'Community Champion': <path d="M12 21s-7-4.4-9.2-9A5.2 5.2 0 0 1 12 6a5.2 5.2 0 0 1 9.2 6c-2.2 4.6-9.2 9-9.2 9z" />,
  'Landed Legend': <><circle cx="12" cy="8" r="6" /><path d="M15.5 13L17 22l-5-3-5 3 1.5-9" /></>
};

const LOCK_ICON = <><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></>;

export function BadgeIcon({ badge }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      {badge.earned ? BADGE_ICONS[badge.name] : LOCK_ICON}
    </svg>
  );
}

export const GIFT_ICON = (
  <svg viewBox="0 0 24 24" aria-hidden="true"><polyline points="20 12 20 22 4 22 4 12" /><rect x="2" y="7" width="20" height="5" /></svg>
);

export function isInStock(reward) {
  return reward.stock === null || reward.stock === undefined || reward.stock > 0;
}

export function stockLabel(reward) {
  if (reward.stock === null || reward.stock === undefined) return 'Unlimited';
  return reward.stock > 0 ? `${reward.stock} available` : 'Out of stock';
}

// Label for the redeem button, given the user's points.
export function redeemState(reward, points) {
  if (!isInStock(reward)) return { canRedeem: false, label: 'Out of stock' };
  if (points < reward.cost) return { canRedeem: false, label: `Need ${reward.cost - points} more points` };
  return { canRedeem: true, label: `Redeem for ${reward.cost} points` };
}

export function validateDonation(form, today) {
  const errors = {};
  const name = form.name.trim();
  if (!name) errors.name = 'This field is required.';
  else if (name.length < 2 || name.length > 100) errors.name = 'Reward name must be between 2 and 100 characters.';
  if (form.description.trim().length > 1000) errors.description = 'Description must be 1000 characters or fewer.';
  if (!form.schoolOffice.trim()) errors.schoolOffice = 'This field is required.';
  if (!form.collectionDate) errors.collectionDate = 'This field is required.';
  else if (form.collectionDate > today) errors.collectionDate = 'The date you left it cannot be in the future.';
  const points = Number(form.points);
  if (String(form.points).trim() === '') errors.points = 'This field is required.';
  else if (!Number.isInteger(points) || points < 1 || points > 500) errors.points = 'Points must be a whole number between 1 and 500.';
  if (!form.confirmed) errors.confirmed = 'You must confirm the item was left with the school office.';
  return errors;
}
