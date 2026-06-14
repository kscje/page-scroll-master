# Privacy Policy for Smart Scroll Navigator

**Last Updated**: June 14, 2026

## Data Collection

Smart Scroll Navigator does **not** collect or transmit your browsing history, visited URLs or domains, page titles, page content, search terms, form input, scroll positions, saved bookmark content, account information, or other personal content.

The extension includes optional anonymous usage analytics. This feature is disabled by default for new and existing users. Data is collected and transmitted only after you explicitly enable **Send anonymous usage statistics** in the Options page.

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

## Chrome Web Store Limited Use

The use of information received from Chrome APIs complies with the [Chrome Web Store User Data Policy](https://developer.chrome.com/docs/webstore/program-policies/limited-use), including the Limited Use requirements. Data is used only to provide or improve the extension's single purpose, and is not transferred or used for personalized advertising, credit decisions, or sale to data brokers.

## Children's Privacy

This extension does not knowingly collect personal information from anyone, including children under the age of 13.

## Changes to This Policy

If any changes are made to this privacy policy, they will be reflected in the updated version of the extension and on this policy page.

## Contact

If you have any questions about this privacy policy, please contact: **kscj.ty@gmail.com**
