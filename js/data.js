/* ============================================================================
   data.js — ALL trip content for the Broken Bow 2026 PWA.
   EDIT TRIP FACTS HERE. Logic lives in app.js, styling in css/style.css.

   Conventions
   -----------
   • Coordinates verified via Google Places (Leg 3 confirmed this session).
   • Times are local Central (CDT in June = UTC-05:00).
   • hours = { default:{open,close}, overrides:{ "0".."6": {open,close} | null }, ... }
       - Day keys are JS getDay(): 0=Sun … 6=Sat.
       - A day present in `overrides` with value null  => CLOSED that day.
       - A day present with an {open,close}            => those hours.
       - A day absent from `overrides`                 => use `default`.
       - alwaysOpen:true overrides everything (24h).
       - "open now" is BEST-EFFORT. callAhead:true = verify before driving.
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
    address: null, // TODO: exact street address — drop the booking link and I'll wire it in
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

/* Open-Meteo location (keyless). Hochatown / Beavers Bend. */
const WEATHER = { lat: 34.1657, lng: -94.7572, label: "Hochatown, OK" };

/* ============================================================================
   ACTIVITIES — anchors + swappable menu.
   defaultDay = anchor date (drives Today view); null = menu-only.
   votable = appears in the per-person voting tally.
   ========================================================================== */
const ACTIVITIES = [
  {
    id: "beavers-bend-state-park",
    name: "Beavers Bend State Park & Nature Center",
    category: "Outdoors",
    lat: 34.1326751, lng: -94.6803052,
    blurb: "Swim beach, paddle boats (warm season) and easy flat trails along the Mountain Fork. The all-purpose anchor day.",
    notes: "Park is 24h; Nature Center 8–5. NO cell service — screenshot maps before you go.",
    hours: { alwaysOpen: true, label: "Park 24h · Center 8–5", default: { open: "08:00", close: "17:00" } },
    tags: ["swim", "trails", "river", "kids"],
    votable: true, defaultDay: "2026-06-08"
  },
  {
    id: "safari-park",
    name: "Beavers Bend Safari Park",
    category: "Animals",
    lat: 34.1566453, lng: -94.7434015,
    blurb: "Drive-through 1.8-mi loop — feed exotic animals from your own car.",
    notes: "Drive your OWN vehicle (Armada is ideal). Per-PERSON pricing + fees; buy tickets & waivers online.",
    hours: { default: { open: "09:30", close: "17:00" }, label: "9:30–5", callAhead: true },
    tags: ["animals", "drive-thru", "kids"],
    votable: true, defaultDay: "2026-06-09"
  },
  {
    id: "the-maze",
    name: "The Maze of Hochatown",
    category: "Play",
    lat: 34.1884224, lng: -94.7774421,
    blurb: "Outdoor wooden maze. Same complex as Chili Dippers — pair them.",
    notes: "Porta-potties only. No animals, no amusement park (per Aaron).",
    hours: { default: { open: "10:00", close: "16:00" }, overrides: { "5": { open: "10:00", close: "18:00" }, "6": { open: "10:00", close: "18:00" } }, label: "10–4 (Fri/Sat to 6)" },
    tags: ["maze", "outdoor", "kids"],
    votable: true, defaultDay: "2026-06-10"
  },
  {
    id: "chili-dippers",
    name: "Chili Dippers Golf Club (mini golf)",
    category: "Play",
    lat: 34.1884273, lng: -94.777846,
    blurb: "18-hole mini golf in the Maze complex.",
    notes: "No food or drink sold on-site.",
    hours: { default: { open: "10:00", close: "16:00" }, overrides: { "5": { open: "10:00", close: "18:00" }, "6": { open: "10:00", close: "18:00" } }, label: "10–4 (Fri/Sat to 6)" },
    tags: ["mini-golf", "outdoor", "kids"],
    votable: true, defaultDay: "2026-06-10"
  },

  /* ---- Swappable menu (no default anchor day) ---- */
  {
    id: "depot-train",
    name: "Beavers Bend Depot — Train & Pony Rides",
    category: "Play",
    lat: 34.1353153, lng: -94.7019977,
    blurb: "Miniature train trail ride plus pony rides. Big toddler hit.",
    notes: "Closes early. Pony rides warm-season.",
    hours: { default: { open: "09:00", close: "15:00" }, overrides: { "6": { open: "09:00", close: "17:00" } }, label: "9–3 (Sat to 5)", callAhead: true },
    tags: ["train", "ponies", "kids"],
    votable: true, defaultDay: null
  },
  {
    id: "forest-heritage-center",
    name: "Forest Heritage Center Museum",
    category: "Indoors",
    lat: 34.1326366, lng: -94.6801289,
    blurb: "Free, air-conditioned, wood-carving dioramas + a kids' corner. Great heat/rain backup, inside the state park.",
    notes: "Free admission.",
    hours: { default: { open: "08:00", close: "17:00" }, label: "8–5" },
    tags: ["free", "indoor", "ac", "kids"],
    votable: true, defaultDay: null
  },
  {
    id: "mining-co",
    name: "Beaver's Bend Mining Co",
    category: "Play",
    lat: 34.1520601, lng: -94.7522380,
    blurb: "Sluice for gems + a dino-themed mini golf. Hands-on for the older two.",
    notes: "Buy a mining bucket; gems are guaranteed finds.",
    hours: { default: { open: "09:00", close: "19:00" }, label: "9–7", callAhead: true },
    tags: ["gems", "mini-golf", "kids"],
    votable: true, defaultDay: null
  },
  {
    id: "rescue-petting-zoo",
    name: "Hochatown Rescue Center & Petting Zoo",
    category: "Animals",
    lat: 34.1514877, lng: -94.7514643,
    blurb: "Hands-on animals, toddler-paced, cheap. Easy win for Siena & Melania.",
    notes: "Quick visit; bring small bills.",
    hours: { default: { open: "10:00", close: "19:00" }, label: "10–7", callAhead: true },
    tags: ["animals", "cheap", "kids"],
    votable: true, defaultDay: null
  },
  {
    id: "gutter-chaos",
    name: "Gutter Chaos (bowling & arcade)",
    category: "Indoors",
    lat: 34.1671184, lng: -94.7609058,
    blurb: "Bowling + arcade. The designated rainy-day backup.",
    notes: "CLOSED TUESDAYS.",
    hours: { default: { open: "11:00", close: "22:00" }, overrides: { "2": null, "5": { open: "11:00", close: "23:00" }, "6": { open: "11:00", close: "23:00" } }, label: "11–10 (later Fri/Sat) · closed Tue", callAhead: true },
    tags: ["bowling", "arcade", "indoor", "rainy-day"],
    votable: true, defaultDay: null
  }
];

/* ============================================================================
   RESTAURANTS — hours best-effort; callAhead flags the ones to verify.
   spin:true => eligible for the "Can't decide?" dinner spinner.
   snack:true => quick/casual, kept out of the dinner spinner.
   ========================================================================== */
const RESTAURANTS = [
  {
    id: "abendigos",
    name: "Abendigo's Grill & Patio",
    type: "Steakhouse",
    lat: 34.1629066, lng: -94.7574234,
    notes: "Nicest sit-down dinner. CLOSED Sun & Mon.",
    hours: { default: { open: "16:00", close: "21:00" }, overrides: { "0": null, "1": null }, label: "4–9 · closed Sun/Mon" },
    spin: true
  },
  {
    id: "mountain-fork-brewery",
    name: "Mountain Fork Brewery",
    type: "Pizza / burgers + beer",
    lat: 34.1828663, lng: -94.7772486,
    notes: "Kid play area, good value. Family-friendly pick.",
    hours: { default: { open: "11:00", close: "21:00" }, label: "≈11–9", callAhead: true },
    spin: true
  },
  {
    id: "grateful-head",
    name: "Grateful Head Pizza",
    type: "Pizza",
    lat: 34.1649127, lng: -94.7603006,
    notes: "Long waits — call ahead for takeout.",
    hours: { default: { open: "11:00", close: "21:00" }, label: "≈11–9", callAhead: true },
    spin: true
  },
  {
    id: "naamans-bbq",
    name: "Naaman's BBQ",
    type: "BBQ",
    lat: 34.1748721, lng: -94.7693318,
    notes: "Brisket; spacious. Can sell out — go earlier.",
    hours: { default: { open: "11:00", close: "20:00" }, label: "≈11–8", callAhead: true },
    spin: true
  },
  {
    id: "buffalo-grill",
    name: "Buffalo Grill",
    type: "BBQ / Tex-Mex",
    lat: 34.1115530, lng: -94.7386914,
    notes: "Kid toys. CLOSED Tue.",
    hours: { default: { open: "11:00", close: "21:00" }, overrides: { "2": null }, label: "≈11–9 · closed Tue", callAhead: true },
    spin: true
  },
  {
    id: "lake-bums",
    name: "Lake Bums Grill",
    type: "Cheesesteaks / burgers",
    lat: 34.1656872, lng: -94.7554037,
    notes: "Eat inside old buses + playground. Closes early.",
    hours: { default: { open: "11:00", close: "19:00" }, label: "≈11–7", callAhead: true },
    spin: true
  },
  {
    id: "hochahut",
    name: "The Hochahut",
    type: "Corn dogs / snacks",
    lat: 34.1524832, lng: -94.7509814,
    notes: "Cheap, casual, outdoor. Snack stop.",
    hours: { default: { open: "11:00", close: "20:00" }, label: "≈11–8", callAhead: true },
    snack: true, spin: false
  },
  {
    id: "hochatown-saloon",
    name: "Hochatown Saloon",
    type: "Bar & grill",
    lat: 34.1502230, lng: -94.7495740,
    notes: "Live music, busy. Adult-leaning vibe.",
    hours: { default: { open: "11:00", close: "23:00" }, label: "≈11–11", callAhead: true },
    spin: true
  },
  {
    id: "shuck-me",
    name: "Shuck Me",
    type: "Seafood / Cajun",
    lat: 34.1830356, lng: -94.7766387,
    notes: "Mixed reviews — set expectations.",
    hours: { default: { open: "11:00", close: "21:00" }, label: "≈11–9", callAhead: true },
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
    notes: "STOCK UP HERE ON THE WAY IN — it's on the route, ~5 min from the cabin.",
    hours: { default: { open: "07:00", close: "22:00" }, label: "7am–10pm daily" }
  },
  {
    id: "local-259",
    name: "The Market at Local 259 (Hochatown)",
    type: "Gourmet / last-minute",
    lat: 34.1900973, lng: -94.7787097,
    notes: "Pricier; coffee bar. Good for forgotten items.",
    hours: { default: { open: "08:00", close: "20:00" }, label: "≈8–8", callAhead: true }
  },
  {
    id: "mountain-man-meat",
    name: "Mountain Man Meat Market",
    type: "Steaks / sausage",
    lat: 34.0931725, lng: -94.7398408,
    notes: "Cabin grill-out supply. In-cabin chef option (Chef Phil).",
    hours: { default: { open: "09:00", close: "18:00" }, label: "≈9–6", callAhead: true }
  }
];

/* ============================================================================
   LEG 1 — drive up (Sun June 7)
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
    { name: "Pruett's Food — final grocery", when: "~2:45 PM", note: "Stock the cabin on the way in (open 7am–10pm).", lat: 34.0250000, lng: -94.7380556 }
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
   LEG 3 — scenic way home (June 11–13). Coords verified via Google Places.
   ========================================================================== */
const LEG3_STOPS = [
  {
    id: "crater-of-diamonds",
    name: "Crater of Diamonds State Park",
    lat: 34.0324674, lng: -93.6751298,
    blurb: "Dig the only public diamond field in the world — keep what you find.",
    notes: "Open 8–5 daily. ~$15/person. Hot & shadeless — bring umbrella, cooler, water. Rent or bring sifters.",
    region: "Murfreesboro, AR"
  },
  {
    id: "hot-springs",
    name: "Hot Springs National Park — Bathhouse Row",
    lat: 34.5137118, lng: -93.0534724,
    blurb: "Historic Fordyce Bathhouse + Bathhouse Row promenade. Free ranger tours.",
    notes: "Visitor center 9–5 daily, free. Overnight here (6/11).",
    region: "Hot Springs, AR"
  },
  {
    id: "natchitoches",
    name: "Natchitoches Historic District (Front St)",
    lat: 31.7607, lng: -93.0866,
    blurb: "Brick-paved Front Street along the Cane River. Famous meat pies. Overnight here (6/12).",
    notes: "Oldest town in the Louisiana Purchase. Pin targets downtown Front St (not the plantation units S of town).",
    region: "Natchitoches, LA"
  },
  {
    id: "fort-rosalie",
    name: "Fort Rosalie (Natchez NHP)",
    lat: 31.55691, lng: -91.4101249,
    blurb: "NPS green space + Mississippi River overlook. The personal-history beat — see FORT_ROSALIE.",
    notes: "Dawn–dusk, free. ~20–30 min picnic stop. ~2 hr home from here.",
    region: "Natchez, MS"
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
  hours: "Dawn–dusk · free",
  body: "Aaron descends from Pierre Mayeux. Fort Rosalie, in Natchez, MS, was founded August 3, 1716 by Bienville and was the site of the 1729 Natchez Massacre. It's the trip's one personal-history beat — a green NPS overlook above the Mississippi, worth a short picnic stop on the way home.",
  footnote: "The New France / Louisiana book is Aaron's dad's project; Aaron did research for it."
};

/* ============================================================================
   KIDS' SCAVENGER HUNT — checked state lives in localStorage (by index).
   ========================================================================== */
const SCAVENGER_HUNT = [
  "Spot a deer",
  "Find a pinecone",
  "Ride or see a paddle boat",
  "Touch a tree taller than Dad",
  "Feed an animal at the Safari Park",
  "Spot a fish in the river",
  "See a real campfire",
  "Find a heart-shaped rock",
  "Hear a bird singing",
  "Roast a marshmallow",
  "Dig with a diamond tool",
  "See the Mississippi River"
];

/* ============================================================================
   PACKING CHECKLIST — defaults; checked state lives in localStorage.
   ========================================================================== */
const PACKING = [
  { group: "Pool & water", items: ["Swimsuits (x5)", "Towels", "Goggles", "Toddler floaties — Siena", "Sunscreen", "Water shoes"] },
  { group: "Outdoors", items: ["Bug spray", "Hats", "Hiking/closed-toe shoes", "Refillable water bottles", "Stroller / carrier", "Umbrella (Crater of Diamonds!)"] },
  { group: "Cabin & grill", items: ["Charcoal + lighter", "Coffee + filters", "Trash bags", "Dish soap", "Cooler"] },
  { group: "Kids", items: ["Diapers / wipes — Siena", "Snacks", "Tablets + chargers", "Favorite stuffies", "Night light"] },
  { group: "Don't forget", items: ["Phone chargers", "SCREENSHOT maps — no cell service!", "Crater of Diamonds tools", "Cash for fees", "First-aid kit"] }
];
