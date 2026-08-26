# Why we do not sell you an overlay

*Placeholder — this comparison is being expanded.*

Accessibility overlays are JavaScript widgets you paste into your site that promise to fix
accessibility on the fly — contrast toggles, screen-reader "modes", automatic alt text.

## The problem with overlays

- **They do not change your code.** A form field without a label is still a form field without a
  label; the overlay guesses, and guesses wrong.
- **They can interfere with real assistive tech.** Many screen reader users report overlays making
  sites harder to use, and some ship blocklists for them.
- **They add a third-party script** to every page, with the privacy and performance cost that
  implies.
- **Demand letters and complaints keep naming sites that use them.** A widget is visible; fixed
  code is what actually removes barriers.

## What we do instead

EAA Pack never injects anything into your site. We scan a page you choose, explain the findings in
plain language, and give you components — a labelled text field, a dialog with a focus trap, a
navigation landmark — that you paste into your own codebase. The fix lives in your repository, not
in our script tag.

That is slower than pasting a widget. It is also the only version that actually works for your
customers.
