const city = $('Config (Broker)').first().json.city || 'Pune';
const clean = v => String(v == null ? '' : v).trim();

// "85 lakh" / "1.2 Cr" / "8500000" -> INR
const parsePrice = value => {
  const s = clean(value).toLowerCase().replace(/,/g, '').replace(/₹/g, '').trim();
  const m = s.match(/(\d+(?:\.\d+)?)/);
  if (!m) return null;
  const amount = Number(m[1]);
  if (!Number.isFinite(amount)) return null;
  if (/(cr|crore)/.test(s)) return Math.round(amount * 10000000);
  if (/(lakh|lac|\bl\b)/.test(s)) return Math.round(amount * 100000);
  return Math.round(amount);
};

const out = [];
for (const item of $input.all()) {
  const row = item.json;
  const keys = Object.keys(row);
  const pick = (...candidates) => {
    for (const c of candidates) { const k = keys.find(x => x.trim().toLowerCase() === c.toLowerCase()); if (k && clean(row[k])) return clean(row[k]); }
    for (const c of candidates) { const k = keys.find(x => x.toLowerCase().includes(c.toLowerCase())); if (k && clean(row[k])) return clean(row[k]); }
    return '';
  };

  const title = pick('property title', 'title');
  if (!title) continue; // skip empty / test submissions

  let phone = pick('broker whatsapp number', 'whatsapp number', 'broker phone', 'phone', 'mobile').replace(/\D/g, '').replace(/^0+/, '');
  if (phone.length === 10) phone = '91' + phone;

  const photos = pick('property photos', 'photo', 'image', 'picture');
  const ids = [...photos.matchAll(/(?:[?&]id=|\/d\/)([-\w]{20,})/g)].map(m => m[1]);
  if (!ids.length && /^[a-zA-Z0-9_-]{20,}$/.test(photos)) ids.push(photos);
  const uniqueIds = [...new Set(ids)];

  const locality = pick('locality', 'neighbourhood', 'neighborhood');
  const address = pick('full address', 'address');
  const areaMatch = pick('area (sq ft)', 'carpet area', 'built up area', 'sq ft', 'sqft', 'area').replace(/,/g, '').match(/\d+(?:\.\d+)?/);
  const bhkMatch = pick('bhk', 'bedroom').match(/\d+/);

  out.push({ json: {
    listing_id: 'VUL-' + Date.now().toString(36).toUpperCase().slice(-4) + Math.random().toString(36).slice(2, 6).toUpperCase(),
    broker_name: pick('broker name', 'your name'),
    broker_phone: phone,
    title,
    property_type: pick('property type', 'type').toLowerCase(),
    bhk: bhkMatch ? Number(bhkMatch[0]) : null,
    locality,
    address,
    price_inr: parsePrice(pick('price')),
    area_sqft: areaMatch ? Number(areaMatch[0]) : null,
    furnishing: pick('furnishing').toLowerCase(),
    description: pick('description', 'details'),
    drive_file_ids: uniqueIds.join(','),
    primary_photo_id: uniqueIds[0] || '',
    image_url: uniqueIds[0] ? 'https://drive.google.com/thumbnail?id=' + uniqueIds[0] + '&sz=w1600' : '',
    address_query: [address, locality, city].filter(Boolean).join(', ')
  } });
}
return out;
