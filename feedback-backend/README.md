# Page Scroll Master Feedback Worker

Cloudflare Worker for extension feedback and uninstall survey feedback.

- `POST /v1/feedback` validates multipart in-extension feedback, limits each
  hashed network address to five submissions per hour, forwards the message and
  optional images through Resend, and retains content-free delivery metadata for
  30 days.
- `GET /uninstall` serves the lightweight uninstall survey page used by
  `chrome.runtime.setUninstallURL()`.
- `POST /v1/uninstall-feedback` validates JSON uninstall feedback, forwards the
  selected reasons, optional message, optional contact, extension version, and
  interface language through Resend, and retains only content-free delivery and
  rate-limit metadata.

## Required configuration

1. Create a dedicated D1 database and add its `DB` binding to `wrangler.toml`.
2. Apply `schema.sql` to the remote database.
3. Configure these Worker secrets:
   - `RESEND_API_KEY`
   - `IP_HASH_SALT`
   - `FEEDBACK_FROM_EMAIL`
   - `FEEDBACK_TO_EMAIL`
4. Deploy the Worker as `page-scroll-master-feedback`.

The clients expect:

`https://page-scroll-master-feedback.kscje-apps.workers.dev/v1/feedback`

`https://page-scroll-master-feedback.kscje-apps.workers.dev/uninstall`

`https://page-scroll-master-feedback.kscje-apps.workers.dev/v1/uninstall-feedback`

The Worker does not collect page URLs or browser language, and it does not store
feedback text, uninstall survey message text, contact details, images, or plain
IP addresses. Resend receives the submitted content solely to deliver the
feedback email.

## Current deployment

- Worker: `https://page-scroll-master-feedback.kscje-apps.workers.dev`
- D1 database: `page-scroll-master-feedback-db`
- Production delivery was verified through a Cloudflare Service Binding on
  2026-06-14, and the recipient confirmed receipt on 2026-06-15.
- A submission from the real extension was delivered successfully and recorded
  with D1 status `sent` on 2026-06-15.
- A real submission with contact details and two image attachments was delivered
  successfully on 2026-06-15; D1 recorded only the image count and delivery
  metadata.
- The uninstall survey Worker routes and D1 metadata table were deployed to
  production on 2026-07-05 as Worker version
  `bc516b66-a2cd-425c-9a10-fe9527f48b56`. Remote D1 schema application
  completed successfully; direct `workers.dev` smoke testing from the local
  network timed out.
- The current sender uses Resend's `onboarding@resend.dev` test domain. Until a
  custom domain is verified, Resend only permits delivery to the account
  owner's registered email address.
- Some networks may block or incorrectly resolve `workers.dev`. A verified
  custom domain should replace the current endpoint before claiming broad
  availability in those networks.
