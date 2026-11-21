export const CATEGORIES = ['Housing', 'Visas', 'Money', 'Food', 'Study', 'Other'];

export const REPORT_REASONS = [
  'Harassment or hate', 'Spam or advertising', 'Unsafe or illegal advice',
  'Privacy violation', 'Other community guideline concern'
];

const CATEGORY_ICONS = {
  Housing: <><path d="M3 12L12 3l9 9" /><path d="M9 21V12h6v9" /></>,
  Food: <><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></>,
  Visas: <><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></>,
  Money: <><rect x="1" y="4" width="22" height="16" rx="2" /><line x1="1" y1="10" x2="23" y2="10" /></>,
  Study: <><rect x="2" y="3" width="20" height="14" rx="2" /><path d="M8 21h8M12 17v4" /></>,
  Other: <><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></>
};

export function CategoryIcon({ category }) {
  const tone = category === 'Food' ? 'gold' : category === 'Money' ? 'mint' : 'blue';
  return (
    <div className={`forum-post-icon ${tone}`} aria-hidden="true">
      <svg viewBox="0 0 24 24">{CATEGORY_ICONS[category] || CATEGORY_ICONS.Other}</svg>
    </div>
  );
}

// Same rules as before the React version.
export function validateField(name, value) {
  const text = String(value || '').trim();
  switch (name) {
    case 'category':
    case 'reason':
      return text ? '' : 'This field is required.';
    case 'title':
      if (!text) return 'This field is required.';
      return text.length < 8 || text.length > 100 ? 'Title must be between 8 and 100 characters.' : '';
    case 'body':
      if (!text) return 'This field is required.';
      return text.length < 20 || text.length > 2000 ? 'Details must be between 20 and 2000 characters.' : '';
    case 'comment':
      if (!text) return 'This field is required.';
      return text.length < 2 || text.length > 1000 ? 'Comment must be between 2 and 1000 characters.' : '';
    case 'details':
      return text.length > 1000 ? 'Additional details must be 1000 characters or fewer.' : '';
    default:
      return '';
  }
}

export function FormMessage({ id, message }) {
  return (
    <div className={'forum-form-message' + (message && message.isError ? ' is-error' : '')} id={id} role="alert"
      hidden={!message || !message.text}>
      {message ? message.text : ''}
    </div>
  );
}

export function FieldError({ id, message }) {
  return <div className="forum-field-error" id={id} role="alert">{message || ''}</div>;
}

// Props for an input/select/textarea that shows its validation state.
export function fieldProps(id, error) {
  return {
    id,
    className: error ? 'has-error' : undefined,
    'aria-invalid': error ? 'true' : 'false',
    'aria-describedby': error ? `${id}-error` : undefined
  };
}
