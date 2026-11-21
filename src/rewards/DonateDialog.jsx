import { useState } from 'react';
import { useDialog } from '../shared/useDialog.js';
import { todayIso } from '../shared/dates.js';
import { validateDonation } from './rewardsUtils.jsx';

const EMPTY = { name: '', description: '', schoolOffice: '', collectionDate: '', points: '50', confirmed: false };

// field name -> element id
const IDS = {
  name: 'donate-name', description: 'donate-description', schoolOffice: 'donate-school-office',
  collectionDate: 'donate-collection-date', points: 'donate-points', confirmed: 'donate-confirmed'
};

export default function DonateDialog({ open, onClose, onDonate }) {
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const today = todayIso();

  const ref = useDialog(open, () => {
    setForm(EMPTY);
    setErrors({});
    setMessage('');
    onClose();
  });

  function update(name, value) {
    const next = { ...form, [name]: value };
    setForm(next);
    const all = validateDonation(next, today);
    setErrors({ ...errors, [name]: all[name] || '' });
  }

  function handleSubmit(event) {
    event.preventDefault();
    setMessage('');
    const all = validateDonation(form, today);
    setErrors(all);
    const firstBad = Object.keys(IDS).find((key) => all[key]);
    if (firstBad) {
      document.getElementById(IDS[firstBad]).focus();
      return;
    }
    setBusy(true);
    onDonate({
      name: form.name.trim(),
      description: form.description.trim(),
      schoolOffice: form.schoolOffice.trim(),
      collectionDate: form.collectionDate,
      points: Number(form.points),
      confirmed: form.confirmed
    }).catch((error) => setMessage(error.message || 'Could not record the donation.'))
      .finally(() => setBusy(false));
  }

  function props(name) {
    const error = errors[name];
    return {
      id: IDS[name],
      name,
      className: error ? 'has-error' : undefined,
      'aria-invalid': error ? 'true' : 'false',
      'aria-describedby': `${IDS[name]}-error`
    };
  }

  const fieldError = (name) => <span className="reward-field-error" id={`${IDS[name]}-error`}>{errors[name] || ''}</span>;

  return (
    <dialog id="donate-dialog" aria-labelledby="donate-title" ref={ref}>
      <button className="dialog-close" id="close-donate-x" type="button" aria-label="Close donate reward dialog"
        onClick={() => ref.current.close()}>&times;</button>
      <h2 id="donate-title">Donate a reward</h2>
      <p>Leave the item with your school office first, then submit these details to receive points.</p>
      <form id="donate-form" noValidate onSubmit={handleSubmit}>
        <div className={'reward-form-message' + (message ? ' is-error' : '')} id="donate-message" role="alert" hidden={!message}>{message}</div>
        <label htmlFor="donate-name">Reward name
          <input {...props('name')} autoComplete="off" maxLength={100} value={form.name} onChange={(e) => update('name', e.target.value)} />
          {fieldError('name')}
        </label>
        <label htmlFor="donate-description">Description
          <textarea {...props('description')} rows={3} maxLength={1000} value={form.description} onChange={(e) => update('description', e.target.value)} />
          {fieldError('description')}
        </label>
        <label htmlFor="donate-school-office">School office
          <input {...props('schoolOffice')} autoComplete="off" value={form.schoolOffice} onChange={(e) => update('schoolOffice', e.target.value)} />
          {fieldError('schoolOffice')}
        </label>
        <label htmlFor="donate-collection-date">Date left with school
          <input {...props('collectionDate')} type="date" max={today} value={form.collectionDate} onChange={(e) => update('collectionDate', e.target.value)} />
          {fieldError('collectionDate')}
        </label>
        <label htmlFor="donate-points">Points requested
          <input {...props('points')} type="number" min={1} max={500} step={1} value={form.points} onChange={(e) => update('points', e.target.value)} />
          {fieldError('points')}
        </label>
        <label className="reward-checkbox-row" htmlFor="donate-confirmed">
          <input {...props('confirmed')} type="checkbox" checked={form.confirmed} onChange={(e) => update('confirmed', e.target.checked)} />
          <span>I left this reward with the school office.</span>
          {fieldError('confirmed')}
        </label>
        <button className="btn btn-gold" type="submit" disabled={busy}>Submit donation</button>
        <button className="btn btn-outline" id="close-donate" type="button" onClick={() => ref.current.close()}>Cancel</button>
      </form>
    </dialog>
  );
}
