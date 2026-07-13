/* =====================================================================
 * LOL Draft Guessr — standalone enemy role predictor.
 * Ported from the "league_helper" app's predictEnemyRoles module.
 * 100% client-side: bundled role_data.json + Data Dragon (icons).
 * ===================================================================== */
'use strict';

var DD = 'https://ddragon.leagueoflegends.com';
var STD_ROLES = ['top', 'jungle', 'middle', 'bottom', 'support'];
var PICKRATE_FLOOR = 0.5; // an unseen role stays possible but very unlikely
var ROLE_META = {
  top:     { label: 'TOP',     emoji: '⚔️' },
  jungle:  { label: 'JUNGLE',  emoji: '🌿' },
  middle:  { label: 'MID',     emoji: '✨' },
  bottom:  { label: 'ADC',     emoji: '🏹' },
  support: { label: 'SUPPORT', emoji: '🛡️' }
};

var VERSION = '';
var CHAMPS = [];              // [{ name, slug, icon }]
var CHAMP_BY_NAME = {};       // normName -> champ
var roleData = {};            // championRoles keyed by display name
var roleDataNorm = {};        // normName -> role weights
var selected = [];            // enemy champion names (max 5), insertion order
var locks = {};              // champion name -> forced role

/* ---------- helpers ---------- */
function normName(n) { return n ? n.replace(/[\s'´`.‐-]/g, '').toLowerCase() : ''; }
function lookupRole(name) { return roleData[name] || roleDataNorm[normName(name)]; }
function champByName(name) { return CHAMP_BY_NAME[normName(name)] || null; }

function champRoleWeights(name) {
  var rw = lookupRole(name);
  if (!rw) return null;
  var out = {};
  for (var i = 0; i < STD_ROLES.length; i++) {
    var v = rw[STD_ROLES[i]];
    out[STD_ROLES[i]] = (typeof v === 'number' && v > 0) ? v : 0;
  }
  return out;
}
function rawRoleWeight(name, role) { var rw = champRoleWeights(name); return rw ? rw[role] : null; }

function roleConfidence(name, role, availableRoles) {
  var rw = champRoleWeights(name);
  if (!rw) return 0;
  var total = 0;
  for (var i = 0; i < availableRoles.length; i++) total += rw[availableRoles[i]] || 0;
  var v = rw[role] || 0;
  return total > 0 ? v / total : 0;
}

function permutationsOf(arr, k) {
  var res = [];
  function rec(prefix, rest) {
    if (prefix.length === k || rest.length === 0) { res.push(prefix.slice()); return; }
    for (var i = 0; i < rest.length; i++) rec(prefix.concat([rest[i]]), rest.slice(0, i).concat(rest.slice(i + 1)));
  }
  rec([], arr);
  return res;
}

/* ---------- the guesser (global maximum-likelihood assignment) ---------- */
function predictRoles(names) {
  var prediction = {};
  var floating = [];
  var taken = {};
  names.forEach(function(name) {
    if (!name) return;
    if (locks[name]) {
      prediction[name] = { role: locks[name], confidence: 1, locked: true, weight: rawRoleWeight(name, locks[name]) };
      taken[locks[name]] = true;
    } else floating.push(name);
  });

  var available = STD_ROLES.filter(function(r) { return !taken[r]; });
  var n = floating.length;
  if (n === 0) return prediction;

  var logW = floating.map(function(name) {
    var rw = champRoleWeights(name) || {};
    var row = {};
    available.forEach(function(role) {
      var v = rw[role] > 0 ? rw[role] : PICKRATE_FLOOR;
      row[role] = Math.log(v);
    });
    return row;
  });

  var perms = permutationsOf(available, Math.min(n, available.length));
  var best = null, bestScore = -Infinity;
  for (var pi = 0; pi < perms.length; pi++) {
    var perm = perms[pi], score = 0;
    for (var k = 0; k < n; k++) score += (perm[k] != null && logW[k][perm[k]] != null) ? logW[k][perm[k]] : Math.log(PICKRATE_FLOOR);
    if (score > bestScore) { bestScore = score; best = perm; }
  }

  for (var k2 = 0; k2 < n; k2++) {
    var name2 = floating[k2];
    var role2 = (best && best[k2]) ? best[k2] : (available[k2] || 'fill');
    prediction[name2] = { role: role2, confidence: roleConfidence(name2, role2, available), locked: false, weight: rawRoleWeight(name2, role2) };
  }
  return prediction;
}

/* ---------- rendering ---------- */
function pickColor(pct) {
  if (pct >= 55) return 'var(--conf-high)';
  if (pct >= 25) return 'var(--conf-mid)';
  return 'var(--conf-low)';
}

function renderEnemySlots() {
  var box = document.getElementById('enemy-slots');
  var html = '';
  for (var i = 0; i < 5; i++) {
    var name = selected[i];
    if (name) {
      var c = champByName(name);
      html += '<div class="enemy-slot filled" data-name="' + esc(name) + '" title="' + esc(name) + ' (cliquer pour retirer)">' +
        (c ? '<img src="' + c.icon + '" alt="' + esc(name) + '">' : esc(name)) +
        '<span class="slot-x">✕</span></div>';
    } else {
      html += '<div class="enemy-slot"><span class="slot-num">' + (i + 1) + '</span></div>';
    }
  }
  box.innerHTML = html;
  document.getElementById('enemy-count').textContent = selected.length + '/5';
  box.querySelectorAll('.enemy-slot.filled').forEach(function(el) {
    el.addEventListener('click', function() { removeChamp(el.getAttribute('data-name')); });
  });
}

function renderPicker() {
  var grid = document.getElementById('picker-grid');
  var q = (document.getElementById('champ-search').value || '').trim().toLowerCase();
  var full = selected.length >= 5;
  var html = '';
  CHAMPS.forEach(function(c) {
    if (q && c.name.toLowerCase().indexOf(q) === -1) return;
    var isSel = selected.indexOf(c.name) !== -1;
    var cls = 'pick-champ' + (isSel ? ' selected' : '') + (!isSel && full ? ' disabled' : '');
    html += '<div class="' + cls + '" data-name="' + esc(c.name) + '" title="' + esc(c.name) + '">' +
      '<img src="' + c.icon + '" alt="' + esc(c.name) + '" loading="lazy">' +
      '<span class="pc-name">' + esc(c.name) + '</span></div>';
  });
  grid.innerHTML = html;
  grid.querySelectorAll('.pick-champ').forEach(function(el) {
    el.addEventListener('click', function() { toggleChamp(el.getAttribute('data-name')); });
  });
}

function renderRoles() {
  var box = document.getElementById('roles');
  if (!selected.length) {
    box.innerHTML = '<div class="empty-state">Ajoute les champions ennemis ci-dessus.<br>Les rôles seront devinés au fur et à mesure.</div>';
    return;
  }
  var pred = predictRoles(selected);
  // Map each role slot -> the champion assigned to it.
  var byRole = {};
  selected.forEach(function(name) { var p = pred[name]; if (p && p.role && p.role !== 'fill') byRole[p.role] = name; });

  var html = '';
  STD_ROLES.forEach(function(role) {
    var meta = ROLE_META[role];
    var name = byRole[role];
    var p = name ? pred[name] : null;
    var c = name ? champByName(name) : null;
    var prPct = p ? Math.round(p.weight != null ? p.weight : 0) : 0;
    html += '<div class="role-row' + (name ? '' : ' empty') + '">' +
      '<div class="role-tag"><span class="role-emoji">' + meta.emoji + '</span>' + meta.label + '</div>' +
      (c ? '<img class="role-champ-icon" src="' + c.icon + '" alt="">' : '<div class="role-champ-icon none"></div>') +
      '<div class="role-info">' +
        '<div class="role-champ-name">' + (name ? esc(name) : '—') + '</div>' +
        (name ? '<div class="conf-wrap"><div class="conf-bar"><div class="conf-fill" style="width:' + Math.min(100, prPct) + '%;background:' + pickColor(prPct) + '"></div></div>' +
          '<span class="conf-pct">' + (p.locked ? '🔒 Pick Rate ' + prPct + '%' : 'Pick Rate ' + prPct + '%') + '</span></div>' : '') +
      '</div>' +
      (name ? roleSelectHtml(name, p) : '<span></span>') +
      '</div>';
  });
  box.innerHTML = html;
  box.querySelectorAll('.role-select').forEach(function(sel) {
    sel.addEventListener('change', function() {
      var nm = sel.getAttribute('data-name');
      if (sel.value === 'auto') delete locks[nm];
      else locks[nm] = sel.value;
      render();
    });
  });
}

function roleSelectHtml(name, p) {
  var opts = '<option value="auto"' + (p.locked ? '' : ' selected') + '>Auto</option>';
  STD_ROLES.forEach(function(r) {
    opts += '<option value="' + r + '"' + (p.locked && p.role === r ? ' selected' : '') + '>' + ROLE_META[r].label + '</option>';
  });
  return '<select class="role-select' + (p.locked ? ' locked' : '') + '" data-name="' + esc(name) + '">' + opts + '</select>';
}

function render() { renderEnemySlots(); renderPicker(); renderRoles(); }

/* ---------- actions ---------- */
function toggleChamp(name) {
  var i = selected.indexOf(name);
  if (i !== -1) { removeChamp(name); return; }
  if (selected.length >= 5) return;
  selected.push(name);
  render();
}
function removeChamp(name) {
  var i = selected.indexOf(name);
  if (i !== -1) selected.splice(i, 1);
  delete locks[name];
  render();
}
function clearAll() { selected = []; locks = {}; render(); }

function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function(c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

/* ---------- boot ---------- */
async function boot() {
  try {
    var rd = await fetch('role_data.json').then(function(r) { return r.json(); });
    roleData = rd.championRoles || rd;
    for (var k in roleData) roleDataNorm[normName(k)] = roleData[k];

    var versions = await fetch(DD + '/api/versions.json').then(function(r) { return r.json(); });
    VERSION = versions[0];
    var champ = await fetch(DD + '/cdn/' + VERSION + '/data/en_US/champion.json').then(function(r) { return r.json(); });
    CHAMPS = Object.keys(champ.data).map(function(key) {
      var c = champ.data[key];
      return { name: c.name, slug: c.id, icon: DD + '/cdn/' + VERSION + '/img/champion/' + c.image.full };
    }).sort(function(a, b) { return a.name.localeCompare(b.name); });
    CHAMPS.forEach(function(c) { CHAMP_BY_NAME[normName(c.name)] = c; });
  } catch (e) {
    document.getElementById('picker-grid').innerHTML = '<div class="empty-state">Erreur de chargement des données : ' + esc(e.message || e) + '</div>';
    return;
  }

  document.getElementById('clear-btn').addEventListener('click', clearAll);
  var search = document.getElementById('champ-search');
  var clr = document.getElementById('search-clear');
  search.addEventListener('input', function() { clr.style.visibility = search.value ? 'visible' : 'hidden'; renderPicker(); });
  clr.addEventListener('click', function() { search.value = ''; clr.style.visibility = 'hidden'; renderPicker(); search.focus(); });

  render();
}

boot();
