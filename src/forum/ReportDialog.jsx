import { useState } from 'react';
import { useDialog } from '../shared/useDialog.js';
import { FieldError, FormMessage, REPORT_REASONS, fieldProps, validateField } from './forumUtils.jsx';

const EMPTY = { reason: '', details: '' };

export default function ReportDialog({ open, onClose, onSubmit }) {
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState(null);
  const [busy, setBusy] = useState(false);

  const ref = useDialog(open, () => {
    setForm(EMPTY);
    setErrors({});
    setMessage(null);
    onClose();
  });

  function update(name, value) {
    setForm({ ...form, [name]: value });
    setErrors({ ...errors, [name]: validateField(name, value) });
  }

  function handleSubmit(event) {
    event.preventDefault();
    const next = { reason: validateField('reason', form.reason), details: validateField('details', form.details) };
    setErrors(next);
    const firstBad = Object.keys(next).find((key) => next[key]);
    if (firstBad) {
      document.getElementById(`report-${firstBad}`).focus();
      return;
    }
    setBusy(true);
    onSubmit(form.reason, form.details.trim())
      .catch((error) => setMessage({ text: error.message, isError: true }))
      .finally(() => setBusy(false));
  }

  return (
    <dialog className="forum-dialog" id="report-dialog" aria-labelledby="report-dialog-title" ref={ref}>
      <form id="report-form" noValidate onSubmit={handleSubmit}>
        <button type="button" className="forum-dialog-close" id="close-report-dialog-x"
          aria-label="Close report dialog" onClick={() => ref.current.close()}>×</button>
        <h2 id="report-dialog-title">Report this post</h2>
        <p className="forum-dialog-sub">Reports help moderators keep the community safe.</p>
        <FormMessage id="report-message" message={message} />

        <label htmlFor="report-reason">Reason</label>
        <select {...fieldProps('report-reason', errors.reason)} name="reason" required
          value={form.reason} onChange={(e) => update('reason', e.target.value)}>
          <option value="">Choose a reason</option>
          {REPORT_REASONS.map((reason) => <option key={reason}>{reason}</option>)}
        </select>
        <FieldError id="report-reason-error" message={errors.reason} />

        <label htmlFor="report-details">Additional details <span>(optional)</span></label>
        <textarea {...fieldProps('report-details', errors.details)} name="details" maxLength={1000}
          placeholder="Tell moderators what happened." value={form.details} onChange={(e) => update('details', e.target.value)} />
        <FieldError id="report-details-error" message={errors.details} />

        <div className="forum-dialog-actions">
          <button type="button" className="btn btn-outline" id="close-report-dialog" onClick={() => ref.current.close()}>Cancel</button>
          <button type="submit" className="btn btn-royal" id="submit-report-btn" disabled={busy}>Submit report</button>
        </div>
      </form>
    </dialog>
  );
}
