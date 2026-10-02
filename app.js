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
    var container = document.getElementById('three-container');
    if (!container) return;

    var width = container.clientWidth || window.innerWidth;
    var height = container.clientHeight || window.innerHeight;

    scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x000000, 0.05);

    camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 4.2, 11.5);
    camera.lookAt(0, 1.2, 0);

    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
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

    var trailCount = 60;
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
  }

  function onResizeThree() {
    if (!renderer || !camera) return;
    var container = document.getElementById('three-container');
    var w = container ? container.clientWidth : window.innerWidth;
    var h = container ? container.clientHeight : window.innerHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  }

  function loopThree() {
    if (!renderer || !scene || !camera) return;

    if (!isDragging) {
      buildingAngle += 0.0018;
      buildingVelocity *= 0.95;
      buildingAngle += buildingVelocity;
      if (Math.abs(buildingVelocity) > 0.0005) {
        updateRotateSound(buildingVelocity);
        ratchetAcc += Math.abs(buildingVelocity);
        if (ratchetAcc > THREE.MathUtils.degToRad(12)) {
          playRatchetTick();
          ratchetAcc = 0;
        }
      } else if (isRotateSoundActive) {
        stopRotateSound();
      }
    }

    buildingGroup.rotation.y = buildingAngle;

    airplaneOrbitAngle += 0.007;
    airplanePivot.rotation.y = airplaneOrbitAngle;

    var time = Date.now() * 0.002;
    airplaneGroup.position.y = 3.2 + Math.sin(time) * 0.22;
    airplaneGroup.rotation.x = Math.cos(time) * 0.08;

    camera.position.x += (mouseTargetX * 2.2 - camera.position.x) * 0.05;
    camera.position.y += (4.2 - mouseTargetY * 1.5 - camera.position.y) * 0.05;
    camera.lookAt(0, 1.4, 0);

    if (trailMesh && airplaneGroup) {
      var craftWorldPos = new THREE.Vector3();
      airplaneGroup.getWorldPosition(craftWorldPos);
      trailPositions.unshift(craftWorldPos);
      trailPositions.pop();
      trailMesh.geometry.setFromPoints(trailPositions);
    }

    renderer.render(scene, camera);
    threeAnimId = requestAnimationFrame(loopThree);
  }

  function startThreeLoop() {
    if (!threeAnimId) {
      onResizeThree();
      threeAnimId = requestAnimationFrame(loopThree);
    }
  }

  function stopThreeLoop() {
    if (threeAnimId) {
      cancelAnimationFrame(threeAnimId);
      threeAnimId = null;
    }
    stopRotateSound();
  }

  function parseGlossaryText(text) {
    if (!text) return '';
    return text.replace(/\[\[(.*?)\|(.*?)\]\]/g, function (_, label, key) {
      return '<button type="button" class="btn-glossary" data-term="' + key + '">' + label + '</button>';
    });
  }

  function wrapWords(text) {
    if (!text) return '';
    return text.split(' ').map(function (w) {
      return '<span class="title-word">' + w + '</span> ';
    }).join('');
  }

  function renderSlideDOM(slide) {
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

  var appState = {
    currentIndex: 0,
    isTransitioning: false,
    isPresenterOpen: false,
    slides: []
  };
  window.appState = appState;

  function runEntranceMotion(stageEl) {
    var words = stageEl.querySelectorAll('.title-word');
    if (words.length) {
      gsap.fromTo(words,
        { y: 32, opacity: 0, filter: 'blur(8px)' },
        { y: 0, opacity: 1, filter: 'blur(0px)', duration: 0.65, stagger: 0.04, ease: 'power3.out', immediateRender: true }
      );
    }

    var animCards = stageEl.querySelectorAll('.stat-card, .card-item, .step-card, .versus-column, .layer-bar, .hub-node, .table-row');
    if (animCards.length) {
      gsap.fromTo(animCards,
        { scale: 0.94, opacity: 0, y: 20 },
        { scale: 1, opacity: 1, y: 0, duration: 0.6, stagger: 0.06, ease: 'expo.out', immediateRender: true }
      );
    }

    var pointRows = stageEl.querySelectorAll('.point-row');
    if (pointRows.length) {
      gsap.fromTo(pointRows,
        { x: -16, opacity: 0 },
        { x: 0, opacity: 1, duration: 0.5, stagger: 0.05, ease: 'power2.out', immediateRender: true }
      );
    }

    var countTargets = stageEl.querySelectorAll('.count-target');
    countTargets.forEach(function (el) {
      var target = parseFloat(el.getAttribute('data-target')) || 0;
      var obj = { val: 0 };
      gsap.to(obj, {
        val: target,
        duration: 1.2,
        ease: 'power3.out',
        onUpdate: function () {
          el.textContent = Math.round(obj.val);
        }
      });
    });

    var lines = stageEl.querySelectorAll('.layer-spine, .shutter-bar');
    if (lines.length) {
      gsap.fromTo(lines, { scaleY: 0 }, { scaleY: 1, duration: 0.7, ease: 'power2.out', immediateRender: true });
    }

    setTimeout(function () {
      var allFx = stageEl.querySelectorAll('.fx, .anim-in, .title-word');
      allFx.forEach(function (el) {
        el.style.opacity = '1';
        el.style.pointerEvents = 'auto';
      });
    }, 1800);
  }

  function applySlideTheme(slideIndex) {
    var darkIndices = [0, 1, 3, 16, 17, 21, 22];
    var isDark = darkIndices.indexOf(slideIndex) !== -1;
    if (isDark) {
      document.body.classList.remove('theme-light');
      document.body.classList.add('theme-dark');
    } else {
      document.body.classList.remove('theme-dark');
      document.body.classList.add('theme-light');
    }
  }

  function updateChapterRail(slideIndex) {
    var rail = document.getElementById('chapter-rail');
    if (!rail) return;
    if (slideIndex <= 5) {
      rail.style.display = 'none';
      return;
    }
    rail.style.display = 'flex';

    var currentChapter = 'A';
    if (slideIndex >= 6 && slideIndex <= 7) currentChapter = 'A';
    else if (slideIndex === 8) currentChapter = 'B';
    else if (slideIndex >= 9 && slideIndex <= 15) currentChapter = 'C';
    else if (slideIndex >= 16 && slideIndex <= 17) currentChapter = 'D';
    else if (slideIndex >= 18 && slideIndex <= 20) currentChapter = 'E';
    else if (slideIndex >= 21) currentChapter = 'F';

    var dots = rail.querySelectorAll('.rail-dot');
    dots.forEach(function (dot) {
      if (dot.getAttribute('data-chapter') === currentChapter) {
        dot.classList.add('active');
      } else {
        dot.classList.remove('active');
      }
    });
  }

  function updateFooter(slideIndex) {
    var total = appState.slides.length || 23;
    var currentNum = slideIndex + 1;
    var counterEl = document.getElementById('slide-counter');
    if (counterEl) {
      counterEl.textContent = (currentNum < 10 ? '0' + currentNum : currentNum) + ' / ' + (total < 10 ? '0' + total : total);
    }

    var progressBar = document.getElementById('progress-bar');
    if (progressBar) {
      var pct = (slideIndex / (total - 1)) * 100;
      progressBar.style.width = pct + '%';
    }

    var nextTitleEl = document.getElementById('next-title-text');
    if (nextTitleEl) {
      if (slideIndex + 1 < total) {
        var nextSlide = appState.slides[slideIndex + 1];
        nextTitleEl.textContent = nextSlide ? nextSlide.title : 'Slide Berikutnya';
      } else {
        nextTitleEl.textContent = 'Akhir Presentasi';
      }
    }
  }

  function updatePresenterPanel(slideIndex) {
    var contentEl = document.getElementById('presenter-content');
    if (!contentEl) return;
    var slide = appState.slides[slideIndex];
    if (slide && slide.script) {
      var paras = slide.script.split('\n\n').filter(Boolean);
      contentEl.innerHTML = paras.map(function (p) {
        return '<p>' + p.trim() + '</p>';
      }).join('');
    } else {
      contentEl.innerHTML = '<p>Tidak ada catatan untuk slide ini.</p>';
    }
  }

  function goToSlide(targetIndex, forward) {
    if (targetIndex < 0 || targetIndex >= appState.slides.length) return;
    if (appState.isTransitioning) {
      gsap.killTweensOf('*');
      appState.isTransitioning = false;
    }

    appState.isTransitioning = true;
    resumeAudio();
    playNav(forward !== undefined ? forward : targetIndex > appState.currentIndex);

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

  function bindCardSpotlight(container) {
    var cards = container.querySelectorAll('.stat-card, .card-item, .step-card, .versus-column');
    cards.forEach(function (c) {
      c.addEventListener('mousemove', function (e) {
        var rect = c.getBoundingClientRect();
        var x = e.clientX - rect.left;
        var y = e.clientY - rect.top;
        c.style.setProperty('--mx', x + 'px');
        c.style.setProperty('--my', y + 'px');

        var cx = rect.width / 2;
        var cy = rect.height / 2;
        var rotX = ((y - cy) / cy) * -6;
        var rotY = ((x - cx) / cx) * 6;
        c.style.transform = 'perspective(1000px) rotateX(' + rotX.toFixed(2) + 'deg) rotateY(' + rotY.toFixed(2) + 'deg)';
      });
      c.addEventListener('mouseleave', function () {
        c.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg)';
      });
    });
  }

  function showGlossaryModal(key) {
    if (!window.DECK || !window.DECK.glossary) return;
    var info = window.DECK.glossary[key];
    if (!info) return;

    var backdrop = document.getElementById('glossary-backdrop');
    var titleEl = document.getElementById('glossary-title');
    var defEl = document.getElementById('glossary-def');
    var exampleEl = document.getElementById('glossary-example');

    titleEl.textContent = info.t || key;
    defEl.textContent = info.d || '';
    exampleEl.textContent = info.c || '';

    backdrop.classList.add('open');
    backdrop.setAttribute('aria-hidden', 'false');
    playGlossarySound(true);
  }

  function closeGlossaryModal() {
    var backdrop = document.getElementById('glossary-backdrop');
    if (!backdrop || !backdrop.classList.contains('open')) return;
    backdrop.classList.remove('open');
    backdrop.setAttribute('aria-hidden', 'true');
    playGlossarySound(false);
  }

  function togglePresenterPanel() {
    var panel = document.getElementById('presenter-panel');
    if (!panel) return;
    appState.isPresenterOpen = !appState.isPresenterOpen;
    if (appState.isPresenterOpen) {
      panel.classList.add('open');
      panel.setAttribute('aria-hidden', 'false');
    } else {
      panel.classList.remove('open');
      panel.setAttribute('aria-hidden', 'true');
    }
  }

  function initEvents() {
    document.addEventListener('click', function (e) {
      resumeAudio();
      var target = e.target;

      if (target.closest('.btn-glossary')) {
        var btn = target.closest('.btn-glossary');
        var termKey = btn.getAttribute('data-term');
        showGlossaryModal(termKey);
        return;
      }

      if (target.closest('#btn-next')) {
        playClick();
        goToSlide(appState.currentIndex + 1, true);
        return;
      }
      if (target.closest('#btn-prev')) {
        playClick();
        goToSlide(appState.currentIndex - 1, false);
        return;
      }
      if (target.closest('#next-slide-preview')) {
        playClick();
        goToSlide(appState.currentIndex + 1, true);
        return;
      }

      if (target.closest('.rail-dot')) {
        var dot = target.closest('.rail-dot');
        var ch = dot.getAttribute('data-chapter');
        var targetIndex = -1;
        if (ch === 'A') targetIndex = 6;
        else if (ch === 'B') targetIndex = 8;
        else if (ch === 'C') targetIndex = 9;
        else if (ch === 'D') targetIndex = 16;
        else if (ch === 'E') targetIndex = 18;
        else if (ch === 'F') targetIndex = 21;
        if (targetIndex !== -1) {
          playClick();
          goToSlide(targetIndex);
        }
        return;
      }

      if (target.closest('#btn-close-glossary') || target.id === 'glossary-backdrop') {
        closeGlossaryModal();
        return;
      }

      if (target.closest('#btn-close-presenter')) {
        togglePresenterPanel();
        return;
      }

      if (target.closest('#mute-toggle')) {
        isAudioMuted = !isAudioMuted;
        var iconOn = document.querySelector('.icon-audio-on');
        var iconOff = document.querySelector('.icon-audio-off');
        if (iconOn && iconOff) {
          iconOn.style.display = isAudioMuted ? 'none' : 'block';
          iconOff.style.display = isAudioMuted ? 'block' : 'none';
        }
        return;
      }

      if (target.closest('#fullscreen-toggle')) {
        playClick();
        try {
          if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(function () {});
          } else {
            document.exitFullscreen().catch(function () {});
          }
        } catch (err) {}
        return;
      }

      if (target.closest('button') || target.closest('a')) {
        playClick();
      }
    });

    document.addEventListener('fullscreenchange', function () {
      var iconEnter = document.querySelector('.icon-fs-enter');
      var iconExit = document.querySelector('.icon-fs-exit');
      if (iconEnter && iconExit) {
        var isFs = !!document.fullscreenElement;
        iconEnter.style.display = isFs ? 'none' : 'block';
        iconExit.style.display = isFs ? 'block' : 'none';
      }
      onResizeThree();
    });

    window.addEventListener('keydown', function (e) {
      resumeAudio();

      if (e.key === 'Escape') {
        closeGlossaryModal();
        if (appState.isPresenterOpen) togglePresenterPanel();
        return;
      }

      if (e.key === 'n' || e.key === 'N') {
        togglePresenterPanel();
        return;
      }

      if (e.key === 'm' || e.key === 'M') {
        var muteBtn = document.getElementById('mute-toggle');
        if (muteBtn) muteBtn.click();
        return;
      }

      if (e.key === 'f' || e.key === 'F') {
        var fsBtn = document.getElementById('fullscreen-toggle');
        if (fsBtn) fsBtn.click();
        return;
      }

      if (appState.isPresenterOpen && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) {
        var panelBody = document.getElementById('presenter-content');
        if (panelBody) {
          panelBody.scrollTop += e.key === 'ArrowDown' ? 60 : -60;
          return;
        }
      }

      if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'PageDown') {
        e.preventDefault();
        goToSlide(appState.currentIndex + 1, true);
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        e.preventDefault();
        goToSlide(appState.currentIndex - 1, false);
      } else if (e.key === 'Home') {
        e.preventDefault();
        goToSlide(0, false);
      } else if (e.key === 'End') {
        e.preventDefault();
        goToSlide(appState.slides.length - 1, true);
      }
    });

    var touchStartX = 0;
    var touchStartY = 0;
    window.addEventListener('touchstart', function (e) {
      if (e.touches && e.touches.length === 1) {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
      }
    }, { passive: true });

    window.addEventListener('touchend', function (e) {
      if (e.changedTouches && e.changedTouches.length === 1) {
        var deltaX = e.changedTouches[0].clientX - touchStartX;
        var deltaY = e.changedTouches[0].clientY - touchStartY;
        if (Math.abs(deltaX) > 50 && Math.abs(deltaY) < 60) {
          if (deltaX < 0) {
            goToSlide(appState.currentIndex + 1, true);
          } else {
            goToSlide(appState.currentIndex - 1, false);
          }
        }
      }
    }, { passive: true });
  }

  function initApp() {
    if (window.DECK && window.DECK.slides) {
      appState.slides = window.DECK.slides;
    }
    initThree();
    initEvents();
    goToSlide(0);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
  } else {
    initApp();
  }
})();
