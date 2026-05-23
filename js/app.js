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

  function dirUrl(lat, lng) {
    return "https://www.google.com/maps/dir/?api=1&destination=" + lat + "," + lng;
  }

  function tagHtml(hours) {
    if (!hours) return "";
    var info = openInfo(hours);
    var cls = info.state === "open" ? "tag open" : info.state === "closed" ? "tag closed" : "tag";
    var h = info.label ? '<span class="' + cls + '">' + info.label + "</span>" : "";
    if (hours.label) h += '<span class="tag hours">' + hours.label + "</span>";
    if (hours.callAhead) h += '<span class="tag call">call ahead</span>';
    return h;
  }

  function md(date) { return parseInt(date.slice(5, 7), 10) + "/" + parseInt(date.slice(8, 10), 10); }
  function dayLabel(date) {
    var d = STAY_DAYS.concat(SCENIC_HOME).filter(function (x) { return x.date === date; })[0];
    return d ? d.dow + " " + md(date) : md(date);
  }

  /* ----- localStorage (votes + checklists) ----- */
  function load(key) { try { return JSON.parse(localStorage.getItem(key)) || {}; } catch (e) { return {}; } }
  function save(key, o) { try { localStorage.setItem(key, JSON.stringify(o)); } catch (e) {} }
  var VKEY = "bb_votes_v1", PKEY = "bb_packing_v1", SKEY = "bb_scavenger_v1", TKEY = "bb_theme";

  /* =========================================================================
     RENDERERS
     ======================================================================= */

  function renderHero() {
    $("roster").textContent = TRIP.family.map(function (f) { return f.name; }).join("  ·  ");
    $("tagline").textContent = TRIP.tagline;
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
        return '<a class="dir" href="' + dirUrl(a.lat, a.lng) + '" target="_blank" rel="noopener">' + a.name + " ↗</a>";
      }).join("<br>");
      html = '<div class="card"><div class="card-head"><h3>Today · ' + day.dow + " " + md(day.date) +
        '</h3></div><p class="blurb"><strong>' + day.title + "</strong></p><p class=\"notes\">" + day.notes + "</p>" +
        (anchors ? '<p style="margin-top:8px">' + anchors + "</p>" : "") + "</div>";
    } else if (today < TRIP.dates.start) {
      var first = STAY_DAYS[0];
      html = '<div class="card"><h3>Not there yet — but soon!</h3><p class="blurb">First up: <strong>' +
        first.title + "</strong> on " + first.dow + " " + md(first.date) + ".</p><p class=\"notes\">" + first.notes + "</p></div>";
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
    var chips = u.path.map(function (p) { return "<span>" + p + "</span>"; }).join("");
    var stops = u.stops.map(function (s) {
      var dir = (s.lat ? ' <a class="dir" href="' + dirUrl(s.lat, s.lng) + '" target="_blank" rel="noopener">map ↗</a>' : "");
      return '<div class="tl-item"><div class="tl-when">' + s.when + " · " + s.name + dir +
        '</div><div class="tl-note">' + s.note + "</div></div>";
    }).join("");
    $("drive").innerHTML =
      '<p class="lead">' + u.distanceMi + " · " + u.driveTime + ". Suggested departure <strong>" + u.departSuggested +
      "</strong> to clear the " + u.checkIn + " check-in with buffer.</p>" +
      '<div class="route-chips">' + chips + "</div>" +
      '<div class="timeline">' + stops +
      '<div class="tl-item"><div class="tl-when">' + u.arrive + " · Arrive Hochatown</div>" +
      '<div class="tl-note">Check in at ' + u.checkIn + ". " +
      '<a class="dir" href="' + dirUrl(TRIP.lodging.lat, TRIP.lodging.lng) + '" target="_blank" rel="noopener">cabin directions ↗</a></div></div></div>';
  }

  /* --- the stay (Leg 2) --- */
  function dayCard(d) {
    var anchors = [d.anchor, d.anchor2].filter(Boolean).map(function (id) {
      var a = ACT_BY_ID[id]; if (!a) return "";
      return '<a class="dir" href="' + dirUrl(a.lat, a.lng) + '" target="_blank" rel="noopener">' + a.name + " ↗</a>";
    }).join("<br>");
    return '<div class="card reveal day ' + (d.type === "travel" ? "travel" : "") + '">' +
      '<div class="day-date"><div class="dow">' + d.dow + '</div><div class="dnum">' + parseInt(d.date.slice(8, 10), 10) + "</div></div>" +
      '<div class="day-body"><h3>' + d.title + "</h3><p class=\"notes\">" + d.notes + "</p>" +
      (anchors ? '<p style="margin-top:6px">' + anchors + "</p>" : "") + "</div></div>";
  }
  function renderStay() { $("stay").innerHTML = STAY_DAYS.map(dayCard).join(""); }

  /* --- activities + per-person voting --- */
  function renderActivities() {
    var votes = load(VKEY);
    $("activities").innerHTML = ACTIVITIES.map(function (a) {
      var anchor = a.defaultDay ? '<span class="badge-day">' + dayLabel(a.defaultDay) + " anchor</span>" : "";
      var voters = TRIP.family.map(function (f) {
        var on = (votes[a.id] || []).indexOf(f.name) >= 0;
        return '<button class="voter ' + (on ? "on" : "") + '" data-act="' + a.id + '" data-person="' +
          f.name + '" title="' + f.name + '">' + f.name.charAt(0) + "</button>";
      }).join("");
      var n = (votes[a.id] || []).length;
      return '<article class="card act reveal"><div class="card-head"><h3>' + a.name + "</h3>" + anchor + "</div>" +
        '<div class="tags">' + tagHtml(a.hours) + '<span class="tag cat">' + a.category + "</span></div>" +
        '<p class="blurb">' + a.blurb + '</p><p class="notes">' + a.notes + "</p>" +
        '<div class="vote-row"><span class="vote-label">Who\'s in?</span><div class="voters">' + voters +
        '</div><span class="tally" data-tally="' + a.id + '">' + n + " vote" + (n === 1 ? "" : "s") + "</span></div>" +
        '<a class="dir" href="' + dirUrl(a.lat, a.lng) + '" target="_blank" rel="noopener">Directions ↗</a></article>';
    }).join("");

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
    });
  }

  /* --- generic place cards (restaurants / provisions) --- */
  function placeCards(list) {
    return list.map(function (p) {
      return '<article class="card reveal"><div class="card-head"><h3>' + p.name +
        '</h3><span class="tag cat">' + p.type + "</span></div>" +
        '<div class="tags">' + tagHtml(p.hours) + "</div>" +
        '<p class="notes" style="margin-top:8px">' + p.notes + "</p>" +
        '<a class="dir" href="' + dirUrl(p.lat, p.lng) + '" target="_blank" rel="noopener">Directions ↗</a></article>';
    }).join("");
  }
  function renderEat()  { $("eat").innerHTML = placeCards(RESTAURANTS); }
  function renderShop() { $("shop").innerHTML = placeCards(PROVISIONS); }

  /* --- scenic route home (Leg 3) + Fort Rosalie sidebar --- */
  function renderHome() {
    var days = SCENIC_HOME.map(function (d) {
      var stops = d.stops.map(function (id) {
        var s = LEG3_BY_ID[id]; if (!s) return "";
        return '<p class="blurb"><strong>' + s.name + "</strong> <span class=\"muted\">· " + s.region +
          '</span><br><span class="notes">' + s.blurb + " " + s.notes + "</span><br>" +
          '<a class="dir" href="' + dirUrl(s.lat, s.lng) + '" target="_blank" rel="noopener">Directions ↗</a></p>';
      }).join("");
      return '<div class="card reveal day"><div class="day-date"><div class="dow">' + d.dow + '</div><div class="dnum">' +
        parseInt(d.date.slice(8, 10), 10) + '</div></div><div class="day-body"><h3>' + d.title + "</h3>" + stops +
        (d.overnight ? '<p class="overnight">Overnight: ' + d.overnight + "</p>" : '<p class="overnight">Home sweet home</p>') +
        "</div></div>";
    }).join("");
    var f = FORT_ROSALIE;
    var sidebar = '<div class="sidebar reveal"><h3>' + f.title + '</h3><p class="blurb">' + f.body +
      '</p><p class="notes">' + f.hours + ' · <a class="dir" href="' + dirUrl(f.lat, f.lng) +
      '" target="_blank" rel="noopener">Directions ↗</a></p><p class="footnote">' + f.footnote + "</p></div>";
    $("home").innerHTML = days + sidebar;
  }

  /* --- checklists (packing + scavenger) --- */
  function renderPacking() {
    var state = load(PKEY), total = 0, done = 0;
    var html = PACKING.map(function (g) {
      return '<div class="check-group"><h3>' + g.group + "</h3>" + g.items.map(function (item) {
        var key = g.group + "|" + item, on = !!state[key]; total++; if (on) done++;
        return '<label class="check ' + (on ? "done" : "") + '"><input type="checkbox" data-pk="' + key +
          '" ' + (on ? "checked" : "") + "><span>" + item + "</span></label>";
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
        '" ' + (on ? "checked" : "") + "><span>" + item + "</span></label>";
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

  /* --- theme toggle (campfire) --- */
  function applyTheme(t) {
    document.documentElement.setAttribute("data-theme", t);
    var b = $("themeToggle"); if (b) b.textContent = (t === "night" ? "Daylight" : "Campfire");
  }
  function initTheme() {
    var t = null; try { t = localStorage.getItem(TKEY); } catch (e) {}
    if (!t) { var h = nowChicago().hh; t = (h >= 19 || h < 7) ? "night" : "day"; }
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
    safe(renderEat);
    safe(renderShop);
    safe(renderHome);
    safe(renderPacking);
    safe(renderScavenger);
    safe(renderSpinner);
    safe(initTheme);
    safe(function () { $("year").textContent = new Date().getFullYear(); });
    safe(function () { $("heroBadge").addEventListener("click", confetti); });
    safe(initReveal);
    safe(tickCountdown); setInterval(function () { safe(tickCountdown); }, 1000);
    safe(loadWeather);
    safe(maybeArrivalConfetti);
  });
})();
