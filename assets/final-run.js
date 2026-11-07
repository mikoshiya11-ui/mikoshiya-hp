/* ABOUT 最下部の背景動画と疾走演出。動きを減らす設定では何も読み込まず、静止画のまま。
   背景：セクションが見えたら再生し、終わりの絵で止める。完全に画面外へ出てから戻ると、終わっていれば最初から。
   疾走：初回は見えてから約 1.5 秒後。2 回目以降は「完了・完全退出・完了から 30 秒経過・再入場」がそろったときだけ。
   幅 1024px 以上は透過 WebM を背景の上で動かす（Safari は VP9 の透過に非対応なので走らせない）。
   幅 1023px 以下は透過が使えない端末があるため、背景と 7 人を合成した MP4 と背景だけの MP4 を 1 つの要素で切り替える */
(function () {
  var bg = document.querySelector('.ab-final-bg');
  var run = document.querySelector('.final-run');
  var conn = navigator.connection;
  var saveData = !!(conn && conn.saveData);
  var sp = matchMedia('(max-width:1023px)').matches;
  if (!bg || !matchMedia('(prefers-reduced-motion:no-preference)').matches || (sp && saveData)) return;
  var u = navigator.userAgent;
  var ios = /iP(hone|ad|od)/.test(u) || (/Mac/.test(u) && navigator.maxTouchPoints > 1);
  var safari = /Safari/.test(u) && !/Chrome|Chromium|Edg|OPR/.test(u);
  /* スマホは画面の外を走る最初の 1.5 秒を飛ばす */
  var spStart = matchMedia('(max-width:650px)').matches ? 1.5 : 0;
  var canRun = sp || (run && !safari);
  var section = bg.parentNode;
  var COOL = 30000;
  var DELAY = 1500;
  var loaded = false;
  var inView = false;
  var first = true;
  var exited = false;
  var running = false;
  var lastEnd = 0;
  var timer = null;
  var prep = null;
  var anim = null;
  var mode = '';
  var bgOn = false;
  var bgLeft = false;

  function go(v) {
    var p = v.play();
    return p && p.then ? p : Promise.resolve();
  }
  function setSp(m) {
    if (mode === m) return;
    mode = m;
    bg.classList.remove('is-on');
    bg.preload = 'auto';
    bg.src = m === 'run' ? bg.dataset.spRun + (spStart ? '#t=' + spStart : '') : bg.dataset.sp;
  }
  function load() {
    if (loaded) return;
    loaded = true;
    if (sp) {
      setSp('run');
      return;
    }
    if (!saveData) {
      bg.preload = 'auto';
      bg.src = bg.dataset.pc;
    }
    if (canRun) {
      run.preload = 'auto';
      run.src = run.dataset.src;
    }
  }

  /* 背景の再生 */
  function showBg() {
    if ((sp && mode !== 'bg') || (!sp && saveData)) return;
    if (bg.ended) {
      if (!bgLeft) return;
      bg.currentTime = 0;
    }
    bgLeft = false;
    bgOn = true;
    go(bg).catch(function () { /* 静止画または止まった絵のまま */ });
  }

  /* 疾走の開始 */
  function started() {
    first = false;
    exited = false;
  }
  function finished() {
    running = false;
    lastEnd = Date.now();
  }
  function startSp() {
    running = true;
    bgOn = true;
    /* 読み込み直後は位置を指定できないので、準備ができてから移す */
    if (bg.readyState) bg.currentTime = spStart;
    else bg.addEventListener('loadedmetadata', function () { bg.currentTime = spStart; }, { once: true });
    go(bg).then(started).catch(function () { running = false; bgOn = false; });
  }
  function startPc() {
    timer = null;
    running = true;
    run.currentTime = 0;
    go(run).then(function () {
      started();
      run.classList.add('is-running');
      anim = run.animate([
        { transform: 'translateX(' + section.clientWidth + 'px)' },
        { transform: 'translateX(' + -run.offsetWidth + 'px)' }
      ], { duration: 9000, easing: 'linear' });
      anim.onfinish = function () {
        anim = null;
        run.classList.remove('is-running');
        run.pause();
        finished();
      };
    }).catch(function () { running = false; });
  }
  function tryRun() {
    if (!canRun || running || timer || !(first || exited)) return;
    if (!sp) {
      timer = setTimeout(startPc, DELAY);
    } else if (mode === 'run') {
      startSp();
    }
  }
  function cancelWait() {
    clearTimeout(timer);
    timer = null;
  }

  /* 画面の外にいる間に次の動画へ切り替えておく。30 秒たつまでは背景だけ、その後は疾走入り */
  function prepareSp() {
    clearTimeout(prep);
    if (first) return;
    var rest = COOL - (Date.now() - lastEnd);
    if (rest <= 0) {
      setSp('run');
      return;
    }
    setSp('bg');
    prep = setTimeout(function () { if (!inView) setSp('run'); }, rest);
  }

  function enter() {
    inView = true;
    clearTimeout(prep);
    /* 30 秒未満で戻った場合は、もう一度完全に出るまで走らせない */
    if (exited && (running || Date.now() - lastEnd < COOL)) exited = false;
    if (sp && exited && mode !== 'run') setSp('run');
  }
  function exit() {
    inView = false;
    exited = true;
    bgLeft = true;
    cancelWait();
    if (sp && running) return; /* 合成動画は最後まで流して完了させる */
    bg.pause();
    bgOn = false;
    if (sp) prepareSp();
  }

  bg.addEventListener('playing', function () { bg.classList.add('is-on'); });
  /* iPhone は再生前の絵を出さないことがあるので、再生が始まるまで静止画のまま */
  if (!ios) bg.addEventListener('loadeddata', function () { bg.classList.add('is-on'); });
  bg.addEventListener('ended', function () {
    if (!sp || !running) return;
    finished();
    bgOn = false;
    if (!inView) prepareSp();
  });

  new IntersectionObserver(function (es) {
    if (es[0].isIntersecting) load();
  }, { rootMargin: '400px 0px' }).observe(section);

  new IntersectionObserver(function (es) {
    var e = es[0];
    if (!e.isIntersecting) {
      if (inView) exit();
      return;
    }
    load();
    if (!inView) enter();
    if (e.intersectionRatio >= 0.25) showBg();
    if (e.intersectionRatio >= 0.5) tryRun();
    else cancelWait();
  }, { threshold: [0, 0.25, 0.5] }).observe(section);

  document.addEventListener('visibilitychange', function () {
    if (document.hidden) {
      if (bgOn) bg.pause();
      if (anim) {
        anim.pause();
        run.pause();
      }
      return;
    }
    if (bgOn && !bg.ended) go(bg).catch(function () { /* 同上 */ });
    if (anim) {
      anim.play();
      go(run).catch(function () { /* 同上 */ });
    }
  });
})();
