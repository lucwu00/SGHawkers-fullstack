/* ─── GLOBAL STYLES & DESIGN TOKENS ────────────────────────────────────────── */

export const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400;1,700&family=Newsreader:ital,wght@0,300;0,400;0,500;1,300;1,400&display=swap');

*,*::before,*::after { box-sizing: border-box; margin: 0; padding: 0; }

:root {
  --ink: #1a1208;
  --ink2: #3d2e1a;
  --ink3: #6b5840;
  --paper: #f5f0e8;
  --paper2: #ede6d3;
  --paper3: #e0d6be;
  --amber: #c8860a;
  --amber2: #e8a020;
  --red: #8b2a1a;
  --green: #2d5a27;
  --green2: #4a7c3f;
  --blue: #1a4a6b;
  --border: rgba(26,18,8,.15);
  --shadow: 0 2px 16px rgba(26,18,8,.12);
  --shadow-lg: 0 8px 40px rgba(26,18,8,.18);
  --ff-d: 'Playfair Display', Georgia, serif;
  --ff-s: 'Newsreader', Georgia, serif;
  --r: 4px;
  --rl: 8px;
}

body {
  background: var(--paper);
  color: var(--ink);
  font-family: var(--ff-s);
  font-size: 15px;
  line-height: 1.6;
}

/* ─── HEADER ─────────────────────────────────────────────────────────────────*/
.hdr { background: var(--ink); color: var(--paper); padding: 0 18px; display: flex; align-items: center; justify-content: space-between; height: 56px; position: sticky; top: 0; z-index: 100; border-bottom: 2px solid var(--amber); }
.logo { font-family: var(--ff-d); font-size: 19px; font-weight: 900; color: var(--amber2); cursor: pointer; flex-shrink: 0; }
.logo span { color: var(--paper); font-weight: 400; font-style: italic; }
.hdr-nav { display: flex; align-items: center; gap: 2px; }
.nav-btn { background: none; border: none; color: var(--paper3); font-family: var(--ff-s); font-size: 13px; padding: 6px 9px; cursor: pointer; border-radius: var(--r); transition: all .2s; white-space: nowrap; }
.nav-btn:hover { color: var(--amber2); background: rgba(255,255,255,.06); }
.nav-btn.on { color: var(--amber2); }
.notif-btn { position: relative; background: none; border: none; color: var(--paper3); font-size: 17px; cursor: pointer; padding: 6px 8px; border-radius: var(--r); transition: color .2s; }
.notif-btn:hover { color: var(--amber2); }
.nbadge { position: absolute; top: 2px; right: 2px; background: var(--red); color: #fff; border-radius: 50%; width: 15px; height: 15px; font-size: 9px; display: flex; align-items: center; justify-content: center; font-style: normal; }
.cart-btn { background: var(--amber); color: var(--ink); border: none; padding: 6px 13px; border-radius: var(--r); font-family: var(--ff-s); font-size: 13px; font-weight: 500; cursor: pointer; display: flex; align-items: center; gap: 5px; transition: background .2s; }
.cart-btn:hover { background: var(--amber2); }
.cbadge { background: var(--red); color: #fff; border-radius: 50%; width: 17px; height: 17px; font-size: 10px; display: inline-flex; align-items: center; justify-content: center; font-style: normal; }

/* ─── HERO ───────────────────────────────────────────────────────────────────*/
.hero { background: var(--ink); color: var(--paper); padding: 52px 24px 44px; position: relative; overflow: hidden; text-align: center; border-bottom: 3px solid var(--amber); }
.hero::before { content: ''; position: absolute; inset: 0; background: repeating-linear-gradient(45deg, transparent, transparent 38px, rgba(200,134,10,.04) 38px, rgba(200,134,10,.04) 39px); }
.hero-eye { font-size: 11px; letter-spacing: 4px; text-transform: uppercase; color: var(--amber); margin-bottom: 13px; position: relative; }
.hero-h { font-family: var(--ff-d); font-size: clamp(32px, 5vw, 62px); font-weight: 900; line-height: 1.05; position: relative; margin-bottom: 11px; letter-spacing: -1px; }
.hero-h em { font-style: italic; color: var(--amber2); }
.hero-sub { font-size: 15px; color: var(--paper3); position: relative; max-width: 480px; margin: 0 auto 26px; font-style: italic; }
.hero-btns { display: flex; gap: 10px; justify-content: center; flex-wrap: wrap; position: relative; }
.hero-cta { background: var(--amber); color: var(--ink); border: none; padding: 11px 24px; font-family: var(--ff-d); font-size: 15px; font-weight: 700; cursor: pointer; border-radius: var(--r); transition: all .2s; }
.hero-cta:hover { background: var(--amber2); transform: translateY(-1px); }
.hero-cta2 { background: transparent; color: var(--paper); border: 1px solid rgba(245,240,232,.3); padding: 11px 24px; font-family: var(--ff-s); font-size: 15px; cursor: pointer; border-radius: var(--r); transition: all .2s; }
.hero-cta2:hover { border-color: var(--amber); color: var(--amber2); }
.hero-stats { display: flex; justify-content: center; gap: 32px; margin-top: 32px; padding-top: 26px; border-top: 1px solid rgba(245,240,232,.12); flex-wrap: wrap; position: relative; }
.hstat-v { font-family: var(--ff-d); font-size: 25px; font-weight: 700; color: var(--amber2); }
.hstat-l { font-size: 11px; color: var(--paper3); letter-spacing: 1px; text-transform: uppercase; }

/* ─── SECTIONS ───────────────────────────────────────────────────────────────*/
.sec { padding: 34px 24px; }
.stitle { font-family: var(--ff-d); font-size: 23px; font-weight: 700; color: var(--ink); margin-bottom: 4px; letter-spacing: -.3px; }
.ssub { font-size: 13px; color: var(--ink3); margin-bottom: 16px; font-style: italic; }
.dvdr { width: 34px; height: 3px; background: var(--amber); margin: 6px 0 16px; }

/* ─── SCROLL / CARDS ─────────────────────────────────────────────────────────*/
.hscr { display: flex; gap: 11px; overflow-x: auto; padding-bottom: 6px; scrollbar-width: none; }
.hscr::-webkit-scrollbar { display: none; }
.dcrd { background: var(--ink); color: var(--paper); border-radius: var(--rl); padding: 13px; min-width: 155px; flex-shrink: 0; cursor: pointer; transition: transform .2s; border: 1px solid rgba(200,134,10,.2); position: relative; overflow: hidden; }
.dcrd::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 2px; background: var(--amber); }
.dcrd:hover { transform: translateY(-3px); }
.demoji { font-size: 28px; margin-bottom: 6px; display: block; }
.dname { font-family: var(--ff-d); font-size: 12px; font-weight: 700; line-height: 1.2; margin-bottom: 3px; }
.dorg { font-size: 10px; color: var(--paper3); font-style: italic; }
.dprice { font-size: 13px; font-weight: 500; color: var(--amber2); margin-top: 6px; }
.hot-bdg { position: absolute; top: 8px; right: 8px; background: var(--red); color: #fff; font-size: 8px; letter-spacing: 1px; text-transform: uppercase; padding: 2px 5px; border-radius: 2px; }

/* ─── FILTERS ────────────────────────────────────────────────────────────────*/
.frow { display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 15px; align-items: center; }
.flabel { font-size: 12px; color: var(--ink3); font-style: italic; margin-right: 3px; }
.chip { border: 1px solid var(--border); background: var(--paper2); color: var(--ink2); padding: 5px 11px; border-radius: 20px; font-size: 12px; cursor: pointer; font-family: var(--ff-s); transition: all .15s; white-space: nowrap; }
.chip:hover { border-color: var(--amber); color: var(--amber); }
.chip.on { background: var(--ink); color: var(--amber2); border-color: var(--amber); }
.srch { position: relative; margin-bottom: 16px; }
.srch-in { width: 100%; background: var(--paper2); border: 1px solid var(--border); border-radius: var(--r); padding: 9px 13px 9px 34px; font-family: var(--ff-s); font-size: 14px; color: var(--ink); outline: none; transition: border-color .2s; }
.srch-in:focus { border-color: var(--amber); }
.srch-ico { position: absolute; left: 11px; top: 50%; transform: translateY(-50%); color: var(--ink3); font-size: 13px; }

/* ─── NEAR ME BANNER ─────────────────────────────────────────────────────────*/
.nmbar { background: linear-gradient(90deg, var(--blue), #205a82); color: #e6f1fb; border-radius: var(--rl); padding: 11px 14px; display: flex; align-items: center; gap: 11px; margin-bottom: 16px; font-size: 13px; }
.nmbar button { margin-left: auto; background: rgba(255,255,255,.15); border: 1px solid rgba(255,255,255,.3); color: #fff; padding: 5px 11px; border-radius: var(--r); font-family: var(--ff-s); font-size: 12px; cursor: pointer; transition: background .15s; }
.nmbar button:hover { background: rgba(255,255,255,.25); }

/* ─── CENTRE GRID ────────────────────────────────────────────────────────────*/
.cgrid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 13px; }
.ccrd { background: var(--paper2); border: 1px solid var(--border); border-radius: var(--rl); padding: 17px; cursor: pointer; transition: all .2s; position: relative; overflow: hidden; }
.ccrd::after { content: ''; position: absolute; bottom: 0; left: 0; right: 0; height: 3px; background: linear-gradient(to right, var(--amber), var(--red)); transform: scaleX(0); transition: transform .2s; transform-origin: left; }
.ccrd:hover { border-color: var(--amber); box-shadow: var(--shadow); transform: translateY(-2px); }
.ccrd:hover::after { transform: scaleX(1); }
.cemoji { font-size: 32px; margin-bottom: 8px; }
.cname { font-family: var(--ff-d); font-size: 15px; font-weight: 700; margin-bottom: 2px; color: var(--ink); line-height: 1.2; }
.carea { font-size: 11px; color: var(--ink3); margin-bottom: 8px; text-transform: uppercase; letter-spacing: 1px; }
.cmeta { display: flex; gap: 9px; font-size: 12px; color: var(--ink2); flex-wrap: wrap; align-items: center; }
.wdot { display: inline-block; width: 6px; height: 6px; border-radius: 50%; margin-right: 4px; }
.ecoleaf { display: inline-flex; align-items: center; gap: 3px; color: var(--green); font-size: 11px; }
.dpill { font-size: 10px; background: var(--paper3); color: var(--ink3); padding: 1px 6px; border-radius: 10px; font-style: italic; }

/* ─── NAVIGATION ─────────────────────────────────────────────────────────────*/
.back { background: none; border: none; color: var(--ink2); font-family: var(--ff-s); font-size: 13px; cursor: pointer; display: flex; align-items: center; gap: 5px; padding: 7px 0; margin-bottom: 16px; transition: color .15s; }
.back:hover { color: var(--amber); }
.breadcrumb { font-size: 12px; color: var(--ink3); margin-bottom: 14px; display: flex; align-items: center; gap: 5px; flex-wrap: wrap; }
.breadcrumb span { cursor: pointer; transition: color .15s; }
.breadcrumb span:hover { color: var(--amber); }

/* ─── STALL HEADER ───────────────────────────────────────────────────────────*/
.sthdr { background: var(--ink); color: var(--paper); padding: 24px; border-radius: var(--rl); margin-bottom: 16px; position: relative; overflow: hidden; }
.sthdr::before { content: ''; position: absolute; inset: 0; background: repeating-linear-gradient(-30deg, transparent, transparent 28px, rgba(200,134,10,.05) 28px, rgba(200,134,10,.05) 29px); }
.stinner { position: relative; }
.stemoji { font-size: 42px; margin-bottom: 8px; }
.stname { font-family: var(--ff-d); font-size: 21px; font-weight: 900; margin-bottom: 4px; letter-spacing: -.3px; }
.stheri { color: var(--amber); font-size: 10px; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 7px; }
.ststory { font-size: 13px; color: var(--paper3); font-style: italic; line-height: 1.6; max-width: 500px; border-left: 2px solid var(--amber); padding-left: 11px; margin-top: 11px; }
.stbio { background: rgba(255,255,255,.05); border: 1px solid rgba(200,134,10,.2); border-radius: var(--r); padding: 9px 13px; margin-top: 12px; font-size: 12px; color: var(--paper3); font-style: italic; }
.stbio-lbl { color: var(--amber); font-size: 9px; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 3px; }
.award-row { display: flex; gap: 5px; flex-wrap: wrap; margin-top: 9px; }
.award { background: rgba(200,134,10,.15); border: 1px solid rgba(200,134,10,.3); color: var(--amber2); font-size: 10px; padding: 2px 7px; border-radius: 2px; letter-spacing: .5px; }

/* ─── LOYALTY ────────────────────────────────────────────────────────────────*/
.loy { background: var(--ink); color: var(--paper); border-radius: var(--rl); padding: 16px; margin-bottom: 13px; border: 1px solid rgba(200,134,10,.3); }
.loy-title { font-family: var(--ff-d); font-size: 14px; font-weight: 700; color: var(--amber2); margin-bottom: 9px; }
.stamps { display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 8px; }
.stamp { width: 28px; height: 28px; border-radius: 50%; border: 1.5px solid rgba(200,134,10,.35); display: flex; align-items: center; justify-content: center; font-size: 12px; }
.stamp.filled { background: var(--amber); border-color: var(--amber); }
.loy-note { font-size: 12px; color: var(--paper3); font-style: italic; }

/* ─── MENU ITEMS ─────────────────────────────────────────────────────────────*/
.mitem { background: var(--paper2); border: 1px solid var(--border); border-radius: var(--rl); padding: 13px; display: flex; gap: 10px; align-items: flex-start; transition: border-color .15s; margin-bottom: 8px; }
.mitem:hover { border-color: var(--amber); }
.mitem.soldout { opacity: .55; pointer-events: none; }
.minfo { flex: 1; }
.mname { font-family: var(--ff-d); font-size: 14px; font-weight: 700; margin-bottom: 2px; display: flex; align-items: center; gap: 5px; flex-wrap: wrap; }
.mdesc { font-size: 11px; color: var(--ink3); font-style: italic; margin-bottom: 6px; }
.mmeta { display: flex; gap: 7px; align-items: center; flex-wrap: wrap; }
.mprice { font-size: 14px; color: var(--ink); font-weight: 500; }
.pop-b { background: var(--amber); color: var(--ink); font-size: 9px; padding: 1px 5px; border-radius: 2px; font-weight: 500; text-transform: uppercase; letter-spacing: .5px; }
.eco-b { background: var(--green); color: #e8f5e3; font-size: 9px; padding: 1px 5px; border-radius: 2px; letter-spacing: .5px; }
.low-b { background: #fff3e0; color: #8b2a1a; font-size: 9px; padding: 1px 5px; border-radius: 2px; letter-spacing: .5px; text-transform: uppercase; animation: pulse 1.5s infinite; }
.so-b { background: #eee; color: #888; font-size: 9px; padding: 1px 6px; border-radius: 2px; text-transform: uppercase; letter-spacing: .5px; }
.similar { font-size: 11px; color: var(--blue); font-style: italic; cursor: pointer; text-decoration: underline; margin-bottom: 5px; }
@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: .6; } }
.cal-t { font-size: 11px; color: var(--ink3); }
.fav-btn { background: none; border: 1px solid var(--border); border-radius: var(--r); padding: 3px 7px; cursor: pointer; font-size: 12px; transition: all .15s; color: var(--ink3); }
.fav-btn.on { border-color: #c0392b; color: #c0392b; }
.add-btn { background: var(--ink); color: var(--amber2); border: none; padding: 7px 12px; border-radius: var(--r); font-family: var(--ff-s); font-size: 13px; cursor: pointer; white-space: nowrap; transition: background .15s; flex-shrink: 0; }
.add-btn:hover { background: var(--ink2); }

/* ─── STALL LIST CARDS ───────────────────────────────────────────────────────*/
.scrd { background: var(--paper2); border: 1px solid var(--border); border-radius: var(--rl); padding: 15px 17px; cursor: pointer; transition: all .2s; margin-bottom: 9px; display: flex; gap: 13px; align-items: flex-start; }
.scrd:hover { border-color: var(--amber); box-shadow: var(--shadow); }
.scrd-emoji { font-size: 32px; flex-shrink: 0; margin-top: 2px; }
.scrd-name { font-family: var(--ff-d); font-size: 15px; font-weight: 700; margin-bottom: 2px; }
.scrd-since { font-size: 10px; color: var(--amber); text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 5px; }
.tpill { font-size: 10px; background: var(--paper3); color: var(--ink3); padding: 2px 6px; border-radius: 10px; font-style: italic; }

/* ─── CART PANEL ─────────────────────────────────────────────────────────────*/
.cart-ovl { position: fixed; inset: 0; background: rgba(26,18,8,.5); z-index: 200; display: flex; justify-content: flex-end; }
.cpanel { background: var(--paper); width: 370px; max-width: 97vw; height: 100%; overflow-y: auto; padding: 20px; border-left: 2px solid var(--amber); display: flex; flex-direction: column; }
.ctitle { font-family: var(--ff-d); font-size: 18px; font-weight: 700; margin-bottom: 3px; }
.csub { font-size: 12px; color: var(--ink3); margin-bottom: 16px; font-style: italic; }
.citem { background: var(--paper2); border: 1px solid var(--border); border-radius: var(--r); padding: 10px; margin-bottom: 6px; }
.citem-name { font-weight: 500; font-size: 14px; }
.citem-stall { font-size: 11px; color: var(--ink3); font-style: italic; margin-bottom: 6px; }
.cqty { display: flex; align-items: center; gap: 7px; justify-content: space-between; }
.qbtn { background: var(--paper3); border: 1px solid var(--border); width: 25px; height: 25px; border-radius: var(--r); cursor: pointer; font-size: 14px; display: flex; align-items: center; justify-content: center; transition: background .15s; }
.qbtn:hover { background: var(--ink); color: var(--paper); }
.csec { font-family: var(--ff-d); font-size: 11px; font-weight: 700; margin: 16px 0 8px; color: var(--ink2); text-transform: uppercase; letter-spacing: 1px; }
.ogrp { display: flex; gap: 6px; margin-bottom: 10px; }
.obtn { flex: 1; background: var(--paper2); border: 1px solid var(--border); border-radius: var(--r); padding: 9px; cursor: pointer; text-align: center; font-family: var(--ff-s); font-size: 13px; transition: all .15s; color: var(--ink2); }
.obtn:hover { border-color: var(--amber); }
.obtn.on { background: var(--ink); color: var(--amber2); border-color: var(--amber); }
.sel { width: 100%; background: var(--paper2); border: 1px solid var(--border); border-radius: var(--r); padding: 7px 9px; font-family: var(--ff-s); font-size: 13px; color: var(--ink); margin-bottom: 8px; outline: none; }
.toggle-row { background: var(--paper2); border: 1px solid var(--border); border-radius: var(--r); padding: 9px 11px; display: flex; align-items: center; gap: 8px; cursor: pointer; margin-bottom: 10px; font-size: 13px; transition: background .15s; }
.toggle-row.eco-on { background: #e8f5e3; border-color: var(--green); color: var(--green); }
.toggle-row.amber-on { background: #fff8e8; border-color: var(--amber); color: var(--amber2); }
.toggle-row.blue-on { background: #e8f0fb; border-color: var(--blue); color: var(--blue); }
.dgrid { display: flex; gap: 5px; flex-wrap: wrap; margin-bottom: 9px; }
.dchip { border: 1px solid var(--border); background: var(--paper2); color: var(--ink2); padding: 5px 8px; border-radius: var(--r); font-size: 11px; cursor: pointer; font-family: var(--ff-s); transition: all .15s; text-align: center; flex: 1; min-width: 78px; }
.dchip:hover { border-color: var(--amber); }
.dchip.on { background: var(--ink); color: var(--amber2); border-color: var(--amber); }
.group-box { background: var(--paper2); border: 1px solid var(--border); border-radius: var(--rl); padding: 12px; margin-bottom: 10px; }
.group-member { display: flex; justify-content: space-between; align-items: center; font-size: 12px; color: var(--ink2); padding: 4px 0; border-bottom: 1px solid var(--border); }
.group-member:last-child { border-bottom: none; }
.ginput { width: 100%; background: var(--paper); border: 1px solid var(--border); border-radius: var(--r); padding: 6px 9px; font-family: var(--ff-s); font-size: 13px; color: var(--ink); outline: none; margin-top: 7px; }
.gadd { background: var(--amber); color: var(--ink); border: none; padding: 6px; border-radius: var(--r); font-family: var(--ff-s); font-size: 12px; cursor: pointer; margin-top: 5px; width: 100%; transition: background .15s; }
.gadd:hover { background: var(--amber2); }
.carbon { border-radius: var(--r); padding: 8px 11px; font-size: 12px; display: flex; gap: 7px; align-items: center; margin-bottom: 9px; }
.carbon.green { background: linear-gradient(135deg, #2d5a27, #4a7c3f); color: #e8f5e3; }
.carbon.blue  { background: linear-gradient(135deg, #1a4a6b, #205a82); color: #e6f1fb; }
.csum { margin-top: auto; border-top: 1px solid var(--border); padding-top: 13px; }
.srow { display: flex; justify-content: space-between; font-size: 13px; color: var(--ink2); margin-bottom: 5px; }
.stot { font-family: var(--ff-d); font-size: 16px; font-weight: 700; display: flex; justify-content: space-between; margin-top: 8px; border-top: 1px solid var(--border); padding-top: 8px; }
.chkbtn { width: 100%; background: var(--ink); color: var(--amber2); border: none; padding: 12px; font-family: var(--ff-d); font-size: 15px; font-weight: 700; cursor: pointer; border-radius: var(--r); margin-top: 11px; transition: background .15s; letter-spacing: .3px; }
.chkbtn:hover { background: var(--red); }

/* ─── NOTIFICATIONS ──────────────────────────────────────────────────────────*/
.notif-ovl { position: fixed; top: 56px; right: 10px; width: 335px; max-width: 96vw; background: var(--paper); border: 1px solid var(--border); border-radius: var(--rl); box-shadow: var(--shadow-lg); z-index: 150; overflow: hidden; }
.notif-hdr { background: var(--ink); color: var(--paper); padding: 11px 14px; display: flex; align-items: center; justify-content: space-between; border-bottom: 2px solid var(--amber); }
.notif-htitle { font-family: var(--ff-d); font-size: 13px; font-weight: 700; color: var(--amber2); }
.nitem { display: flex; gap: 9px; padding: 11px 14px; border-bottom: 1px solid var(--border); transition: background .15s; cursor: pointer; }
.nitem:hover { background: var(--paper2); }
.nitem.unread { border-left: 3px solid var(--amber); }
.nicon { font-size: 19px; flex-shrink: 0; margin-top: 2px; }
.ntitle { font-family: var(--ff-d); font-size: 12px; font-weight: 700; margin-bottom: 2px; }
.nbody { font-size: 11px; color: var(--ink2); font-style: italic; line-height: 1.4; }
.ntime { font-size: 10px; color: var(--ink3); margin-top: 3px; }

/* ─── ORDER CARDS ────────────────────────────────────────────────────────────*/
.ocrd { background: var(--paper2); border: 1px solid var(--border); border-radius: var(--rl); padding: 15px; margin-bottom: 9px; }
.ohdr { display: flex; justify-content: space-between; margin-bottom: 8px; flex-wrap: wrap; gap: 6px; }
.oid { font-size: 11px; color: var(--ink3); font-style: italic; }
.ostatus { font-size: 11px; background: #e8f5e3; color: var(--green); padding: 2px 8px; border-radius: 10px; }
.ostall { font-family: var(--ff-d); font-size: 14px; font-weight: 700; margin-bottom: 7px; }
.oitems { font-size: 12px; color: var(--ink2); margin-bottom: 8px; font-style: italic; }
.oftr { display: flex; justify-content: space-between; align-items: center; }
.otot { font-weight: 500; font-size: 14px; }
.reorder { background: var(--ink); color: var(--amber2); border: none; padding: 6px 12px; border-radius: var(--r); font-size: 12px; cursor: pointer; font-family: var(--ff-s); transition: background .15s; }
.reorder:hover { background: var(--amber); color: var(--ink); }

/* ─── ORDER CONFIRM ──────────────────────────────────────────────────────────*/
.conf-ovl { position: fixed; inset: 0; background: rgba(26,18,8,.7); z-index: 300; display: flex; align-items: center; justify-content: center; padding: 24px; }
.conf-card { background: var(--paper); border-radius: var(--rl); padding: 30px; max-width: 420px; width: 100%; text-align: center; border-top: 4px solid var(--amber); }
.conf-ico { font-size: 50px; margin-bottom: 13px; }
.conf-title { font-family: var(--ff-d); font-size: 21px; font-weight: 700; margin-bottom: 6px; }
.conf-sub { font-size: 13px; color: var(--ink3); margin-bottom: 20px; font-style: italic; }
.sbar { display: flex; justify-content: space-between; position: relative; margin-bottom: 20px; }
.sbar::before { content: ''; position: absolute; top: 10px; left: 10%; right: 10%; height: 2px; background: var(--amber); z-index: 0; }
.sstep { display: flex; flex-direction: column; align-items: center; gap: 5px; position: relative; z-index: 1; }
.sdot { width: 21px; height: 21px; border-radius: 50%; background: var(--paper3); border: 2px solid var(--amber); display: flex; align-items: center; justify-content: center; font-size: 9px; }
.sdot.done { background: var(--amber); color: var(--ink); }
.sdot.cur  { background: var(--ink); color: var(--amber2); border-color: var(--ink); }
.slbl { font-size: 9px; color: var(--ink3); text-transform: uppercase; letter-spacing: .4px; }
.done-btn { background: var(--ink); color: var(--amber2); border: none; padding: 10px 26px; border-radius: var(--r); font-family: var(--ff-d); font-size: 14px; font-weight: 700; cursor: pointer; transition: background .15s; }
.done-btn:hover { background: var(--red); }

/* ─── ECO BANNER ─────────────────────────────────────────────────────────────*/
.eco-banner { background: linear-gradient(135deg, #2d5a27, #4a7c3f); color: #e8f5e3; padding: 15px 28px; margin: 0 0 22px; display: flex; align-items: center; justify-content: center; flex-direction: column; text-align: center; gap: 8px; border-radius: 0; }
.eco-ico { font-size: 32px; flex-shrink: 0; }
.eco-title { font-family: var(--ff-d); font-size: 14px; font-weight: 700; margin-bottom: 2px; }
.eco-desc { font-size: 12px; opacity: .85; font-style: italic; }

/* ─── REVIEWS ────────────────────────────────────────────────────────────────*/
.rcrd { background: var(--paper2); border-left: 3px solid var(--amber); border-radius: 0 var(--rl) var(--rl) 0; border-top: 1px solid var(--border); border-right: 1px solid var(--border); border-bottom: 1px solid var(--border); padding: 11px 14px; margin-bottom: 8px; }
.ruser { font-weight: 500; font-size: 13px; margin-bottom: 1px; }
.rstall { font-size: 11px; color: var(--ink3); font-style: italic; margin-bottom: 6px; }
.rtext { font-size: 14px; color: var(--ink2); font-style: italic; line-height: 1.5; }
.rmeta { display: flex; justify-content: space-between; margin-top: 6px; }
.stars { color: var(--amber); font-size: 11px; letter-spacing: 1px; }
.rdate { font-size: 10px; color: var(--ink3); }

/* ─── MISC / UTILITY ─────────────────────────────────────────────────────────*/
.empty { text-align: center; padding: 42px 24px; color: var(--ink3); }
.empty-ico { font-size: 42px; margin-bottom: 9px; }
.empty-title { font-family: var(--ff-d); font-size: 16px; color: var(--ink2); margin-bottom: 5px; }
.rrow { display: flex; align-items: center; gap: 4px; font-size: 12px; color: var(--ink3); }
.rstar { color: var(--amber); }
.sbox { background: var(--paper2); border: 1px dashed var(--amber); border-radius: var(--rl); padding: 15px; margin-top: 13px; }
.sin { width: 100%; background: var(--paper); border: 1px solid var(--border); border-radius: var(--r); padding: 6px 10px; font-family: var(--ff-s); font-size: 13px; color: var(--ink); outline: none; margin-bottom: 6px; }
.sbtn { background: var(--amber); color: var(--ink); border: none; padding: 6px 13px; border-radius: var(--r); font-family: var(--ff-s); font-size: 13px; cursor: pointer; transition: background .15s; }
.sbtn:hover { background: var(--amber2); }
.toast { position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%) translateY(80px); background: var(--ink); color: var(--amber2); padding: 8px 16px; border-radius: var(--r); font-size: 13px; z-index: 400; transition: transform .3s; font-family: var(--ff-s); border: 1px solid var(--amber); white-space: nowrap; pointer-events: none; }
.toast.show { transform: translateX(-50%) translateY(0); }
`;