/* PS3-style boot: black, wordmark swells, soft chime. Any key/click skips. */
(() => {
  const b = document.getElementById('boot'); let done = 0;
  const end = () => { if (done) return; done = 1; b.classList.add('off'); setTimeout(() => b.remove(), 1100); removeEventListener('keydown', skip, true); removeEventListener('click', skip, true); };
  const skip = e => { e.stopPropagation(); e.preventDefault(); end(); };
  addEventListener('keydown', skip, true); addEventListener('click', skip, true);
  try { // layered sine chime
    const ac = new AudioContext(); if (ac.state === 'suspended') ac.resume();
    [[392, 0], [523.25, .25], [659.25, .5], [783.99, .8], [1046.5, 1.1]].forEach(([f, d]) => {
      const o = ac.createOscillator(), g = ac.createGain(), t = ac.currentTime + .3 + d;
      o.type = 'sine'; o.frequency.value = f; g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(.05, t + .4); g.gain.exponentialRampToValueAtTime(.0001, t + 2.6);
      o.connect(g); g.connect(ac.destination); o.start(t); o.stop(t + 2.7);
    });
  } catch (e) {}
  setTimeout(end, 3600);
})();
