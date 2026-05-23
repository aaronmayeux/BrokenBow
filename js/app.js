/* ============================================================================
   app.js — the "brains". Reads the globals from data.js and fills the page,
   then powers the live features. Vanilla JS, no dependencies.
   Loaded AFTER data.js (see index.html). Each section is wrapped in a
   try/catch so one failure can never blank the whole page.
   ========================================================================== */

(function () {
  "use strict";

  /* ----- lookups ----- */
  var ACT_BY_ID  = {}; ACTIVITIES.forEach(function (a) { ACT_BY_ID[a.id] = a; });
  var LEG3_BY_ID = {}; LEG3_STOPS.forEach(function (s) { LEG3_BY_ID[s.id] = s; });
  var WDAY = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  var LAST_DAY = "2026-06-13"; // last day home (scenic leg)

  /* ----- helpers ----- */
  function $(id) { return document.getElementById(id); }
  function esc(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }

  // Current time in Hochatown (America/Chicago), order-independent.
  function nowChicago() {
    var p = new Intl.DateTimeFormat("en-US", {
      timeZone: "America/Chicago", year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit", hour12: false, weekday: "short"
    }).formatToParts(new Date());
    var o = {}; p.forEach(function (x) { o[x.type] = x.value; });
    var hh = parseInt(o.hour, 10); if (hh === 24) hh = 0;
    return {
      date: o.year + "-" + o.month + "-" + o.day,
      dow: WDAY.indexOf(o.weekday),
      minutes: hh * 60 + parseInt(o.minute, 10),
      hh: hh
    };
  }

  function parseHHMM(s) { var a = s.split(":"); return (+a[0]) * 60 + (+a[1]); }

  // Best-effort "open now" from the hours schema in data.js.
  function openInfo(hours) {
    if (!hours) return { state: "unknown", label: "" };
    if (hours.alwaysOpen) return { state: "open", label: "Open 24h" };
    var c = nowChicago();
    var spec = hours.default;
    if (hours.overrides && Object.prototype.hasOwnProperty.call(hours.overrides, String(c.dow))) {
      spec = hours.overrides[String(c.dow)];
    }
    if (spec == null) return { state: "closed", label: "Closed today" };
    var open = c.minutes >= parseHHMM(spec.open) && c.minutes < parseHHMM(spec.close);
    return { state: open ? "open" : "closed", label: open ? "Open now" : "Closed now" };
  }

  /* ----- Google Maps links -------------------------------------------------
     Locked decision (#26):
       • travelDay items (drive-up stops, scenic-home stops, cabin) → DIRECTIONS
       • everything else (activities, restaurants, provisions)      → place LISTING
     query_place_id lands on the exact business card when we have a real ID. */
  function mapsPlaceUrl(p) {
    var base = "https://www.google.com/maps/search/?api=1&query=";
    if (p.placeId) return base + encodeURIComponent(p.name) + "&query_place_id=" + p.placeId;
    return base + encodeURIComponent(p.name + " " + p.lat + "," + p.lng);
  }
  function mapsDirUrl(p) {
    var u = "https://www.google.com/maps/dir/?api=1&destination=" + p.lat + "," + p.lng;
    if (p.placeId) u += "&destination_place_id=" + p.placeId;
    return u;
  }
  // Returns { url, label } honoring the travel-day split.
  function mapsLink(p) {
    return p.travelDay
      ? { url: mapsDirUrl(p),   label: "Directions ↗" }
      : { url: mapsPlaceUrl(p), label: "View on Maps ↗" };
  }
  function mapsAnchor(p, cls) {
    var m = mapsLink(p);
    return '<a class="dir' + (cls ? " " + cls : "") + '" href="' + m.url +
      '" target="_blank" rel="noopener">' + m.label + "</a>";
  }

  /* ----- pill / chip builders ----- */
  function catClass(category) {
    return "cat-" + String(category || "").toLowerCase().replace(/[^a-z]/g, "");
  }

  // Open / closed / hours / call-ahead pills.
  function hoursTags(hours) {
    if (!hours) return "";
    var info = openInfo(hours);
    var cls = info.state === "open" ? "tag open" : info.state === "closed" ? "tag closed" : "tag";
    var h = info.label ? '<span class="' + cls + '">' + info.label + "</span>" : "";
    if (hours.label) h += '<span class="tag hours">' + esc(hours.label) + "</span>";
    if (hours.callAhead) h += '<span class="tag call">call ahead</span>';
    return h;
  }

  // Action flags (open vocabulary).
  function flagTags(p) {
    if (!p.flags || !p.flags.length) return "";
    return p.flags.map(function (f) { return '<span class="tag flag">' + esc(f) + "</span>"; }).join("");
  }

  // Price tier pill ($/$$/$$$).
  function priceTag(p) {
    return p.priceTier ? '<span class="tag price">' + p.priceTier + "</span>" : "";
  }

  // Rating: single star + value + review count, with honest "as of" tooltip.
  function ratingHtml(p) {
    if (p.rating == null) return "";
    var cnt = p.ratingCount ? ' <span class="rcount">(' + p.ratingCount.toLocaleString() + ")</span>" : "";
    return '<span class="rating" title="Google rating · as of ' + RATINGS_AS_OF + ' · tap the Maps link for live">' +
      '<span class="star">★</span>' + p.rating.toFixed(1) + cnt + "</span>";
  }

  // Real $ detail line (only where we know it).
  function priceDetailHtml(p) {
    if (!p.priceDetail) return "";
    return '<p class="price-detail">' + (p.priceTier ? p.priceTier + " · " : "") + esc(p.priceDetail) + "</p>";
  }

  // "Pick this if you feel like…" recommendation line.
  function pickIfHtml(p) {
    if (!p.pickIf) return "";
    return '<p class="pickif">' + esc(p.pickIf) + "</p>";
  }

  function md(date) { return parseInt(date.slice(5, 7), 10) + "/" + parseInt(date.slice(8, 10), 10); }
  function dayLabel(date) {
    var d = STAY_DAYS.concat(SCENIC_HOME).filter(function (x) { return x.date === date; })[0];
    return d ? d.dow + " " + md(date) : md(date);
  }

  /* ----- localStorage (votes + checklists) ----- */
  function load(key) { try { return JSON.parse(localStorage.getItem(key)) || {}; } catch (e) { return {}; } }
  function save(key, o) { try { localStorage.setItem(key, JSON.stringify(o)); } catch (e) {} }
  var VKEY = "bb_votes_v1", PKEY = "bb_packing_v1", SKEY = "bb_scavenger_v1", TKEY = "bb_theme", KKEY = "bb_kitchen_v1";

  /* voters = family minus the 1-yr-old → Aaron, Lucia, Zelphia, Melania */
  var VOTERS = TRIP.family.filter(function (f) { return !f.age || f.age >= 4; });
  var activitiesBound = false; // bind the voting click handler only once
  /* every activity id a given person is currently "in" for, from the votes map */
  function picksFor(name, v) { var out = []; for (var id in v) { if (v[id] && v[id].indexOf(name) >= 0) out.push(id); } return out; }
  function pushPersonVotes(name, v) { if (window.BBSync) BBSync.pushVotes(name.toLowerCase(), name, picksFor(name, v)); }

  /* =========================================================================
     RENDERERS
     ======================================================================= */

  function renderHero() {
    $("roster").textContent = TRIP.family.map(function (f) { return f.name; }).join("  ·  ");
    $("tagline").textContent = TRIP.tagline;
    var b = $("banner"); if (b && typeof BANNER === "string") b.textContent = BANNER;
  }

  /* --- live countdown (to departure → check-in → checkout) --- */
  function tickCountdown() {
    var now = Date.now();
    var dep = new Date(TRIP.departure).getTime();
    var ci = new Date(TRIP.lodging.checkIn).getTime();
    var co = new Date(TRIP.lodging.checkOut).getTime();
    var box = $("countdown"), cap = $("cd-caption");
    var target, caption;
    if (now < dep)      { target = dep; caption = "until we hit the road"; }
    else if (now < ci)  { target = ci;  caption = "until cabin check-in"; }
    else if (now < co)  { target = co;  caption = "left at the cabin — soak it up"; }
    else                { box.style.display = "none"; cap.textContent = "Hope it was a great one."; return; }

    var s = Math.max(0, Math.floor((target - now) / 1000));
    var d = Math.floor(s / 86400); s -= d * 86400;
    var h = Math.floor(s / 3600);  s -= h * 3600;
    var m = Math.floor(s / 60);    s -= m * 60;
    var cells = [["cd-d", d], ["cd-h", h], ["cd-m", m], ["cd-s", s]];
    cells.forEach(function (c) { var el = $(c[0]); if (el) el.textContent = c[1]; });
    cap.textContent = caption;
  }

  /* --- auto "today" view --- */
  function renderToday() {
    var today = nowChicago().date;
    var all = STAY_DAYS.concat(SCENIC_HOME);
    var day = all.filter(function (d) { return d.date === today; })[0];
    var html;
    if (day) {
      var anchors = [day.anchor, day.anchor2].filter(Boolean).map(function (id) {
        var a = ACT_BY_ID[id]; if (!a) return "";
        return '<a class="dir" href="' + mapsPlaceUrl(a) + '" target="_blank" rel="noopener">' + esc(a.name) + " ↗</a>";
      }).join("<br>");
      html = '<div class="card"><div class="card-head"><h3>Today · ' + day.dow + " " + md(day.date) +
        '</h3></div><p class="blurb"><strong>' + esc(day.title) + "</strong></p><p class=\"notes\">" + esc(day.notes) + "</p>" +
        (anchors ? '<p style="margin-top:8px">' + anchors + "</p>" : "") + "</div>";
    } else if (today < TRIP.dates.start) {
      var first = STAY_DAYS[0];
      html = '<div class="card"><h3>Not there yet — but soon!</h3><p class="blurb">First up: <strong>' +
        esc(first.title) + "</strong> on " + first.dow + " " + md(first.date) + ".</p><p class=\"notes\">" + esc(first.notes) + "</p></div>";
    } else {
      html = '<div class="card"><h3>Trip complete</h3><p class="blurb">Hope Broken Bow was everything. ' +
        "Time to plan the next one.</p></div>";
    }
    $("today").innerHTML = html;
  }

  /* --- weather (Open-Meteo, keyless; degrades offline) --- */
  var WMO = {
    0: "Clear", 1: "Mostly clear", 2: "Partly cloudy", 3: "Overcast",
    45: "Fog", 48: "Rime fog", 51: "Light drizzle", 53: "Drizzle", 55: "Heavy drizzle",
    61: "Light rain", 63: "Rain", 65: "Heavy rain", 71: "Light snow", 73: "Snow", 75: "Heavy snow",
    80: "Rain showers", 81: "Rain showers", 82: "Violent showers",
    95: "Thunderstorm", 96: "Storm + hail", 99: "Severe storm"
  };
  function loadWeather() {
    var el = $("weather");
    var url = "https://api.open-meteo.com/v1/forecast?latitude=" + WEATHER.lat +
      "&longitude=" + WEATHER.lng +
      "&current=temperature_2m,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min" +
      "&temperature_unit=fahrenheit&timezone=America%2FChicago&forecast_days=16";
    fetch(url).then(function (r) { return r.json(); }).then(function (j) {
      var now = j.current || {};
      var html = '<div class="wx-now"><span class="wx-temp">' + Math.round(now.temperature_2m) +
        "°</span><span class=\"wx-cond\">" + (WMO[now.weather_code] || "—") + " in " + WEATHER.label + "</span></div>";
      var d = j.daily || {}, days = [];
      if (d.time) {
        for (var i = 0; i < d.time.length; i++) {
          if (d.time[i] >= TRIP.dates.start && d.time[i] <= LAST_DAY) {
            days.push('<div class="wx-day"><div class="d">' + dayLabel(d.time[i]) + '</div><div class="t">' +
              Math.round(d.temperature_2m_max[i]) + "° / " + Math.round(d.temperature_2m_min[i]) + "°</div>" +
              '<div class="muted" style="font-size:12px">' + (WMO[d.weather_code[i]] || "") + "</div></div>");
          }
        }
      }
      if (days.length) html += '<p class="muted" style="margin-top:12px">Your trip days:</p><div class="wx-days">' + days.join("") + "</div>";
      else html += '<p class="muted" style="margin-top:10px">The day-by-day trip forecast appears about two weeks out — this is current conditions.</p>';
      el.innerHTML = html;
    }).catch(function () {
      el.innerHTML = '<p class="muted">Weather needs a connection — it\'ll load when you\'re back online.</p>';
    });
  }

  /* --- drive up (Leg 1) --- */
  function renderDriveUp() {
    var u = DRIVE_UP;
    var chips = u.path.map(function (p) { return "<span>" + esc(p) + "</span>"; }).join("");
    var stops = u.stops.map(function (s) {
      var dir = (s.lat ? " " + mapsAnchor({ name: s.name, lat: s.lat, lng: s.lng, placeId: s.placeId, travelDay: true }, "inline").replace("View on Maps", "Map").replace("Directions ↗", "map ↗") : "");
      return '<div class="tl-item"><div class="tl-when">' + esc(s.when) + " · " + esc(s.name) + dir +
        '</div><div class="tl-note">' + esc(s.note) + "</div></div>";
    }).join("");
    $("drive").innerHTML =
      '<p class="lead">' + esc(u.distanceMi) + " · " + esc(u.driveTime) + ". Suggested departure <strong>" + esc(u.departSuggested) +
      "</strong> to clear the " + esc(u.checkIn) + " check-in with buffer.</p>" +
      '<div class="route-chips">' + chips + "</div>" +
      '<div class="timeline">' + stops +
      '<div class="tl-item"><div class="tl-when">' + esc(u.arrive) + " · Arrive Hochatown</div>" +
      '<div class="tl-note">Check in at ' + esc(u.checkIn) + ". " +
      '<a class="dir" href="' + mapsDirUrl(TRIP.lodging) + '" target="_blank" rel="noopener">cabin directions ↗</a></div></div></div>';
  }

  /* --- the stay (Leg 2) --- */
  function dayCard(d) {
    var anchors = [d.anchor, d.anchor2].filter(Boolean).map(function (id) {
      var a = ACT_BY_ID[id]; if (!a) return "";
      return '<a class="dir" href="' + mapsPlaceUrl(a) + '" target="_blank" rel="noopener">' + esc(a.name) + " ↗</a>";
    }).join("<br>");
    return '<div class="card reveal day ' + (d.type === "travel" ? "travel" : "") + '">' +
      '<div class="day-date"><div class="dow">' + d.dow + '</div><div class="dnum">' + parseInt(d.date.slice(8, 10), 10) + "</div></div>" +
      '<div class="day-body"><h3>' + esc(d.title) + "</h3><p class=\"notes\">" + esc(d.notes) + "</p>" +
      (anchors ? '<p style="margin-top:6px">' + anchors + "</p>" : "") + "</div></div>";
  }
  function renderStay() { $("stay").innerHTML = STAY_DAYS.map(dayCard).join(""); }

  /* --- activities + per-person voting --- */
  function renderActivities() {
    var votes = load(VKEY);
    $("activities").innerHTML = ACTIVITIES.map(function (a) {
      var anchor = a.defaultDay ? '<span class="badge-day">' + dayLabel(a.defaultDay) + " anchor</span>" : "";
      var voters = VOTERS.map(function (f) {
        var on = (votes[a.id] || []).indexOf(f.name) >= 0;
        return '<button class="voter ' + (on ? "on" : "") + '" data-act="' + a.id + '" data-person="' +
          esc(f.name) + '" title="' + esc(f.name) + '">' + esc(f.name.charAt(0)) + "</button>";
      }).join("");
      var n = (votes[a.id] || []).length;
      return '<article class="card act reveal ' + catClass(a.category) + '"><div class="card-head"><h3>' + esc(a.name) + "</h3>" + anchor + "</div>" +
        '<div class="tags"><span class="tag cat ' + catClass(a.category) + '">' + esc(a.category) + "</span>" +
        priceTag(a) + hoursTags(a.hours) + ratingHtml(a) + "</div>" +
        '<div class="tags flags-row">' + flagTags(a) + "</div>" +
        '<p class="blurb">' + esc(a.blurb) + '</p><p class="notes">' + esc(a.notes) + "</p>" +
        priceDetailHtml(a) + pickIfHtml(a) +
        '<div class="vote-row"><span class="vote-label">Who\'s in?</span><div class="voters">' + voters +
        '</div><span class="tally" data-tally="' + a.id + '">' + n + " vote" + (n === 1 ? "" : "s") + "</span></div>" +
        '<a class="dir" href="' + mapsPlaceUrl(a) + '" target="_blank" rel="noopener">View on Maps ↗</a></article>';
    }).join("");

    if (!activitiesBound) {
      activitiesBound = true;
      $("activities").addEventListener("click", function (e) {
        var b = e.target.closest(".voter"); if (!b) return;
        var act = b.dataset.act, person = b.dataset.person, v = load(VKEY);
        v[act] = v[act] || [];
        var i = v[act].indexOf(person);
        if (i >= 0) v[act].splice(i, 1); else v[act].push(person);
        save(VKEY, v);
        b.classList.toggle("on");
        var t = document.querySelector('[data-tally="' + act + '"]');
        if (t) t.textContent = v[act].length + " vote" + (v[act].length === 1 ? "" : "s");
        pushPersonVotes(person, v); // mirror this person's picks to everyone's phone
      });
    }
  }

  /* pull shared votes from Firestore -> rebuild the local votes map -> re-render.
     Safe no-op when Firebase is missing/offline: the app stays fully local. */
  function initSync() {
    if (!window.BBSync) return;
    var voterNames = VOTERS.map(function (f) { return f.name; });
    BBSync.onVotes(function (docs) {
      var v = {};
      docs.forEach(function (d) {
        if (voterNames.indexOf(d.name) < 0) return; // ignore non-voters / stale docs
        (d.picks || []).forEach(function (actId) {
          v[actId] = v[actId] || [];
          if (v[actId].indexOf(d.name) < 0) v[actId].push(d.name);
        });
      });
      save(VKEY, v);
      safe(renderActivities); // delegated listener already bound once -> safe to re-render
    });
  }

  /* --- restaurants (cuisine pills + optional filter) --- */
  function restaurantCard(p) {
    return '<article class="card reveal" data-cuisine="' + esc(p.cuisine) + '"><div class="card-head"><h3>' + esc(p.name) +
      '</h3>' + ratingHtml(p) + "</div>" +
      '<div class="tags"><span class="tag cuisine">' + esc(p.cuisine) + "</span>" + priceTag(p) + hoursTags(p.hours) + "</div>" +
      '<div class="tags flags-row">' + flagTags(p) + "</div>" +
      '<p class="notes" style="margin-top:8px">' + esc(p.notes) + "</p>" +
      priceDetailHtml(p) + pickIfHtml(p) +
      '<a class="dir" href="' + mapsPlaceUrl(p) + '" target="_blank" rel="noopener">View on Maps ↗</a></article>';
  }
  function renderEat() {
    // optional cuisine filter (session-only)
    var cuisines = [];
    RESTAURANTS.forEach(function (r) { if (cuisines.indexOf(r.cuisine) < 0) cuisines.push(r.cuisine); });
    var chips = '<button class="filter-chip on" data-cuisine="all">All</button>' +
      cuisines.map(function (c) { return '<button class="filter-chip" data-cuisine="' + esc(c) + '">' + esc(c) + "</button>"; }).join("");
    $("eat-filter").innerHTML = chips;
    $("eat").innerHTML = RESTAURANTS.map(restaurantCard).join("");

    $("eat-filter").addEventListener("click", function (e) {
      var b = e.target.closest(".filter-chip"); if (!b) return;
      var pick = b.dataset.cuisine;
      $("eat-filter").querySelectorAll(".filter-chip").forEach(function (c) { c.classList.toggle("on", c === b); });
      $("eat").querySelectorAll(".card").forEach(function (card) {
        card.style.display = (pick === "all" || card.dataset.cuisine === pick) ? "" : "none";
      });
    });
  }

  /* --- provisions --- */
  function renderShop() {
    $("shop").innerHTML = PROVISIONS.map(function (p) {
      return '<article class="card reveal"><div class="card-head"><h3>' + esc(p.name) +
        '</h3>' + ratingHtml(p) + "</div>" +
        '<div class="tags"><span class="tag cuisine">' + esc(p.type) + "</span>" + priceTag(p) + hoursTags(p.hours) + "</div>" +
        '<div class="tags flags-row">' + flagTags(p) + "</div>" +
        '<p class="notes" style="margin-top:8px">' + esc(p.notes) + "</p>" +
        priceDetailHtml(p) +
        '<a class="dir" href="' + mapsPlaceUrl(p) + '" target="_blank" rel="noopener">View on Maps ↗</a></article>';
    }).join("");
  }

  /* --- scenic route home (Leg 3) + Fort Rosalie sidebar --- */
  function renderHome() {
    var days = SCENIC_HOME.map(function (d) {
      var stops = d.stops.map(function (id) {
        var s = LEG3_BY_ID[id]; if (!s) return "";
        return '<p class="blurb"><strong>' + esc(s.name) + "</strong> <span class=\"muted\">· " + esc(s.region) +
          "</span>" + (s.rating != null ? " " + ratingHtml(s) : "") + "<br><span class=\"notes\">" + esc(s.blurb) + " " + esc(s.notes) + "</span>" +
          (s.priceDetail ? '<br><span class="price-detail">' + esc(s.priceDetail) + "</span>" : "") +
          '<br>' + mapsAnchor(s) + "</p>";
      }).join("");
      return '<div class="card reveal day"><div class="day-date"><div class="dow">' + d.dow + '</div><div class="dnum">' +
        parseInt(d.date.slice(8, 10), 10) + '</div></div><div class="day-body"><h3>' + esc(d.title) + "</h3>" + stops +
        (d.overnight ? '<p class="overnight">Overnight: ' + esc(d.overnight) + "</p>" : '<p class="overnight">Home sweet home</p>') +
        "</div></div>";
    }).join("");
    var f = FORT_ROSALIE;
    var sidebar = '<div class="sidebar reveal"><h3>' + esc(f.title) + '</h3><p class="blurb">' + esc(f.body) +
      '</p><p class="notes">' + esc(f.hours) + ' · ' + mapsAnchor(f) + "</p><p class=\"footnote\">" + esc(f.footnote) + "</p></div>";
    $("home").innerHTML = days + sidebar;
  }

  /* --- checklists (packing + scavenger) --- */
  function renderPacking() {
    var state = load(PKEY), total = 0, done = 0;
    var html = PACKING.map(function (g) {
      return '<div class="check-group"><h3>' + esc(g.group) + "</h3>" + g.items.map(function (item) {
        var key = g.group + "|" + item, on = !!state[key]; total++; if (on) done++;
        return '<label class="check ' + (on ? "done" : "") + '"><input type="checkbox" data-pk="' + esc(key) +
          '" ' + (on ? "checked" : "") + "><span>" + esc(item) + "</span></label>";
      }).join("") + "</div>";
    }).join("");
    $("packing").innerHTML = '<p class="progress" id="pk-prog">' + done + " / " + total + " packed</p>" + html;
    $("packing").addEventListener("change", function (e) {
      var c = e.target; if (!c.dataset.pk) return;
      var s = load(PKEY);
      if (c.checked) s[c.dataset.pk] = 1; else delete s[c.dataset.pk];
      save(PKEY, s);
      c.closest(".check").classList.toggle("done", c.checked);
      var t = 0, dn = 0;
      document.querySelectorAll('[data-pk]').forEach(function (x) { t++; if (x.checked) dn++; });
      $("pk-prog").textContent = dn + " / " + t + " packed";
    });
  }

  function renderScavenger() {
    var state = load(SKEY), done = 0;
    var html = SCAVENGER_HUNT.map(function (item, i) {
      var on = !!state[i]; if (on) done++;
      return '<label class="check ' + (on ? "done" : "") + '"><input type="checkbox" data-sc="' + i +
        '" ' + (on ? "checked" : "") + "><span>" + esc(item) + "</span></label>";
    }).join("");
    $("scavenger").innerHTML = '<p class="progress" id="sc-prog">' + done + " / " + SCAVENGER_HUNT.length + " found</p>" + html;
    $("scavenger").addEventListener("change", function (e) {
      var c = e.target; if (c.dataset.sc === undefined) return;
      var s = load(SKEY);
      if (c.checked) s[c.dataset.sc] = 1; else delete s[c.dataset.sc];
      save(SKEY, s);
      c.closest(".check").classList.toggle("done", c.checked);
      var dn = 0; document.querySelectorAll('[data-sc]').forEach(function (x) { if (x.checked) dn++; });
      $("sc-prog").textContent = dn + " / " + SCAVENGER_HUNT.length + " found";
      if (dn === SCAVENGER_HUNT.length) confetti();
    });
  }

  /* --- dinner spinner --- */
  function renderSpinner() {
    var pool = RESTAURANTS.filter(function (r) { return r.spin !== false; });
    var btn = $("spinBtn"), out = $("spinResult");
    btn.addEventListener("click", function () {
      var n = 0, max = 16;
      out.classList.add("rolling");
      var iv = setInterval(function () {
        out.textContent = pool[Math.floor(Math.random() * pool.length)].name;
        if (++n >= max) {
          clearInterval(iv);
          var pick = pool[Math.floor(Math.random() * pool.length)];
          out.classList.remove("rolling");
          out.textContent = "Tonight: " + pick.name;
        }
      }, 70);
    });
  }

  /* --- cabin kitchen: optional meals → ONE consolidated grocery list --------
     State (KKEY): "meal|<id>" = 0 means SKIPPED (default = included);
                   "buy|<item>" = 1 means checked off the grocery list.       */
  var GROCERY_ORDER = ["Meat", "Produce", "Dairy & eggs", "Bread & bakery", "Pantry"];

  function mealSkipped(state, id) { return state["meal|" + id] === 0; }

  // Collapse a list of qty strings: identical ones become "qty ×N"; mixed ones join with " + ".
  function qtyLabel(qtys) {
    if (!qtys || !qtys.length) return "";
    var counts = {}, order = [];
    qtys.forEach(function (q) { if (!(q in counts)) order.push(q); counts[q] = (counts[q] || 0) + 1; });
    return order.map(function (q) { return q + (counts[q] > 1 ? " \u00d7" + counts[q] : ""); }).join(" + ");
  }

  function buildGrocery(state) {
    var map = {}; // lower-item -> { item, cat, qtys[], stores[] }
    CABIN_KITCHEN.meals.forEach(function (m) {
      if (mealSkipped(state, m.id)) return;
      m.ingredients.forEach(function (ing) {
        var k = ing.item.toLowerCase();
        if (!map[k]) map[k] = { item: ing.item, cat: ing.cat, qtys: [], stores: [] };
        if (ing.qty && ing.qty !== "to taste") map[k].qtys.push(ing.qty);
        var st = ing.store || CABIN_KITCHEN.defaultStore;
        if (map[k].stores.indexOf(st) < 0) map[k].stores.push(st);
      });
    });
    var byCat = {};
    Object.keys(map).forEach(function (k) {
      var r = map[k]; (byCat[r.cat] = byCat[r.cat] || []).push(r);
    });
    return byCat;
  }

  function drawGrocery() {
    var state = load(KKEY), byCat = buildGrocery(state), total = 0, done = 0, html = "";
    GROCERY_ORDER.forEach(function (cat) {
      var rows = byCat[cat]; if (!rows || !rows.length) return;
      rows.sort(function (a, b) { return a.item.localeCompare(b.item); });
      html += '<div class="check-group"><h3>' + esc(cat) + "</h3>";
      rows.forEach(function (r) {
        var key = "buy|" + r.item, on = !!state[key]; total++; if (on) done++;
        var qty = r.qtys.length ? '<span class="g-qty">' + esc(qtyLabel(r.qtys)) + "</span>" : "";
        var alt = r.stores.filter(function (s) { return s !== CABIN_KITCHEN.defaultStore; });
        var store = alt.length ? '<span class="g-store">' + esc(alt.join(", ")) + "</span>" : "";
        html += '<label class="check ' + (on ? "done" : "") + '"><input type="checkbox" data-buy="' +
          esc(key) + '" ' + (on ? "checked" : "") + "><span>" + esc(r.item) + " " + qty + " " + store + "</span></label>";
      });
      html += "</div>";
    });
    var box = $("kitchen-grocery");
    if (box) box.innerHTML = '<h3 class="grocery-head">Pruett\'s stock-up list</h3>' +
      '<p class="progress" id="kk-prog">' + done + " / " + total + " bought</p>" +
      (total ? html : '<p class="muted">No meals selected — toggle a meal back on above.</p>');
  }

  function renderKitchen() {
    var state = load(KKEY);
    var cards = CABIN_KITCHEN.meals.map(function (m) {
      var skip = mealSkipped(state, m.id);
      var steps = m.steps.map(function (s) { return "<li>" + esc(s) + "</li>"; }).join("");
      var ings = m.ingredients.map(function (ing) { return esc(ing.item); }).join(" · ");
      return '<article class="card meal reveal ' + (skip ? "skipped" : "") + '">' +
        '<div class="card-head"><h3>' + esc(m.name) + "</h3>" +
        '<span class="tag cat ' + (m.slot === "Dinner" ? "cat-rust" : "cat-kraft") + '">' + esc(m.slot) + "</span>" +
        (m.grill ? '<span class="tag flag">grill</span>' : "") + "</div>" +
        '<p class="blurb">' + esc(m.blurb) + '</p><p class="notes">Serves: ' + esc(m.serves) + "</p>" +
        '<ol class="meal-steps">' + steps + "</ol>" +
        '<p class="meal-ings"><strong>You\'ll need:</strong> ' + ings + "</p>" +
        '<label class="meal-toggle"><input type="checkbox" data-meal="' + esc(m.id) + '" ' +
        (skip ? "" : "checked") + "> Include this meal &amp; its groceries</label></article>";
    }).join("");

    $("kitchen").innerHTML =
      '<p class="kitchen-intro">' + esc(CABIN_KITCHEN.intro) + "</p>" +
      '<div class="grid">' + cards + "</div>" +
      '<div id="kitchen-grocery" class="grocery"></div>';

    drawGrocery();

    $("kitchen").addEventListener("change", function (e) {
      var c = e.target, s = load(KKEY);
      if (c.dataset.meal) {
        if (c.checked) delete s["meal|" + c.dataset.meal]; else s["meal|" + c.dataset.meal] = 0;
        save(KKEY, s);
        c.closest(".meal").classList.toggle("skipped", !c.checked);
        drawGrocery();
      } else if (c.dataset.buy) {
        if (c.checked) s[c.dataset.buy] = 1; else delete s[c.dataset.buy];
        save(KKEY, s);
        c.closest(".check").classList.toggle("done", c.checked);
        var t = 0, dn = 0;
        document.querySelectorAll("[data-buy]").forEach(function (x) { t++; if (x.checked) dn++; });
        var p = $("kk-prog"); if (p) p.textContent = dn + " / " + t + " bought";
      }
    });
  }

  /* --- print / save-to-PDF: build a clean "the plan" sheet (selections only) -- */
  function planActivities() {
    var votes = load(VKEY);
    return ACTIVITIES
      .map(function (a) { return { a: a, n: (votes[a.id] || []).length, who: (votes[a.id] || []) }; })
      .filter(function (x) { return x.n > 0; })
      .sort(function (x, y) { return y.n - x.n; });
  }

  function buildPrintSheet() {
    var sheet = $("print-sheet"); if (!sheet) return;
    var stayRows = STAY_DAYS.map(function (d) {
      var anc = [d.anchor, d.anchor2].filter(Boolean).map(function (id) {
        var a = ACT_BY_ID[id]; return a ? a.name : "";
      }).filter(Boolean).join(", ");
      return "<tr><td>" + d.dow + " " + md(d.date) + "</td><td><strong>" + esc(d.title) + "</strong>" +
        (anc ? " — " + esc(anc) : "") + "<br><span class='p-note'>" + esc(d.notes) + "</span></td></tr>";
    }).join("");
    var homeRows = SCENIC_HOME.map(function (d) {
      return "<tr><td>" + d.dow + " " + md(d.date) + "</td><td><strong>" + esc(d.title) + "</strong>" +
        (d.overnight ? " · overnight " + esc(d.overnight) : "") +
        "<br><span class='p-note'>" + esc(d.notes) + "</span></td></tr>";
    }).join("");

    var voted = planActivities();
    var votedHtml = voted.length
      ? "<ul class='p-list'>" + voted.map(function (x) {
          return "<li><strong>" + esc(x.a.name) + "</strong> — " + x.n + " vote" + (x.n === 1 ? "" : "s") +
            " <span class='p-note'>(" + esc(x.who.join(", ")) + ")</span></li>";
        }).join("") + "</ul>"
      : "<p class='p-note'>No activities voted yet — pick favorites in the app first.</p>";

    var kstate = load(KKEY);
    var meals = CABIN_KITCHEN.meals.filter(function (m) { return !mealSkipped(kstate, m.id); });
    var mealsHtml = meals.length
      ? "<ul class='p-list'>" + meals.map(function (m) { return "<li>" + esc(m.slot) + ": <strong>" + esc(m.name) + "</strong></li>"; }).join("") + "</ul>"
      : "<p class='p-note'>No cabin meals selected.</p>";
    var byCat = buildGrocery(kstate), groceryHtml = "";
    GROCERY_ORDER.forEach(function (cat) {
      var rows = byCat[cat]; if (!rows || !rows.length) return;
      rows.sort(function (a, b) { return a.item.localeCompare(b.item); });
      groceryHtml += "<div class='p-gcat'><strong>" + esc(cat) + ":</strong> " +
        rows.map(function (r) {
          var q = r.qtys.length ? " (" + qtyLabel(r.qtys) + ")" : "";
          return esc(r.item + q);
        }).join(", ") + "</div>";
    });

    var packHtml = PACKING.map(function (g) {
      return "<div class='p-gcat'><strong>" + esc(g.group) + ":</strong> ☐ " + g.items.map(esc).join(" · ☐ ") + "</div>";
    }).join("");

    sheet.innerHTML =
      "<h1>Broken Bow 2026 — The Plan</h1>" +
      "<p class='p-sub'>June 7–11 · Hochatown, OK · " + TRIP.family.map(function (f) { return f.name; }).join(", ") + "</p>" +
      "<p class='p-sub'>Cabin pin: " + TRIP.lodging.lat + ", " + TRIP.lodging.lng + " (VRBO #" + TRIP.lodging.vrbo + ")</p>" +
      "<h2>The stay</h2><table class='p-table'>" + stayRows + "</table>" +
      "<h2>Voted activities</h2>" + votedHtml +
      "<h2>Cabin kitchen</h2>" + mealsHtml + "<div class='p-grocery'>" + groceryHtml + "</div>" +
      "<h2>Scenic way home</h2><table class='p-table'>" + homeRows + "</table>" +
      "<h2>Packing</h2><div class='p-grocery'>" + packHtml + "</div>" +
      "<p class='p-foot'>Prices/hours approximate — confirm at the door. No cell service at the cabin — screenshot your maps. Printed " +
      new Date().toLocaleDateString() + ".</p>";
  }

  function initPrint() {
    var b = $("printBtn"); if (!b) return;
    b.addEventListener("click", function () { buildPrintSheet(); window.print(); });
  }

  /* --- theme toggle (campfire) — LIGHT DEFAULT, manual only (no auto-night) --- */
  function applyTheme(t) {
    document.documentElement.setAttribute("data-theme", t);
    var b = $("themeToggle"); if (b) b.textContent = (t === "night" ? "Daylight" : "Campfire");
  }
  function initTheme() {
    var t = null; try { t = localStorage.getItem(TKEY); } catch (e) {}
    if (t !== "night" && t !== "day") t = "day";  // default daylight; never auto-switch by clock
    applyTheme(t);
    var b = $("themeToggle");
    if (b) b.addEventListener("click", function () {
      var cur = document.documentElement.getAttribute("data-theme");
      var next = cur === "night" ? "day" : "night";
      applyTheme(next); try { localStorage.setItem(TKEY, next); } catch (e) {}
    });
  }

  /* --- confetti (arrival day + scavenger completion) --- */
  function confetti() {
    var c = $("confetti"); if (!c) return;
    c.width = window.innerWidth; c.height = window.innerHeight; c.style.display = "block";
    var ctx = c.getContext("2d");
    var cols = ["#c4622d", "#2f4a3c", "#e7d9bd", "#e0813a", "#84a98c"];
    var parts = [];
    for (var i = 0; i < 110; i++) parts.push({
      x: Math.random() * c.width, y: -20 - Math.random() * c.height * 0.4,
      r: 4 + Math.random() * 6, vy: 2 + Math.random() * 3.5, vx: -1.2 + Math.random() * 2.4,
      rot: Math.random() * 6, vr: -0.12 + Math.random() * 0.24, col: cols[i % cols.length]
    });
    var f = 0;
    (function anim() {
      f++; ctx.clearRect(0, 0, c.width, c.height);
      parts.forEach(function (p) {
        p.x += p.vx; p.y += p.vy; p.rot += p.vr;
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot);
        ctx.fillStyle = p.col; ctx.fillRect(-p.r / 2, -p.r / 2, p.r, p.r * 0.6); ctx.restore();
      });
      if (f < 280) requestAnimationFrame(anim); else c.style.display = "none";
    })();
  }
  function maybeArrivalConfetti() {
    var d = nowChicago().date;
    if (d >= TRIP.dates.start && d <= TRIP.dates.end) {
      var k = "bb_confetti_" + d;
      var seen = false; try { seen = !!localStorage.getItem(k); } catch (e) {}
      if (!seen) { confetti(); try { localStorage.setItem(k, "1"); } catch (e) {} }
    }
  }

  /* --- accordions: open the target section's <details> from nav / hash --- */
  function openDetailsIn(target) {
    if (!target) return;
    var det = target.tagName === "DETAILS" ? target : target.querySelector("details.acc");
    if (det && !det.open) { det.open = true; revealWithin(det); }
  }
  function revealWithin(scope) {
    scope.querySelectorAll(".reveal").forEach(function (el) { el.classList.add("in"); });
  }
  function initAccordions() {
    // Reveal content as a section is expanded (IO can't see display:none children).
    document.querySelectorAll("details.acc").forEach(function (det) {
      det.addEventListener("toggle", function () { if (det.open) revealWithin(det); });
    });
    // Nav links auto-open their destination before the browser scrolls to it.
    document.querySelectorAll('.nav-links a[href^="#"]').forEach(function (link) {
      link.addEventListener("click", function () {
        openDetailsIn(document.querySelector(link.getAttribute("href")));
      });
    });
    // Direct load with a hash (or later hashchange).
    function fromHash() { if (location.hash) openDetailsIn(document.querySelector(location.hash)); }
    window.addEventListener("hashchange", fromHash);
    fromHash();
  }

  /* --- staggered reveal on scroll --- */
  function initReveal() {
    if (!("IntersectionObserver" in window)) {
      document.querySelectorAll(".reveal").forEach(function (el) { el.classList.add("in"); }); return;
    }
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
    }, { threshold: 0.08 });
    document.querySelectorAll(".reveal").forEach(function (el) { io.observe(el); });
  }

  /* =========================================================================
     INIT — each step isolated so one error can't take down the page.
     ======================================================================= */
  function safe(fn) { try { fn(); } catch (e) { if (window.console) console.error(e); } }

  document.addEventListener("DOMContentLoaded", function () {
    safe(renderHero);
    safe(renderToday);
    safe(renderDriveUp);
    safe(renderStay);
    safe(renderActivities);
    safe(initSync);
    safe(renderEat);
    safe(renderShop);
    safe(renderKitchen);
    safe(renderHome);
    safe(renderPacking);
    safe(renderScavenger);
    safe(renderSpinner);
    safe(initTheme);
    safe(initPrint);
    safe(buildPrintSheet);
    safe(function () { $("year").textContent = new Date().getFullYear(); });
    safe(function () { $("heroBadge").addEventListener("click", confetti); });
    safe(initAccordions);
    safe(initReveal);
    safe(tickCountdown); setInterval(function () { safe(tickCountdown); }, 1000);
    safe(loadWeather);
    safe(maybeArrivalConfetti);
  });
})();
