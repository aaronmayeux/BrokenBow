/* ============================================================================
   data.js — ALL trip content for the Broken Bow 2026 PWA.
   EDIT TRIP FACTS HERE. Logic lives in app.js, styling in css/style.css.

   Conventions
   -----------
   • Coordinates + Google Place IDs verified via Google Places (May 2026).
   • ratings/ratingCount are point-in-time SNAPSHOTS (May 2026). The live value
     is one tap away in Google Maps — see the "as of" caveat in the UI.
   • placeId = real Google Place ID (ChIJ…). Powers the place-listing deep link.
     Natchitoches has none on purpose (the only correct pin is the district,
     not a business — see note there).
   • Times are local Central (CDT in June = UTC-05:00).
   • hours = { default:{open,close}, overrides:{ "0".."6": {open,close} | null }, ... }
       - Day keys are JS getDay(): 0=Sun … 6=Sat.
       - A day present in `overrides` with value null  => CLOSED that day.
       - A day present with an {open,close}            => those hours.
       - A day absent from `overrides`                 => use `default`.
       - alwaysOpen:true overrides everything (24h).
       - "open now" is BEST-EFFORT. callAhead:true = verify before driving.
       - Hours are May-2026 snapshots; summer hours may run later — flagged.
   • priceTier  = "$" | "$$" | "$$$"  (from Google price level; null = unknown).
   • priceDetail = real dollar figures where we actually know them.
   • flags = SHORT action verbs/notes (open vocabulary): "buy ahead", "reserve",
     "cash only", "call ahead", "closes early", "porta-potties"… Closed-days are
     NOT flags (the hours pill already shows them — no duplication).
   • pickIf = friendly "pick this if you feel like…" one-liner shown on the card.
   • category (activities): Outdoors | Animals | Play | Indoors  → palette tint.
   • cuisine (restaurants): plain-text pill, NO per-cuisine color.
   • Family note: a 1-yr-old (Siena) tags along everywhere — picks favor calm,
     shallow water + toddler-paced trails, and dinners that welcome small kids.
   • Globals are plain consts loaded via <script src> — shared window scope.
   ========================================================================== */

const TRIP = {
  title: "Broken Bow 2026",
  subtitle: "The Mayeux Family Field Guide",
  tagline: "June 7–11 · Hochatown, Oklahoma",

  origin: { label: "Prairieville, LA 70769", lat: 30.3035, lng: -90.9637 },

  lodging: {
    name: "2 Suites & Bunks | Hot Tub, Firepit & Lounge Pool",
    vrbo: "2831195",
    vrboUrl: "https://www.vrbo.com/2831195",
    lat: 34.06484,
    lng: -94.75162,
    placeId: null,                 // map pin only until the booking address arrives
    address: null,                 // TODO: exact street address — from booking email
    travelDay: true,               // → Google Maps DIRECTIONS (not a place listing)
    blurb: "Private pool, hot tub, firepit, full kitchen, A/C, bunks. 10/10 over 55 reviews.",
    notes: "Just S of the Hochatown strip · ~10 min to attractions · ~5 min to Pruett's.",
    checkIn: "2026-06-07T16:00:00-05:00",  // 4:00 PM CDT, Sun June 7
    checkOut: "2026-06-11T10:00:00-05:00"  // 10:00 AM CDT, Thu June 11
  },

  dates: { start: "2026-06-07", end: "2026-06-11", nightsStay: 4, nightsHome: 2 },

  // Countdown targets
  departure: "2026-06-07T08:00:00-05:00", // suggested depart Prairieville

  family: [
    { name: "Aaron",   role: "Dad" },
    { name: "Lucia",   role: "Mom" },
    { name: "Zelphia", age: 8 },
    { name: "Melania", age: 5 },
    { name: "Siena",   age: 1 }
  ]
};

/* One trip-wide banner replaces the repeated "no cell service" card notes. */
const BANNER = "No cell service at the cabin or most trails — screenshot your maps before you head out.";

/* Snapshot date shown beside ratings so drift is honest. */
const RATINGS_AS_OF = "May 2026";

/* Open-Meteo location (keyless). Hochatown / Beavers Bend. */
const WEATHER = { lat: 34.1657, lng: -94.7572, label: "Hochatown, OK" };

/* ============================================================================
   ACTIVITIES (12) — anchors + swappable menu.
   defaultDay = anchor date (drives Today view); null = menu-only.
   votable = appears in the per-person voting tally.
   Family lean: calm shallow water + easy trails for a 1-yr-old in tow.
   ========================================================================== */
const ACTIVITIES = [
  {
    id: "beavers-bend-state-park",
    name: "Beavers Bend State Park & Nature Center",
    category: "Outdoors",
    lat: 34.1326751, lng: -94.6803052,
    placeId: "ChIJJ8bXSMVqNYYRxLYyU4Mi0bg",
    rating: 4.8, ratingCount: 5133,
    priceTier: null, priceDetail: "Park free to enter",
    blurb: "The do-everything anchor: swim beach, paddle boats (warm season), picnic spots, and the flat riverside Friends Trail through the woods.",
    notes: "Park is 24h. The Nature Center BUILDING may keep reduced early-week hours off-season — the park itself doesn't.",
    pickIf: "Pick this if you want the do-everything day — swim beach, shaded picnic spots, and the flat riverside Friends Trail, all toddler-paced and in one place.",
    hours: { alwaysOpen: true, label: "Park 24h · Center ≈9–4", default: { open: "09:00", close: "16:00" } },
    flags: ["flat trails", "swim season"],
    tags: ["swim", "trails", "river", "kids"],
    votable: true, defaultDay: "2026-06-08"
  },
  {
    id: "safari-park",
    name: "Beavers Bend Safari Park",
    category: "Animals",
    lat: 34.1566453, lng: -94.7434015,
    placeId: "ChIJYyuICfpHNYYREpb4Frq8tlM",
    rating: 4.5, ratingCount: 569,
    priceTier: "$$", priceDetail: "Per-person + service fee + tax; animal feed extra",
    blurb: "Drive-through 1.8-mi loop — feed exotic animals from your own car. The priciest single outing.",
    notes: "Open daily 9:30–5. Drive your OWN vehicle (Armada is ideal).",
    pickIf: "Pick this if you feel like feeding a kangaroo from the car window without ever unbuckling the baby — the splurge day the big kids will never forget.",
    hours: { default: { open: "09:30", close: "17:00" }, label: "9:30–5 daily" },
    flags: ["buy tickets ahead", "drive your own car", "cash for feed"],
    tags: ["animals", "drive-thru", "kids"],
    votable: true, defaultDay: "2026-06-09"
  },
  {
    id: "the-maze",
    name: "The Maze of Hochatown",
    category: "Play",
    lat: 34.1884224, lng: -94.7774421,
    placeId: "ChIJMc7pMltHNYYRGTStnxmT4Sk",
    rating: 4.6, ratingCount: 549,
    priceTier: null, priceDetail: null,
    blurb: "Outdoor wooden maze with stamp-card towers. Same complex as Chili Dippers — pair them.",
    notes: "Bigger than it looks — shaded paths, water stations. No animals/amusement (per Aaron).",
    pickIf: "Pick this if you want to wander an outdoor maze together — Siena rides along in the carrier just fine.",
    hours: { default: { open: "10:00", close: "16:00" }, overrides: { "5": { open: "10:00", close: "18:00" }, "6": { open: "10:00", close: "18:00" } }, label: "10–4 (Fri/Sat to 6)" },
    flags: ["porta-potties only"],
    tags: ["maze", "outdoor", "kids"],
    votable: true, defaultDay: "2026-06-10"
  },
  {
    id: "chili-dippers",
    name: "Chili Dippers Golf Club (mini golf)",
    category: "Play",
    lat: 34.1884273, lng: -94.777846,
    placeId: "ChIJ5xaWybZHNYYR0LcWlX7PAEo",
    rating: 4.3, ratingCount: 87,
    priceTier: null, priceDetail: "Kid & senior discounts",
    blurb: "18-hole mini golf in the Maze complex — holes get progressively harder.",
    notes: "No food or drink sold on-site; bring your own cup.",
    pickIf: "Pick this if you feel like an easy 18 holes of mini golf right after the maze.",
    hours: { default: { open: "10:00", close: "16:00" }, overrides: { "5": { open: "10:00", close: "18:00" }, "6": { open: "10:00", close: "18:00" } }, label: "10–4 (Fri/Sat to 6)" },
    flags: ["no food/drink sold"],
    tags: ["mini-golf", "outdoor", "kids"],
    votable: true, defaultDay: "2026-06-10"
  },

  /* ---- Swappable menu (no default anchor day) ---- */
  {
    id: "depot-train",
    name: "Beavers Bend Depot — Train & Pony Rides",
    category: "Play",
    lat: 34.1353153, lng: -94.7019977,
    placeId: "ChIJF2ZC8-c-NYYR33LVAG6_LwI",
    rating: 4.7, ratingCount: 1049,
    priceTier: null, priceDetail: null,
    blurb: "Miniature train trail ride plus pony rides — deer sightings along the route. Big toddler hit.",
    notes: "Closes early. Pony rides warm-season.",
    pickIf: "Pick this if you want the easiest little-kid win going — a slow train, ponies, and deer along the track.",
    hours: { default: { open: "09:00", close: "15:00" }, overrides: { "6": { open: "09:00", close: "17:00" } }, label: "9–3 (Sat to 5)", callAhead: true },
    flags: ["call ahead", "closes early"],
    tags: ["train", "ponies", "kids"],
    votable: true, defaultDay: null
  },
  {
    id: "forest-heritage-center",
    name: "Forest Heritage Center Museum",
    category: "Indoors",
    lat: 34.1326366, lng: -94.6801289,
    placeId: "ChIJJ9wH9RI_NYYRQaFVmPwZjQ0",
    rating: 4.7, ratingCount: 1418,
    priceTier: null, priceDetail: "Free (donations welcome)",
    blurb: "Air-conditioned wood-carving dioramas + a kids' corner, inside the state park. Great heat/rain backup.",
    notes: "Carver often demonstrating on weekends.",
    pickIf: "Pick this if it's blazing hot or raining and you need somewhere free, indoors, and air-conditioned for an hour.",
    hours: { default: { open: "08:00", close: "17:00" }, label: "8–5 daily" },
    flags: ["free", "A/C"],
    tags: ["free", "indoor", "ac", "kids"],
    votable: true, defaultDay: null
  },
  {
    id: "mining-co",
    name: "Beaver's Bend Mining Co",
    category: "Play",
    lat: 34.1520601, lng: -94.7522380,
    placeId: "ChIJVykkSiNHNYYR8El_hFWp1Uk",
    rating: 4.5, ratingCount: 370,
    priceTier: null, priceDetail: "Buy a mining bucket; bigger bag = more finds",
    blurb: "Sluice for gems + a dino-themed mini golf. Hands-on for the older two; gems are guaranteed finds.",
    notes: "Cute gift shop. (Dino ride was occasionally down late 2025.)",
    pickIf: "Pick this if you feel like 'digging for treasure' — guaranteed gem finds, plus dino mini golf for the older two.",
    hours: { default: { open: "09:00", close: "19:00" }, label: "9–7 daily", callAhead: true },
    flags: ["call ahead", "cash for buckets"],
    tags: ["gems", "mini-golf", "kids"],
    votable: true, defaultDay: null
  },
  {
    id: "rescue-petting-zoo",
    name: "Hochatown Rescue Center & Petting Zoo",
    category: "Animals",
    lat: 34.1514877, lng: -94.7514643,
    placeId: "ChIJz0Fx3DRHNYYRGN_OW52c0fQ",
    rating: 4.6, ratingCount: 1847,
    priceTier: "$", priceDetail: "Cheap; supports animal rescue",
    blurb: "Hands-on animals, toddler-paced, cheap. Easy win for Siena & Melania — easily a two-hour visit.",
    notes: "Pet and feed most of the animals.",
    pickIf: "Pick this if you want maximum hands-on animal time for almost no money — calm and toddler-paced.",
    hours: { default: { open: "10:00", close: "19:00" }, label: "10–7 daily", callAhead: true },
    flags: ["call ahead", "bring small bills"],
    tags: ["animals", "cheap", "kids"],
    votable: true, defaultDay: null
  },
  {
    id: "gutter-chaos",
    name: "Gutter Chaos (bowling & arcade)",
    category: "Indoors",
    lat: 34.1671184, lng: -94.7609058,
    placeId: "ChIJk0STjJpHNYYRosODqJOh-_Q",
    rating: 4.5, ratingCount: 622,
    priceTier: "$$", priceDetail: "Walk-in cheaper than online reservation",
    blurb: "Bowling, pool, arcade, full kitchen + bar. The designated rainy-day backup.",
    notes: "High-energy family spot; speak to a server before sitting in the dining area.",
    pickIf: "Pick this if the weather turns and you need bowling, an arcade, and a full kitchen under one roof (closed Tuesdays).",
    hours: { default: { open: "11:00", close: "22:00" }, overrides: { "2": null, "5": { open: "11:00", close: "23:00" }, "6": { open: "11:00", close: "23:00" } }, label: "11–10 (later Fri/Sat) · closed Tue", callAhead: true },
    flags: ["rainy-day backup", "walk-in over online"],
    tags: ["bowling", "arcade", "indoor", "rainy-day"],
    votable: true, defaultDay: null
  },

  /* ---- NEW: calm, shallow water + easy trail (toddler-friendly) ---- */
  {
    id: "lake-beach-area",
    name: "Broken Bow Lake — Beach Area",
    category: "Outdoors",
    lat: 34.1386441, lng: -94.6883223,
    placeId: "ChIJTbXwdCc_NYYROeMfSL2skL4",
    rating: 4.6, ratingCount: 284,
    priceTier: null, priceDetail: "Free",
    blurb: "A calm lake swim area that's basically a big shallow pool — sandy/grassy edge, no river current, restrooms and showers right there.",
    notes: "Free life jackets for swimmers. Come before midday on weekends for a shady table. Dog-friendly.",
    pickIf: "Pick this if you want the easiest water day of the trip — a free, calm swim beach that's basically a big shallow pool, with showers and free life jackets for the little ones.",
    hours: { alwaysOpen: true, label: "Open 24h · swim in daylight", default: { open: "06:00", close: "21:00" } },
    flags: ["free", "calm/shallow", "showers + life jackets"],
    tags: ["swim", "lake", "kids", "free"],
    votable: true, defaultDay: null
  },
  {
    id: "spillway-wade",
    name: "Spillway Overlook & River Wade",
    category: "Outdoors",
    lat: 34.1571701, lng: -94.7053839,
    placeId: "ChIJvYO-JMo4NYYRMTQMmzUVAKs",
    rating: 4.8, ratingCount: 169,
    priceTier: null, priceDetail: "Free",
    blurb: "Clear, cold, shin-deep water below the dam with a short path down to the river's edge — the lazy-creek wade spot. Big rocks to perch on, easy splashing.",
    notes: "Water is cold (dam release) and rocks are slick — water shoes help. Anglers fish nearby; keep the rock-throwing away from them.",
    pickIf: "Pick this if you feel like a lazy wade in clear, shin-deep water — a short path leads right to the river's edge, perfect for letting Siena splash while the big kids hunt for rocks.",
    hours: { alwaysOpen: true, label: "Open 24h · daylight best", default: { open: "06:00", close: "20:00" } },
    flags: ["free", "shallow wading", "water shoes"],
    tags: ["wade", "river", "kids", "free"],
    votable: true, defaultDay: null
  },
  {
    id: "beaver-lodge-trail",
    name: "Beaver Lodge Nature Trail",
    category: "Outdoors",
    lat: 34.1451801, lng: -94.6895746,
    placeId: "ChIJ7fJQBSk_NYYRLhUiUsRc8Ak",
    rating: 4.8, ratingCount: 128,
    priceTier: null, priceDetail: "State-park parking pass ~$10",
    blurb: "A short, gentle nature loop in the trees along the water — birdsong, shade, and easy footing. A real trail without the climb.",
    notes: "Bring the carrier for Siena; stroller won't love the dirt sections. Parking pass (~$10 as of late 2025).",
    pickIf: "Pick this if you want a true trail without the work — a short, gentle nature loop along the water (bring the carrier for Siena and ~$10 for parking).",
    hours: { default: { open: "07:00", close: "20:00" }, label: "Daylight hours" },
    flags: ["easy trail", "parking pass ~$10", "carrier for Siena"],
    tags: ["trail", "shade", "river", "kids"],
    votable: true, defaultDay: null
  }
];

/* ============================================================================
   RESTAURANTS (12) — hours best-effort (May 2026 snapshot); callAhead = volatile.
   cuisine = plain-text pill (no color). priceTier from Google price level.
   All picks here welcome a 1-yr-old. spin:true => dinner-spinner eligible.
   ========================================================================== */
const RESTAURANTS = [
  {
    id: "abendigos",
    name: "Abendigo's Grill & Patio",
    cuisine: "Steakhouse",
    lat: 34.1629066, lng: -94.7574234,
    placeId: "ChIJGTfUTtxqNYYRtHIUoJKB73U",
    rating: 4.5, ratingCount: 3257,
    priceTier: "$$$", priceDetail: null,
    notes: "The nicest sit-down dinner in town — big space, outdoor area, live music.",
    pickIf: "Pick this if you want the nicest sit-down dinner in town — cocktails, a big patio, and live music. Reserve a table; kids are welcome but it's the dress-it-up-a-little night.",
    hours: { default: { open: "16:00", close: "21:00" }, overrides: { "0": null, "1": null, "5": { open: "16:00", close: "21:30" }, "6": { open: "16:00", close: "21:30" } }, label: "4–9 · closed Sun/Mon" },
    flags: ["reserve", "cocktails"],
    spin: true
  },
  {
    id: "mountain-fork-brewery",
    name: "Mountain Fork Brewery",
    cuisine: "Pizza · burgers · beer",
    lat: 34.1828663, lng: -94.7772486,
    placeId: "ChIJlfxJ0-RGNYYRUHffbwbzUgQ",
    rating: 4.1, ratingCount: 1336,
    priceTier: "$$", priceDetail: null,
    notes: "Family-friendly; good value, big kid play area, local beer.",
    pickIf: "Pick this if you want pizza and a cold beer while the kids burn off energy in the play area.",
    hours: { default: { open: "11:00", close: "20:30" }, overrides: { "5": { open: "11:00", close: "21:30" }, "6": { open: "11:00", close: "21:30" } }, label: "11–8:30 (Fri/Sat 9:30)", callAhead: true },
    flags: ["kid play area"],
    spin: true
  },
  {
    id: "grateful-head",
    name: "Grateful Head Pizza Oven & Tap Room",
    cuisine: "Pizza",
    lat: 34.1649127, lng: -94.7603006,
    placeId: "ChIJWWFoOjFHNYYRyyjIqLVKbbs",
    rating: 4.2, ratingCount: 5053,
    priceTier: "$$", priceDetail: null,
    notes: "The area's main pizza spot — and it knows it. Great patio.",
    pickIf: "Pick this if you're craving pizza and willing to call ahead for takeout to skip the famous wait.",
    hours: { default: { open: "11:00", close: "20:00" }, overrides: { "5": { open: "11:00", close: "21:00" }, "6": { open: "11:00", close: "21:00" } }, label: "11–8 (Fri/Sat 9)", callAhead: true },
    flags: ["long waits", "takeout recommended"],
    spin: true
  },
  {
    id: "naamans-bbq",
    name: "Naaman's BBQ",
    cuisine: "BBQ",
    lat: 34.1748721, lng: -94.7693318,
    placeId: "ChIJ94EEcfZHNYYRLWy0dng_9EU",
    rating: 4.4, ratingCount: 270,
    priceTier: "$$", priceDetail: null,
    notes: "Tender brisket, spacious indoor seating + patio. Order at the counter.",
    pickIf: "Pick this if you want tender brisket in a roomy, easy spot — go early before it sells out.",
    hours: { default: { open: "11:00", close: "19:00" }, overrides: { "0": { open: "10:30", close: "19:00" }, "5": { open: "11:00", close: "20:00" }, "6": { open: "11:00", close: "20:00" } }, label: "11–7 (Fri/Sat to 8)", callAhead: true },
    flags: ["can sell out — go early"],
    spin: true
  },
  {
    id: "buffalo-grill",
    name: "Buffalo Grill",
    cuisine: "BBQ · Tex-Mex",
    lat: 34.1115530, lng: -94.7386914,
    placeId: "ChIJA7c3oShBNYYReKQtFLPRb44",
    rating: 4.3, ratingCount: 1089,
    priceTier: "$$", priceDetail: null,
    notes: "Kid toys, strong margaritas, fast service. BBQ + southern comfort.",
    pickIf: "Pick this if you want BBQ-meets-Tex-Mex, strong margaritas, and a toy bin to keep the kids busy (closed Tuesdays).",
    hours: { default: { open: "11:00", close: "21:00" }, overrides: { "0": { open: "11:00", close: "17:00" }, "2": null }, label: "11–9 · closed Tue (Sun to 5)", callAhead: true },
    flags: ["kid toys", "margaritas"],
    spin: true
  },
  {
    id: "lake-bums",
    name: "Lake Bums Grill & Buzz Bar",
    cuisine: "Cheesesteaks · burgers",
    lat: 34.1656872, lng: -94.7554037,
    placeId: "ChIJeQWegpZHNYYRsq6KwLiZXko",
    rating: 4.6, ratingCount: 236,
    priceTier: null, priceDetail: null,
    notes: "Eat inside old buses + playground. Owner Josh runs a great cheesesteak.",
    pickIf: "Pick this if you feel like the best cheesesteak around, eaten inside a converted bus with a playground right outside — the most kid-friendly spot going.",
    hours: { default: { open: "11:00", close: "18:00" }, overrides: { "0": { open: "11:00", close: "15:00" }, "1": { open: "11:00", close: "15:00" }, "5": { open: "11:00", close: "20:00" }, "6": { open: "11:00", close: "20:00" } }, label: "11–6 (Fri/Sat to 8) · closes early Sun/Mon", callAhead: true },
    flags: ["closes early", "playground"],
    spin: true
  },
  {
    id: "hochahut",
    name: "The Hochahut",
    cuisine: "Corn dogs · snacks",
    lat: 34.1524832, lng: -94.7509814,
    placeId: "ChIJaY9S_5lHNYYROYQy-lja4aw",
    rating: 4.7, ratingCount: 442,
    priceTier: "$", priceDetail: null,
    notes: "Famous corn dogs (ranked top-10 in the US), hammocks, outdoor seating. Snack stop, not dinner.",
    pickIf: "Pick this if you just want a famous corn dog and a hammock — a snack stop, not a real dinner.",
    hours: { default: { open: "11:00", close: "18:00" }, overrides: { "5": { open: "11:00", close: "20:00" }, "6": { open: "11:00", close: "20:00" } }, label: "11–6 (Fri/Sat to 8)", callAhead: true },
    flags: ["snack stop", "porta-potty"],
    snack: true, spin: false
  },
  {
    id: "hochatown-saloon",
    name: "Hochatown Saloon",
    cuisine: "Bar & grill",
    lat: 34.1502230, lng: -94.7495740,
    placeId: "ChIJeRfJ_C1BNYYRvN6gO7VzvLc",
    rating: 4.0, ratingCount: 2615,
    priceTier: "$$", priceDetail: null,
    notes: "Big portions, live music on weekends (can close early for concerts). Adult-leaning vibe.",
    pickIf: "Pick this if you want big plates and a lively crowd — come earlier with the kids before the weekend music takes over.",
    hours: { default: { open: "11:00", close: "21:00" }, overrides: { "0": { open: "08:00", close: "21:00" }, "6": { open: "08:00", close: "21:00" } }, label: "≈11–9 (wknd from 8am)", callAhead: true },
    flags: ["live music", "busy"],
    spin: true
  },
  {
    id: "shuck-me",
    name: "Shuck Me Kitchen & Cantina",
    cuisine: "Seafood · Cajun",
    lat: 34.1830356, lng: -94.7766387,
    placeId: "ChIJS6V5hdlHNYYRD_0eE0KaMOs",
    rating: 4.1, ratingCount: 1258,
    priceTier: "$$", priceDetail: null,
    notes: "Mixed reviews on flavor; prices run high. Set expectations.",
    pickIf: "Pick this if you're set on seafood and Cajun and going in with open-minded expectations.",
    hours: { default: { open: "11:00", close: "21:00" }, overrides: { "5": { open: "11:00", close: "22:00" }, "6": { open: "11:00", close: "22:00" } }, label: "11–9 (Fri/Sat to 10)", callAhead: true },
    flags: ["mixed reviews"],
    spin: true
  },

  /* ---- NEW: atmosphere + drinks, all welcome a 1-yr-old ---- */
  {
    id: "beavers-bend-brewery",
    name: "Beavers Bend Brewery",
    cuisine: "Brewery · beer garden",
    lat: 34.1656913, lng: -94.7596645,
    placeId: "ChIJDf7MuSRHNYYRUS6Vc8o7xNA",
    rating: 4.6, ratingCount: 394,
    priceTier: null, priceDetail: null,
    notes: "Beer garden with live music, cornhole, board games and a family-friendly patio. Food is limited (gourmet hot-dog cart) — come for the vibe + a brew.",
    pickIf: "Pick this if you want the best easygoing atmosphere of the trip — a beer garden with live music, cornhole, and board games where kids and dogs are part of the deal.",
    hours: { default: { open: "12:00", close: "20:00" }, overrides: { "0": { open: "11:00", close: "19:00" }, "5": { open: "12:00", close: "21:00" }, "6": { open: "12:00", close: "21:00" } }, label: "12–8 (Fri/Sat 9 · Sun 11–7)", callAhead: true },
    flags: ["live music", "family + dog friendly", "light food only"],
    spin: true
  },
  {
    id: "papa-poblanos",
    name: "Papa Poblanos",
    cuisine: "Mexican · Tex-Mex",
    lat: 34.029736, lng: -94.739289,
    placeId: "ChIJEVuER8VqNYYR3wCiPeAkEYw",
    rating: 4.2, ratingCount: 1684,
    priceTier: "$$", priceDetail: null,
    notes: "Relaxed Tex-Mex with a full bar and pet-friendly patio. Down in Broken Bow proper (~12 min); reviewers note they don't rush you, even late.",
    pickIf: "Pick this if you want a relaxed, kid-friendly Tex-Mex dinner with a real margarita and a patio — nobody rushes you, even with a baby in tow.",
    hours: { default: { open: "11:00", close: "21:00" }, overrides: { "5": { open: "11:00", close: "22:00" }, "6": { open: "11:00", close: "22:00" } }, label: "11–9 (Fri/Sat to 10)" },
    flags: ["margaritas", "patio", "kid-friendly"],
    spin: true
  },
  {
    id: "pressa-italia",
    name: "Pressa Italia",
    cuisine: "Italian",
    lat: 34.1137086, lng: -94.7406714,
    placeId: "ChIJ34aeYABBNYYRH_FQnHVL8RI",
    rating: 4.2, ratingCount: 410,
    priceTier: null, priceDetail: null,
    notes: "Chic Italian with a wine list and house limoncello — the closest thing to a date-night room that still welcomes kids. Pasta and pizza are the standouts.",
    pickIf: "Pick this if you want the closest thing to a date-night vibe that still welcomes the kids — chic Italian, a proper wine list, and a great room.",
    hours: { default: { open: "11:00", close: "21:00" }, overrides: { "5": { open: "11:00", close: "22:00" }, "6": { open: "11:00", close: "22:00" } }, label: "11–9 (Fri/Sat to 10)", callAhead: true },
    flags: ["chic atmosphere", "wine list", "kid-friendly"],
    spin: true
  }
];

/* ============================================================================
   PROVISIONS — groceries / meat market / in-cabin chef option.
   ========================================================================== */
const PROVISIONS = [
  {
    id: "pruetts",
    name: "Pruett's Food (Broken Bow)",
    type: "Full grocery",
    lat: 34.0250000, lng: -94.7380556,
    placeId: "ChIJAAAAANRqNYYRWSN2Chlm8rc",
    rating: 4.4, ratingCount: 2171,
    priceTier: "$", priceDetail: null,
    notes: "Clean, well-stocked, friendly. Bakery + hot deli. ~5 min from the cabin.",
    hours: { default: { open: "07:00", close: "22:00" }, label: "7am–10pm daily" },
    flags: ["stock up on the way in"]
  },
  {
    id: "local-259",
    name: "The Market at Local 259 (Hochatown)",
    type: "Gourmet / last-minute",
    lat: 34.1900973, lng: -94.7787097,
    placeId: "ChIJUxVbSx9HNYYRugGJeuHESIo",
    rating: 4.3, ratingCount: 233,
    priceTier: "$$", priceDetail: null,
    notes: "Hand-cut steaks, ready-to-eat meals, coffee bar, cabin basics. Pricier — for forgotten items.",
    hours: { default: { open: "08:00", close: "19:00" }, overrides: { "4": { open: "08:00", close: "20:00" }, "5": { open: "08:00", close: "21:00" }, "6": { open: "08:00", close: "21:00" } }, label: "≈8–7 (later Thu–Sat)", callAhead: true },
    flags: ["last-minute · pricey"]
  },
  {
    id: "mountain-man-meat",
    name: "Mountain Man Meat Market",
    type: "Steaks / sausage",
    lat: 34.0931725, lng: -94.7398408,
    placeId: "ChIJ4Q1VvW9ANYYRfipptFI8oLE",
    rating: 4.7, ratingCount: 277,
    priceTier: "$$", priceDetail: null,
    notes: "High-end grill supply: steaks, sausage, sides, wine. In-cabin chef option (Chef Phil).",
    hours: { default: { open: "11:00", close: "18:00" }, overrides: { "5": { open: "11:00", close: "20:00" }, "6": { open: "10:00", close: "20:00" } }, label: "11–6 (later Fri/Sat)", callAhead: true },
    flags: ["opens 11am", "in-cabin chef option"]
  }
];

/* ============================================================================
   LEG 1 — drive up (Sun June 7). Stops are TRAVEL-DAY items → DIRECTIONS.
   ========================================================================== */
const DRIVE_UP = {
  date: "2026-06-07",
  distanceMi: "~400–420 mi",
  driveTime: "~6–6.5 hr driving (≈7.5 hr with stops)",
  departSuggested: "8:00 AM",
  path: ["Prairieville", "Central LA", "Shreveport area", "Texarkana", "US-259 N · Idabel", "Broken Bow", "Hochatown"],
  stops: [
    { name: "Morning coffee & stretch", when: "~9:30 AM", note: "First break out of the gate." },
    { name: "Lunch — Shreveport area", when: "~12:00 PM", note: "Time-midpoint; let the kids run." },
    { name: "Pruett's Food — final grocery", when: "~2:45 PM", note: "Stock the cabin on the way in (open 7am–10pm).", lat: 34.0250000, lng: -94.7380556, placeId: "ChIJAAAAANRqNYYRWSN2Chlm8rc", travelDay: true }
  ],
  arrive: "~3:00 PM",
  checkIn: "4:00 PM"
};

/* ============================================================================
   LEG 2 — the stay (date-keyed; drives the auto-"Today" view).
   anchor / anchor2 reference ACTIVITIES ids.
   ========================================================================== */
const STAY_DAYS = [
  { date: "2026-06-07", dow: "Sun", title: "Arrive & settle", type: "travel", anchor: null, anchor2: null, notes: "Arrive ~3 PM · check in 4 PM · unpack, grill, firepit." },
  { date: "2026-06-08", dow: "Mon", title: "Beavers Bend day", type: "activity", anchor: "beavers-bend-state-park", anchor2: null, notes: "Swim beach + paddle boats · easy flat trails. Then home for the pool." },
  { date: "2026-06-09", dow: "Tue", title: "Safari Park", type: "activity", anchor: "safari-park", anchor2: null, notes: "Drive your OWN vehicle · buy tickets & waivers online beforehand." },
  { date: "2026-06-10", dow: "Wed", title: "Maze + mini golf", type: "activity", anchor: "the-maze", anchor2: "chili-dippers", notes: "Same complex. Porta-potties only. No animals/amusement (per Aaron)." },
  { date: "2026-06-11", dow: "Thu", title: "Check out → head home", type: "travel", anchor: null, anchor2: null, notes: "Check out 10 AM → begin the scenic route home." }
];

/* ============================================================================
   LEG 3 — scenic way home (June 11–13). Coords + Place IDs verified.
   These are TRAVEL-DAY items → DIRECTIONS.
   ========================================================================== */
const LEG3_STOPS = [
  {
    id: "crater-of-diamonds",
    name: "Crater of Diamonds State Park",
    lat: 34.0324674, lng: -93.6751298,
    placeId: "ChIJq5AkbjhhM4YR3pUpqKmSMSc",
    rating: 4.5, ratingCount: 8065,
    priceTier: "$$", priceDetail: "$15 adult · $7 kids 6–12 · under 6 free; tool rental ~$10–20",
    blurb: "Dig the only public diamond field in the world — keep what you find.",
    notes: "Open 8–4 daily. Hot & shadeless — bring umbrella, cooler, water. Rent or bring sifters.",
    hours: { default: { open: "08:00", close: "16:00" }, label: "8–4 daily" },
    flags: ["cash for fees", "bring shade & water"],
    region: "Murfreesboro, AR", travelDay: true
  },
  {
    id: "hot-springs",
    name: "Hot Springs National Park — Bathhouse Row",
    lat: 34.5137118, lng: -93.0534724,
    placeId: "ChIJJ8pAuQArzYcRGyB_jA0P_Vc",
    rating: 4.7, ratingCount: 2177,
    priceTier: null, priceDetail: "Free; ranger tours free",
    blurb: "Historic Fordyce Bathhouse + Bathhouse Row promenade. Free ranger tours.",
    notes: "Visitor center 9–5 daily, free. Overnight here (6/11).",
    hours: { default: { open: "09:00", close: "17:00" }, label: "VC 9–5 daily" },
    flags: ["free"],
    region: "Hot Springs, AR", travelDay: true
  },
  {
    id: "natchitoches",
    name: "Natchitoches Historic District (Front St)",
    lat: 31.7607, lng: -93.0866,
    placeId: null,   // Google's "Historic District" pin is the WRONG spot (LA-494, S of town). Use a name search → downtown Front St.
    rating: null, ratingCount: null,
    priceTier: null, priceDetail: "Free to stroll",
    blurb: "Brick-paved Front Street along the Cane River. Famous meat pies. Overnight here (6/12).",
    notes: "Oldest town in the Louisiana Purchase. Coords target downtown Front St (not the plantation units S of town).",
    hours: null,
    flags: ["meat pies", "evening stroll"],
    region: "Natchitoches, LA", travelDay: true
  },
  {
    id: "fort-rosalie",
    name: "Fort Rosalie (Natchez NHP)",
    lat: 31.55691, lng: -91.4101249,
    placeId: "ChIJ2_vJQ-f3JYYRCqjQlEzRknA",
    rating: 4.6, ratingCount: 23,
    priceTier: null, priceDetail: "Free",
    blurb: "NPS green space + Mississippi River overlook. The personal-history beat — see the sidebar.",
    notes: "Dawn–dusk, free. ~20–30 min picnic stop. ~2 hr home from here. (It's an open green space — set expectations.)",
    hours: null,
    flags: ["picnic stop", "park on Green St"],
    region: "Natchez, MS", travelDay: true
  }
];

const SCENIC_HOME = [
  { date: "2026-06-11", dow: "Thu", title: "Crater of Diamonds → Hot Springs", stops: ["crater-of-diamonds", "hot-springs"], overnight: "Hot Springs, AR", notes: "Check out 10 AM. Crater ~1.5–2 hr away; Hot Springs ~1.5 hr past that." },
  { date: "2026-06-12", dow: "Fri", title: "Hot Springs → Natchitoches", stops: ["natchitoches"], overnight: "Natchitoches, LA", notes: "~3–3.5 hr drive. Cane River, brick Front St, meat pies." },
  { date: "2026-06-13", dow: "Sat", title: "Natchitoches → Fort Rosalie → home", stops: ["fort-rosalie"], overnight: null, notes: "~2 hr to Natchez, quick picnic stop, then ~2 hr home to Prairieville." }
];

/* ============================================================================
   FORT ROSALIE — personal-history sidebar (Mayeux line).
   ========================================================================== */
const FORT_ROSALIE = {
  title: "Fort Rosalie & the Mayeux line",
  lat: 31.55691, lng: -91.4101249,
  placeId: "ChIJ2_vJQ-f3JYYRCqjQlEzRknA",
  travelDay: true,
  hours: "Dawn–dusk · free",
  body: "Aaron descends from Pierre Mayeux. Fort Rosalie, in Natchez, MS, was founded August 3, 1716 by Bienville and was the site of the 1729 Natchez Massacre. It's the trip's one personal-history beat — a green NPS overlook above the Mississippi, worth a short picnic stop on the way home.",
  footnote: "The New France / Louisiana book is Aaron's dad's project; Aaron did research for it."
};

/* ============================================================================
   SCAVENGER HUNT v2 (Cluster D1) — shared, scored, kid + adult items.

   State lives PER-PLAYER in localStorage (bb_scavenger_v2) and mirrors to the
   Firestore `scoreboard` collection (see js/sync.js). Everyone has their own
   card: finding a deer scores YOU — no claiming/stealing, so it reconciles
   cleanly even when four phones log finds offline at the cabin.

   Keyed by stable `id` (NEVER by array index) so adding/reordering items can
   never scramble saved finds.

   Each item: { id, emoji, label, who: "kid" | "adult", points }
     emoji  = shown big so Melania (5) can play solo without anyone reading.
              (Lucia can swap these for custom field-guide icons later — the
              renderer only needs this one field to change.)
     who    = "kid" or "adult"; kid items render first.
     points = 1 normal; 2/3/5 = rare bonus (the diamond is the white whale).

   The `farthest-plate` item is SPECIAL (special: "plate"): instead of a tap,
   each player picks states they've spotted from a scrollable list; the app
   ranks by distance from home (SCAVENGER_HOME) and crowns a winner at trip's
   end. Its bonus goes to the winner, not per-tap — so points: 0 here.
   ========================================================================== */
const SCAVENGER_HUNT = [
  /* --- KID items (emoji-first; Melania can play by sight alone) --- */
  { icon: "assets/icons/scavenger/01.png", id: "yellow-car",      emoji: "🚗", label: "A yellow car",                                who: "kid",   points: 1 },
  { icon: "assets/icons/scavenger/02.png", id: "welcome-sign",    emoji: "🪧", label: "A \"Welcome to ___\" state sign",             who: "kid",   points: 1 },
  { icon: "assets/icons/scavenger/03.png", id: "logging-truck",   emoji: "🚛", label: "A logging truck full of timber",              who: "kid",   points: 1 },
  { icon: "assets/icons/scavenger/04.png", id: "fireworks-stand", emoji: "🎆", label: "A roadside fireworks stand",                  who: "kid",   points: 1 },
  { icon: "assets/icons/scavenger/05.png", id: "cattle",          emoji: "🐄", label: "Cows or longhorns in a field",                who: "kid",   points: 1 },
  { icon: "assets/icons/scavenger/06.png", id: "lizard",          emoji: "🦎", label: "A lizard on the cabin",                       who: "kid",   points: 1 },
  { icon: "assets/icons/scavenger/07.png", id: "turtle",          emoji: "🐢", label: "A turtle on a log",                           who: "kid",   points: 1 },
  { icon: "assets/icons/scavenger/08.png", id: "firefly",         emoji: "✨", label: "A firefly after dark",                        who: "kid",   points: 1 },
  { icon: "assets/icons/scavenger/09.png", id: "deer",            emoji: "🦌", label: "A deer",                                      who: "kid",   points: 1 },
  { icon: "assets/icons/scavenger/10.png", id: "black-bear",      emoji: "🐻", label: "A black bear (Hochatown's mascot)",           who: "kid",   points: 1 },
  { icon: "assets/icons/scavenger/11.png", id: "bigfoot",         emoji: "🐾", label: "Bigfoot — sign, statue, or merch",            who: "kid",   points: 1 },
  { icon: "assets/icons/scavenger/12.png", id: "a-frame",         emoji: "🏠", label: "A giant A-frame cabin in the trees",          who: "kid",   points: 1 },
  { icon: "assets/icons/scavenger/13.png", id: "skip-rock",       emoji: "🪨", label: "Skip a rock across the water",                who: "kid",   points: 1 },
  { icon: "assets/icons/scavenger/14.png", id: "safari-trio",     emoji: "🦓", label: "A zebra, an ostrich, AND a buffalo (Safari Park)", who: "kid", points: 3 },
  { icon: "assets/icons/scavenger/15.png", id: "mini-golf-ace",   emoji: "⛳", label: "A hole-in-one at mini golf",                  who: "kid",   points: 3 },
  { icon: "assets/icons/scavenger/16.png", id: "quartz",          emoji: "🔮", label: "A piece of quartz crystal in the dig field",  who: "kid",   points: 2 },
  { icon: "assets/icons/scavenger/17.png", id: "diamond",         emoji: "💎", label: "A real diamond or gemstone at Crater of Diamonds", who: "kid", points: 5 },
  { icon: "assets/icons/scavenger/18.png", id: "hot-spring-steam",emoji: "♨️", label: "Steam rising off a hot spring",               who: "kid",   points: 1 },
  { icon: "assets/icons/scavenger/19.png", id: "waterfowl",       emoji: "🦆", label: "A duck or pelican on the water",              who: "kid",   points: 1 },

  /* --- ADULT items (naughty & funny finds) --- */
  { icon: "assets/icons/scavenger/20.png", id: "farthest-plate",  emoji: "🔢", label: "Farthest-away license plate — pick the state", who: "adult", points: 0, special: "plate" },
  { icon: "assets/icons/scavenger/21.png", id: "are-we-there",    emoji: "🗣️", label: "Catch someone saying \"are we there yet\"",    who: "adult", points: 1 },
  { icon: "assets/icons/scavenger/22.png", id: "sticker-truck",   emoji: "🚚", label: "A truck buried in bumper stickers",           who: "adult", points: 1 },
  { icon: "assets/icons/scavenger/23.png", id: "day-drinker",     emoji: "🍺", label: "Someone day-drinking harder than you before noon", who: "adult", points: 1 },
  { icon: "assets/icons/scavenger/24.png", id: "church-sign",     emoji: "⛪", label: "A church sign with an accidental double meaning", who: "adult", points: 2 },
  { icon: "assets/icons/scavenger/25.png", id: "cabin-name",      emoji: "🏚️", label: "The most unhinged cabin name on the strip",   who: "adult", points: 1 },
  { icon: "assets/icons/scavenger/26.png", id: "cursed-koozie",   emoji: "👕", label: "A koozie or shirt with a cursed slogan",       who: "adult", points: 1 },
  { icon: "assets/icons/scavenger/27.png", id: "zero-bars",       emoji: "📵", label: "Your phone at zero bars — find the void",      who: "adult", points: 1 },
  { icon: "assets/icons/scavenger/28.png", id: "bathhouse-sign",  emoji: "🛁", label: "A 1900s bathhouse sign on Bathhouse Row",      who: "adult", points: 2 },
  { icon: "assets/icons/scavenger/29.png", id: "steel-magnolias", emoji: "🎬", label: "A \"Steel Magnolias\" filming spot in Natchitoches", who: "adult", points: 3 },
  { icon: "assets/icons/scavenger/30.png", id: "mississippi-barge",emoji:"🚢", label: "A barge on the Mississippi at Natchez",        who: "adult", points: 1 },
  { icon: "assets/icons/scavenger/31.png", id: "repropose-sunset",emoji: "🌅", label: "A sunset worth re-proposing over",            who: "adult", points: 1 },
  { icon: "assets/icons/scavenger/32.png", id: "fort-rosalie",    emoji: "⚜️", label: "The Fort Rosalie marker — your Mayeux ancestor's site", who: "adult", points: 2 }
];

/* Home origin for the license-plate distance ranking (Prairieville, LA). */
const SCAVENGER_HOME = { name: "Broken Bow, OK", lat: 34.0287, lng: -94.7385 };

/* US states + DC with rough center coords — drives the plate picker and the
   "farthest plate from home" ranking. `code` = the plate abbreviation. */
const US_STATES = [
  { code: "AL", name: "Alabama",        lat: 32.377716,  lng: -86.300568 },  // Montgomery
  { code: "AK", name: "Alaska",         lat: 58.301598,  lng: -134.420212 }, // Juneau
  { code: "AZ", name: "Arizona",        lat: 33.448143,  lng: -112.096962 }, // Phoenix
  { code: "AR", name: "Arkansas",       lat: 34.746613,  lng: -92.288986 },  // Little Rock
  { code: "CA", name: "California",     lat: 38.576668,  lng: -121.493629 }, // Sacramento
  { code: "CO", name: "Colorado",       lat: 39.739227,  lng: -104.984856 }, // Denver
  { code: "CT", name: "Connecticut",    lat: 41.764046,  lng: -72.682198 },  // Hartford
  { code: "DE", name: "Delaware",       lat: 39.157307,  lng: -75.519722 },  // Dover
  { code: "DC", name: "Washington DC",  lat: 38.907192,  lng: -77.036873 },  // Washington
  { code: "FL", name: "Florida",        lat: 30.438118,  lng: -84.281296 },  // Tallahassee
  { code: "GA", name: "Georgia",        lat: 33.749027,  lng: -84.388229 },  // Atlanta
  { code: "HI", name: "Hawaii",         lat: 21.307442,  lng: -157.857376 }, // Honolulu
  { code: "ID", name: "Idaho",          lat: 43.617775,  lng: -116.199722 }, // Boise
  { code: "IL", name: "Illinois",       lat: 39.798363,  lng: -89.654961 },  // Springfield
  { code: "IN", name: "Indiana",        lat: 39.768623,  lng: -86.162643 },  // Indianapolis
  { code: "IA", name: "Iowa",           lat: 41.591087,  lng: -93.603729 },  // Des Moines
  { code: "KS", name: "Kansas",         lat: 39.048191,  lng: -95.677956 },  // Topeka
  { code: "KY", name: "Kentucky",       lat: 38.197273,  lng: -84.863577 },  // Frankfort
  { code: "LA", name: "Louisiana",      lat: 30.457069,  lng: -91.187393 },  // Baton Rouge
  { code: "ME", name: "Maine",          lat: 44.307167,  lng: -69.781693 },  // Augusta
  { code: "MD", name: "Maryland",       lat: 38.978764,  lng: -76.490936 },  // Annapolis
  { code: "MA", name: "Massachusetts",  lat: 42.358162,  lng: -71.063698 },  // Boston
  { code: "MI", name: "Michigan",       lat: 42.733635,  lng: -84.555328 },  // Lansing
  { code: "MN", name: "Minnesota",      lat: 44.955097,  lng: -93.102211 },  // Saint Paul
  { code: "MS", name: "Mississippi",    lat: 32.303848,  lng: -90.182106 },  // Jackson
  { code: "MO", name: "Missouri",       lat: 38.579201,  lng: -92.172935 },  // Jefferson City
  { code: "MT", name: "Montana",        lat: 46.585709,  lng: -112.018417 }, // Helena
  { code: "NE", name: "Nebraska",       lat: 40.808075,  lng: -96.699654 },  // Lincoln
  { code: "NV", name: "Nevada",         lat: 39.163914,  lng: -119.766121 }, // Carson City
  { code: "NH", name: "New Hampshire",  lat: 43.206898,  lng: -71.537994 },  // Concord
  { code: "NJ", name: "New Jersey",     lat: 40.220596,  lng: -74.769913 },  // Trenton
  { code: "NM", name: "New Mexico",     lat: 35.682240,  lng: -105.939728 }, // Santa Fe
  { code: "NY", name: "New York",       lat: 42.652579,  lng: -73.756233 },  // Albany
  { code: "NC", name: "North Carolina", lat: 35.780430,  lng: -78.639099 },  // Raleigh
  { code: "ND", name: "North Dakota",   lat: 46.820850,  lng: -100.783318 }, // Bismarck
  { code: "OH", name: "Ohio",           lat: 39.961346,  lng: -82.999069 },  // Columbus
  { code: "OK", name: "Oklahoma",       lat: 35.492207,  lng: -97.503342 },  // Oklahoma City
  { code: "OR", name: "Oregon",         lat: 44.938461,  lng: -123.030403 }, // Salem
  { code: "PA", name: "Pennsylvania",   lat: 40.264378,  lng: -76.883598 },  // Harrisburg
  { code: "RI", name: "Rhode Island",   lat: 41.830914,  lng: -71.414963 },  // Providence
  { code: "SC", name: "South Carolina", lat: 34.000343,  lng: -81.033211 },  // Columbia
  { code: "SD", name: "South Dakota",   lat: 44.367031,  lng: -100.346405 }, // Pierre
  { code: "TN", name: "Tennessee",      lat: 36.165890,  lng: -86.784443 },  // Nashville
  { code: "TX", name: "Texas",          lat: 30.274670,  lng: -97.740349 },  // Austin
  { code: "UT", name: "Utah",           lat: 40.777477,  lng: -111.888237 }, // Salt Lake City
  { code: "VT", name: "Vermont",        lat: 44.262436,  lng: -72.580536 },  // Montpelier
  { code: "VA", name: "Virginia",       lat: 37.538857,  lng: -77.433640 },  // Richmond
  { code: "WA", name: "Washington",     lat: 47.035805,  lng: -122.905014 }, // Olympia
  { code: "WV", name: "West Virginia",  lat: 38.336246,  lng: -81.612328 },  // Charleston
  { code: "WI", name: "Wisconsin",      lat: 43.074684,  lng: -89.384445 },  // Madison
  { code: "WY", name: "Wyoming",        lat: 41.140259,  lng: -104.820236 }  // Cheyenne
];

/* ============================================================================
   PACKING CHECKLIST — defaults; checked state lives in localStorage.
   ========================================================================== */
const PACKING = [
  { group: "Pool & water", items: ["Swimsuits (x5)", "Towels", "Goggles", "Toddler floaties — Siena", "Sunscreen", "Water shoes"] },
  { group: "Outdoors", items: ["Bug spray", "Hats", "Hiking/closed-toe shoes", "Refillable water bottles", "Stroller / carrier", "Umbrella (Crater of Diamonds!)"] },
  { group: "Cabin & grill", items: ["Charcoal + lighter", "Coffee + filters", "Trash bags", "Dish soap", "Ice chest / cooler"] },
  { group: "Kids", items: ["Diapers / wipes — Siena", "Snacks", "Tablets + chargers", "Favorite stuffies", "Night light"] },
  { group: "Don't forget", items: ["Phone chargers", "SCREENSHOT maps — no cell service!", "Crater of Diamonds tools", "Cash for fees", "First-aid kit"] }
];

/* ============================================================================
   CABIN KITCHEN (Cluster B) — 2 dinners + 2 breakfasts, all OPTIONAL.
   Toggle a meal off and its ingredients drop out of the consolidated grocery
   list below. Everything is grill-leaning + kid-friendly.

   Each ingredient: { item, qty, cat, store? }
     cat   = grocery aisle for grouping ("Meat", "Produce", "Dairy & eggs",
             "Bread & bakery", "Pantry"). Shared items across meals merge in
             the rollup (qtys combined).
     store = override default store. Default is Pruett's (the stock-up run).
   ========================================================================== */
const CABIN_KITCHEN = {
  intro: "Four easy, grill-leaning meals — all optional. Toggle off anything you won't cook and its ingredients drop off the grocery list. Everything but the ribeyes comes from Pruett's on the way in; grab the steaks at Mountain Man Meat Market.",
  defaultStore: "Pruett's Food",
  meals: [
    {
      id: "dinner-ribeyes",
      slot: "Dinner",
      name: "Grilled Ribeyes",
      grill: true,
      serves: "Family of 5 (small kid plates)",
      blurb: "The splurge dinner. Steaks from Mountain Man Meat Market, foil potatoes and corn straight on the firepit grill.",
      steps: [
        "Pull steaks out 30–40 min before cooking; salt both sides.",
        "Grill ribeyes hot ~4–5 min/side for medium; rest 5 min under foil with a pat of butter.",
        "Wrap potatoes in foil with butter + salt; grill ~40 min, turning. Corn in husk ~15 min.",
        "Toss a quick bagged salad while the steaks rest."
      ],
      ingredients: [
        { item: "Ribeye steaks", qty: "4 large", cat: "Meat", store: "Mountain Man Meat Market" },
        { item: "Butter", qty: "1 stick", cat: "Dairy & eggs" },
        { item: "Russet potatoes", qty: "6", cat: "Produce" },
        { item: "Corn on the cob", qty: "5 ears", cat: "Produce" },
        { item: "Bagged salad kit", qty: "1", cat: "Produce" },
        { item: "Salt & pepper", qty: "to taste", cat: "Pantry" },
        { item: "Garlic powder", qty: "1 jar", cat: "Pantry" },
        { item: "Aluminum foil", qty: "1 roll", cat: "Pantry" }
      ]
    },
    {
      id: "dinner-burgers",
      slot: "Dinner",
      name: "Burgers + Dogs",
      grill: true,
      serves: "Family of 5",
      blurb: "Easy crowd-pleaser. Burgers for the grown-ups and big kids, hot dogs for the littles — all off the grill.",
      steps: [
        "Form patties (or use pre-made); season with salt, pepper, garlic powder.",
        "Grill burgers ~4 min/side; add cheese in the last minute. Grill dogs ~6–8 min, turning.",
        "Toast buns on the grill edge for a minute.",
        "Set out lettuce, tomato, onion, pickles + condiments. Chips on the side."
      ],
      ingredients: [
        { item: "Ground beef (or patties)", qty: "2 lb", cat: "Meat", store: "Mountain Man Meat Market" },
        { item: "Hot dogs", qty: "1 pack", cat: "Meat" },
        { item: "Hamburger buns", qty: "1 pack", cat: "Bread & bakery" },
        { item: "Hot dog buns", qty: "1 pack", cat: "Bread & bakery" },
        { item: "American cheese slices", qty: "1 pack", cat: "Dairy & eggs" },
        { item: "Lettuce", qty: "1 head", cat: "Produce" },
        { item: "Tomato", qty: "2", cat: "Produce" },
        { item: "Onion", qty: "1", cat: "Produce" },
        { item: "Pickles", qty: "1 jar", cat: "Pantry" },
        { item: "Ketchup / mustard / mayo", qty: "1 ea", cat: "Pantry" },
        { item: "Chips", qty: "2 bags", cat: "Pantry" },
        { item: "Salt & pepper", qty: "to taste", cat: "Pantry" },
        { item: "Garlic powder", qty: "1 jar", cat: "Pantry" }
      ]
    },
    {
      id: "breakfast-biscuits",
      slot: "Breakfast",
      name: "Biscuits & Gravy",
      grill: false,
      serves: "Family of 5",
      blurb: "The big one. Jimmy Dean sausage white gravy over biscuits, with scrambled eggs on the side.",
      steps: [
        "Bake biscuits per the package.",
        "Brown the Jimmy Dean sausage in a skillet; leave the drippings.",
        "Sprinkle in flour, stir 1 min, then whisk in milk; simmer to thicken. Salt & lots of pepper.",
        "Scramble the eggs in butter. Spoon gravy over split biscuits."
      ],
      ingredients: [
        { item: "Jimmy Dean sausage roll", qty: "1 lb", cat: "Meat" },
        { item: "Canned/frozen biscuits", qty: "2 cans", cat: "Bread & bakery" },
        { item: "Eggs", qty: "1 dozen", cat: "Dairy & eggs" },
        { item: "Milk", qty: "1/2 gal", cat: "Dairy & eggs" },
        { item: "Butter", qty: "1 stick", cat: "Dairy & eggs" },
        { item: "All-purpose flour", qty: "1 bag", cat: "Pantry" },
        { item: "Salt & pepper", qty: "to taste", cat: "Pantry" }
      ]
    },
    {
      id: "breakfast-pancakes",
      slot: "Breakfast",
      name: "Pancakes + Bacon",
      grill: false,
      serves: "Family of 5",
      blurb: "The easy morning. Pancakes off a griddle/skillet, crispy bacon, syrup. Kids love it.",
      steps: [
        "Mix pancake batter per the box.",
        "Cook bacon first; reserve a little fat for flavor if you like.",
        "Griddle pancakes until bubbles set, flip once.",
        "Serve with butter + syrup."
      ],
      ingredients: [
        { item: "Bacon", qty: "1 pack", cat: "Meat" },
        { item: "Pancake mix", qty: "1 box", cat: "Pantry" },
        { item: "Maple syrup", qty: "1 bottle", cat: "Pantry" },
        { item: "Butter", qty: "1 stick", cat: "Dairy & eggs" },
        { item: "Eggs", qty: "1 dozen", cat: "Dairy & eggs" },
        { item: "Milk", qty: "1/2 gal", cat: "Dairy & eggs" }
      ]
    }
  ]
};

/* ============================================================================
   RESOURCES — maps, guides & PDFs to link out to. Add new finds here.
   Shape: { title, note, url, kind }  — `kind` is a short pill label.
   These open external pages, so the app reminds you to save/screenshot them
   before you lose signal at the cabin or on the trails.
   ========================================================================== */
const RESOURCES = [
  {
    title: "Beavers Bend State Park — Park Map",
    note: "Trails, cabins, the swim beach, Nature Center & Forest Heritage Center, all on one sheet.",
    url: "https://d1pk12b7bb81je.cloudfront.net/okdataengine/appmedia/documents/6/6466/2023%20Beavers%20Bend%20State%20Park%20Map.pdf",
    kind: "Map · PDF"
  }
];
