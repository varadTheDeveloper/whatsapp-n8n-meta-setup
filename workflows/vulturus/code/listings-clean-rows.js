// Normalise Properties-sheet rows into the bot's Data Table format.
const toNum = v => { const n = Number(String(v == null ? '' : v).replace(/[^0-9.]/g, '')); return Number.isFinite(n) && n > 0 ? n : null; };
const s = v => String(v == null ? '' : v).trim();
const score = r => ['title','property_type','bhk','locality','address','price_inr','area_sqft','furnishing','image_url'].filter(k => s(r[k])).length;
const best = new Map();
for (const item of $input.all()) {
  const r = item.json;
  const id = s(r.listing_id).toUpperCase();
  if (!id) continue;
  const prev = best.get(id);
  if (!prev || score(r) > score(prev)) best.set(id, r);
}
return [...best.entries()].map(([id, r]) => ({ json: {
  listing_id: id,
  status: s(r.status || r.availability).toLowerCase(),
  title: s(r.title),
  property_type: s(r.property_type || r.PropertyType).toLowerCase(),
  bhk: toNum(r.bhk || r.BHK),
  locality: s(r.locality || r.Area),
  address: s(r.address),
  price_inr: toNum(r.price_inr || r.Price),
  area_sqft: toNum(r.area_sqft || r['Carpet area']),
  furnishing: s(r.furnishing).toLowerCase(),
  image_url: s(r.image_url),
  broker_name: s(r.broker_name),
  broker_phone: s(r.broker_phone || r.broker_contact).replace(/\D/g, ''),
  description: s(r.description).slice(0, 500)
} }));
