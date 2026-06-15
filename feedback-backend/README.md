# Page Scroll Master Feedback Worker

Cloudflare Worker for `POST /v1/feedback`. It validates multipart feedback,
limits each hashed network address to five submissions per hour, forwards the
message and optional images through Resend, and retains content-free delivery
metadata for 30 days.

## Required configuration

1. Create a dedicated D1 database and add its `DB` binding to `wrangler.toml`.
2. Apply `schema.sql` to the remote database.
3. Configure these Worker secrets:
   - `RESEND_API_KEY`
   - `IP_HASH_SALT`
   - `FEEDBACK_FROM_EMAIL`
   - `FEEDBACK_TO_EMAIL`
4. Deploy the Worker as `page-scroll-master-feedback`.

The client expects:

`https://page-scroll-master-feedback.kscje-apps.workers.dev/v1/feedback`

The Worker does not collect page URLs or browser language, and it does not store
feedback text, contact details, images, or plain IP addresses. Resend receives
the submitted content solely to deliver the feedback email.

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
- The current sender uses Resend's `onboarding@resend.dev` test domain. Until a
  custom domain is verified, Resend only permits delivery to the account
  owner's registered email address.
- Some networks may block or incorrectly resolve `workers.dev`. A verified
  custom domain should replace the current endpoint before claiming broad
  availability in those networks.
