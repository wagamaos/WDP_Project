import { useState } from 'react';
import { useDialog } from '../shared/useDialog.js';
import { CATEGORIES, FieldError, FormMessage, fieldProps, validateField } from './forumUtils.jsx';

const EMPTY = { category: '', title: '', body: '' };

export default function NewPostDialog({ open, onClose, onCreate }) {
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
    const next = {
      category: validateField('category', form.category),
      title: validateField('title', form.title),
      body: validateField('body', form.body)
    };
    setErrors(next);
    const firstBad = Object.keys(next).find((key) => next[key]);
    if (firstBad) {
      document.getElementById(`post-${firstBad}`).focus();
      return;
    }
    setBusy(true);
    onCreate({ category: form.category, title: form.title.trim(), body: form.body.trim() })
      .catch((error) => setMessage({ text: error.message, isError: true }))
      .finally(() => setBusy(false));
  }

  return (
    <dialog className="forum-dialog" id="post-dialog" aria-labelledby="post-dialog-title" ref={ref}>
      <form id="post-form" noValidate onSubmit={handleSubmit}>
        <button type="button" className="forum-dialog-close" id="close-post-dialog-x"
          aria-label="Close create post dialog" onClick={() => ref.current.close()}>×</button>
        <h2 id="post-dialog-title">Create a new post</h2>
        <p className="forum-dialog-sub">Ask a clear question or share helpful advice with the community.</p>
        <FormMessage id="post-message" message={message} />

        <label htmlFor="post-category">Channel</label>
        <select {...fieldProps('post-category', errors.category)} name="category" required
          value={form.category} onChange={(e) => update('category', e.target.value)}>
          <option value="">Choose a channel</option>
          {CATEGORIES.map((category) => <option key={category}>{category}</option>)}
        </select>
        <FieldError id="post-category-error" message={errors.category} />

        <label htmlFor="post-title">Title</label>
        <input {...fieldProps('post-title', errors.title)} name="title" type="text" maxLength={100} required
          placeholder="What would you like to ask?" value={form.title} onChange={(e) => update('title', e.target.value)} />
        <FieldError id="post-title-error" message={errors.title} />

        <label htmlFor="post-body">Details</label>
        <textarea {...fieldProps('post-body', errors.body)} name="body" maxLength={2000} required
          placeholder="Add enough context for helpful replies." value={form.body} onChange={(e) => update('body', e.target.value)} />
        <FieldError id="post-body-error" message={errors.body} />

        <div className="forum-dialog-actions">
          <button type="button" className="btn btn-outline" id="close-post-dialog" onClick={() => ref.current.close()}>Cancel</button>
          <button type="submit" className="btn btn-royal" id="submit-post-btn" disabled={busy}>Publish post</button>
        </div>
      </form>
    </dialog>
  );
}
