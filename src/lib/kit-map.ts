/**
 * Static map from axe rule ids to kit component keys, plus plain-language
 * one-liners for the report. Rules not listed here still appear in reports,
 * just without a "Use component" link.
 */

export const RULE_TO_KIT: Record<string, string> = {
  // skip-link
  bypass: "skip-link",
  "skip-link": "skip-link",
  // focus-ring (buttons/links without accessible names, focus visibility)
  "button-name": "focus-ring",
  "link-name": "focus-ring",
  "input-button-name": "focus-ring",
  // text-field (form labelling)
  label: "text-field",
  "label-title-only": "text-field",
  "select-name": "text-field",
  "form-field-multiple-labels": "text-field",
  "autocomplete-valid": "text-field",
  // checkbox-radio
  checkboxgroup: "checkbox-radio",
  radiogroup: "checkbox-radio",
  "aria-toggle-field-name": "checkbox-radio",
  // dialog
  "aria-dialog-name": "dialog",
  "aria-hidden-focus": "dialog",
  // nav / landmarks
  region: "nav",
  "landmark-one-main": "nav",
  "landmark-unique": "nav",
  "landmark-no-duplicate-banner": "nav",
  "landmark-no-duplicate-contentinfo": "nav",
  "landmark-banner-is-top-level": "nav",
  "landmark-main-is-top-level": "nav",
  // contrast-tokens
  "color-contrast": "contrast-tokens",
  "color-contrast-enhanced": "contrast-tokens",
  "link-in-text-block": "contrast-tokens",
  // statement-page (document-level structure)
  "document-title": "statement-page",
  "html-has-lang": "statement-page",
  "html-lang-valid": "statement-page",
  "page-has-heading-one": "statement-page",
};

/** Human sentences shown in reports instead of raw axe help text. */
export const RULE_SENTENCES: Record<string, string> = {
  "color-contrast":
    "Some text does not stand out enough from its background, so people with low vision or a cheap screen in sunlight cannot read it.",
  "button-name":
    "A button has no text a screen reader can announce — it is just a shape. Nobody using assistive tech knows what it does.",
  "input-button-name":
    "An input styled as a button has no readable name, so screen reader users hear nothing useful when they reach it.",
  label:
    "A form field has no label tied to it. Screen reader users do not know what to type, and clicking the label text does not focus the field.",
  "label-title-only":
    "A form field is labelled only through a tooltip attribute, which most assistive tech users never discover.",
  "select-name":
    "A dropdown has no label, so it is announced as just \u201ccombo box\u201d with no hint of what it selects.",
  "form-field-multiple-labels":
    "A form field has more than one label, so screen readers may announce the wrong one.",
  "link-name":
    "A link has no readable text — screen reader users hear \u201clink\u201d and nothing else.",
  bypass:
    "There is no way to skip past the header with a keyboard, so keyboard users must tab through every menu item on every page.",
  "document-title":
    "The page has no title, which is the first thing a screen reader announces and what shows in the browser tab.",
  "html-has-lang":
    "The page does not declare its language, so screen readers may read it with the wrong pronunciation rules.",
  "html-lang-valid":
    "The declared page language is not a valid language code.",
  "page-has-heading-one":
    "The page has no top-level heading, so screen reader users have no anchor for what the page is about.",
  region:
    "Some content sits outside any landmark (header, nav, main, footer), so screen reader users cannot jump to it.",
  "landmark-one-main":
    "The page is missing a single main landmark, the primary jump target for assistive tech.",
  "landmark-unique":
    "Two landmarks look identical to assistive tech, so users cannot tell them apart when navigating.",
  "aria-dialog-name":
    "A dialog opens without a name, so screen reader users are dropped into a box with no idea what it is.",
  "aria-hidden-focus":
    "Something marked as hidden from assistive tech can still receive keyboard focus — the keyboard lands on an element that does not exist for screen readers.",
  "image-alt":
    "An image has no text alternative, so screen reader users get either silence or a filename read out loud.",
  "aria-required-attr":
    "An element declares an ARIA role but is missing attributes that role requires, so assistive tech gets an incomplete picture.",
  "aria-valid-attr-value":
    "An ARIA attribute points at something that does not exist, so assistive tech follows a dead reference.",
  "duplicate-id":
    "Two elements share the same id, which silently breaks label and ARIA references pointing at it.",
  "frame-title":
    "An embedded frame has no title, so screen reader users cannot tell what is inside before entering it.",
  "heading-order":
    "Heading levels jump around (for example h1 to h4), which scrambles the page outline assistive tech users navigate by.",
  list: "List markup is malformed, so screen readers cannot announce how many items there are.",
  listitem: "A list item sits outside a list, so it loses its position announcement.",
  "meta-viewport":
    "The page blocks pinch-to-zoom, which people with low vision rely on.",
  tabindex:
    "A positive tabindex forces an unnatural keyboard order that confuses keyboard users.",
  "nested-interactive":
    "An interactive control is nested inside another one, so assistive tech cannot reliably reach the inner control.",
  "select-name-missing": "A dropdown has no accessible name.",
  "link-in-text-block":
    "A link inside body text is distinguishable only by color, which people with color-vision deficiency cannot see.",
};

export function humanSentence(ruleId: string, fallbackDescription: string): string {
  return RULE_SENTENCES[ruleId] ?? fallbackDescription;
}
