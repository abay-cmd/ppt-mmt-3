(function () {
  'use strict';

  var audioCtx = null;
  var masterGain = null;
  var activeVoices = 0;
  var MAX_VOICES = 6;
  var isAudioMuted = false;

  var rotateGainNode = null;
  var rotateFilterNode = null;
  var rotateOscNode = null;
  var isRotateSoundActive = false;

  function initAudio() {
    if (audioCtx) return;
    try {
      var AudioContextClass = window.AudioContext || window.webkitAudioContext;
      audioCtx = new AudioContextClass();
      masterGain = audioCtx.createGain();
      masterGain.gain.setValueAtTime(0.25, audioCtx.currentTime);
      masterGain.connect(audioCtx.destination);
    } catch (e) {
      console.warn('AudioContext gagal diinisialisasi:', e);
    }
  }

  function resumeAudio() {
    if (!audioCtx) initAudio();
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume().catch(function () {});
    }
  }

  function playClick() {
    if (isAudioMuted || !audioCtx || activeVoices >= MAX_VOICES) return;
    try {
      activeVoices++;
      var osc = audioCtx.createOscillator();
      var gain = audioCtx.createGain();
      var now = audioCtx.currentTime;
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1800, now);
      osc.frequency.exponentialRampToValueAtTime(900, now + 0.04);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
      osc.connect(gain);
      gain.connect(masterGain);
      osc.start(now);
      osc.stop(now + 0.045);
      osc.onended = function () { activeVoices = Math.max(0, activeVoices - 1); };
    } catch (e) {}
  }

  function playNav(forward) {
    if (isAudioMuted || !audioCtx || activeVoices >= MAX_VOICES) return;
    try {
      activeVoices++;
      var now = audioCtx.currentTime;
      var bufferSize = audioCtx.sampleRate * 0.35;
      var buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
      var data = buffer.getChannelData(0);
      for (var i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      var noise = audioCtx.createBufferSource();
      noise.buffer = buffer;
      var filter = audioCtx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.Q.setValueAtTime(3.0, now);
      if (forward) {
        filter.frequency.setValueAtTime(300, now);
        filter.frequency.exponentialRampToValueAtTime(1400, now + 0.35);
      } else {
        filter.frequency.setValueAtTime(1400, now);
        filter.frequency.exponentialRampToValueAtTime(300, now + 0.35);
      }
      var gain = audioCtx.createGain();
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.18, now + 0.12);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      noise.connect(filter);
      filter.connect(gain);
      gain.connect(masterGain);
      noise.start(now);
      noise.stop(now + 0.36);
      noise.onended = function () { activeVoices = Math.max(0, activeVoices - 1); };
    } catch (e) {}
  }

  function playGlossarySound(isOpen) {
    if (isAudioMuted || !audioCtx || activeVoices >= MAX_VOICES) return;
    try {
      activeVoices++;
      var now = audioCtx.currentTime;
      var osc = audioCtx.createOscillator();
      var gain = audioCtx.createGain();
      osc.type = 'sine';
      if (isOpen) {
        osc.frequency.setValueAtTime(540, now);
        osc.frequency.setValueAtTime(820, now + 0.06);
      } else {
        osc.frequency.setValueAtTime(820, now);
        osc.frequency.setValueAtTime(540, now + 0.06);
      }
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
      osc.connect(gain);
      gain.connect(masterGain);
      osc.start(now);
      osc.stop(now + 0.125);
      osc.onended = function () { activeVoices = Math.max(0, activeVoices - 1); };
    } catch (e) {}
  }

  function playStartSwell() {
    if (isAudioMuted || !audioCtx) return;
    try {
      var freqs = [220, 277.18, 329.63, 440];
      var now = audioCtx.currentTime;
      freqs.forEach(function (f) {
        var osc = audioCtx.createOscillator();
        var gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(f, now);
        gain.gain.setValueAtTime(0.001, now);
        gain.gain.linearRampToValueAtTime(0.08, now + 0.35);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.7);
        osc.connect(gain);
        gain.connect(masterGain);
        osc.start(now);
        osc.stop(now + 0.72);
      });
    } catch (e) {}
  }

  function startRotateSound() {
    if (isAudioMuted || !audioCtx || isRotateSoundActive) return;
    try {
      var now = audioCtx.currentTime;
      var bufferSize = audioCtx.sampleRate * 2;
      var buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
      var data = buffer.getChannelData(0);
      for (var i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      rotateOscNode = audioCtx.createBufferSource();
      rotateOscNode.buffer = buffer;
      rotateOscNode.loop = true;
      rotateFilterNode = audioCtx.createBiquadFilter();
      rotateFilterNode.type = 'bandpass';
      rotateFilterNode.frequency.setValueAtTime(450, now);
      rotateFilterNode.Q.setValueAtTime(2.5, now);
      rotateGainNode = audioCtx.createGain();
      rotateGainNode.gain.setValueAtTime(0.001, now);
      rotateOscNode.connect(rotateFilterNode);
      rotateFilterNode.connect(rotateGainNode);
      rotateGainNode.connect(masterGain);
      rotateOscNode.start(now);
      isRotateSoundActive = true;
    } catch (e) {}
  }

  function updateRotateSound(velocity) {
    if (!isRotateSoundActive || !rotateGainNode || !audioCtx) return;
    try {
      var now = audioCtx.currentTime;
      var speed = Math.min(Math.abs(velocity) * 12, 1.0);
      var targetGain = speed * 0.12;
      var targetFreq = 350 + speed * 600;
      rotateGainNode.gain.cancelScheduledValues(now);
      rotateGainNode.gain.linearRampToValueAtTime(targetGain, now + 0.05);
      rotateFilterNode.frequency.cancelScheduledValues(now);
      rotateFilterNode.frequency.linearRampToValueAtTime(targetFreq, now + 0.05);
    } catch (e) {}
  }

  function stopRotateSound() {
    if (!isRotateSoundActive || !rotateGainNode || !audioCtx) return;
    try {
      var now = audioCtx.currentTime;
      rotateGainNode.gain.cancelScheduledValues(now);
      rotateGainNode.gain.linearRampToValueAtTime(0.0001, now + 0.08);
      setTimeout(function () {
        if (rotateOscNode) {
          try { rotateOscNode.stop(); rotateOscNode.disconnect(); } catch (e) {}
          rotateOscNode = null;
        }
        isRotateSoundActive = false;
      }, 100);
    } catch (e) {
      isRotateSoundActive = false;
    }
  }

  function playRatchetTick() {
    if (isAudioMuted || !audioCtx) return;
    try {
      var osc = audioCtx.createOscillator();
      var gain = audioCtx.createGain();
      var now = audioCtx.currentTime;
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(1200, now);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.015);
      osc.connect(gain);
      gain.connect(masterGain);
      osc.start(now);
      osc.stop(now + 0.02);
    } catch (e) {}
  }

  var scene, camera, renderer, threeAnimId = null;
  var buildingGroup, airplaneGroup, airplanePivot;
  var isDragging = false, prevMouseX = 0, buildingVelocity = 0;
  var buildingAngle = 0, airplaneOrbitAngle = 0;
  var ratchetAcc = 0;
  var mouseTargetX = 0, mouseTargetY = 0;
  var trailMesh = null, trailPositions = [];

  function makeWindowTexture() {
    var canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 256;
    var ctx = canvas.getContext('2d');
    ctx.fillStyle = '#18181b';
    ctx.fillRect(0, 0, 128, 256);
    ctx.fillStyle = '#ffffff';
    for (var y = 12; y < 244; y += 20) {
      for (var x = 10; x < 118; x += 18) {
        ctx.globalAlpha = Math.random() > 0.45 ? 0.75 : 0.15;
        ctx.fillRect(x, y, 10, 12);
      }
    }
    return new THREE.CanvasTexture(canvas);
  }

  function initThree() {
    try {
      var container = document.getElementById('three-container');
      if (!container || typeof THREE === 'undefined') return;

      var width = container.clientWidth || window.innerWidth;
      var height = container.clientHeight || window.innerHeight;

      scene = new THREE.Scene();
      scene.fog = new THREE.FogExp2(0x000000, 0.05);

      camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
      camera.position.set(0, 4.2, 11.5);
      camera.lookAt(0, 1.2, 0);

      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      container.innerHTML = '';
      container.appendChild(renderer.domElement);

      var ambLight = new THREE.AmbientLight(0xffffff, 0.85);
      scene.add(ambLight);

      var dirLight1 = new THREE.DirectionalLight(0xffffff, 1.2);
      dirLight1.position.set(8, 14, 8);
      scene.add(dirLight1);

      var dirLight2 = new THREE.DirectionalLight(0xa1a1aa, 0.6);
      dirLight2.position.set(-8, -4, -6);
      scene.add(dirLight2);

      buildingGroup = new THREE.Group();
      scene.add(buildingGroup);

      var winTex = makeWindowTexture();
      winTex.wrapS = THREE.RepeatWrapping;
      winTex.wrapT = THREE.RepeatWrapping;

      var buildingMat = new THREE.MeshStandardMaterial({
        color: 0xe4e4e7,
        roughness: 0.35,
        metalness: 0.15,
        map: winTex
      });

      var edgeMat = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.28 });

      function addBlock(w, h, d, y) {
        var geo = new THREE.BoxGeometry(w, h, d);
        var mesh = new THREE.Mesh(geo, buildingMat);
        mesh.position.y = y;
        buildingGroup.add(mesh);
        var edges = new THREE.EdgesGeometry(geo);
        var line = new THREE.LineSegments(edges, edgeMat);
        mesh.add(line);
        return mesh;
      }

      addBlock(5.2, 0.6, 5.2, 0.3);
      addBlock(4.2, 2.4, 4.2, 1.8);
      addBlock(3.0, 1.8, 3.0, 3.9);
      addBlock(1.4, 2.2, 1.4, 5.9);

      var groundGeo = new THREE.RingGeometry(0.1, 7.5, 64);
      var groundMat = new THREE.MeshBasicMaterial({ color: 0x27272a, side: THREE.DoubleSide });
      var ground = new THREE.Mesh(groundGeo, groundMat);
      ground.rotation.x = Math.PI / 2;
      ground.position.y = 0.01;
      scene.add(ground);

      var grid = new THREE.GridHelper(18, 36, 0x3f3f46, 0x1f1f23);
      grid.position.y = 0;
      scene.add(grid);

      airplanePivot = new THREE.Group();
      scene.add(airplanePivot);

      airplaneGroup = new THREE.Group();
      var craftMat = new THREE.MeshStandardMaterial({ color: 0xf4f4f5, roughness: 0.3, metalness: 0.2 });

      var bodyGeo = new THREE.CylinderGeometry(0.14, 0.18, 1.3, 16);
      var body = new THREE.Mesh(bodyGeo, craftMat);
      body.rotation.z = Math.PI / 2;
      airplaneGroup.add(body);

      var noseGeo = new THREE.ConeGeometry(0.18, 0.45, 16);
      var nose = new THREE.Mesh(noseGeo, craftMat);
      nose.rotation.z = -Math.PI / 2;
      nose.position.x = 0.85;
      airplaneGroup.add(nose);

      var wingGeo = new THREE.BoxGeometry(0.32, 0.04, 1.8);
      var wings = new THREE.Mesh(wingGeo, craftMat);
      wings.position.set(0.1, 0, 0);
      airplaneGroup.add(wings);

      var tailFinGeo = new THREE.BoxGeometry(0.24, 0.4, 0.04);
      var tailFin = new THREE.Mesh(tailFinGeo, craftMat);
      tailFin.position.set(-0.55, 0.22, 0);
      airplaneGroup.add(tailFin);

      var tailWingGeo = new THREE.BoxGeometry(0.18, 0.03, 0.65);
      var tailWing = new THREE.Mesh(tailWingGeo, craftMat);
      tailWing.position.set(-0.55, 0.06, 0);
      airplaneGroup.add(tailWing);

      airplaneGroup.position.set(5.5, 3.2, 0);
      airplaneGroup.rotation.z = THREE.MathUtils.degToRad(-12);
      airplanePivot.add(airplaneGroup);

      var trailCount = 40;
      for (var t = 0; t < trailCount; t++) {
        trailPositions.push(new THREE.Vector3(5.5, 3.2, 0));
      }
      var trailGeo = new THREE.BufferGeometry().setFromPoints(trailPositions);
      var trailMat = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.35 });
      trailMesh = new THREE.Line(trailGeo, trailMat);
      scene.add(trailMesh);

      function onPointerDown(e) {
        if (window.appState && window.appState.currentIndex !== 0) return;
        isDragging = true;
        resumeAudio();
        startRotateSound();
        prevMouseX = e.clientX || (e.touches && e.touches[0].clientX) || 0;
      }

      function onPointerMove(e) {
        var clientX = e.clientX || (e.touches && e.touches[0].clientX) || 0;
        var clientY = e.clientY || (e.touches && e.touches[0].clientY) || 0;
        mouseTargetX = (clientX / window.innerWidth - 0.5) * 1.2;
        mouseTargetY = (clientY / window.innerHeight - 0.5) * 0.8;

        if (!isDragging) return;
        var deltaX = clientX - prevMouseX;
        prevMouseX = clientX;
        var deltaAngle = deltaX * 0.007;
        buildingAngle += deltaAngle;
        buildingVelocity = deltaAngle;
        airplaneOrbitAngle -= deltaAngle * 0.85;

        updateRotateSound(deltaAngle);

        ratchetAcc += Math.abs(deltaAngle);
        if (ratchetAcc > THREE.MathUtils.degToRad(12)) {
          playRatchetTick();
          ratchetAcc = 0;
        }
      }

      function onPointerUp() {
        if (!isDragging) return;
        isDragging = false;
        stopRotateSound();
      }

      var dom = renderer.domElement;
      dom.addEventListener('mousedown', onPointerDown);
      window.addEventListener('mousemove', onPointerMove);
      window.addEventListener('mouseup', onPointerUp);

      dom.addEventListener('touchstart', onPointerDown, { passive: true });
      window.addEventListener('touchmove', onPointerMove, { passive: true });
      window.addEventListener('touchend', onPointerUp);

      window.addEventListener('resize', onResizeThree);
    } catch (err) {
      console.warn('Three.js initialization safely bypassed:', err);
    }
  }

  function renderSlideDOM(slide) {
    if (!slide) return '';
    var layout = slide.layout || 'cards';
    var out = '<div class="slide-wrap layout-' + layout + '"><div class="slide-content-stack">';

    if (layout === 'intro3d') {
      out = '<div class="slide-wrap layout-intro3d">' +
            '<div class="slide-intro-overlay anim-in">' +
            '<span class="slide-kicker fx">' + (slide.kicker || 'Selamat Datang') + '</span>' +
            '<h1 class="slide-title fx">' + wrapWords(slide.title) + '</h1>' +
            '<p class="slide-lead fx">' + parseGlossaryText(slide.lead || '') + '</p>' +
            '<button type="button" id="btn-start-presentation" class="btn-start-action fx">Mulai Pemaparan</button>' +
            '<div class="hint-drag fx">' + (slide.visual && slide.visual.hint ? slide.visual.hint : 'Seret gedung untuk memutarnya') + '</div>' +
            '</div></div>';
      return out;
    }

    if (layout === 'hero') {
      out += '<div class="hero-box anim-in">' +
             '<div class="logo-badge-large fx"><img src="logo_uin.png" alt="Logo UIN" class="logo-img" onerror="this.parentElement.style.display=\'none\'"></div>' +
             '<span class="slide-kicker fx">' + (slide.kicker || '') + '</span>' +
             '<h1 class="hero-title fx">' + wrapWords(slide.title) + '</h1>' +
             '<div class="hero-sub fx">' + (slide.subtitle || '') + '</div>' +
             '<div class="hero-meta fx">' + (slide.meta || '') + '</div>' +
             '</div>';
      out += '<div class="source-line anim-in fx">' + (slide.source || '') + '</div>';
      out += '</div></div>';
      return out;
    }

    out += '<div class="slide-top-head anim-in">' +
           '<span class="slide-kicker fx">' + (slide.kicker || '') + '</span>' +
           '<div class="slide-title-wrap"><h2 class="slide-title fx">' + wrapWords(slide.title) + '</h2></div>' +
           (slide.lead ? '<p class="slide-lead fx">' + parseGlossaryText(slide.lead) + '</p>' : '') +
           '</div>';

    if (layout === 'stats') {
      out += '<div class="stats-zone anim-in">';
      if (slide.stats && slide.stats.length) {
        out += '<div class="grid-stats">';
        slide.stats.forEach(function (st) {
          out += '<div class="stat-card-wrap"><div class="stat-card fx">' +
                 '<div class="stat-num count-target" data-target="' + st.n + '">0</div>' +
                 '<div class="stat-label">' + parseGlossaryText(st.l) + '</div>' +
                 '</div></div>';
        });
        out += '</div>';
      }
      if (slide.points && slide.points.length) {
        out += '<div class="points-list">';
        slide.points.forEach(function (pt) {
          out += '<div class="point-row-wrap"><div class="point-row fx">' +
                 '<div class="point-icon-box">' + (pt.icon || '<svg class="svg-icon" viewBox="0 0 24 24"><circle cx="12" cy="12" r="8"/></svg>') + '</div>' +
                 '<div class="point-text-box">' +
                 (pt.h ? '<div class="point-headline">' + pt.h + '</div>' : '') +
                 '<div class="point-desc">' + parseGlossaryText(pt.t) + '</div>' +
                 '</div></div></div>';
        });
        out += '</div>';
      }
      out += '</div>';
    } else if (layout === 'cards' || layout === 'pillars') {
      out += '<div class="grid-cards anim-in">';
      if (slide.points && slide.points.length) {
        slide.points.forEach(function (pt) {
          out += '<div class="card-item-wrap"><div class="card-item fx">' +
                 (pt.icon ? '<div class="card-icon-wrap">' + pt.icon + '</div>' : '') +
                 (pt.h ? '<h3 class="card-title">' + pt.h + '</h3>' : '') +
                 '<p class="card-text">' + parseGlossaryText(pt.t) + '</p>' +
                 '</div></div>';
        });
      }
      out += '</div>';
    } else if (layout === 'split') {
      out += '<div class="split-layout anim-in">';
      out += '<div class="split-visual fx">' + (slide.visual && slide.visual.html ? slide.visual.html : '') + '</div>';
      out += '<div class="points-list fx">';
      if (slide.points && slide.points.length) {
        slide.points.forEach(function (pt) {
          out += '<div class="point-row-wrap"><div class="point-row">' +
                 (pt.icon ? '<div class="point-icon-box">' + pt.icon + '</div>' : '') +
                 '<div class="point-text-box">' +
                 (pt.h ? '<div class="point-headline">' + pt.h + '</div>' : '') +
                 '<div class="point-desc">' + parseGlossaryText(pt.t) + '</div>' +
                 '</div></div></div>';
        });
      }
      out += '</div></div>';
    } else if (layout === 'versus') {
      out += '<div class="versus-grid anim-in">';
      if (slide.columns && slide.columns.length) {
        slide.columns.forEach(function (col) {
          out += '<div class="versus-column fx">' +
                 '<div class="versus-header"><h3 class="versus-title">' + col.title + '</h3>' +
                 '<div class="versus-subtitle">' + (col.sub || '') + '</div></div>' +
                 '<div class="points-list">';
          col.items.forEach(function (it) {
            out += '<div class="point-row"><div class="point-desc">' + parseGlossaryText(it) + '</div></div>';
          });
          out += '</div></div>';
        });
      }
      out += '</div>';
    } else if (layout === 'steps' || layout === 'route' || layout === 'cycle') {
      out += '<div class="timeline-steps anim-in">';
      if (slide.points && slide.points.length) {
        slide.points.forEach(function (st, idx) {
          out += '<div class="step-card fx">' +
                 '<div class="step-number">' + (idx + 1 < 10 ? '0' + (idx + 1) : idx + 1) + '</div>' +
                 (st.h ? '<div class="step-tag">' + st.h + '</div>' : '') +
                 '<div class="card-text">' + parseGlossaryText(st.t) + '</div>' +
                 '</div>';
        });
      }
      out += '</div>';
    } else if (layout === 'hub') {
      out += '<div class="hub-container anim-in">';
      if (slide.points && slide.points.length) {
        slide.points.forEach(function (hb) {
          out += '<div class="hub-node fx" data-info="' + (hb.desc || hb.t || '') + '">' +
                 '<div class="card-title">' + hb.h + '</div>' +
                 '<div class="card-text">' + parseGlossaryText(hb.t || '') + '</div>' +
                 '</div>';
        });
      }
      out += '</div>';
    } else if (layout === 'layers') {
      out += '<div class="layers-stack anim-in"><div class="layer-spine"></div>';
      if (slide.points && slide.points.length) {
        slide.points.forEach(function (ly) {
          out += '<div class="layer-bar fx">' +
                 '<div class="point-headline">' + ly.h + '</div>' +
                 '<div class="card-text">' + parseGlossaryText(ly.t) + '</div>' +
                 '</div>';
        });
      }
      out += '</div>';
    } else if (layout === 'table') {
      out += '<div class="table-matrix anim-in">';
      if (slide.table) {
        out += '<div class="table-row table-head">' +
               '<div>' + slide.table.headers[0] + '</div>' +
               '<div>' + slide.table.headers[1] + '</div>' +
               '<div>' + slide.table.headers[2] + '</div>' +
               '<div>' + slide.table.headers[3] + '</div>' +
               '</div>';
        slide.table.rows.forEach(function (r) {
          out += '<div class="table-row fx">' +
                 '<div class="point-headline">' + parseGlossaryText(r[0]) + '</div>' +
                 '<div class="card-text">' + parseGlossaryText(r[1]) + '</div>' +
                 '<div class="card-text">' + parseGlossaryText(r[2]) + '</div>' +
                 '<div class="card-text">' + parseGlossaryText(r[3]) + '</div>' +
                 '</div>';
        });
      }
      out += '</div>';
    } else if (layout === 'network') {
      out += '<div class="network-grid anim-in">';
      if (slide.points && slide.points.length) {
        slide.points.forEach(function (pt) {
          out += '<div class="network-node fx">' +
                 (pt.icon ? '<div class="card-icon-wrap">' + pt.icon + '</div>' : '') +
                 '<h3 class="card-title">' + pt.h + '</h3>' +
                 '<p class="card-text">' + parseGlossaryText(pt.t) + '</p>' +
                 '</div>';
        });
      }
      out += '</div>';
    } else if (layout === 'quote') {
      out += '<div class="quote-zone anim-in">';
      if (slide.visual && slide.visual.highlight) {
        out += '<div class="quote-statement fx">' + slide.visual.highlight + '</div>';
      }
      if (slide.points && slide.points.length) {
        out += '<div class="grid-cards" style="margin-top:24px;">';
        slide.points.forEach(function (pt) {
          out += '<div class="card-item fx">' +
                 '<h3 class="card-title">' + pt.h + '</h3>' +
                 '<p class="card-text">' + parseGlossaryText(pt.t) + '</p>' +
                 '</div>';
        });
        out += '</div>';
      }
      out += '</div>';
    } else if (layout === 'closing') {
      out += '<div class="hero-box anim-in">' +
             '<div class="logo-badge-large fx"><img src="logo_uin.png" alt="Logo UIN" class="logo-img" onerror="this.parentElement.style.display=\'none\'"></div>' +
             '<h1 class="hero-title fx">' + wrapWords(slide.title) + '</h1>' +
             '<div class="hero-sub fx">' + (slide.subtitle || 'Mari Berdiskusi') + '</div>' +
             '<div class="hero-meta fx">' + (slide.meta || '') + '</div>' +
             '</div>';
    }

    out += '<div class="source-line anim-in fx">' + (slide.source || '') + '</div>';
    out += '</div></div>';
    return out;
  }

  function goToSlide(targetIndex, forward, isInitial) {
    if (!appState.slides || appState.slides.length === 0) return;
    if (targetIndex < 0 || targetIndex >= appState.slides.length) return;

    if (appState.isTransitioning) {
      if (typeof gsap !== 'undefined') gsap.killTweensOf('*');
      appState.isTransitioning = false;
    }

    if (!isInitial) {
      appState.isTransitioning = true;
      resumeAudio();
      playNav(forward !== undefined ? forward : targetIndex > appState.currentIndex);
    }

    var stage = document.getElementById('slide-stage');
    var transitionTypeIndex = targetIndex % 3;

    if (targetIndex === 0) {
      startThreeLoop();
    } else {
      stopThreeLoop();
    }

    function swapContent() {
      appState.currentIndex = targetIndex;
      applySlideTheme(targetIndex);
      updateChapterRail(targetIndex);
      updateFooter(targetIndex);
      updatePresenterPanel(targetIndex);

      stage.innerHTML = renderSlideDOM(appState.slides[targetIndex]);
      runEntranceMotion(stage);
      bindCardSpotlight(stage);

      if (targetIndex === 0) {
        var btnStart = document.getElementById('btn-start-presentation');
        if (btnStart) {
          btnStart.addEventListener('click', function () {
            playStartSwell();
            try {
              if (document.documentElement.requestFullscreen) {
                document.documentElement.requestFullscreen().catch(function () {});
              } else if (document.documentElement.webkitRequestFullscreen) {
                document.documentElement.webkitRequestFullscreen();
              }
            } catch (e) {}
            goToSlide(1, true);
          });
        }
      }
    }

    /* Skip heavy transition masks on first startup to avoid blank screen */
    if (isInitial || typeof gsap === 'undefined') {
      swapContent();
      appState.isTransitioning = false;
      return;
    }

    if (transitionTypeIndex === 0) {
      var circleMask = document.createElement('div');
      circleMask.style.position = 'fixed';
      circleMask.style.inset = '0';
      circleMask.style.zIndex = '75';
      circleMask.style.pointerEvents = 'none';
      circleMask.style.backgroundColor = 'var(--bg-color)';
      circleMask.style.clipPath = 'circle(0% at 50% 50%)';
      document.body.appendChild(circleMask);

      gsap.to(circleMask, {
        clipPath: 'circle(150% at 50% 50%)',
        duration: 0.65,
        ease: 'power3.inOut',
        onStart: function () {
          setTimeout(swapContent, 280);
        },
        onComplete: function () {
          circleMask.remove();
          appState.isTransitioning = false;
        }
      });
    } else if (transitionTypeIndex === 1) {
      var shutterBars = document.querySelectorAll('.shutter-bar');
      gsap.set(shutterBars, { transformOrigin: 'top', scaleY: 0 });
      gsap.to(shutterBars, {
        scaleY: 1,
        duration: 0.32,
        stagger: 0.04,
        ease: 'power2.in',
        onComplete: function () {
          swapContent();
          gsap.set(shutterBars, { transformOrigin: 'bottom' });
          gsap.to(shutterBars, {
            scaleY: 0,
            duration: 0.35,
            stagger: 0.04,
            ease: 'power2.out',
            onComplete: function () {
              appState.isTransitioning = false;
            }
          });
        }
      });
    } else {
      gsap.to(stage, {
        scale: 0.95,
        opacity: 0,
        filter: 'blur(10px)',
        duration: 0.28,
        ease: 'power2.in',
        onComplete: function () {
          swapContent();
          gsap.fromTo(stage,
            { scale: 1.05, opacity: 0, filter: 'blur(8px)' },
            { scale: 1, opacity: 1, filter: 'blur(0px)', duration: 0.38, ease: 'power2.out', onComplete: function () {
              appState.isTransitioning = false;
            }}
          );
        }
      });
    }
  }

  function initApp() {
    var stage = document.getElementById('slide-stage');

    if (window.DECK && window.DECK.slides && window.DECK.slides.length > 0) {
      appState.slides = window.DECK.slides;
    } else {
      if (stage) {
        stage.innerHTML = '<div style="text-align:center;padding:40px;color:#fff;">' +
                          '<h2 style="font-size:1.8rem;margin-bottom:12px;">Memuat Data Presentasi...</h2>' +
                          '<p style="color:#a1a1aa;">Pastikan slides.js berada di direktori yang sama dengan index.html.</p>' +
                          '</div>';
      }
      return;
    }

    initThree();
    initEvents();
    goToSlide(0, false, true);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
  } else {
    initApp();
  }
})();
