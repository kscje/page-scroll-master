# Privacy Policy for Smart Scroll Navigator

**Last Updated**: August 8, 2026

## Data Collection

During normal scrolling use, Smart Scroll Navigator does **not** collect or transmit your browsing history, visited URLs or domains, page titles, page content, search terms, form input, scroll positions, saved bookmark content, account information, or other personal content. The only exception is information you explicitly submit through the optional feedback form described below.

Current releases do not include anonymous usage analytics and do not collect, store, or transmit usage-statistics data. The analytics disclosures below are retained only as a historical record for releases before 2.5.4.

When enabled, the extension may send:

- Enumerated or bucketed extension settings, such as button layout, size range, icon style, and reading-tool options.
- UTC daily aggregate counts for allowed actions, such as top/bottom button use, keyboard commands, progress jumps, bookmark actions, and outline actions.
- UTC daily aggregate counts for extension and advanced-feature enable or disable actions.
- The extension version and selected interface language.

The analytics payload does not contain URLs, domains, page titles, page text, bookmark data, site enable lists, exact custom colors, persistent user identifiers, advertising identifiers, or device fingerprints. The extension does not create a long-term installation or user ID.

## Local Storage

The extension uses Chrome's built-in storage API (`chrome.storage.sync`) to save preferences such as scroll speed, button position, colors, opacity settings, and reading-tool settings. This data is synced across your Chrome-signed-in devices through Google's infrastructure. When optional analytics is enabled, only the enumerated or bucketed subset described above may be included in an analytics payload; exact custom values are not sent.

The extension may also use `chrome.storage.local` to save per-site enable status and scroll position bookmarks when you choose to use those features. Scroll position bookmarks contain the page URL, approximate scroll progress, page title, and related scroll container metadata so the extension can offer to resume from that position later. This data stays in your browser and is not transmitted to the extension developer or any third party.

When smart section navigation is enabled, the extension may read visible headings on the current page to build an in-memory page outline for navigation. This outline, including heading text and page structure, is not saved to Chrome storage and is not transmitted to the extension developer or any third party.

Analytics consent, up to seven UTC days of pending aggregate counts, and a temporary retry batch are stored in `chrome.storage.local`. Disabling analytics immediately stops new collection, removes pending analytics data, stops upload scheduling, and revokes the optional analytics permissions. Previously received server-side aggregate statistics expire according to the retention periods below.

## Host Permissions

The extension requests broad host permissions (`<all_urls>`) exclusively for the purpose of injecting floating scroll buttons into web pages. This permission is required for the core functionality of the extension. The extension does **not** read, intercept, collect, store, or transmit any content from the web pages you visit.

The analytics endpoint permission and the `alarms` scheduling permission are optional. Chrome requests them only when you enable anonymous usage analytics. They are used solely to send bounded aggregate analytics batches to:

`https://page-scroll-master-analytics.kscje-apps.workers.dev/v1/events`

## Analytics Processing And Retention

The analytics endpoint is operated by the extension developer using Cloudflare Workers and Cloudflare D1 infrastructure. No third-party analytics SDK, advertising network, tracking pixel, cookie, remote script, or data broker is used.

Accepted batches are immediately converted into aggregate daily counters. Individual action events are not stored. Random batch IDs used only for retry deduplication are retained for up to 30 days. Aggregate daily statistics are retained for up to 13 months.

Cloudflare may process ordinary network metadata, including an IP address and request headers, to deliver and protect the service under its own infrastructure policies. The extension does not add page URLs, referrers, custom user-agent data, or persistent identifiers to analytics requests, and the developer does not use network metadata to identify users or build profiles.

Analytics data is used only to evaluate feature usage, setting distributions, defaults, and product priorities. It is not sold, used for advertising, or shared for profiling.

## Suggestions And Feedback

The Options page includes an optional feedback form. Data is sent only after you submit it. A submission includes the feedback type, message, extension version, and selected interface language. Contact details and up to three JPEG, PNG, or WebP images are sent only when you provide them. The form does not collect the current page URL or browser language. Feedback is not written to extension storage.

After uninstall, the browser may open a voluntary uninstall survey page operated by the developer. Opening the page does not submit an uninstall reason. Data is sent only if you submit the survey, and may include selected reasons, optional details, optional contact information, the extension version, and selected interface language. The survey does not collect visited URLs, page content, bookmarks, site states, settings details, or analytics consent.

The developer operates the endpoint with Cloudflare Workers and Cloudflare D1 and uses Resend to forward the content and images to the developer's email. The service uses a salted hash of the network address for hourly rate limiting and does not store plain IP addresses. It retains only content-free logs such as request ID, feedback type, image count, selected uninstall reason enums, whether optional fields were included, delivery result, and timestamps for up to 30 days. Feedback text, uninstall survey details, contact details, and images are not stored in D1. Cloudflare and Resend may process data needed to deliver and protect their services under their respective policies.

The feedback host permission is optional, requested only when you submit feedback, and revoked after that submission finishes:

`https://page-scroll-master-feedback.kscje-apps.workers.dev/v1/feedback`

The uninstall survey page uses:

`https://page-scroll-master-feedback.kscje-apps.workers.dev/uninstall`

## Chrome Web Store Limited Use

The use of information received from Chrome APIs complies with the [Chrome Web Store User Data Policy](https://developer.chrome.com/docs/webstore/program-policies/limited-use), including the Limited Use requirements. Data is used only to provide or improve the extension's single purpose, and is not transferred or used for personalized advertising, credit decisions, or sale to data brokers.

## Children's Privacy

This extension does not knowingly collect personal information from anyone, including children under the age of 13.

## Changes to This Policy

If any changes are made to this privacy policy, they will be reflected in the updated version of the extension and on this policy page.

## Contact

If you have any questions about this privacy policy, please contact: **kscj.ty@gmail.com**
