import { getStore } from "@netlify/blobs";

// Counts unique visitors without ever storing an IP address.
//
// The address is hashed with a secret salt and truncated, then used as a key.
// That is enough to tell two visitors apart and not enough to work backwards to
// anyone: you cannot reverse a hash, and without the salt you cannot even build
// a rainbow table of the four billion possible addresses.
//
// Writes are one key per visitor per day, so two people arriving at the same
// moment write different keys and neither count is lost. A single counter that
// both tried to increment would drop one of them.

const SALT = process.env.COUNTER_SALT || "change-me-in-netlify-env";

async function fingerprint(ip) {
  const bytes = new TextEncoder().encode(SALT + "|" + ip);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)].slice(0, 8)
    .map(b => b.toString(16).padStart(2, "0")).join("");
}

const countKeys = async (store, prefix) => {
  let n = 0;
  for await (const page of store.list({ prefix, paginate: true })) n += page.blobs.length;
  return n;
};

export default async (req, context) => {
  const json = (body, status = 200) => new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", "cache-control": "no-store" }
  });

  try {
    const store = getStore("visits");
    const today = new Date().toISOString().slice(0, 10);
    const url = new URL(req.url);

    // ?peek=1 reads the numbers without recording a visit, for dashboards
    if (url.searchParams.get("peek") !== "1") {
      const ip = req.headers.get("x-nf-client-connection-ip")
              || context?.ip
              || req.headers.get("x-forwarded-for")?.split(",")[0].trim()
              || "unknown";
      const id = await fingerprint(ip);
      await Promise.all([
        store.set(`all/${id}`, "1"),
        store.set(`day/${today}/${id}`, "1")
      ]);
    }

    const [total, todayCount] = await Promise.all([
      countKeys(store, "all/"),
      countKeys(store, `day/${today}/`)
    ]);
    return json({ total, today: todayCount, date: today });
  } catch (err) {
    // a broken counter must never take the page down with it
    return json({ error: "counter unavailable" }, 503);
  }
};

export const config = { path: "/api/hits" };
