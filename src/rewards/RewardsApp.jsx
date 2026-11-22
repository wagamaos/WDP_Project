import { useEffect, useState } from 'react';
import { api } from '../shared/landed.js';
import { useDialog } from '../shared/useDialog.js';
import { longDate } from '../shared/dates.js';
import DonateDialog from './DonateDialog.jsx';
import { emailDonationThanks, emailRedemptionReceipt } from './rewardsEmails.js';
import {
  BadgeIcon, GIFT_ICON, milestoneProgress, redeemState, stockLabel
} from './rewardsUtils.jsx';

const RING_CIRCUMFERENCE = 2 * Math.PI * 50;

function RewardVisual({ reward, className }) {
  if (reward.image && reward.image.dataUrl) {
    return <img className={className} src={reward.image.dataUrl} alt={reward.name} />;
  }
  return GIFT_ICON;
}

function RewardDetailsDialog({ reward, points, busy, error, onClose, onRedeem }) {
  const ref = useDialog(Boolean(reward), onClose);
  const state = reward ? redeemState(reward, points) : null;
  return (
    <dialog id="reward-details-dialog" aria-labelledby="reward-details-title" ref={ref}>
      <button className="dialog-close" id="close-reward-details" type="button" aria-label="Close reward details"
        onClick={() => ref.current.close()}>&times;</button>
      {reward && (
        <>
          <div id="reward-details-content">
            <h2 id="reward-details-title">{reward.name}</h2>
            {reward.image && reward.image.dataUrl && <RewardVisual reward={reward} className="reward-details-image" />}
            <p className="reward-details-description">{reward.description || 'A community-donated reward for students.'}</p>
            <div className="reward-details-meta">
              <div><span className="reward-detail-label">Donated by</span><span className="reward-detail-value">{reward.donatedBy || 'Landed community'}</span></div>
              <div><span className="reward-detail-label">Donated on</span><span className="reward-detail-value">{longDate(reward.donatedAt)}</span></div>
              <div><span className="reward-detail-label">Cost</span><span className="reward-detail-value">{reward.cost} points</span></div>
              <div><span className="reward-detail-label">Availability</span><span className="reward-detail-value">{stockLabel(reward)}</span></div>
            </div>
            <p className="reward-details-collection">{reward.collectionDetails}</p>
          </div>
          <div className="reward-form-message is-error" role="alert" hidden={!error}>{error}</div>
          <button className="btn btn-gold" id="details-redeem-btn" type="button"
            disabled={!state.canRedeem || busy} onClick={() => onRedeem(reward)}>
            {busy ? 'Redeeming…' : state.label}
          </button>
        </>
      )}
    </dialog>
  );
}

function SuccessDialog({ success, onClose }) {
  const ref = useDialog(Boolean(success), onClose);
  return (
    <dialog id="redeem-success-dialog" aria-labelledby="redeem-success-title" ref={ref}>
      <button className="dialog-close" id="close-redeem-success-x" type="button" aria-label="Close confirmation"
        onClick={() => ref.current.close()}>&times;</button>
      <h2 id="redeem-success-title">{success ? success.title : ''}</h2>
      <p id="redeem-success-message">{success ? success.message : ''}</p>
      <button className="btn btn-gold" id="close-redeem-success" type="button" onClick={() => ref.current.close()}>Done</button>
    </dialog>
  );
}

export default function RewardsApp() {
  const [user, setUser] = useState(null);
  const [rewards, setRewards] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loadError, setLoadError] = useState('');

  const [selected, setSelected] = useState(null);
  const [redeeming, setRedeeming] = useState(false);
  const [redeemError, setRedeemError] = useState('');
  const [success, setSuccess] = useState(null);
  const [donateOpen, setDonateOpen] = useState(false);

  function refresh() {
    return Promise.all([api().getCurrentUser(), api().listLeaderboard(), api().listRewards()])
      .then(([current, board, list]) => {
        if (!current) {
          window.location.replace('login.html');
          return;
        }
        setUser(current);
        setLeaderboard(board);
        setRewards(list);
      });
  }

  useEffect(() => {
    refresh().catch((error) => setLoadError(error.message || 'Could not load rewards.'));
  }, []);

  // Adds a line to the open success message once its email has actually been sent.
  function noteEmailed(title, sending, text) {
    sending.then((sent) => {
      if (!sent) return;
      setSuccess((current) => (current && current.title === title
        ? { ...current, message: `${current.message} ${text}` }
        : current));
    });
  }

  function redeem(reward) {
    const redeemer = user;
    setRedeeming(true);
    setRedeemError('');
    api().redeemReward(reward.id).then((result) => {
      setSelected(null);
      const title = 'Successfully redeemed';
      setSuccess({
        title,
        message: `Your ${result.redemption.rewardName} will be ready for collection at your school office from ` +
          `${longDate(result.redemption.collectionDate)}. Show this confirmation and your student ID when you collect it.`
      });
      noteEmailed(title, emailRedemptionReceipt(redeemer, reward, result),
        `We also emailed a receipt to ${redeemer.email}.`);
      return refresh();
    }).catch((error) => setRedeemError(error.message || 'Could not redeem this reward.'))
      .finally(() => setRedeeming(false));
  }

  function donate(details) {
    const donor = user;
    return api().donateReward(details).then((result) => {
      setDonateOpen(false);
      const title = 'Donation recorded';
      setSuccess({
        title,
        message: `Thank you! ${result.donation.points} points were added to your balance, and your reward is now listed for other students.`
      });
      noteEmailed(title, emailDonationThanks(donor, details, result),
        `A record of your donation was emailed to ${donor.email}.`);
      return refresh();
    });
  }

  if (loadError) return <p className="rewards-empty">{loadError}</p>;
  if (!user) return null;

  const points = user.points || 0;
  const ring = milestoneProgress(points);
  const badges = api().getBadgeCatalog(user);
  const earnedCount = badges.filter((badge) => badge.earned).length;
  const rank = leaderboard.findIndex((entry) => entry.email === user.email);

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Rewards &amp; Leaderboard</h1>
          <p className="page-sub">Earn points, collect badges, climb the board and redeem real-world treats.</p>
        </div>
      </div>

      <div className="rewards-layout">
        <div className="rewards-left">
          <div className="card rewards-xp-card">
            <div className="rewards-ring-wrap" aria-label={`Total accumulated points: ${points}. ${ring.label}.`}>
              <svg className="rewards-ring-svg" viewBox="0 0 120 120" aria-hidden="true">
                <circle cx="60" cy="60" r="50" fill="none" stroke="rgba(255,255,255,.15)" strokeWidth="10" />
                <circle cx="60" cy="60" r="50" fill="none" stroke="var(--gold)" strokeWidth="10"
                  strokeDasharray={RING_CIRCUMFERENCE} strokeDashoffset={RING_CIRCUMFERENCE * (1 - ring.progress)}
                  strokeLinecap="round" transform="rotate(-90 60 60)"
                  style={{ transition: 'stroke-dashoffset 1.2s ease-out' }} />
              </svg>
              <div className="rewards-ring-inner">
                <div className="rewards-ring-level">L{ring.level}</div>
              </div>
            </div>
            <div className="rewards-xp-info">
              <div className="rewards-xp-pts">{points} pts</div>
              <div className="rewards-xp-label">{ring.label}</div>
            </div>
          </div>

          <div className="card" aria-labelledby="rw-badges-heading">
            <div className="card-title">
              <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="6" /><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11" /></svg>
              <h2 id="rw-badges-heading" style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--navy)' }}>Badges</h2>
              <span className="badge-count">&middot; {earnedCount} of {badges.length}</span>
            </div>
            <div className="badges-grid" id="rewards-badges-grid" aria-label="Your badges">
              {badges.map((badge) => (
                <div className="badge-item" key={badge.name} title={badge.detail}>
                  <div className={'badge-hex ' + (badge.earned ? 'earned' : 'locked')} role="img"
                    aria-label={`${badge.name} badge - ${badge.earned ? 'earned' : 'locked'}. ${badge.detail}`}>
                    <BadgeIcon badge={badge} />
                  </div>
                  <span className={'badge-label' + (badge.earned ? '' : ' locked-lbl')}>{badge.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="card" aria-labelledby="lb-heading">
          <div className="card-title">
            <svg viewBox="0 0 24 24" aria-hidden="true"><polyline points="18 20 18 10" /><polyline points="12 20 12 4" /><polyline points="6 20 6 14" /></svg>
            <h2 id="lb-heading" style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--navy)' }}>Total points leaderboard</h2>
          </div>
          <ol className="leaderboard-list" id="leaderboard-list" aria-label="Leaderboard by total accumulated points">
            {leaderboard.map((entry, index) => {
              const isYou = entry.email === user.email;
              const medal = ['gold-rank', 'silver-rank', 'bronze-rank'][index] || '';
              return (
                <li className={'lb-item' + (isYou ? ' lb-you' : '')} key={entry.email}>
                  <div className={`lb-rank ${medal}${isYou ? ' lb-rank-you' : ''}`} aria-label={`Rank ${index + 1}`}>{index + 1}</div>
                  <span className="lb-name">{entry.name}{isYou ? ' (you)' : ''}</span>
                  <span className={'lb-pts' + (isYou ? ' lb-pts-you' : '')}>{entry.points || 0} pts</span>
                </li>
              );
            })}
          </ol>
          <p className="lb-hint" id="lb-hint">
            {rank < 0 ? 'Your total accumulated points determine your rank.' : `Rank #${rank + 1} · ${points} total accumulated points`}
          </p>
        </div>

        <div className="card" aria-labelledby="redeem-heading">
          <div className="card-title">
            <svg viewBox="0 0 24 24" aria-hidden="true"><polyline points="20 12 20 22 4 22 4 12" /><rect x="2" y="7" width="20" height="5" /><line x1="12" y1="22" x2="12" y2="7" /><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z" /><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" /></svg>
            <h2 id="redeem-heading" style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--navy)' }}>Redeem rewards</h2>
          </div>
          <ul className="redeem-list" id="redeem-list" aria-label="Redeemable rewards">
            {rewards.map((reward) => (
              <li className="redeem-item" key={reward.id}>
                <button className="reward-details-button" type="button" aria-label={`View details for ${reward.name}`}
                  onClick={() => { setRedeemError(''); setSelected(reward); }}>
                  <span className="redeem-visual" aria-hidden="true"><RewardVisual reward={reward} className="redeem-image" /></span>
                  <span className="redeem-info">
                    <span className="redeem-name">{reward.name}</span>
                    <span className="redeem-cost">{reward.cost} pts</span>
                    <span className="redeem-stock">{stockLabel(reward)}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
          <p className="rewards-empty" id="rewards-empty" hidden={rewards.length > 0}>No rewards are available yet.</p>
          <button className="btn btn-gold add-reward-cta" id="donate-reward-btn" type="button" onClick={() => setDonateOpen(true)}>
            Add a reward for points
          </button>
        </div>
      </div>

      <RewardDetailsDialog reward={selected} points={points} busy={redeeming} error={redeemError}
        onClose={() => setSelected(null)} onRedeem={redeem} />
      <SuccessDialog success={success} onClose={() => setSuccess(null)} />
      <DonateDialog open={donateOpen} onClose={() => setDonateOpen(false)} onDonate={donate} />
    </>
  );
}
