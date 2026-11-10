const s = $('Merge Extraction').first().json.state;

// ---------- helpers ----------
const toNum = v => Number(String(v == null ? '' : v).replace(/[^0-9.]/g, '')) || 0;
const clean = v => String(v == null ? '' : v).replace(/[;|\n]/g, ',').trim();
const norm = v => String(v == null ? '' : v).toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
const fmt = p => !p ? 'Price on request'
  : p >= 1e7 ? '₹' + (p / 1e7).toFixed(2).replace(/\.?0+$/, '') + ' Cr'
  : p >= 1e5 ? '₹' + (p / 1e5).toFixed(1).replace(/\.0$/, '') + ' L'
  : '₹' + p.toLocaleString('en-IN');

// ---------- Pune locality knowledge ----------
// Words that mean "anywhere in Pune" -> no locality filter.
const CITY_WIDE = ['pune', 'pune city', 'any', 'anywhere', 'all', 'all pune', 'whole pune', 'anywhere in pune'];
// Spelling variants -> one canonical name.
const ALIASES = {
  'hinjawadi': 'hinjewadi', 'hinjewadi phase 1': 'hinjewadi', 'hinjewadi phase 2': 'hinjewadi', 'hinjewadi phase 3': 'hinjewadi',
  'vimannagar': 'viman nagar', 'kalyaninagar': 'kalyani nagar', 'kp': 'koregaon park', 'karvenagar': 'karve nagar',
  'pimplesaudagar': 'pimple saudagar', 'pimple saudagaar': 'pimple saudagar', 'magarpatta city': 'magarpatta',
  'baner road': 'baner', 'balewadi high street': 'balewadi', 'kharadi bypass': 'kharadi', 'wadgaonsheri': 'wadgaon sheri',
  'shivajinagar': 'shivaji nagar', 'kothrud depot': 'kothrud'
};
// Approved nearby areas (used only when the customer says nearby is OK).
const NEARBY = {
  'baner': ['balewadi', 'aundh', 'pashan', 'sus', 'mahalunge', 'bavdhan'],
  'balewadi': ['baner', 'mahalunge', 'aundh', 'wakad'],
  'aundh': ['baner', 'pashan', 'bopodi', 'sangvi', 'balewadi'],
  'wakad': ['tathawade', 'punawale', 'ravet', 'thergaon', 'hinjewadi', 'pimple saudagar', 'pimple nilakh'],
  'hinjewadi': ['wakad', 'maan', 'marunji', 'tathawade', 'punawale'],
  'kothrud': ['karve nagar', 'warje', 'erandwane', 'bavdhan'],
  'kharadi': ['viman nagar', 'wagholi', 'chandan nagar', 'mundhwa', 'wadgaon sheri'],
  'viman nagar': ['kalyani nagar', 'kharadi', 'lohegaon', 'yerawada', 'wadgaon sheri'],
  'hadapsar': ['magarpatta', 'mundhwa', 'amanora', 'fursungi', 'wanowrie'],
  'pimple saudagar': ['pimple nilakh', 'wakad', 'rahatani', 'pimple gurav']
};

const canonLoc = v => { let n = ' ' + norm(v).replace(/ pune$/, '').replace(/\bphase \d+\b/g, ' ').replace(/\s+/g, ' ').trim() + ' '; for (const k in ALIASES) n = n.split(' ' + k + ' ').join(' ' + ALIASES[k] + ' '); return n.trim(); };
const locMatches = (listingLoc, wanted) => { const L = canonLoc(listingLoc); return !!L && (L === wanted || (' ' + L + ' ').includes(' ' + wanted + ' ')); };
const canonFurn = v => { const n = norm(v); if (!n) return ''; if (n.includes('unfurnish') || /^un /.test(n) || n === 'bare') return 'unfurnished'; if (n.includes('semi')) return 'semi-furnished'; if (n.includes('furnish')) return 'furnished'; return n; };
const canonType = v => { const n = norm(v); if (!n) return ''; if (/flat|apartment|apt/.test(n)) return 'apartment'; if (/villa|bungalow|row ?house|independent house/.test(n)) return 'villa'; if (/plot|land/.test(n)) return 'plot'; if (/commercial|office|shop/.test(n)) return 'commercial'; return n; };

// ---------- clean the listing data ----------
const completeness = r => ['title','property_type','bhk','locality','address','price_inr','area_sqft','furnishing','image_url'].reduce((n, k) => n + (String(r[k] == null ? '' : r[k]).trim() ? 1 : 0), 0);
const unique = new Map();
for (const r of $input.all().map(i => i.json)) {
  const id = String((r && r.listing_id) || '').trim().toUpperCase();
  if (!id) continue;
  const prev = unique.get(id);
  if (!prev || completeness(r) > completeness(prev)) unique.set(id, r);
}
const available = [...unique.values()].filter(r => {
  if (norm(r.status) !== 'available') return false;
  if (clean(r.title).length < 3) return false;              // hides junk test rows like "a"
  const t = canonType(r.property_type);
  if (!t) return false;
  if ((t === 'apartment' || t === 'villa') && !toNum(r.bhk)) return false;
  return true;
});

// ---------- what the customer wants ----------
const wantedLoc = canonLoc(s.locality);
const cityWide = !wantedLoc || CITY_WIDE.includes(wantedLoc);
const wantType = canonType(s.property_type);
const wantFurn = canonFurn(s.furnishing);
const wantBhk = Number(s.bhk) || 0;
const minB = Number(s.budget_min) || 0;
const maxB = Number(s.budget_max) || 0;
const flexible = s.locality_flexible === true;
const noCriteria = cityWide && !wantBhk && !minB && !maxB && !wantType;

const fits = (r, slack) => {
  const bhk = toNum(r.bhk), price = toNum(r.price_inr);
  if (wantType && canonType(r.property_type) !== wantType) return false;
  if (wantBhk && Math.abs(bhk - wantBhk) > slack.bhk) return false;
  if (maxB && (!price || price > maxB * (1 + slack.budget))) return false;
  if (minB && (!price || price < minB * (1 - slack.budget))) return false;
  if (wantFurn && slack.strictFurn && canonFurn(r.furnishing) !== wantFurn) return false;
  return true;
};
const EXACT = { bhk: 0, budget: 0, strictFurn: true };
const CLOSE = { bhk: 1, budget: 0.15, strictFurn: false };

const inLoc = cityWide ? available : available.filter(r => locMatches(r.locality, wantedLoc));
let matches = inLoc.filter(r => fits(r, EXACT));
let match_type = matches.length ? 'exact' : 'none';

// 1) nearby areas (only if the customer agreed)
if (!matches.length && !cityWide && flexible && NEARBY[wantedLoc]) {
  matches = available.filter(r => NEARBY[wantedLoc].some(n => locMatches(r.locality, n)) && fits(r, EXACT));
  if (matches.length) match_type = 'nearby';
}
// 2) closest matches in the same area: +/-1 BHK, up to 15% over/under budget, any furnishing
const diffNote = r => {
  const d = [];
  const bhk = toNum(r.bhk), price = toNum(r.price_inr);
  if (wantBhk && bhk !== wantBhk) d.push(bhk + ' BHK instead of ' + wantBhk);
  if (maxB && price > maxB) d.push(Math.round((price / maxB - 1) * 100) + '% above budget');
  if (minB && price && price < minB) d.push('below minimum budget');
  if (wantFurn && canonFurn(r.furnishing) !== wantFurn) d.push((clean(r.furnishing) || 'furnishing unknown') + ' instead of ' + wantFurn);
  return d.join(', ');
};
if (!matches.length) {
  const close = inLoc.filter(r => fits(r, CLOSE));
  if (close.length) {
    match_type = 'closest';
    const score = r => Math.abs(toNum(r.bhk) - wantBhk) * 10 + (maxB ? Math.max(0, toNum(r.price_inr) / maxB - 1) * 100 : 0);
    matches = close.sort((a, b) => score(a) - score(b));
  }
}
if (match_type === 'exact' || match_type === 'nearby') matches.sort((a, b) => toNum(a.price_inr) - toNum(b.price_inr));

const picks = matches.slice(0, 3);

// ---------- context for the reply writer ----------
const crit = [];
if (wantBhk) crit.push(wantBhk + ' BHK');
if (s.property_type) crit.push(s.property_type);
crit.push(cityWide ? 'anywhere in Pune' : 'in ' + s.locality);
if (minB) crit.push('min ' + fmt(minB));
if (maxB) crit.push('max ' + fmt(maxB));
if (s.furnishing) crit.push(s.furnishing);
const critText = crit.join(', ');

let context_text;
if (!picks.length) {
  match_type = 'none';
  const near = NEARBY[wantedLoc] ? NEARBY[wantedLoc].slice(0, 4).join(', ') : '';
  if (!cityWide && !flexible && near) {
    context_text = 'NO MATCHING PROPERTIES FOUND. Criteria: ' + critText + '. Nothing in ' + s.locality + ' even with small changes. Ask if they are open to nearby areas like ' + near + ', or to change budget/BHK. Do not show any listings.';
  } else {
    context_text = 'NO MATCHING PROPERTIES FOUND. Criteria: ' + critText + '. Suggest changing ONE thing (budget, BHK or area). Do not show any listings.';
  }
} else {
  const lines = picks.map((r, i) =>
    (i + 1) + '. ID ' + r.listing_id + ' | ' + clean(r.title) + ' | ' + (clean(r.locality) || 'Pune') + ' | ' + fmt(toNum(r.price_inr)) +
    ' | ' + (r.area_sqft || '?') + ' sq ft | ' + (clean(r.furnishing) || 'furnishing n/a') + ' | ' + clean(r.property_type) +
    (match_type === 'closest' ? ' | DIFFERS: ' + (diffNote(r) || 'minor') : ''));
  const head = {
    exact: 'SEARCH RESULTS (match_type: exact).',
    nearby: 'SEARCH RESULTS (match_type: nearby). Nothing in ' + s.locality + '; these are from nearby areas the customer accepted. Say so.',
    closest: 'SEARCH RESULTS (match_type: closest). No exact match. These are the closest options; mention what DIFFERS for each.'
  }[match_type];
  context_text = head + ' Criteria: ' + critText + '.' + (noCriteria ? ' Customer gave no criteria yet: present these as examples and ask for budget, BHK and area.' : '') + '\n' + lines.join('\n');
}

const shown_compact = picks.map((r, i) => (i + 1) + '|' + r.listing_id + '|' + clean(r.title)).join(';');

return [{ json: { context_text, shown_compact, top_image: (picks[0] && picks[0].image_url) || '', match_type } }];
