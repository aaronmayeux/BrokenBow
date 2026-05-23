/* ============================================================================
   js/sync.js — Broken Bow shared-state layer (Cluster C + D1)

   WHAT THIS DOES
   - Mirrors two things to a shared Firebase/Firestore project so every phone
     sees the same data:

       1) ACTIVITY + RESTAURANT VOTES (Cluster C) — one document per voter:
            votes/{personId} = { name, picks: [activityId, ...], updatedAt }

       2) SCAVENGER SCOREBOARD (Cluster D1) — one document per player:
            scoreboard/{personId} = { name, found: [itemId, ...],
                                      plates: [stateCode, ...], updatedAt }

     Each person owns their own doc in each collection, so two people acting at
     once never clobber each other (last-write-wins only within one person's
     own data — never across people).

   DESIGN RULE — the app must survive with no signal (the cabin/trails have none)
   - app.js owns localStorage and updates instantly on every tap.
   - This file ONLY mirrors that state out and listens for others' changes.
   - If Firebase can't load (offline, blocked, no SDK), every method here is a
     silent no-op. The app keeps working entirely on localStorage. Nothing in
     here is ever on the app's critical path.

   Loaded as a normal <script> before app.js. The Firebase SDK itself is pulled
   in lazily via dynamic import() so a failed load can't break page startup.
   ========================================================================== */
window.BBSync = (function () {
  "use strict";

  // Public web config — safe to ship in client code; access is gated by the
  // Firestore security rules, not by hiding this.
  var firebaseConfig = {
    apiKey: "AIzaSyBjKp9tHtobqkMJJWvUHYwXb4fXHfVpcyA",
    authDomain: "brokenbow-trip.firebaseapp.com",
    projectId: "brokenbow-trip",
    storageBucket: "brokenbow-trip.firebasestorage.app",
    messagingSenderId: "844292378687",
    appId: "1:844292378687:web:89152278507380b84de88a"
  };

  var SDK = "https://www.gstatic.com/firebasejs/10.12.2/";

  var fs = null;          // the firestore module namespace
  var db = null;          // firestore instance
  var ready = false;      // true once Firebase is initialized
  var bootPromise = null; // memoized boot

  var voteCb = null;      // app's vote-change callback
  var votesStarted = false;

  var scoreCb = null;     // app's scoreboard-change callback
  var scoresStarted = false;

  function warn(m, e) { if (window.console) console.warn("[BBSync] " + m, e || ""); }

  /* Lazily load + initialize Firebase. Resolves true on success, false on any
     failure (offline, CDN unreachable, bad config). Never throws. */
  function boot() {
    return Promise.all([
      import(SDK + "firebase-app.js"),
      import(SDK + "firebase-firestore.js")
    ]).then(function (mods) {
      var appMod = mods[0];
      fs = mods[1];
      var app = appMod.initializeApp(firebaseConfig);
      db = fs.getFirestore(app);
      ready = true;
      startVotes();  // attach listeners if the app already asked for them
      startScores();
      return true;
    }).catch(function (e) {
      warn("Firebase unavailable — running local-only.", e);
      return false;
    });
  }

  function ensure() { if (!bootPromise) bootPromise = boot(); return bootPromise; }

  /* ----- generic live listener on a collection of per-person docs ----------
     Pushes the full set of docs to `cb` whenever anything changes (including
     this device's own writes, via Firestore's instant local echo). `fields`
     lists the array fields to surface (e.g. ["picks"] or ["found","plates"]). */
  function listen(colName, cb, fields) {
    var col = fs.collection(db, colName);
    return fs.onSnapshot(col, function (snap) {
      var docs = [];
      snap.forEach(function (d) {
        var data = d.data() || {};
        var row = { personId: d.id, name: data.name || d.id };
        fields.forEach(function (f) { row[f] = Array.isArray(data[f]) ? data[f] : []; });
        docs.push(row);
      });
      try { cb(docs); } catch (e) { warn(colName + " callback threw", e); }
    }, function (err) { warn(colName + " listener error", err); });
  }

  /* Live listener on the votes collection. Attaches at most once. */
  function startVotes() {
    if (!ready || !voteCb || votesStarted) return;
    votesStarted = true;
    try { listen("votes", voteCb, ["picks"]); }
    catch (e) { votesStarted = false; warn("startVotes failed", e); }
  }

  /* Live listener on the scoreboard collection. Attaches at most once. */
  function startScores() {
    if (!ready || !scoreCb || scoresStarted) return;
    scoresStarted = true;
    try { listen("scoreboard", scoreCb, ["found", "plates"]); }
    catch (e) { scoresStarted = false; warn("startScores failed", e); }
  }

  /* ----- generic per-person write. Safe no-op offline / before boot. -------
     We only ever write the doc for the person who was just touched, so we
     never overwrite anyone else with stale data. */
  function write(colName, personId, payload) {
    ensure().then(function () {
      if (!ready) return; // offline: localStorage already has it; syncs on a later online action
      try {
        var ref = fs.doc(db, colName, personId);
        payload.updatedAt = fs.serverTimestamp();
        fs.setDoc(ref, payload);
      } catch (e) { warn(colName + " write failed", e); }
    });
  }

  return {
    /* Optional explicit boot. Safe to call anytime; memoized. */
    init: function () { ensure(); },

    /* ----- VOTES (Cluster C) ----- */

    /* Subscribe to shared votes.
       cb receives: [{ personId, name, picks: [activityId, ...] }] */
    onVotes: function (cb) {
      voteCb = cb;
      ensure().then(startVotes);
    },

    /* Mirror ONE person's full pick list. */
    pushVotes: function (personId, name, picks) {
      write("votes", personId, { name: name, picks: picks || [] });
    },

    /* ----- SCOREBOARD (Cluster D1) ----- */

    /* Subscribe to the shared scavenger scoreboard.
       cb receives: [{ personId, name, found: [itemId, ...], plates: [code, ...] }] */
    onScores: function (cb) {
      scoreCb = cb;
      ensure().then(startScores);
    },

    /* Mirror ONE player's finds + spotted plates.
       payload = { found: [itemId, ...], plates: [stateCode, ...] } */
    pushScores: function (personId, name, payload) {
      payload = payload || {};
      write("scoreboard", personId, {
        name: name,
        found: payload.found || [],
        plates: payload.plates || []
      });
    }
  };
})();
