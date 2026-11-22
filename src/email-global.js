/*
 * Email functions for the pages that use plain <script> files (profile and admin).
 * Vite builds this into react-dist/email.js; those pages load it with
 *   <script type="module" src="react-dist/email.js"></script>
 * and call window.LandedEmail.<group>.<function>(...). The React pages (sign up, forum, rewards)
 * import the same modules directly. Every function resolves (never rejects), so a failed email
 * never breaks the page.
 */
import { isNotifyEmailOn } from './shared/email.js';
import { emailAccountDeleted, emailFeedback } from './shared/accountEmails.js';
import { emailCommentRemoved, emailPostRemoved } from './shared/moderationEmails.js';

window.LandedEmail = {
  isOn: isNotifyEmailOn,
  account: { deleted: emailAccountDeleted, feedback: emailFeedback },
  moderation: { postRemoved: emailPostRemoved, commentRemoved: emailCommentRemoved }
};
