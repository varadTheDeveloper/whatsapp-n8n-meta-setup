// Vulturus v2 – Brain: decides the reply with code (no AI) and builds the new session.
const OPEN = 10, CLOSE = 19, VISIT_MIN = 30;

const trig = $('WhatsApp Trigger').first().json;
const msg = (trig.messages || [])[0] || {};
const contact = (trig.contacts || [])[0] || {};
const phone = String(msg.from || '');
const text = String((msg.text && msg.text.body) || '').trim();
const waName = (contact.profile && contact.profile.name) || '';
const row = $('Get Session').first().json || {};
const ai = ($('Understand Message (AI)').first().json || {}).output || {};
const all = $input.all().map(i => i.json).filter(r => r && r.listing_id);

// ---------- helpers ----------
const str = v => String(v == null ? '' : v).trim();
const num = v => { const n = Number(String(v == null ? '' : v).replace(/[^0-9.]/g, '')); return Number.isFinite(n) && n > 0 ? n : 0; };
const clean = v => str(v).replace(/[;|\n]/g, ',');
const norm = v => str(v).toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
const clip = (t, n) => str(t).replace(/\s+/g, ' ').slice(0, n);
const fmtPrice = p => !p ? '' : p >= 1e7 ? '₹' + (p / 1e7).toFixed(2).replace(/\.?0+$/, '') + ' Cr' : p >= 1e5 ? '₹' + (p / 1e5).toFixed(1).replace(/\.0$/, '') + ' L' : '₹' + p.toLocaleString('en-IN');
const hhmm = mins => String(Math.floor(mins / 60) % 24).padStart(2, '0') + ':' + String(mins % 60).padStart(2, '0');
const hourLabel = h => ((h % 12) || 12) + (h >= 12 ? ' PM' : ' AM');
const timeLabel = t => { const p = t.split(':').map(Number); return ((p[0] % 12) || 12) + ':' + String(p[1]).padStart(2, '0') + (p[0] >= 12 ? ' PM' : ' AM'); };

// ---------- session state ----------
const st = {
  phone,
  customer_name: str(row.customer_name),
  lang: str(row.lang) || 'en',
  last_intent: str(row.last_intent),
  budget_min: num(row.budget_min),
  budget_max: num(row.budget_max),
  bhk: num(row.bhk),
  locality: str(row.locality),
  locality_flexible: row.locality_flexible === true || String(row.locality_flexible) === 'true',
  property_type: str(row.property_type),
  furnishing: str(row.furnishing),
  shown: str(row.shown),
  selected_id: str(row.selected_id),
  meeting_date: str(row.meeting_date),
  meeting_time: str(row.meeting_time),
  booking_status: str(row.booking_status),
  history: str(row.history),
  last_message_id: str(msg.id)
};

// ---------- apply what the AI understood ----------
if (['en', 'hi', 'mr', 'hinglish'].includes(ai.lang)) st.lang = ai.lang;
const lang = st.lang;
if (ai.reset === true) Object.assign(st, { budget_min: 0, budget_max: 0, bhk: 0, locality: '', locality_flexible: false, property_type: '', furnishing: '', shown: '', selected_id: '' });
['locality', 'property_type', 'furnishing'].forEach(k => { const v = str(ai[k]); if (v) st[k] = v; });
['budget_min', 'budget_max', 'bhk'].forEach(k => { const v = num(ai[k]); if (v) st[k] = v; });
if (st.budget_min && st.budget_max && st.budget_min > st.budget_max) st.budget_min = 0;
if (ai.locality_flexible === 'yes') st.locality_flexible = true;
else if (ai.locality_flexible === 'no') st.locality_flexible = false;
if (str(ai.name)) st.customer_name = str(ai.name);
if (!st.customer_name) st.customer_name = waName;
if (/^\d{4}-\d{2}-\d{2}$/.test(str(ai.meeting_date))) st.meeting_date = str(ai.meeting_date);
const tm = str(ai.meeting_time).match(/^(\d{1,2}):(\d{2})$/);
if (tm) st.meeting_time = tm[1].padStart(2, '0') + ':' + tm[2];

const shownList = st.shown.split(';').filter(Boolean).map(x => { const p = x.split('|'); return { n: Number(p[0]), id: p[1], title: p[2] }; });
const typedId = (text.match(/\bVUL-[A-Z0-9]{4,12}\b/i) || [])[0];
const pickN = num(ai.pick);
const picked = shownList.find(x => x.n === pickN);
if (typedId) st.selected_id = typedId.toUpperCase();
else if (picked) st.selected_id = picked.id;
else if (/^VUL-/i.test(str(ai.listing_id))) st.selected_id = str(ai.listing_id).toUpperCase();

const intent = ['property_search', 'book_visit', 'general_chat'].includes(ai.intent) ? ai.intent : 'general_chat';
st.last_intent = intent;

// ---------- reply templates (en / hi / mr / hinglish) ----------
const T = {
  en: {
    ask_criteria: 'Happy to help you find a home in Pune! 🏡 Tell me your *budget*, *BHK* and *preferred area*, e.g. "2 BHK in Baner under 90 lakh".',
    head_exact: '🏡 Options for *{crit}*:',
    head_nearby: 'Nothing in {loc} right now, but these are nearby 📍',
    head_closest: 'No exact match for *{crit}*, but these are close:',
    footer: 'Reply with the number (e.g. *1*) to book a free site visit.',
    none: 'Sorry, nothing matches *{crit}* right now. Want to change the budget, BHK or area?',
    none_nearby: 'Sorry, nothing in {loc} matches *{crit}* right now. Are nearby areas like {near} okay?',
    book_which: 'Which property would you like to visit? Reply with its number from the list (e.g. *1*).',
    book_need_search: 'Sure! First tell me what you are looking for (budget, BHK, area) and I will show you options to visit.',
    book_unavailable: 'Sorry, *{title}* is no longer available. Want me to show similar options?',
    book_ask: 'Great choice: *{title}* ({loc}) 👍\nPlease share {missing}. Visits run daily {open} to {close}.',
    m_date: 'the visit date', m_time: 'a time', m_name: 'your name', and: ' and ',
    book_past: 'That time has already passed. Please pick a future date and time.',
    book_hours: 'Visits are possible between {open} and {close}. Please pick a time in that window.',
    slot_taken: 'Sorry, {date} at {time} is already booked. Could you pick another time between {open} and {close}?',
    confirmed: '✅ *Site visit confirmed!*\n\n🏠 {title}\n📍 {loc}\n👤 {name}\n📅 {date}\n⏰ {time}\n\n{broker_line}Reply here to reschedule or to see more options.',
    broker_line: 'Our broker {broker} will meet you there.\n',
    pune: 'Pune'
  },
  hi: {
    ask_criteria: 'पुणे में घर ढूँढने में खुशी से मदद करूँगा! 🏡 अपना *बजट*, *BHK* और *पसंदीदा इलाका* बताइए, जैसे "बानेर में 2 BHK, 90 लाख तक"।',
    head_exact: '🏡 *{crit}* के लिए विकल्प:',
    head_nearby: '{loc} में अभी कुछ नहीं है, पर ये पास के इलाकों में हैं 📍',
    head_closest: '*{crit}* का बिल्कुल सही मैच नहीं मिला, पर ये करीब हैं:',
    footer: 'फ्री साइट विज़िट बुक करने के लिए नंबर भेजिए (जैसे *1*)।',
    none: 'माफ़ कीजिए, *{crit}* के लिए अभी कुछ नहीं मिला। बजट, BHK या इलाका बदलें?',
    none_nearby: 'माफ़ कीजिए, {loc} में *{crit}* के लिए अभी कुछ नहीं है। क्या {near} जैसे पास के इलाके चलेंगे?',
    book_which: 'आप कौन-सी प्रॉपर्टी देखना चाहेंगे? लिस्ट से उसका नंबर भेजिए (जैसे *1*)।',
    book_need_search: 'ज़रूर! पहले बताइए आप क्या ढूँढ रहे हैं (बजट, BHK, इलाका), फिर मैं विज़िट के लिए विकल्प दिखाऊँगा।',
    book_unavailable: 'माफ़ कीजिए, *{title}* अब उपलब्ध नहीं है। क्या मैं मिलते-जुलते विकल्प दिखाऊँ?',
    book_ask: 'बढ़िया पसंद: *{title}* ({loc}) 👍\nकृपया {missing} बताइए। विज़िट रोज़ {open} से {close} के बीच होती हैं।',
    m_date: 'विज़िट की तारीख', m_time: 'समय', m_name: 'आपका नाम', and: ' और ',
    book_past: 'यह समय निकल चुका है। कृपया आगे की कोई तारीख और समय चुनिए।',
    book_hours: 'विज़िट {open} से {close} के बीच ही हो सकती है। कृपया इस बीच का समय चुनिए।',
    slot_taken: 'माफ़ कीजिए, {date} को {time} पहले से बुक है। क्या {open} से {close} के बीच कोई और समय चलेगा?',
    confirmed: '✅ *साइट विज़िट कन्फर्म!*\n\n🏠 {title}\n📍 {loc}\n👤 {name}\n📅 {date}\n⏰ {time}\n\n{broker_line}समय बदलना हो या और विकल्प देखने हों तो यहीं मैसेज करें।',
    broker_line: 'हमारे ब्रोकर {broker} आपसे वहीं मिलेंगे।\n',
    pune: 'पुणे'
  },
  mr: {
    ask_criteria: 'पुण्यात घर शोधायला नक्की मदत करेन! 🏡 तुमचे *बजेट*, *BHK* आणि *आवडता भाग* सांगा, उदा. "बाणेरमध्ये 2 BHK, 90 लाखांपर्यंत".',
    head_exact: '🏡 *{crit}* साठी पर्याय:',
    head_nearby: '{loc} मध्ये सध्या काही नाही, पण हे जवळच्या भागात आहेत 📍',
    head_closest: '*{crit}* साठी अचूक जुळणी नाही, पण हे जवळचे पर्याय आहेत:',
    footer: 'मोफत साइट व्हिजिट बुक करण्यासाठी नंबर पाठवा (उदा. *1*).',
    none: 'माफ करा, *{crit}* साठी सध्या काही नाही. बजेट, BHK किंवा भाग बदलूया का?',
    none_nearby: 'माफ करा, {loc} मध्ये *{crit}* साठी सध्या काही नाही. {near} सारखे जवळचे भाग चालतील का?',
    book_which: 'तुम्हाला कोणती प्रॉपर्टी पाहायची आहे? यादीतील नंबर पाठवा (उदा. *1*).',
    book_need_search: 'नक्की! आधी सांगा तुम्ही काय शोधत आहात (बजेट, BHK, भाग), मग मी व्हिजिटसाठी पर्याय दाखवेन.',
    book_unavailable: 'माफ करा, *{title}* आता उपलब्ध नाही. सारखे पर्याय दाखवू का?',
    book_ask: 'छान निवड: *{title}* ({loc}) 👍\nकृपया {missing} सांगा. व्हिजिट रोज {open} ते {close} दरम्यान होतात.',
    m_date: 'भेटीची तारीख', m_time: 'वेळ', m_name: 'तुमचे नाव', and: ' आणि ',
    book_past: 'ही वेळ आधीच गेली आहे. कृपया पुढची तारीख आणि वेळ निवडा.',
    book_hours: 'व्हिजिट फक्त {open} ते {close} दरम्यान होऊ शकते. कृपया त्या वेळेत वेळ निवडा.',
    slot_taken: 'माफ करा, {date} रोजी {time} आधीच बुक आहे. {open} ते {close} दरम्यान दुसरी वेळ चालेल का?',
    confirmed: '✅ *साइट व्हिजिट निश्चित!*\n\n🏠 {title}\n📍 {loc}\n👤 {name}\n📅 {date}\n⏰ {time}\n\n{broker_line}वेळ बदलायची असेल किंवा आणखी पर्याय हवे असतील तर इथेच मेसेज करा.',
    broker_line: 'आमचे ब्रोकर {broker} तुम्हाला तिथे भेटतील.\n',
    pune: 'पुणे'
  },
  hinglish: {
    ask_criteria: 'Pune mein ghar dhoondhne mein zaroor help karunga! 🏡 Apna *budget*, *BHK* aur *preferred area* batayein, jaise "Baner mein 2 BHK, 90 lakh tak".',
    head_exact: '🏡 *{crit}* ke liye options:',
    head_nearby: '{loc} mein abhi kuch nahi hai, par ye paas ke areas mein hain 📍',
    head_closest: '*{crit}* ka exact match nahi mila, par ye close options hain:',
    footer: 'Free site visit book karne ke liye number bhejiye (jaise *1*).',
    none: 'Sorry, *{crit}* ke liye abhi kuch nahi mila. Budget, BHK ya area change karein?',
    none_nearby: 'Sorry, {loc} mein *{crit}* ke liye abhi kuch nahi hai. Kya {near} jaise paas ke areas chalenge?',
    book_which: 'Aap kaunsi property dekhna chahenge? List se uska number bhejiye (jaise *1*).',
    book_need_search: 'Zaroor! Pehle bataiye aap kya dhoondh rahe hain (budget, BHK, area), phir main visit ke liye options dikhata hoon.',
    book_unavailable: 'Sorry, *{title}* ab available nahi hai. Kya main similar options dikhaun?',
    book_ask: 'Badhiya choice: *{title}* ({loc}) 👍\nPlease {missing} batayein. Visits roz {open} se {close} ke beech hoti hain.',
    m_date: 'visit ki date', m_time: 'time', m_name: 'aapka naam', and: ' aur ',
    book_past: 'Ye time nikal chuka hai. Please aage ki koi date aur time choose karein.',
    book_hours: 'Visits sirf {open} se {close} ke beech ho sakti hain. Please is beech ka time choose karein.',
    slot_taken: 'Sorry, {date} ko {time} pehle se booked hai. Kya {open} se {close} ke beech koi aur time chalega?',
    confirmed: '✅ *Site visit confirmed!*\n\n🏠 {title}\n📍 {loc}\n👤 {name}\n📅 {date}\n⏰ {time}\n\n{broker_line}Time change karna ho ya aur options dekhne hon to yahin message karein.',
    broker_line: 'Hamare broker {broker} aapse wahin milenge.\n',
    pune: 'Pune'
  }
};
const L = T[lang] || T.en;
const fill = (key, vars) => { let s = L[key] || T.en[key]; for (const k in (vars || {})) s = s.split('{' + k + '}').join(String(vars[k])); return s; };
const OPEN_L = hourLabel(OPEN), CLOSE_L = hourLabel(CLOSE);
const LOCALE = { en: 'en-IN', hinglish: 'en-IN', hi: 'hi-IN', mr: 'mr-IN' };
const dateLabel = d => new Date(d + 'T00:00:00Z').toLocaleDateString(LOCALE[lang] || 'en-IN', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' });

// ---------- Pune search ----------
const CITY_WIDE = ['pune', 'pune city', 'any', 'anywhere', 'all', 'all pune', 'whole pune', 'anywhere in pune'];
const ALIASES = { 'hinjawadi': 'hinjewadi', 'vimannagar': 'viman nagar', 'kalyaninagar': 'kalyani nagar', 'kp': 'koregaon park', 'karvenagar': 'karve nagar', 'pimplesaudagar': 'pimple saudagar', 'pimple saudagaar': 'pimple saudagar', 'magarpatta city': 'magarpatta', 'baner road': 'baner', 'balewadi high street': 'balewadi', 'kharadi bypass': 'kharadi', 'wadgaonsheri': 'wadgaon sheri', 'shivajinagar': 'shivaji nagar', 'kothrud depot': 'kothrud' };
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
const locMatches = (l, w) => { const c = canonLoc(l); return !!c && (c === w || (' ' + c + ' ').includes(' ' + w + ' ')); };
const canonFurn = v => { const n = norm(v); if (!n) return ''; if (n.includes('unfurnish') || /^un /.test(n) || n === 'bare') return 'unfurnished'; if (n.includes('semi')) return 'semi-furnished'; if (n.includes('furnish')) return 'furnished'; return n; };
const canonType = v => { const n = norm(v); if (!n) return ''; if (/flat|apartment|apt/.test(n)) return 'apartment'; if (/villa|bungalow|row ?house|independent house/.test(n)) return 'villa'; if (/plot|land/.test(n)) return 'plot'; if (/commercial|office|shop/.test(n)) return 'commercial'; return n; };
const titleCase = s => s.replace(/\b\w/g, c => c.toUpperCase());

function search() {
  const available = all.filter(r => {
    if (norm(r.status) !== 'available' || clean(r.title).length < 3) return false;
    const t = canonType(r.property_type);
    if (!t) return false;
    if ((t === 'apartment' || t === 'villa') && !num(r.bhk)) return false;
    return true;
  });
  const wantedLoc = canonLoc(st.locality);
  const cityWide = !wantedLoc || CITY_WIDE.includes(wantedLoc);
  const wantType = canonType(st.property_type), wantFurn = canonFurn(st.furnishing);
  const wantBhk = st.bhk, minB = st.budget_min, maxB = st.budget_max;
  const noCriteria = cityWide && !wantBhk && !minB && !maxB && !wantType;
  const fits = (r, s) => {
    const bhk = num(r.bhk), price = num(r.price_inr);
    if (wantType && canonType(r.property_type) !== wantType) return false;
    if (wantBhk && Math.abs(bhk - wantBhk) > s.bhk) return false;
    if (maxB && (!price || price > maxB * (1 + s.budget))) return false;
    if (minB && (!price || price < minB * (1 - s.budget))) return false;
    if (wantFurn && s.strict && canonFurn(r.furnishing) !== wantFurn) return false;
    return true;
  };
  const EXACT = { bhk: 0, budget: 0, strict: true }, CLOSE_S = { bhk: 1, budget: 0.15, strict: false };
  const inLoc = cityWide ? available : available.filter(r => locMatches(r.locality, wantedLoc));
  let matches = inLoc.filter(r => fits(r, EXACT)), type = matches.length ? 'exact' : 'none';
  if (!matches.length && !cityWide && st.locality_flexible && NEARBY[wantedLoc]) {
    matches = available.filter(r => NEARBY[wantedLoc].some(n => locMatches(r.locality, n)) && fits(r, EXACT));
    if (matches.length) type = 'nearby';
  }
  const diff = r => {
    const d = [], bhk = num(r.bhk), price = num(r.price_inr);
    if (wantBhk && bhk !== wantBhk) d.push(bhk + ' BHK');
    if (maxB && price > maxB) d.push('+' + Math.round((price / maxB - 1) * 100) + '% budget');
    if (wantFurn && canonFurn(r.furnishing) !== wantFurn) d.push(str(r.furnishing) || '?');
    return d.join(' · ');
  };
  if (!matches.length) {
    const close = inLoc.filter(r => fits(r, CLOSE_S));
    if (close.length) {
      type = 'closest';
      const score = r => Math.abs(num(r.bhk) - wantBhk) * 10 + (maxB ? Math.max(0, num(r.price_inr) / maxB - 1) * 100 : 0);
      matches = close.sort((a, b) => score(a) - score(b));
    }
  }
  if (type === 'exact' || type === 'nearby') matches.sort((a, b) => num(a.price_inr) - num(b.price_inr));
  const crit = [];
  if (wantBhk) crit.push(wantBhk + ' BHK');
  if (wantType) crit.push(wantType);
  crit.push(cityWide ? L.pune : titleCase(st.locality));
  if (minB && maxB) crit.push(fmtPrice(minB) + '–' + fmtPrice(maxB));
  else if (maxB) crit.push('≤ ' + fmtPrice(maxB));
  else if (minB) crit.push('≥ ' + fmtPrice(minB));
  if (wantFurn) crit.push(wantFurn);
  const near = (NEARBY[wantedLoc] || []).slice(0, 3).map(titleCase).join(', ');
  return { picks: matches.slice(0, 3), type, cityWide, noCriteria, crit: crit.join(' · '), near: cityWide ? '' : near, diff };
}

const line = (r, i, type, diff) => {
  const facts = [fmtPrice(num(r.price_inr)), num(r.area_sqft) ? num(r.area_sqft) + ' sq ft' : '', str(r.furnishing), 'ID ' + r.listing_id].filter(Boolean).join(' · ');
  const d = type === 'closest' ? diff(r) : '';
  return i + '. *' + clean(r.title) + '* – ' + (clean(r.locality) || 'Pune') + '\n   ' + facts + (d ? '\n   ↳ ' + d : '');
};

// ---------- decide the reply ----------
let reply = '', image_url = '', check_slot = false, start_iso = '', end_iso = '';
let reply_confirmed = '', reply_taken = '', session_confirmed = null, session_taken = null, lead = null, historyNote = '';

if (intent === 'property_search') {
  const res = search();
  if (res.noCriteria) reply = fill('ask_criteria');
  else if (!res.picks.length) {
    reply = res.near && !st.locality_flexible ? fill('none_nearby', { loc: titleCase(st.locality), crit: res.crit, near: res.near }) : fill('none', { crit: res.crit });
  } else {
    const head = res.type === 'nearby' ? fill('head_nearby', { loc: titleCase(st.locality) }) : res.type === 'closest' ? fill('head_closest', { crit: res.crit }) : fill('head_exact', { crit: res.crit });
    reply = head + '\n\n' + res.picks.map((r, i) => line(r, i + 1, res.type, res.diff)).join('\n\n') + '\n\n' + fill('footer');
    st.shown = res.picks.map((r, i) => (i + 1) + '|' + r.listing_id + '|' + clean(r.title)).join(';');
    image_url = str(res.picks[0].image_url);
  }
} else if (intent === 'book_visit') {
  if (st.booking_status !== 'in_progress') st.booking_status = 'in_progress';
  const prop = all.find(r => str(r.listing_id).toUpperCase() === st.selected_id);
  if (!prop) reply = shownList.length ? fill('book_which') : fill('book_need_search');
  else {
    const title = clean(prop.title), loc = clean(prop.locality) || 'Pune';
    if (norm(prop.status) !== 'available') { reply = fill('book_unavailable', { title }); st.selected_id = ''; }
    else {
      const missing = [];
      if (!st.meeting_date) missing.push(L.m_date);
      if (!st.meeting_time) missing.push(L.m_time);
      if (!st.customer_name) missing.push(L.m_name);
      if (missing.length) reply = fill('book_ask', { title, loc, missing: missing.join(L.and), open: OPEN_L, close: CLOSE_L });
      else {
        const p = st.meeting_time.split(':').map(Number);
        const startMin = p[0] * 60 + p[1], endMin = startMin + VISIT_MIN;
        const nowIst = new Date(Date.now() + 5.5 * 3600e3).toISOString().slice(0, 16);
        if ((st.meeting_date + 'T' + st.meeting_time) <= nowIst) { reply = fill('book_past'); st.meeting_date = ''; st.meeting_time = ''; }
        else if (startMin < OPEN * 60 || endMin > CLOSE * 60) { reply = fill('book_hours', { open: OPEN_L, close: CLOSE_L }); st.meeting_time = ''; }
        else {
          check_slot = true;
          start_iso = st.meeting_date + 'T' + st.meeting_time + ':00+05:30';
          end_iso = st.meeting_date + 'T' + hhmm(endMin) + ':00+05:30';
          const broker = str(prop.broker_name);
          const vars = { title, loc, name: st.customer_name, date: dateLabel(st.meeting_date), time: timeLabel(st.meeting_time), open: OPEN_L, close: CLOSE_L, broker_line: broker ? fill('broker_line', { broker }) : '' };
          reply_confirmed = fill('confirmed', vars);
          reply_taken = fill('slot_taken', vars);
          historyNote = 'visit requested ' + st.meeting_date + ' ' + st.meeting_time + ' for ' + prop.listing_id;
          lead = { customer_name: st.customer_name, phone, listing_id: prop.listing_id, title, locality: loc, address: str(prop.address), broker_name: broker, broker_phone: str(prop.broker_phone).replace(/\D/g, ''), budget: st.budget_max || '', date_label: dateLabel(st.meeting_date), time_label: timeLabel(st.meeting_time), en_date: new Date(st.meeting_date + 'T00:00:00Z').toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }), en_time: timeLabel(st.meeting_time) };
          reply = reply_taken;
        }
      }
    }
  }
} else {
  let r = str(ai.reply);
  const unsafe = /\+?\d[\d\s-]{8,}\d/.test(r) || /\b(confirmed|booked)\b|कन्फर्म|बुक हो|निश्चित झाली/i.test(r);
  if (!r || unsafe) r = fill('ask_criteria');
  reply = r.slice(0, 1200);
}

// ---------- history + sessions ----------
const turns = st.history.split(' ## ').filter(Boolean);
turns.push('U: ' + clip(text, 140) + ' | A: ' + clip(historyNote || reply, 200));
st.history = turns.slice(-3).join(' ## ');
if (check_slot) {
  session_confirmed = Object.assign({}, st, { booking_status: 'confirmed', meeting_date: '', meeting_time: '' });
  session_taken = Object.assign({}, st, { meeting_time: '' });
}

return [{ json: {
  phone, phone_number_id: str(trig.metadata && trig.metadata.phone_number_id), intent, lang,
  reply, image_url, session: st, confirmed: false,
  check_slot, start_iso, end_iso, reply_confirmed, reply_taken, session_confirmed, session_taken, lead
} }];
