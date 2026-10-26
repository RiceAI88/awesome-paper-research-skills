export const VISIT_API = "https://busuanzi.9420.ltd/api";
export const VISIT_SITE =
  "https://riceai88.github.io/awesome-paper-research-skills/";

export function parseVisits(payload) {
  const { page_pv: views, page_uv: visitors } = payload?.data || {};
  if (
    payload?.success !== true ||
    ![views, visitors].every(
      (value) => Number.isSafeInteger(value) && value >= 0,
    )
  ) {
    throw new Error("Invalid visitor totals");
  }
  return { views, visitors };
}

// A document load is one visit. React updates, language changes and remounts
// share this request; retries could double-count a request whose reply was lost.
let request;
export function countVisit() {
  if (!request) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 6000);
    request = fetch(VISIT_API, {
      method: "POST",
      headers: { "x-bsz-referer": VISIT_SITE },
      credentials: "omit",
      referrerPolicy: "no-referrer",
      signal: controller.signal,
    })
      .then((response) => {
        if (!response.ok) throw new Error("Visitor service unavailable");
        return response.json();
      })
      .then(parseVisits)
      .catch(() => null)
      .finally(() => clearTimeout(timer));
  }
  return request;
}
