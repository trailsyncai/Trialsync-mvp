:root {
  --navy: #0b2b33;
  --navy2: #12404a;
  --teal: #0e7c86;
  --teal2: #12a3a8;
  --mint: #5fd0c5;
  --coral: #f0654a;
  --sand: #f4f1ec;
  --ink: #13262b;
  --gray: #5c6b6e;
  --white: #ffffff;
  --hit: #0e7c86;
  --miss: #c0392b;
  --line: #e4ddd2;
}

* { box-sizing: border-box; margin: 0; padding: 0; }

body {
  font-family: Calibri, system-ui, -apple-system, "Segoe UI", sans-serif;
  background: var(--sand);
  color: var(--ink);
  -webkit-font-smoothing: antialiased;
}

a { color: var(--teal); }

.serif { font-family: Cambria, Georgia, "Times New Roman", serif; }

.container { max-width: 1040px; margin: 0 auto; padding: 0 22px; }
.narrow { max-width: 460px; margin: 0 auto; padding: 0 22px; }

.topbar {
  background: var(--navy);
  color: var(--white);
  padding: 16px 24px;
  display: flex;
  align-items: center;
  gap: 12px;
}
.brand-badge {
  width: 34px; height: 34px; border-radius: 17px; background: var(--teal);
  display: flex; align-items: center; justify-content: center; font-size: 17px; flex-shrink: 0;
}
.brand-name { font-family: Cambria, Georgia, serif; font-size: 19px; font-weight: 700; line-height: 1; }
.brand-sub { color: var(--mint); font-size: 11px; letter-spacing: 1px; margin-top: 2px; }

.btn {
  display: inline-flex; align-items: center; justify-content: center; gap: 6px;
  background: var(--coral); color: var(--white); border: none; border-radius: 9px;
  padding: 12px 22px; font-size: 15px; font-weight: 700; cursor: pointer;
  font-family: inherit; letter-spacing: 0.2px; text-decoration: none; transition: opacity .15s;
}
.btn:hover { opacity: 0.92; }
.btn:disabled { background: var(--gray); cursor: default; }
.btn-secondary {
  background: transparent; color: var(--teal); border: 1px solid var(--teal);
}
.btn-ghost { background: transparent; color: var(--gray); border: 1px solid #cfc7ba; }
.btn-teal { background: var(--teal); }

.card {
  background: var(--white); border: 1px solid var(--line); border-radius: 12px;
  padding: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.05);
}

label.field { display: block; margin-bottom: 14px; }
label.field span { display: block; font-size: 12px; font-weight: 700; color: var(--teal); letter-spacing: 0.5px; margin-bottom: 5px; }
input.inp, textarea.inp, select.inp {
  width: 100%; border: 1px solid #d9d2c7; border-radius: 9px; padding: 11px 13px;
  font-size: 14px; font-family: inherit; color: var(--ink); background: var(--white);
}
textarea.inp { resize: vertical; min-height: 110px; font-family: Consolas, ui-monospace, monospace; font-size: 12.5px; line-height: 1.5; }
input.inp:focus, textarea.inp:focus, select.inp:focus { outline: 2px solid var(--teal); outline-offset: 1px; }

.h-title { font-family: Cambria, Georgia, serif; font-size: 28px; font-weight: 700; color: var(--ink); }
.kicker { font-size: 11px; font-weight: 700; letter-spacing: 1.2px; color: var(--teal); }
.muted { color: var(--gray); }
.error { background: #fdecea; color: var(--miss); border: 1px solid #f5c6c0; border-radius: 8px; padding: 10px 13px; font-size: 13px; margin-bottom: 14px; }
.notice { background: #eafaf7; color: var(--teal); border: 1px solid #bfe8e2; border-radius: 8px; padding: 10px 13px; font-size: 13px; margin-bottom: 14px; }

.run-row {
  display: flex; align-items: center; gap: 14px; padding: 14px 16px;
  background: var(--white); border: 1px solid var(--line); border-radius: 11px; margin-bottom: 11px;
  text-decoration: none; color: var(--ink); transition: box-shadow .15s, border-color .15s;
}
.run-row:hover { box-shadow: 0 4px 14px rgba(0,0,0,0.08); border-color: var(--teal2); }
.pill { font-size: 12px; font-weight: 700; padding: 3px 10px; border-radius: 20px; }
.pill-hit { background: #e3f3f1; color: var(--hit); }
.pill-miss { background: #fbe9e7; color: var(--miss); }

.crit { background: var(--white); border: 1px solid #e8e2d8; border-radius: 9px; padding: 11px 13px; margin-bottom: 8px; display: flex; gap: 11px; }
.dot { width: 24px; height: 24px; border-radius: 12px; color: #fff; display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 700; flex-shrink: 0; }
.dot-hit { background: var(--hit); }
.dot-miss { background: var(--miss); }
.dot-unknown { background: #c9851a; }
