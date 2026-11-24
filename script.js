/* script.js: iPhone 18 Pro Max concept page (vanilla JS, no dependencies) */
(() => {
  'use strict';

  const root = document.documentElement;
  const WHITE = '#ffffff';                                   // default page background
  const wait = ms => new Promise(r => setTimeout(r, ms));
  const nextFrame = () => new Promise(r => requestAnimationFrame(() => r()));

  /* ---------- 1. Intro: "Hello" -> "Want a new iPhone?" -> reveal the page ---------- */
  (async () => {
    const intro = document.querySelector('.intro');
    await wait(1400); await nextFrame();
    intro.classList.add('second');                           // crossfade (300ms, in CSS)
    await wait(1600); await nextFrame();
    root.classList.add('ready');                             // fade the page in
    intro.classList.add('done');                             // fade the overlay out
  })();

  /* ---------- 2. Color picker over the photo ---------- */
  const photo = document.querySelector('.photo');
  const list = document.querySelector('.phones');
  const phones = [...list.querySelectorAll('.phone')];
  const nameEl = document.getElementById('color-name');
  const priceEl = document.getElementById('price');
  const statusEl = document.getElementById('status');
  const buyBtn = document.querySelector('.buy');
  const storage = [...document.querySelectorAll('input[name="storage"]')];
  const ZOOM = 1.12, FOCUS_Y = 0.3;                          // magnification, and its vertical focus (keeps phone tops in frame)

  let selected = null;   // persistent choice (click / Enter / Space)
  let hovered = null;    // temporary preview (mouse hover or keyboard focus)

  const checked = () => storage.find(r => r.checked);
  const currentPrice = () => Number(checked().dataset.price).toFixed(2) + ' ₼';   // swap for an API value here
  const currentStorage = () => checked().nextElementSibling.textContent;
  const announce = msg => { statusEl.textContent = msg; };

  // The only place where state becomes DOM; runs inside requestAnimationFrame
  function render() {
    const active = hovered || selected;
    const s = active ? ZOOM : 1, cx = active ? Number(active.dataset.cx) : 0.5;
    root.style.setProperty('--theme-color', active ? active.dataset.bg : WHITE);
    photo.style.transform = `translate(${-(s - 1) * cx * 100}%, ${-(s - 1) * FOCUS_Y * 100}%) scale(${s})`;   // zoom toward the phone
    for (const p of phones) {
      const up = p === hovered || p === selected;
      p.classList.toggle('is-up', up);
      p.classList.toggle('is-dim', Boolean(active) && !up);  // dim the others
      p.setAttribute('aria-selected', String(p === selected));
    }
    nameEl.textContent = selected ? selected.dataset.name : 'Pick a color';
    priceEl.textContent = currentPrice();
    buyBtn.disabled = !selected;
  }

  let queued = false;
  function queueRender() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => { queued = false; render(); });
  }

  function toggle(p) {
    selected = selected === p ? null : p;                    // click again to deselect
    hovered = null;                                          // deselect returns the page to white
    announce(selected ? `${selected.dataset.name} selected, ${currentStorage()}, ${currentPrice()}` : 'Selection cleared');
    queueRender();
  }

  // Roving tabindex: Tab enters the list once, arrow keys move inside it
  const setRoving = p => phones.forEach(x => { x.tabIndex = x === p ? 0 : -1; });
  setRoving(phones[0]);

  function onKey(e) {
    const i = phones.indexOf(e.currentTarget);
    let n;
    switch (e.key) {
      case 'ArrowRight': case 'ArrowDown': n = (i + 1) % phones.length; break;
      case 'ArrowLeft': case 'ArrowUp': n = (i - 1 + phones.length) % phones.length; break;
      case 'Home': n = 0; break;
      case 'End': n = phones.length - 1; break;
      case 'Enter': case ' ': e.preventDefault(); toggle(phones[i]); return;
      default: return;
    }
    e.preventDefault();
    phones[n].focus();
  }

  const focusVisible = el => { try { return el.matches(':focus-visible'); } catch (e) { return true; } };   // older Safari lacks :focus-visible

  phones.forEach(p => {
    // Mouse only, so touch taps don't leave a stuck hover; taps fire click instead
    p.addEventListener('pointerenter', e => { if (e.pointerType === 'mouse') { hovered = p; queueRender(); } });
    p.addEventListener('pointerleave', () => { if (hovered === p) { hovered = null; queueRender(); } });
    // Keyboard focus previews like hover
    p.addEventListener('focus', () => { setRoving(p); if (focusVisible(p)) { hovered = p; queueRender(); } });
    p.addEventListener('blur', () => { if (hovered === p) { hovered = null; queueRender(); } });
    p.addEventListener('click', () => toggle(p));
    p.addEventListener('keydown', onKey);
  });

  /* ---------- 3. Storage + cart ---------- */
  storage.forEach(r => r.addEventListener('change', () => {
    queueRender();
    announce(`${currentStorage()}, ${currentPrice()}`);
  }));

  buyBtn.addEventListener('click', async () => {
    if (!selected) return;
    buyBtn.textContent = 'Added';
    announce(`Added to cart: ${selected.dataset.name}, ${currentStorage()}, ${currentPrice()}`);
    await wait(1600);
    buyBtn.textContent = 'Add to cart';
  });

  render();
})();
