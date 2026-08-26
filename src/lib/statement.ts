/**
 * Draft accessibility statement generator (PL + EN).
 * Every statement opens with the mandatory draft disclaimer. No conformity
 * claims, no WCAG level claims, no VPAT.
 */

export interface StatementInput {
  siteName: string;
  siteUrl: string;
  contactEmail: string;
  lastReviewDate: string; // yyyy-mm-dd
  language: "pl" | "en";
  practices: string[]; // keys from PRACTICE_OPTIONS
  knownLimits: string;
  watermarked: boolean;
}

export const PRACTICE_OPTIONS: { key: string; en: string; pl: string }[] = [
  {
    key: "keyboard",
    en: "The main purchase or booking flow can be completed with a keyboard alone",
    pl: "Główną ścieżkę zakupu lub rezerwacji można przejść wyłącznie klawiaturą",
  },
  {
    key: "alt-text",
    en: "Product and content images have text alternatives",
    pl: "Zdjęcia produktów i treści mają alternatywy tekstowe",
  },
  {
    key: "labels",
    en: "Form fields have visible labels connected to the inputs",
    pl: "Pola formularzy mają widoczne etykiety powiązane z polami",
  },
  {
    key: "contrast",
    en: "Text colors are checked for sufficient contrast",
    pl: "Kolory tekstu są sprawdzane pod kątem wystarczającego kontrastu",
  },
  {
    key: "zoom",
    en: "Pages remain usable at 200% browser zoom",
    pl: "Strony pozostają użyteczne przy powiększeniu przeglądarki do 200%",
  },
  {
    key: "captions",
    en: "Published videos have captions",
    pl: "Publikowane filmy mają napisy",
  },
  {
    key: "testing",
    en: "We run automated accessibility checks on key pages",
    pl: "Prowadzimy automatyczne testy dostępności kluczowych stron",
  },
];

const DISCLAIMER = {
  en: "This is a draft you edit. It is not a declaration of conformity under Directive (EU) 2019/882. We are not your lawyer.",
  pl: "To jest szkic do samodzielnej edycji. Nie stanowi deklaracji zgodności w rozumieniu dyrektywy (UE) 2019/882. Nie jesteśmy Twoją kancelarią prawną.",
};

export const WATERMARK_TEXT = {
  en: "Draft generated with the EAA Pack free plan — review every sentence before publishing.",
  pl: "Szkic wygenerowany w darmowym planie EAA Pack — przejrzyj każde zdanie przed publikacją.",
};

export function generateStatementMarkdown(input: StatementInput): string {
  const lang = input.language;
  const practiceLines = PRACTICE_OPTIONS.filter((p) => input.practices.includes(p.key)).map(
    (p) => `- ${lang === "pl" ? p.pl : p.en}`
  );

  if (lang === "pl") {
    return [
      `> ${DISCLAIMER.pl}`,
      input.watermarked ? `> \n> ${WATERMARK_TEXT.pl}` : null,
      "",
      `# Deklaracja dostępności — ${input.siteName}`,
      "",
      `Ta strona dotyczy serwisu [${input.siteUrl}](${input.siteUrl}), prowadzonego przez ${input.siteName}.`,
      "",
      `Zależy nam, aby z serwisu mogły korzystać także osoby z niepełnosprawnościami. Poniżej opisujemy, co już robimy, co wiemy, że wymaga poprawy, i jak można się z nami skontaktować.`,
      "",
      "## Co już robimy",
      "",
      practiceLines.length > 0
        ? practiceLines.join("\n")
        : "- Jesteśmy na początku pracy nad dostępnością i dopiero porządkujemy podstawy.",
      "",
      "## Znane ograniczenia",
      "",
      input.knownLimits.trim() ||
        "Nie mamy jeszcze pełnej listy ograniczeń. Jeśli trafisz na problem, napisz do nas — traktujemy takie zgłoszenia priorytetowo.",
      "",
      "## Zgłaszanie problemów",
      "",
      `Jeśli coś w serwisie nie działa dla Ciebie, napisz na [${input.contactEmail}](mailto:${input.contactEmail}). Postaramy się odpowiedzieć w ciągu kilku dni roboczych i zaproponować obejście, zanim wdrożymy poprawkę.`,
      "",
      "## Przegląd",
      "",
      `Ostatni przegląd tej deklaracji: ${input.lastReviewDate}. Aktualizujemy ją przy istotnych zmianach w serwisie.`,
      "",
    ]
      .filter((line) => line !== null)
      .join("\n");
  }

  return [
    `> ${DISCLAIMER.en}`,
    input.watermarked ? `> \n> ${WATERMARK_TEXT.en}` : null,
    "",
    `# Accessibility statement — ${input.siteName}`,
    "",
    `This page covers [${input.siteUrl}](${input.siteUrl}), operated by ${input.siteName}.`,
    "",
    `We want people with disabilities to be able to use this service. Below is what we already do, what we know needs work, and how to reach us.`,
    "",
    "## What we already do",
    "",
    practiceLines.length > 0
      ? practiceLines.join("\n")
      : "- We are early in our accessibility work and still getting the basics in order.",
    "",
    "## Known limitations",
    "",
    input.knownLimits.trim() ||
      "We do not have a complete list of limitations yet. If you hit a problem, tell us — such reports get priority.",
    "",
    "## Reporting problems",
    "",
    `If something on this site does not work for you, email [${input.contactEmail}](mailto:${input.contactEmail}). We aim to reply within a few working days and to offer a workaround while we fix the underlying issue.`,
    "",
    "## Review",
    "",
    `This statement was last reviewed on ${input.lastReviewDate}. We update it when the service changes in a meaningful way.`,
    "",
  ]
    .filter((line) => line !== null)
    .join("\n");
}
