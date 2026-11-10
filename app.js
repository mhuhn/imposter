'use strict';
const VERSION = '1.7';
const MIN_PLAYERS = 3, MIN_ACTIVE = 3;
const KEY_NAMES = 'imposter.names';
const KEY_GAME = 'imposter.game';

const $main = document.getElementById('main');
const $modal = document.getElementById('modal');
const $sheet = document.getElementById('sheet');
const $menuBtn = document.getElementById('menuBtn');

const ICON = {
  eye: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>',
  eyeOff: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3l18 18"/><path d="M10.6 5.1A10 10 0 0 1 12 5c6.5 0 10 7 10 7a17 17 0 0 1-3.2 4.1M6.6 6.6C3.8 8.4 2 12 2 12s3.5 7 10 7a9.6 9.6 0 0 0 5.4-1.6"/><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2"/></svg>',
  plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',
  play: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5.5v13a1 1 0 0 0 1.5.9l10.5-6.5a1 1 0 0 0 0-1.8L9.5 4.6A1 1 0 0 0 8 5.5z"/></svg>',
  q: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9.5"/><path d="M9.2 9.3a2.9 2.9 0 0 1 5.6 1c0 2-2.8 2.6-2.8 4.2"/><path d="M12 17.6h.01"/></svg>',
  check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
  mask: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M3 9.5c3.5-2.5 14.5-2.5 18 0 .3 4-1.6 6.3-4.8 6.8-1.8.3-2.6-1.6-4.2-1.6s-2.4 1.9-4.2 1.6C4.6 15.8 2.7 13.5 3 9.5zm5 2.6c1.2 0 2-.6 2.2-1.2-.6-.6-3.6-.8-4.4 0 .2.6 1 1.2 2.2 1.2zm8 0c1.2 0 2-.6 2.2-1.2-.8-.8-3.8-.6-4.4 0 .2.6 1 1.2 2.2 1.2z"/></svg>',
  next: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
  flag: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 21V4M5 4h11l-2 4 2 4H5"/></svg>',
  pause: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M9 6v12M15 6v12"/></svg>',
  stop: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9.5"/><path d="M15 9l-6 6M9 9l6 6"/></svg>',
  trophy: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 4h8v5a4 4 0 0 1-8 0V4zM8 6H4.5a3 3 0 0 0 3.5 4M16 6h3.5a3 3 0 0 1-3.5 4M12 13v4M8 20h8M9.5 17h5"/></svg>',
};

// ---------- Speicher ----------
function load(key, fallback) {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; } catch (e) { return fallback; }
}
function store(key, value) {
  try { value === null ? localStorage.removeItem(key) : localStorage.setItem(key, JSON.stringify(value)); } catch (e) {}
}
// Gespeichert: [{ name, count, last }]; ältere Version speicherte nur Namen als Text.
function nameStats() {
  const raw = load(KEY_NAMES, []);
  return raw.map((e, i) => typeof e === 'string' ? { name: e, count: 1, last: raw.length - i } : e);
}
// Häufigste zuerst, bei Gleichstand zuletzt genutzte zuerst.
function knownNames() {
  return nameStats().sort((a, b) => b.count - a.count || b.last - a.last).map(e => e.name);
}
function rememberNames(names) {
  const stats = nameStats();
  const now = Date.now();
  names.forEach(n => {
    const e = stats.find(x => x.name.toLowerCase() === n.toLowerCase());
    if (e) { e.count++; e.last = now; e.name = n; } else stats.push({ name: n, count: 1, last: now });
  });
  stats.sort((a, b) => b.last - a.last);
  store(KEY_NAMES, stats.slice(0, 200));
}

// ---------- Hilfen ----------
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const rand = n => Math.floor(Math.random() * n);
const pick = arr => arr[rand(arr.length)];

// ---------- Zustand ----------
let setupNames = [];
let game = load(KEY_GAME, null);
let modalHandler = null;

function save() { store(KEY_GAME, game); }

function activeIdx() {
  return game.players.map((_, i) => i).filter(i => !game.round.skipped.includes(i));
}

// ---------- Spielablauf ----------
function startGame() {
  game = {
    players: setupNames.map(name => ({ name, score: 0 })),
    starterBag: setupNames.map((_, i) => i),
    used: [],
    roundNo: 1,
    played: 0,
    round: null,
  };
  rememberNames(setupNames);
  newRound();
}

function newRound() {
  if (game.used.length >= WORDS.length) game.used = [];
  const free = WORDS.map((_, i) => i).filter(i => !game.used.includes(i));
  const pair = pick(free);
  game.used.push(pair);
  game.round = {
    pair,
    imposter: rand(game.players.length),
    skipped: [],
    revealIdx: 0,
    revealed: false,
    phase: 'reveal',
    peek: null,
    starter: null,
    chosen: null,
    abortReason: null,
    deltas: null,
  };
  save();
  render();
}

function abortRound(reason) {
  game.round.phase = 'aborted';
  game.round.abortReason = reason;
  game.round.revealed = false;
  save();
  render();
}

function nextReveal() {
  const r = game.round;
  r.revealed = false;
  r.revealIdx++;
  while (r.revealIdx < game.players.length && r.skipped.includes(r.revealIdx)) r.revealIdx++;
  if (r.revealIdx >= game.players.length) r.phase = 'ready';
  save();
  render();
}

function chooseStarter() {
  const active = activeIdx();
  let candidates = game.starterBag.filter(i => active.includes(i));
  if (!candidates.length) {
    game.starterBag = game.players.map((_, i) => i);
    candidates = active.slice();
  }
  const s = pick(candidates);
  game.starterBag = game.starterBag.filter(i => i !== s);
  return s;
}

function startDiscussion() {
  const r = game.round;
  r.starter = chooseStarter();
  r.phase = 'discuss';
  save();
  render();
}

function resolve(chosen) {
  const r = game.round;
  r.chosen = chosen;
  const deltas = game.players.map(() => 0);
  if (chosen === r.imposter) {
    activeIdx().forEach(i => { if (i !== r.imposter) deltas[i] = 1; });
  } else {
    deltas[r.imposter] = 2;
  }
  deltas.forEach((d, i) => { game.players[i].score += d; });
  r.deltas = deltas;
  game.played = (game.played || 0) + 1;
  r.phase = 'result';
  save();
  render();
}

function nextRound() {
  game.roundNo++;
  newRound();
}

function endGame() {
  game.round.phase = 'final';
  save();
  render();
}

function leaveGame() {
  game = null;
  store(KEY_GAME, null);
  setupNames = [];
  render();
}

// ---------- Modal ----------
function openModal(html, handler) {
  $sheet.innerHTML = html;
  modalHandler = handler;
  $modal.hidden = false;
}
function closeModal() { $modal.hidden = true; $sheet.innerHTML = ''; modalHandler = null; }
$modal.addEventListener('click', e => {
  if (e.target === $modal) { closeModal(); return; }
  const b = e.target.closest('[data-m]');
  if (!b) return;
  const action = b.dataset.m;
  const h = modalHandler;
  closeModal();
  if (action !== 'close' && h) h(action, b.dataset);
});

// ---------- Rendering ----------
function scoreList(withDeltas) {
  const order = game.players.map((p, i) => ({ ...p, i })).sort((a, b) => b.score - a.score);
  const top = order[0].score;
  return '<ul class="score">' + order.map((p, k) => {
    const d = withDeltas && game.round.deltas ? game.round.deltas[p.i] : 0;
    return `<li class="${top > 0 && p.score === top ? 'lead' : ''}"><span class="rank">${k + 1}.</span><span class="n">${esc(p.name)}</span>${d ? `<span class="d">+${d}</span>` : ''}<span class="p">${p.score}</span></li>`;
  }).join('') + '</ul>';
}

function progressDots() {
  const r = game.round;
  return '<div class="progress">' + game.players.map((_, i) => {
    let c = '';
    if (r.skipped.includes(i)) c = 'skip';
    else if (i < r.revealIdx) c = 'done';
    else if (i === r.revealIdx) c = 'now';
    return `<i class="${c}"></i>`;
  }).join('') + '</div>';
}

function wordCard(i) {
  const r = game.round;
  const [word, hint] = WORDS[r.pair];
  if (i === r.imposter) {
    return `<div class="card"><div class="label"><span class="imp-tag">Imposter</span> · Hinweis</div><div class="word">${esc(hint)}</div></div>`;
  }
  return `<div class="card"><div class="label">Dein Begriff</div><div class="word">${esc(word)}</div></div>`;
}

function render() {
  $menuBtn.hidden = !game || (game.round && game.round.phase === 'final');
  if (!game) return renderSetup();
  const ph = game.round.phase;
  ({ reveal: renderReveal, aborted: renderAborted, ready: renderReady, peek: renderPeek,
     discuss: renderDiscuss, result: renderResult, final: renderFinal }[ph])();
  $main.scrollTop = 0;
}

// Setup
function renderSetup() {
  const canStart = setupNames.length >= MIN_PLAYERS;
  $main.innerHTML = `<div class="screen">
    <h1>Wer spielt mit?</h1>
    <button class="btn red" id="startBtn" style="margin-top:8px" ${canStart ? '' : 'disabled'}>${ICON.play} ${canStart ? "Los geht's" : `Noch ${MIN_PLAYERS - setupNames.length} ${MIN_PLAYERS - setupNames.length === 1 ? 'Spieler fehlt' : 'Spieler fehlen'}`}</button>
    <p class="muted" style="margin-top:14px">Ab ${MIN_PLAYERS} Spielern, alle an einem Gerät. Die Reihenfolge hier ist die Reihenfolge beim Aufdecken.</p>
    <form class="add-row" id="addForm" autocomplete="off">
      <input id="nameInput" type="text" placeholder="Name eingeben" maxlength="20" autocapitalize="words" autocorrect="off" spellcheck="false" enterkeyhint="done">
      <button class="btn" type="submit" aria-label="Hinzufügen">${ICON.plus}</button>
    </form>
    <div class="suggest" id="suggest"></div>
    <div class="error" id="err"></div>
    <ul class="players">${setupNames.map((n, i) => `<li><span class="num">${i + 1}</span><span class="name">${esc(n)}</span><button class="x" data-remove="${i}" aria-label="${esc(n)} entfernen">×</button></li>`).join('')}</ul>
    <div class="grow"></div>
    <div class="version">Imposter v${VERSION} · ${WORDS.length} Begriffe</div>
  </div>`;

  const input = document.getElementById('nameInput');
  const err = document.getElementById('err');
  const suggest = document.getElementById('suggest');
  if (input) {
    const showSuggest = () => {
      const q = input.value.trim().toLowerCase();
      err.textContent = '';
      const taken = setupNames.map(n => n.toLowerCase());
      const hits = knownNames()
        .filter(n => !taken.includes(n.toLowerCase()) && n.toLowerCase() !== q)
        .filter(n => !q || n.toLowerCase().startsWith(q))
        .slice(0, q ? 6 : 12);
      suggest.innerHTML = hits.map(n => `<button class="chip" type="button" data-name="${esc(n)}">${esc(n)}</button>`).join('');
    };
    input.addEventListener('input', showSuggest);
    showSuggest();
    suggest.addEventListener('click', e => {
      const c = e.target.closest('[data-name]');
      if (c) addName(c.dataset.name);
    });
    document.getElementById('addForm').addEventListener('submit', e => {
      e.preventDefault();
      addName(input.value);
    });
  }
  $main.querySelectorAll('[data-remove]').forEach(b => b.addEventListener('click', () => {
    setupNames.splice(+b.dataset.remove, 1);
    renderSetup();
  }));
  document.getElementById('startBtn').addEventListener('click', () => { if (canStart) startGame(); });
}

function addName(raw) {
  const name = raw.trim().replace(/\s+/g, ' ');
  const err = document.getElementById('err');
  if (!name) return;
  if (setupNames.some(n => n.toLowerCase() === name.toLowerCase())) {
    err.textContent = `„${name}“ ist schon dabei.`;
    return;
  }
  setupNames.push(name);
  renderSetup();
  const input = document.getElementById('nameInput');
  if (input) input.focus();
}

// Aufdecken
// Gemeinsames Layout für verdeckt und aufgedeckt: Karte und Hauptbutton bleiben an derselben Stelle.
function revealLayout({ top, name, card, primary, secondary }) {
  return `<div class="screen center">
    ${top}
    <div class="bigname reveal-name">${esc(name)}</div>
    <p class="muted">Nur ${esc(name)} darf jetzt hinschauen.</p>
    ${card}
    <div class="grow"></div>
    ${primary}
    ${secondary || '<button class="btn ghost spacer" tabindex="-1" aria-hidden="true">&nbsp;</button>'}
  </div>`;
}
const coveredCard = () => `<div class="card covered">${ICON.q}<p>Begriff verdeckt</p></div>`;
const showBtn = () => `<button class="btn red big" id="show">${ICON.eye} Aufdecken</button>`;
const gotItBtn = () => `<button class="btn green big" id="hide">${ICON.check} Habe ich mir gemerkt</button>`;

function renderReveal() {
  const r = game.round;
  const p = game.players[r.revealIdx];
  const top = progressDots() + '<div class="hand">Gib das Gerät an</div>';
  if (!r.revealed) {
    $main.innerHTML = revealLayout({ top, name: p.name, card: coveredCard(), primary: showBtn() });
    document.getElementById('show').onclick = () => { r.revealed = true; save(); render(); };
  } else {
    $main.innerHTML = revealLayout({ top, name: p.name, card: wordCard(r.revealIdx), primary: gotItBtn(),
      secondary: `<button class="btn ghost" id="unknown">${ICON.q} Kenne ich nicht / hatten wir schon</button>` });
    document.getElementById('hide').onclick = nextReveal;
    document.getElementById('unknown').onclick = unknownDialog;
  }
}

function unknownDialog() {
  const r = game.round;
  const isImp = r.revealIdx === r.imposter;
  const activeAfter = activeIdx().length - 1;
  const canSkip = activeAfter >= MIN_ACTIVE;
  const html = isImp
    ? `<h2>Hinweis unbekannt oder schon gehabt?</h2>
       <p class="muted">Als Imposter kannst du nicht aussetzen. Du kannst die Runde abbrechen, dann gibt es für alle einen neuen Begriff.</p>
       <button class="btn red" data-m="abort">${ICON.stop} Runde abbrechen</button>
       <button class="btn ghost" data-m="close">Zurück</button>`
    : `<h2>Begriff unbekannt oder schon gehabt?</h2>
       ${canSkip
         ? `<p class="muted">Du kannst diese Runde aussetzen oder die Runde für alle abbrechen und mit einem neuen Begriff neu starten.</p>
       <button class="btn" data-m="skip">${ICON.pause} Ich setze aus</button>`
         : `<p class="muted">Aussetzen geht nicht, dafür sind zu wenige Spieler dabei. Du kannst die Runde für alle abbrechen und mit einem neuen Begriff neu starten.</p>`}
       <button class="btn red" data-m="abort">${ICON.stop} Runde abbrechen</button>
       <button class="btn ghost" data-m="close">Zurück</button>`;
  openModal(html, action => {
    if (action === 'abort') {
      abortRound(`${game.players[r.revealIdx].name} kannte ${isImp ? 'den Hinweis' : 'den Begriff'} nicht oder hatte ihn schon.`);
    } else if (action === 'skip') {
      r.skipped.push(r.revealIdx);
      if (activeIdx().length < MIN_ACTIVE) {
        abortRound(`Zu viele Spieler setzen aus, es müssen mindestens ${MIN_ACTIVE} mitspielen.`);
      } else {
        nextReveal();
      }
    }
  });
}

function renderAborted() {
  $main.innerHTML = `<div class="screen center">
    <div class="result-head"><div class="badge lose">${ICON.stop}</div><h1>Runde abgebrochen</h1></div>
    <p class="muted">${esc(game.round.abortReason || '')}</p>
    <p>Es gibt einen neuen Begriff und einen neuen Imposter. Alle decken nochmal auf.</p>
    <div class="grow"></div>
    <button class="btn red" id="again">${ICON.next} Neuer Begriff</button>
  </div>`;
  document.getElementById('again').onclick = newRound;
}

// Alle haben gesehen
function renderReady() {
  const r = game.round;
  $main.innerHTML = `<div class="screen">
    <div class="center"><div class="result-head"><div class="badge win">${ICON.check}</div></div>
    <h1>Alle kennen ihren Begriff</h1>
    <p class="muted">Wer seinen Begriff nochmal sehen will, tippt auf den eigenen Namen.</p></div>
    <div class="grid">${game.players.map((p, i) => r.skipped.includes(i)
      ? `<button class="pbtn skip" disabled>${esc(p.name)}<span class="sub">setzt aus</span></button>`
      : `<button class="pbtn" data-peek="${i}">${esc(p.name)}</button>`).join('')}</div>
    <div class="grow"></div>
    <button class="btn red" id="go">${ICON.play} Spiel starten</button>
  </div>`;
  $main.querySelectorAll('[data-peek]').forEach(b => b.onclick = () => {
    r.peek = +b.dataset.peek; r.revealed = false; r.phase = 'peek'; save(); render();
  });
  document.getElementById('go').onclick = startDiscussion;
}

function renderPeek() {
  const r = game.round;
  const p = game.players[r.peek];
  const back = () => { r.peek = null; r.revealed = false; r.phase = 'ready'; save(); render(); };
  const top = '<div class="hand">Begriff nochmal ansehen</div>';
  if (!r.revealed) {
    $main.innerHTML = revealLayout({ top, name: p.name, card: coveredCard(), primary: showBtn(),
      secondary: '<button class="btn ghost" id="back">Zurück</button>' });
    document.getElementById('show').onclick = () => { r.revealed = true; save(); render(); };
    document.getElementById('back').onclick = back;
    return;
  }
  $main.innerHTML = revealLayout({ top, name: p.name, card: wordCard(r.peek), primary: gotItBtn() });
  document.getElementById('hide').onclick = back;
}

// Diskussion
function renderDiscuss() {
  const r = game.round;
  const active = activeIdx();
  $main.innerHTML = `<div class="screen">
    <p class="center muted small">Runde ${game.roundNo}</p>
    <div class="starter-box"><div class="muted">Es beginnt</div><div class="bigname">${esc(game.players[r.starter].name)}</div>
      <p class="muted small">Reihum nennt jeder ein Wort, das zum Begriff passt, ohne ihn zu verraten.</p></div>
    <h2>Wer ist der Imposter?</h2>
    <p class="muted small">Wenn ihr euch einig seid, tippt auf seinen Namen.</p>
    <div class="grid">${active.map(i => `<button class="pbtn ${i === r.starter ? 'starter' : ''}" data-vote="${i}">${esc(game.players[i].name)}</button>`).join('')}</div>
    ${r.skipped.length ? `<p class="muted small" style="margin-top:12px">Setzt aus: ${r.skipped.map(i => esc(game.players[i].name)).join(', ')}</p>` : ''}
  </div>`;
  $main.querySelectorAll('[data-vote]').forEach(b => b.onclick = () => {
    const i = +b.dataset.vote;
    openModal(`<h2>Ist ${esc(game.players[i].name)} der Imposter?</h2>
      <p class="muted">Dann wird jetzt aufgelöst.</p>
      <button class="btn red" data-m="yes">${ICON.mask} Ja, auflösen</button>
      <button class="btn ghost" data-m="close">Abbrechen</button>`, a => { if (a === 'yes') resolve(i); });
  });
}

// Auflösung
function renderResult() {
  const r = game.round;
  const [word, hint] = WORDS[r.pair];
  const caught = r.chosen === r.imposter;
  const imp = game.players[r.imposter].name;
  $main.innerHTML = `<div class="screen">
    <div class="result-head">
      <div class="badge ${caught ? 'win' : 'lose'}">${caught ? ICON.check : ICON.mask}</div>
      <h1>${caught ? 'Imposter entdeckt!' : 'Der Imposter war schlauer!'}</h1>
      <p class="muted">${caught
        ? `Es war wirklich ${esc(imp)}. Alle anderen bekommen einen Punkt.`
        : `Ihr habt ${esc(game.players[r.chosen].name)} gewählt, aber ${esc(imp)} war der Imposter und bekommt zwei Punkte.`}</p>
    </div>
    <div class="facts">
      <div><span>Imposter</span><span>${esc(imp)}</span></div>
      <div><span>Begriff</span><span>${esc(word)}</span></div>
      <div><span>Hinweis</span><span>${esc(hint)}</span></div>
    </div>
    <h2>Punktestand</h2>
    ${scoreList(true)}
    <div class="grow"></div>
    <button class="btn red" id="next">${ICON.next} Nächste Runde</button>
    <button class="btn ghost" id="end">${ICON.flag} Spiel beenden</button>
  </div>`;
  document.getElementById('next').onclick = nextRound;
  document.getElementById('end').onclick = confirmEnd;
}

function confirmEnd() {
  openModal(`<h2>Spiel beenden?</h2>
    <p class="muted">Der Punktestand wird angezeigt und danach gelöscht. Nur die Namen bleiben für das nächste Mal gespeichert.</p>
    <button class="btn red" data-m="end">${ICON.flag} Spiel beenden</button>
    <button class="btn ghost" data-m="close">Weiterspielen</button>`, a => { if (a === 'end') endGame(); });
}

function renderFinal() {
  const top = Math.max(...game.players.map(p => p.score));
  const winners = game.players.filter(p => p.score === top).map(p => esc(p.name));
  $main.innerHTML = `<div class="screen">
    <div class="result-head">
      <div class="badge win">${ICON.trophy}</div>
      <h1>${top > 0 ? (winners.length > 1 ? 'Gleichstand!' : `${winners[0]} gewinnt!`) : 'Spiel beendet'}</h1>
      <p class="muted">${top > 0 && winners.length > 1 ? winners.join(' und ') + ' liegen vorne.' : `${game.played || 0} Runde${game.played === 1 ? '' : 'n'} gespielt.`}</p>
    </div>
    <h2>Endstand</h2>
    ${scoreList(false)}
    <div class="grow"></div>
    <button class="btn red" id="new">${ICON.play} Neues Spiel</button>
  </div>`;
  document.getElementById('new').onclick = leaveGame;
}

// Menü während des Spiels
$menuBtn.addEventListener('click', () => {
  if (!game) return;
  openModal(`<h2>Punktestand · Runde ${game.roundNo}</h2>
    ${scoreList(false)}
    <button class="btn red" data-m="end">${ICON.flag} Spiel beenden</button>
    <button class="btn ghost" data-m="close">Weiterspielen</button>`, a => { if (a === 'end') endGame(); });
});

// Start
if (game && (!game.round || !game.players)) { game = null; store(KEY_GAME, null); }
if (game && game.round) {
  game.round.revealed = false;
  if (game.round.phase === 'peek') { game.round.phase = 'ready'; game.round.peek = null; }
}
render();

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js', { updateViaCache: 'none' }).then(reg => {
    reg.update();
    document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') reg.update(); });
  }).catch(() => {});
}
