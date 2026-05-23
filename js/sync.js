/* ============================================================================
   js/sync.js — Broken Bow shared-state layer (Cluster C)

   WHAT THIS DOES
   - Mirrors activity votes to a shared Firebase/Firestore project so every
     phone sees the same tally. One document per voter:
         votes/{personId} = { name, picks: [activityId, ...], updatedAt }
     Each person owns their own doc, so two people voting at once never clobber
     each other (last-write-wins only within a single person's picks).

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
      startVotes(); // attach listener if app already asked for one
      return true;
    }).catch(function (e) {
      warn("Firebase unavailable — running local-only.", e);
      return false;
    });
  }

  function ensure() { if (!bootPromise) bootPromise = boot(); return bootPromise; }

  /* Live listener on the votes collection. Pushes the full set of voter docs to
     the app whenever anything changes (including this device's own writes, via
     Firestore's instant local echo). Attaches at most once. */
  function startVotes() {
    if (!ready || !voteCb || votesStarted) return;
    votesStarted = true;
    try {
      var col = fs.collection(db, "votes");
      fs.onSnapshot(col, function (snap) {
        var docs = [];
        snap.forEach(function (d) {
          var data = d.data() || {};
          docs.push({
            personId: d.id,
            name: data.name || d.id,
            picks: Array.isArray(data.picks) ? data.picks : []
          });
        });
        try { voteCb(docs); } catch (e) { warn("vote callback threw", e); }
      }, function (err) { warn("votes listener error", err); });
    } catch (e) {
      votesStarted = false; // allow a later retry
      warn("startVotes failed", e);
    }
  }

  return {
    /* Optional explicit boot. Safe to call anytime; memoized. */
    init: function () { ensure(); },

    /* Subscribe to shared votes.
       cb receives an array: [{ personId, name, picks: [activityId, ...] }] */
    onVotes: function (cb) {
      voteCb = cb;
      ensure().then(startVotes);
    },

    /* Mirror ONE person's full pick list. Safe no-op offline / before boot.
       We only ever write the doc for the person who was just toggled, so we
       never overwrite anyone else with stale data. */
    pushVotes: function (personId, name, picks) {
      ensure().then(function () {
        if (!ready) return; // offline: localStorage already has it; will sync on a later online toggle
        try {
          var ref = fs.doc(db, "votes", personId);
          fs.setDoc(ref, {
            name: name,
            picks: picks || [],
            updatedAt: fs.serverTimestamp()
          });
        } catch (e) { warn("pushVotes failed", e); }
      });
    }
  };
})();
