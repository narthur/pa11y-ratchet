enum HTMLEscapeChars {
  "&" = "&amp;",
  "<" = "&lt;",
  ">" = "&gt;",
  "'" = "&#39;",
  '"' = "&quot;",
}

const htmlEscapeReg = new RegExp(
  `[${Object.keys(HTMLEscapeChars).join("")}]`,
  "g"
);

export default function escapeHtml(str: string) {
  return str.replace(
    htmlEscapeReg,
    (char) => HTMLEscapeChars[char as keyof typeof HTMLEscapeChars]
  );
}
