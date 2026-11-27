/* 3D caricature for the hero (Three.js).
   - Rigged model (Mixamo skeleton): the gaze is split across Spine2 / Neck / Head bones, computed in
     world space so it doesn't depend on each bone's local axes.
   - Eyes: the model's eyes are painted in its texture, so at load time each eye is captured from the
     front into a small off-screen render. From that capture we build (a) the eye with its pupil
     painted out (row-by-row sclera colour, eyelid line kept), (b) the iris itself and (c) the shape of
     the eye opening. A patch parented to the Head bone redraws the eye and lets the iris slide toward
     the cursor inside the opening. Because the patch is made of the model's own pixels, it has no seam.
   - Unrigged model fallback: vertex-shader neck rotation.
   avatar.js drives everything through window.Avatar3D.look(x, y) with x, y in -1..1. */
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';

const stage = document.getElementById('avatarStage');
const host = document.getElementById('avScene');
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const params = new URLSearchParams(location.search);
const DEBUG = params.has('debug');

/* Eye regions are world-space boxes around each eye opening, in the normalised rest pose
   (model scaled to height 1, waist at y=0). Measured once with ?debug. */
const DEFAULT = {
  url: 'assets/models/avatar.glb',
  yaw: 0,
  eyes: [
    { c: [-0.0562, 0.7726, 0.1426], size: [0.091, 0.049] },
    { c: [0.0554, 0.7728, 0.1430], size: [0.092, 0.049] },
  ],
};

function webglOK() {
  try { const c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')); } catch (e) { return false; }
}

if (stage && host && webglOK()) {
  // Show the 2D fallback only if the 3D version fails, or is still not ready after 10 s (slow network).
  const slow = setTimeout(() => { if (!stage.classList.contains('has3d')) stage.classList.add('no3d'); }, 10000);
  init().catch((err) => { console.warn('[avatar3d] falling back to 2D:', err); stage.classList.add('no3d'); }).finally(() => clearTimeout(slow));
} else if (stage) {
  stage.classList.add('no3d');
}

async function init() {
  const alt = params.get('model');
  const cfg = alt && /^[a-z0-9-]+$/.test(alt)
    ? { url: `assets/models/avatar-${alt}.glb`, yaw: Number(params.get('yaw') || 0), eyes: [] }
    : DEFAULT;

  const canvas = document.createElement('canvas');
  canvas.className = 'av-canvas';
  canvas.setAttribute('aria-hidden', 'true');
  host.insertBefore(canvas, host.querySelector('.av-figure'));

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'low-power', preserveDrawingBuffer: DEBUG });
  renderer.setPixelRatio(Math.min(2, devicePixelRatio || 1));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.NeutralToneMapping; // keeps the texture's own skin tones
  renderer.toneMappingExposure = 1.0;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(24, 1, 0.01, 20);

  // Bright, frontal, soft light so the face reads clearly; near-white rims (coloured ones turned the hair purple).
  scene.add(new THREE.HemisphereLight(0xffffff, 0xbdbdbd, 1.9));
  const key = new THREE.DirectionalLight(0xffffff, 1.5); key.position.set(0.3, 0.8, 2.5); scene.add(key);
  const fill = new THREE.DirectionalLight(0xffffff, 0.6); fill.position.set(-1.2, 0.4, 1.5); scene.add(fill);
  const rimL = new THREE.DirectionalLight(0xdfe6ff, 0.9); rimL.position.set(-1.6, 1.2, -1.2); scene.add(rimL);
  const rimR = new THREE.DirectionalLight(0xffe8d2, 0.7); rimR.position.set(1.6, 1.0, -1.2); scene.add(rimR);

  const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
  const gltf = await loader.loadAsync(cfg.url);
  const root = gltf.scene;
  const holder = new THREE.Group(); // orientation fix + normalisation live here
  holder.add(root);
  scene.add(holder);
  holder.rotation.y = cfg.yaw;

  let skinned = null;
  const bones = {};
  root.traverse((o) => {
    if (o.isSkinnedMesh) skinned = o;
    if (o.isBone) {
      if (/Head$/.test(o.name)) bones.head = o;
      else if (/Neck$/.test(o.name)) bones.neck = o;
      else if (/Spine2$/.test(o.name)) bones.spine = o;
    }
    if (o.isMesh) {
      o.frustumCulled = false;
      const m = o.material;
      m.metalness = 0;
      if (!m.roughnessMap) m.roughness = 0.9;
      const aniso = renderer.capabilities.getMaxAnisotropy();
      for (const t of [m.map, m.normalMap, m.roughnessMap]) if (t) t.anisotropy = aniso;
      // Lift the texture a little (it already has baked shading) so eyes and skin don't sink into shadow.
      if (m.map) { m.emissive = new THREE.Color(0xffffff); m.emissiveMap = m.map; m.emissiveIntensity = 0.28; }
    }
  });
  const rigged = !!(bones.head && bones.neck);

  // Normalise: centre horizontally, waist at y=0, height 1.
  holder.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(holder, true);
  const size = box.getSize(new THREE.Vector3());
  const centre = box.getCenter(new THREE.Vector3());
  const s = 1 / size.y;
  holder.scale.setScalar(s);
  holder.position.set(-centre.x * s, -box.min.y * s, -centre.z * s);
  holder.updateMatrixWorld(true);

  /* ---------- Gaze: bones (rigged) or vertex shader (unrigged) ---------- */
  let applyGaze;
  if (rigged) {
    const chain = [
      { bone: bones.spine, share: 0.15 },
      { bone: bones.neck, share: 0.4 },
      { bone: bones.head, share: 1 }, // cumulative: the head ends at the full rotation
    ].filter((c) => c.bone);
    chain.forEach((c) => { c.restWorld = c.bone.getWorldQuaternion(new THREE.Quaternion()); });
    const tmpQ = new THREE.Quaternion(), parentQ = new THREE.Quaternion(), rotQ = new THREE.Quaternion(), e = new THREE.Euler();
    applyGaze = (yaw, pitch) => {
      for (const c of chain) {
        e.set(pitch * c.share, yaw * c.share, 0, 'YXZ');
        rotQ.setFromEuler(e);
        tmpQ.copy(rotQ).multiply(c.restWorld);                   // desired world rotation
        c.bone.parent.getWorldQuaternion(parentQ);
        c.bone.quaternion.copy(parentQ.invert().multiply(tmpQ)); // back to local
        c.bone.updateMatrixWorld(true);
      }
    };
  } else {
    const U = installNeckShader(root);
    applyGaze = (yaw, pitch) => { U.uYaw.value = yaw; U.uPitch.value = pitch; holder.rotation.y = cfg.yaw + yaw * 0.25; };
  }

  /* ---------- Eyes (captured in the rest pose, before the first gaze is applied) ---------- */
  let eyeCtl = null;
  if (rigged && skinned && cfg.eyes.length) {
    try {
      applyGaze(0, 0);
      holder.updateMatrixWorld(true);
      const data = cfg.eyes.map((region) => buildEye(renderer, scene, region));
      eyeCtl = installEyeShader(skinned, data);
    } catch (err) {
      console.warn('[avatar3d] eyes disabled:', err);
      eyeCtl = null;
    }
  }
  const eyes = eyeCtl ? [eyeCtl] : [];

  // Frame the bust.
  camera.position.set(0, 0.6, 2.75);
  camera.lookAt(0, 0.56, 0);

  const resize = () => {
    const r = host.getBoundingClientRect();
    renderer.setSize(r.width, r.height, false);
    camera.aspect = r.width / Math.max(1, r.height);
    camera.updateProjectionMatrix();
    draw();
  };
  new ResizeObserver(resize).observe(host);

  // The head eases slowly; the eyes lead (they move faster than the head, like a real glance).
  const st = { x: -0.45, y: -0.05, tx: -0.45, ty: -0.05, ex: -0.45, ey: -0.05, blink: 0, smile: 0, raf: 0 };
  function draw() {
    applyGaze(st.x * 0.6, st.y * 0.3);
    // Eyes cover what the head hasn't turned yet, so they keep pointing at the cursor.
    for (const eye of eyes) eye.set(st.ex * 1.6 - st.x * 0.9, st.ey * 1.4 - st.y * 0.6, st.blink, st.smile);
    renderer.render(scene, camera);
  }
  const ease = (t) => t * t * (3 - 2 * t);
  let smiling = false;
  function tick() {
    st.raf = 0;
    const kh = reduced ? 1 : 0.08, ke = reduced ? 1 : 0.28;
    st.x += (st.tx - st.x) * kh; st.y += (st.ty - st.y) * kh;
    st.ex += (st.tx - st.ex) * ke; st.ey += (st.ty - st.ey) * ke;
    draw();
    const moving = Math.abs(st.tx - st.x) > 0.001 || Math.abs(st.ty - st.y) > 0.001;
    if (moving) st.raf = requestAnimationFrame(tick);
  }
  window.Avatar3D = {
    look(x, y) {
      st.tx = Math.max(-1, Math.min(1, x));
      st.ty = Math.max(-1, Math.min(1, y));
      if (!st.raf) st.raf = requestAnimationFrame(tick);
    },
    blink() {
      if (!eyes.length || reduced) return;
      const t0 = performance.now();
      const step = (now) => {
        const k = (now - t0) / 170; // ~170 ms close + open
        st.blink = k < 0.5 ? k * 2 : Math.max(0, 2 - k * 2);
        draw();
        if (k < 1) requestAnimationFrame(step); else { st.blink = 0; draw(); }
      };
      requestAnimationFrame(step);
    },
    // Discreet half smile: eases in (~0.4 s), holds, eases out (~0.5 s).
    smile(hold = 1800) {
      if (!eyes.length || smiling) return;
      smiling = true;
      const t0 = performance.now(), IN = reduced ? 1 : 420, OUT = reduced ? 1 : 520;
      const step = (now) => {
        const t = now - t0;
        st.smile = t < IN ? ease(t / IN) : t < IN + hold ? 1 : Math.max(0, 1 - ease((t - IN - hold) / OUT));
        draw();
        if (t < IN + hold + OUT) requestAnimationFrame(step); else { st.smile = 0; smiling = false; draw(); }
      };
      requestAnimationFrame(step);
    },
  };
  // Occasional blink and an occasional smile (small, and they don't move the page, so phones get them too).
  if (eyes.length && !reduced) {
    (function loop() { setTimeout(() => { window.Avatar3D.blink(); loop(); }, 2600 + Math.random() * 3600); })();
    (function loop() { setTimeout(() => { window.Avatar3D.smile(1600 + Math.random() * 1200); loop(); }, 9000 + Math.random() * 7000); })();
  }

  if (DEBUG) {
    // Click the face to log the hit point (world, rest-normalised) — used to place the eye regions.
    const ray = new THREE.Raycaster();
    window.__av = { THREE, scene, camera, renderer, root, holder, skinned, bones, draw, eyes, st, applyGaze };
    canvas.style.pointerEvents = 'auto';
    canvas.addEventListener('click', (ev) => {
      const r = canvas.getBoundingClientRect();
      ray.setFromCamera(new THREE.Vector2(((ev.clientX - r.left) / r.width) * 2 - 1, -((ev.clientY - r.top) / r.height) * 2 + 1), camera);
      const hit = ray.intersectObject(skinned || root, true)[0];
      console.log('[avatar3d] hit', hit ? hit.point.toArray().map((v) => +v.toFixed(4)) : 'miss');
    });
  }

  resize();
  stage.classList.add('has3d');
}

/* ---------------- Eye capture + patch ---------------- */
function buildEye(renderer, scene, region) {
  const [cx, cy, cz] = region.c, [w, h] = region.size;
  const cap = captureRegion(renderer, scene, region);
  const { W, H, px } = cap; // px: Uint8ClampedArray RGBA, row 0 = bottom (GL order)
  const N = W * H;
  const lum = new Float32Array(N), sat = new Float32Array(N);
  const isSkin = new Uint8Array(N);
  for (let i = 0; i < N; i++) {
    const r = px[i * 4] / 255, g = px[i * 4 + 1] / 255, b = px[i * 4 + 2] / 255, a = px[i * 4 + 3];
    const mx = Math.max(r, g, b), mn = Math.min(r, g, b);
    lum[i] = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    sat[i] = mx > 0 ? (mx - mn) / mx : 0;
    isSkin[i] = a < 10 || (sat[i] > 0.28 && lum[i] > 0.2 && r >= g && g >= b * 0.85) ? 1 : 0;
  }
  // Eye opening = everything NOT reachable from the patch border through skin. Flooding the skin
  // (instead of the eye) means brownish iris pixels that look like skin can't punch holes in it.
  const outside = new Uint8Array(N);
  const stack = [];
  for (let x = 0; x < W; x++) for (const y of [0, H - 1]) { const i = y * W + x; if (isSkin[i] && !outside[i]) { outside[i] = 1; stack.push(i); } }
  for (let y = 0; y < H; y++) for (const x of [0, W - 1]) { const i = y * W + x; if (isSkin[i] && !outside[i]) { outside[i] = 1; stack.push(i); } }
  while (stack.length) {
    const i = stack.pop(), x = i % W, y = (i / W) | 0;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx, ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
      const j = ny * W + nx;
      if (!outside[j] && isSkin[j]) { outside[j] = 1; stack.push(j); }
    }
  }
  const open = new Uint8Array(N);
  for (let i = 0; i < N; i++) open[i] = outside[i] || px[i * 4 + 3] < 10 ? 0 : 1;
  if (!open[(H >> 1) * W + (W >> 1)]) throw new Error('eye centre is skin');
  // Interior (eyelid line excluded) = opening eroded by a few pixels.
  const E = Math.max(2, Math.round(W / 90));
  const inner = new Uint8Array(N);
  for (let y = E; y < H - E; y++) for (let x = E; x < W - E; x++) {
    let ok = open[y * W + x];
    for (let dy = -E; ok && dy <= E; dy++) for (let dx = -E; ok && dx <= E; dx++) ok = open[(y + dy) * W + x + dx];
    inner[y * W + x] = ok ? 1 : 0;
  }
  // Opening minus a single pixel: the moving iris is clipped to this, so it reaches the lash line
  // (dark on dark, invisible) and never leaves a white sliver between iris and eyelid.
  const inner1 = new Uint8Array(N);
  for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) {
    const i = y * W + x;
    inner1[i] = open[i] && open[i - 1] && open[i + 1] && open[i - W] && open[i + W] ? 1 : 0;
  }
  // Iris: dark pixels inside the interior.
  let sx = 0, sy = 0, n = 0, top = -1, bot = H;
  for (let i = 0; i < N; i++) {
    if (inner[i]) { const y = (i / W) | 0; top = Math.max(top, y); bot = Math.min(bot, y); }
    if (inner[i] && lum[i] < 0.2) { sx += i % W; sy += (i / W) | 0; n++; }
  }
  if (n < 30) throw new Error('iris not found');
  const ix = sx / n, iy = sy / n;
  let l = Math.round(ix), rr = Math.round(ix);
  const row = Math.round(iy) * W;
  while (l > 0 && inner[row + l - 1] && lum[row + l - 1] < 0.32) l--;
  while (rr < W - 1 && inner[row + rr + 1] && lum[row + rr + 1] < 0.32) rr++;
  const R = Math.max((rr - l) / 2, Math.sqrt(n / Math.PI)) * 1.04;
  let oL = Math.round(ix), oR = Math.round(ix);
  while (oL > 0 && inner[row + oL - 1]) oL--;
  while (oR < W - 1 && inner[row + oR + 1]) oR++;

  // Sclera colour per row (fallback: global average).
  const rowCol = new Array(H);
  let gr = 0, gg = 0, gb = 0, gn = 0;
  for (let y = 0; y < H; y++) {
    let r = 0, g = 0, b = 0, k = 0;
    for (let x = 0; x < W; x++) {
      const i = y * W + x;
      if (!inner[i] || lum[i] < 0.5 || sat[i] > 0.3 || Math.hypot(x - ix, y - iy) < R * 1.1) continue;
      r += px[i * 4]; g += px[i * 4 + 1]; b += px[i * 4 + 2]; k++;
    }
    if (k) { rowCol[y] = [r / k, g / k, b / k]; gr += r; gg += g; gb += b; gn += k; }
  }
  const glob = gn ? [gr / gn, gg / gn, gb / gn] : [238, 232, 228];
  for (let y = 0; y < H; y++) if (!rowCol[y]) rowCol[y] = glob;

  // Skin colour just above the opening (for the blink).
  let kr = 0, kg = 0, kb = 0, kn = 0;
  for (let y = Math.min(H - 1, top + E * 2); y < Math.min(H, top + E * 6); y++) for (let x = oL; x <= oR; x++) {
    const i = y * W + x; if (isSkin[i] && px[i * 4 + 3] > 10) { kr += px[i * 4]; kg += px[i * 4 + 1]; kb += px[i * 4 + 2]; kn++; }
  }
  const skin = kn ? [kr / kn, kg / kn, kb / kn] : [196, 136, 98];

  // (a) clean eye: pupil + iris painted out. Each row is filled by blending the sclera found just
  //     left and right of the iris on that row, then rows are smoothed vertically (no hard block).
  const clean = new Uint8Array(px);
  const fillR = R * 1.12;
  const isWhite = (i) => inner[i] && lum[i] > 0.5 && sat[i] < 0.3;
  const filled = new Float32Array(N * 3), has = new Uint8Array(N);
  for (let y = 0; y < H; y++) {
    const dy = y - iy; if (Math.abs(dy) > fillR) continue;
    const span = Math.sqrt(fillR * fillR - dy * dy);
    const x0 = Math.max(0, Math.floor(ix - span)), x1 = Math.min(W - 1, Math.ceil(ix + span));
    let lc = null, rc = null;
    for (let x = x0; x >= 0 && !lc; x--) { const i = y * W + x; if (isWhite(i)) lc = [px[i * 4], px[i * 4 + 1], px[i * 4 + 2]]; if (!inner[i]) break; }
    for (let x = x1; x < W && !rc; x++) { const i = y * W + x; if (isWhite(i)) rc = [px[i * 4], px[i * 4 + 1], px[i * 4 + 2]]; if (!inner[i]) break; }
    lc = lc || rc || rowCol[y]; rc = rc || lc;
    for (let x = x0; x <= x1; x++) {
      const i = y * W + x; if (!inner[i]) continue;
      const t = x1 > x0 ? (x - x0) / (x1 - x0) : 0.5;
      for (let k = 0; k < 3; k++) filled[i * 3 + k] = lc[k] * (1 - t) + rc[k] * t;
      has[i] = 1;
    }
  }
  const V = Math.max(2, Math.round(H / 40)); // vertical smoothing radius
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const i = y * W + x; if (!has[i]) continue;
    let r = 0, g = 0, b = 0, k = 0;
    for (let dy = -V; dy <= V; dy++) { const j = (y + dy) * W + x; if (y + dy < 0 || y + dy >= H || !has[j]) continue; r += filled[j * 3]; g += filled[j * 3 + 1]; b += filled[j * 3 + 2]; k++; }
    const d = Math.hypot(x - ix, y - iy), t = smooth(R * 1.0, fillR, d);
    clean[i * 4] = (r / k) * (1 - t) + px[i * 4] * t;
    clean[i * 4 + 1] = (g / k) * (1 - t) + px[i * 4 + 1] * t;
    clean[i * 4 + 2] = (b / k) * (1 - t) + px[i * 4 + 2] * t;
  }
  // (b) iris texture, square, centred on the iris; fully opaque up to its dark rim (no light halo).
  //     In the artwork the eyelid hides the top (and bottom) of the iris, so those parts are rebuilt
  //     by mirroring the visible half: the iris is a full disc wherever it moves.
  const S = Math.ceil(R * 2.3) + 2, half = S / 2;
  const iris = new Uint8Array(S * S * 4);
  const cyr = Math.round(iy);
  const srcOf = (x, y) => {
    if (inner1[y * W + x]) return y * W + x;
    const my = 2 * cyr - y; // mirror across the iris centre row
    if (my >= 0 && my < H && inner1[my * W + x]) return my * W + x;
    for (let t = y; t !== cyr; t += y < cyr ? 1 : -1) if (inner1[t * W + x]) return t * W + x; // nearest visible pixel in the column
    return inner1[cyr * W + x] ? cyr * W + x : -1;
  };
  for (let v = 0; v < S; v++) for (let u = 0; u < S; u++) {
    const x = Math.round(ix - half + u), y = Math.round(iy - half + v);
    if (x < 0 || y < 0 || x >= W || y >= H) continue;
    const d = Math.hypot(x - ix, y - iy);
    if (d > R * 1.05) continue;
    const j = srcOf(x, y);
    if (j < 0) continue;
    const o = (v * S + u) * 4;
    iris[o] = px[j * 4]; iris[o + 1] = px[j * 4 + 1]; iris[o + 2] = px[j * 4 + 2];
    iris[o + 3] = 255 * (1 - smooth(R * 1.01, R * 1.05, d));
  }
  // (c) masks: R = interior (iris clip), G = patch alpha (opening, softened and slightly grown).
  const mask = new Uint8Array(N * 4);
  const B = Math.max(2, Math.round(W / 110));
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    let so = 0, k = 0, s1 = 0, k1 = 0;
    for (let dy = -B; dy <= B; dy++) for (let dx = -B; dx <= B; dx++) {
      const nx = x + dx, ny = y + dy; if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
      const j = ny * W + nx; so += open[j]; k++;
      if (Math.abs(dx) <= 1 && Math.abs(dy) <= 1) { s1 += inner1[j]; k1++; }
    }
    const o = (y * W + x) * 4;
    mask[o] = 255 * s1 / k1; // iris clip: opening minus 1 px, lightly antialiased
    mask[o + 1] = 255 * Math.min(1, (so / k) * 1.8);
    mask[o + 3] = 255;
  }

  const tex = (data, tw, th, srgb) => {
    const t = new THREE.DataTexture(data, tw, th, THREE.RGBAFormat);
    t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
    // Same filtering as the model's own texture (mipmaps + anisotropy): crisp at hero size, no shimmer.
    t.magFilter = THREE.LinearFilter; t.minFilter = THREE.LinearMipmapLinearFilter; t.generateMipmaps = true;
    t.anisotropy = renderer.capabilities.getMaxAnisotropy();
    t.needsUpdate = true;
    return t;
  };
  // Everything the model's shader needs for this eye (all coordinates are "rest-pose plane" uv).
  return {
    tClean: tex(clean, W, H, true),
    tIris: tex(iris, S, S, true),
    tMask: tex(mask, W, H, false),
    centre: new THREE.Vector3(cx, cy, cz),
    size: new THREE.Vector2(w, h),
    irisC: new THREE.Vector2(ix / W, iy / H),
    irisS: new THREE.Vector2(S / W, S / H),
    // How far the iris may travel (uv): left, right, up, down — so it stays inside the opening.
    range: new THREE.Vector4(Math.max(0, ix - oL - R) * 0.85 / W, Math.max(0, oR - ix - R) * 0.85 / W, R * 0.14 / H, R * 0.14 / H),
    lid: new THREE.Vector2((top + E) / H, (bot - E) / H),
  };
}

/* Paints the eyes inside the model's own material. Each fragment knows where it was in the rest pose
   (bind-pose position × rest world matrix), so the eye artwork stays glued to the skin when the head
   turns: no floating patch, no parallax, and the model's lighting is applied on top as usual. */
function installEyeShader(mesh, eyes) {
  // Rest-pose world position of every vertex, computed once on the CPU with the skeleton at rest.
  // (Quantised skinned meshes hide part of their transform in the bones, so a plain matrix isn't enough.)
  const geo = mesh.geometry, count = geo.attributes.position.count;
  const rest = new Float32Array(count * 3), v = new THREE.Vector3();
  mesh.skeleton.update();
  for (let i = 0; i < count; i++) {
    mesh.getVertexPosition(i, v);
    v.applyMatrix4(mesh.matrixWorld);
    rest[i * 3] = v.x; rest[i * 3 + 1] = v.y; rest[i * 3 + 2] = v.z;
  }
  geo.setAttribute('aRest', new THREE.BufferAttribute(rest, 3));
  // Linear map from rest-world displacements back to the mesh's own (bind) space, so the smile can
  // be described in world units. Solved from four vertices: world = A · local (+ offset).
  const P = geo.attributes.position, ids = [0, (count / 3) | 0, ((2 * count) / 3) | 0, count - 1];
  const lp = ids.map((i) => new THREE.Vector3().fromBufferAttribute(P, i));
  const rp = ids.map((i) => new THREE.Vector3(rest[i * 3], rest[i * 3 + 1], rest[i * 3 + 2]));
  const cols = (arr) => new THREE.Matrix3().set(...[0, 1, 2].flatMap((r) => [1, 2, 3].map((c) => arr[c].getComponent(r) - arr[0].getComponent(r))));
  const A = cols(rp).multiply(cols(lp).invert());
  const U = {
    uEyeOff: { value: new THREE.Vector2() },
    uBlink: { value: 0 },
    uSmile: { value: 0 },
    uW2L: { value: A.invert() },
  };
  eyes.forEach((e, i) => {
    Object.assign(U, {
      [`tEC${i}`]: { value: e.tClean }, [`tEI${i}`]: { value: e.tIris }, [`tEM${i}`]: { value: e.tMask },
      [`uEC${i}`]: { value: e.centre }, [`uES${i}`]: { value: e.size },
      [`uIC${i}`]: { value: e.irisC }, [`uIS${i}`]: { value: e.irisS },
      [`uER${i}`]: { value: e.range }, [`uEL${i}`]: { value: e.lid },
    });
  });
  const decl = eyes.map((_, i) => `uniform sampler2D tEC${i}, tEI${i}, tEM${i}; uniform vec3 uEC${i}; uniform vec2 uES${i}, uIC${i}, uIS${i}, uEL${i}; uniform vec4 uER${i};`).join('\n');
  const calls = eyes.map((_, i) => `{ vec4 e = eyeAlbedo(tEC${i}, tEI${i}, tEM${i}, uEC${i}, uES${i}, uIC${i}, uIS${i}, uER${i}, uEL${i}); if (e.a > eyeMix.a) eyeMix = e; }`).join('\n');
  const m = mesh.material;
  m.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, U);
    sh.vertexShader = `attribute vec3 aRest;
varying vec3 vRestPos;
uniform float uSmile; uniform mat3 uW2L;
// Discreet, one-sided smile: his left mouth corner (viewer's right) lifts and tucks back, the other
// corner barely moves, the cheek on that side rises a touch. Gaussian falloffs in rest-world units.
vec3 smileDelta(vec3 r) {
  float front = smoothstep(0.08, 0.11, r.z);
  vec2 d1 = (r.xy - vec2(0.0564, 0.7006)) / vec2(0.026, 0.017);
  vec2 d2 = (r.xy - vec2(-0.0511, 0.6997)) / vec2(0.020, 0.014);
  vec2 d3 = (r.xy - vec2(0.046, 0.724)) / vec2(0.032, 0.022);
  float w1 = exp(-dot(d1, d1)), w2 = exp(-dot(d2, d2)), w3 = exp(-dot(d3, d3));
  vec3 dw = vec3(0.0035 * w1 - 0.0012 * w2, 0.0095 * w1 + 0.003 * w2 + 0.003 * w3, -0.0025 * w1);
  return dw * uSmile * front;
}
` + sh.vertexShader.replace(
      '#include <begin_vertex>',
      '#include <begin_vertex>\n  vRestPos = aRest;\n  transformed += uW2L * smileDelta(aRest);');
    sh.fragmentShader = `varying vec3 vRestPos;
uniform vec2 uEyeOff; uniform float uBlink; uniform float uSmile;
float gEyeLid = 0.0; // how much of this fragment is covered by a closing lid
${decl}
vec4 eyeAlbedo(sampler2D tC, sampler2D tI, sampler2D tM, vec3 c, vec2 s, vec2 ic, vec2 is, vec4 rg, vec2 lid) {
  vec2 uv = (vRestPos.xy - c.xy) / s + 0.5;
  if (uv.x <= 0.0 || uv.y <= 0.0 || uv.x >= 1.0 || uv.y >= 1.0 || vRestPos.z < c.z - 0.03) return vec4(0.0);
  vec4 m = texture2D(tM, uv);
  if (m.g < 0.004) return vec4(0.0);
  vec3 col = texture2D(tC, uv).rgb;
  vec2 off = vec2(uEyeOff.x < 0.0 ? uEyeOff.x * rg.x : uEyeOff.x * rg.y,
                  uEyeOff.y < 0.0 ? uEyeOff.y * rg.w : uEyeOff.y * rg.z);
  vec2 iuv = (uv - ic - off) / is + 0.5;
  if (iuv.x > 0.0 && iuv.y > 0.0 && iuv.x < 1.0 && iuv.y < 1.0) {
    vec4 icol = texture2D(tI, iuv);
    col = mix(col, icol.rgb, icol.a * m.r);
    // Crisp catch-lights that travel with the iris (they give the eye its life).
    float hl = 1.0 - smoothstep(0.055, 0.075, length(iuv - vec2(0.34, 0.66)));
    hl += 0.7 * (1.0 - smoothstep(0.022, 0.034, length(iuv - vec2(0.62, 0.38))));
    col = mix(col, vec3(1.0), clamp(hl, 0.0, 1.0) * icol.a * m.r);
  }
  // Upper lid: closes for a blink, and also follows the iris down when looking down (like a real
  // eye), so no white shows above the iris.
  float alpha = m.g;
  // Smiling eyes: the lower lid (cheek) rises a little when he smiles.
  float sq = uSmile * 0.42;
  if (sq > 0.001) {
    float u2 = (uv.x - ic.x) / 0.5;
    float lowY = mix(lid.y - 0.06, lid.y + 0.3, sq) - 0.05 * (1.0 - clamp(u2 * u2, 0.0, 1.0));
    vec3 skinB = (texture2D(tC, vec2(uv.x, max(0.015, lid.y - 0.12))).rgb
                + texture2D(tC, vec2(uv.x, max(0.015, lid.y - 0.2))).rgb) / 2.0;
    float coverB = 1.0 - smoothstep(lowY - 0.02, lowY + 0.02, uv.y);
    float lashB = 1.0 - smoothstep(0.0, 0.035, abs(uv.y - lowY));
    col = mix(col, skinB, coverB);
    col = mix(col, skinB * 0.55, lashB * 0.6);
    alpha = mix(alpha, smoothstep(0.0, 0.06, m.g), coverB);
  }
  float lidAmt = max(uBlink, clamp(-uEyeOff.y, 0.0, 1.0) * 0.3);
  if (lidAmt > 0.001) {
    // Skin from just above the eye comes down over the opening, with a lash line at its edge.
    float u = (uv.x - ic.x) / 0.5;
    float arch = 0.10 * (1.0 - clamp(u * u, 0.0, 1.0)) * (1.0 - lidAmt);
    float lidY = mix(lid.x + 0.06, lid.y - 0.08, lidAmt) + arch;
    vec3 skin = (texture2D(tC, vec2(uv.x, min(0.985, lid.x + 0.12))).rgb
               + texture2D(tC, vec2(uv.x, min(0.985, lid.x + 0.18))).rgb
               + texture2D(tC, vec2(uv.x, min(0.985, lid.x + 0.24))).rgb) / 3.0;
    float cover = smoothstep(lidY - 0.02, lidY + 0.02, uv.y);
    // Rounded lid: a little darker toward the lash edge, as the lid curves away from the light.
    skin *= mix(0.8, 1.0, smoothstep(lidY, lidY + 0.3, uv.y));
    float lash = 1.0 - smoothstep(0.0, 0.045, abs(uv.y - lidY));
    col = mix(col, skin, cover);
    col = mix(col, skin * 0.28, lash * 0.9);
    // While the lid is down it also hides the eye's outline, so the patch is fully opaque there.
    float a = mix(alpha, smoothstep(0.0, 0.06, m.g), max(cover, lash));
    gEyeLid = max(gEyeLid, cover * a);
    return vec4(col, a);
  }
  return vec4(col, alpha);
}
` + sh.fragmentShader
      .replace('#include <map_fragment>', `#include <map_fragment>
  vec4 eyeMix = vec4(0.0);
  ${calls}
  diffuseColor.rgb = mix(diffuseColor.rgb, eyeMix.rgb, eyeMix.a);`)
      // Inside the eye the model's own relief and shine still mark where the painted iris used to be,
      // and a closed lid must not show the eyeball under it: flat normal and matte there, so only the
      // (moving) painted iris and its highlight are seen.
      .replace('#include <roughnessmap_fragment>', `#include <roughnessmap_fragment>
  roughnessFactor = mix(roughnessFactor, 1.0, max(gEyeLid, eyeMix.a));`)
      .replace('#include <normal_fragment_maps>', `#include <normal_fragment_maps>
  normal = normalize(mix(normal, nonPerturbedNormal, max(gEyeLid, eyeMix.a)));`)
      .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
  totalEmissiveRadiance = mix(totalEmissiveRadiance, emissive * eyeMix.rgb, eyeMix.a);
  totalEmissiveRadiance += eyeMix.rgb * 0.12 * gEyeLid;
  diffuseColor.rgb *= 1.0 - 0.12 * gEyeLid;`);
  };
  m.needsUpdate = true;
  return {
    set(x, y, blink, smile = 0) {
      U.uEyeOff.value.set(Math.max(-1, Math.min(1, x)), Math.max(-1, Math.min(1, -y)));
      U.uBlink.value = blink;
      U.uSmile.value = smile;
    },
  };
}

function smooth(a, b, x) { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); }

/* Renders the eye region straight-on (orthographic, so it matches the shader's planar mapping) with an
   unlit material: the result is the texture's own colour (albedo), which the model's shader can then
   light normally. Returns the pixels, 2x supersampled. */
function captureRegion(renderer, scene, region) {
  const [cx, cy, cz] = region.c, [w, h] = region.size;
  const SW = 640, SH = Math.round((SW * h) / w / 2) * 2;
  const rt = new THREE.WebGLRenderTarget(SW, SH);
  rt.texture.colorSpace = THREE.SRGBColorSpace;
  const cam = new THREE.OrthographicCamera(-w / 2, w / 2, h / 2, -h / 2, 0.001, 5);
  cam.position.set(cx, cy, cz + 1);
  cam.lookAt(cx, cy, cz);
  const swapped = [];
  scene.traverse((o) => {
    if (o.isMesh && o.material.map) {
      swapped.push([o, o.material]);
      o.material = new THREE.MeshBasicMaterial({ map: o.material.map });
    }
  });
  const prev = renderer.getRenderTarget();
  renderer.setRenderTarget(rt);
  renderer.setClearColor(0x000000, 0);
  renderer.clear();
  renderer.render(scene, cam);
  const buf = new Uint8Array(SW * SH * 4);
  renderer.readRenderTargetPixels(rt, 0, 0, SW, SH, buf);
  renderer.setRenderTarget(prev);
  rt.dispose();
  for (const [o, mat] of swapped) { o.material.dispose(); o.material = mat; }
  const W = SW / 2, H = SH / 2, px = new Uint8ClampedArray(W * H * 4);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) for (let k = 0; k < 4; k++) {
    const a = ((2 * y) * SW + 2 * x) * 4 + k, b = a + 4, c = a + SW * 4, d = c + 4;
    px[(y * W + x) * 4 + k] = (buf[a] + buf[b] + buf[c] + buf[d]) / 4;
  }
  return { W, H, px };
}

/* Fallback for unrigged models: rotate vertices above the neck in the vertex shader. */
function installNeckShader(root) {
  const U = { uYaw: { value: 0 }, uPitch: { value: 0 }, uNeck: { value: 0 }, uSoft: { value: 0 }, uPivotZ: { value: 0 } };
  root.traverse((o) => {
    if (!o.isMesh) return;
    o.geometry.computeBoundingBox();
    const gb = o.geometry.boundingBox;
    const h = gb.max.y - gb.min.y;
    U.uNeck.value = gb.min.y + h * 0.6;
    U.uSoft.value = h * 0.05;
    U.uPivotZ.value = (gb.min.z + gb.max.z) / 2 - (gb.max.z - gb.min.z) * 0.08;
    o.material.onBeforeCompile = (sh) => {
      Object.assign(sh.uniforms, U);
      sh.vertexShader = `uniform float uYaw; uniform float uPitch; uniform float uNeck; uniform float uSoft; uniform float uPivotZ;
mat3 headRot(float w) {
  float y = uYaw * w, p = uPitch * w;
  float cy = cos(y), sy = sin(y), cp = cos(p), sp = sin(p);
  mat3 ry = mat3(cy, 0.0, -sy, 0.0, 1.0, 0.0, sy, 0.0, cy);
  mat3 rx = mat3(1.0, 0.0, 0.0, 0.0, cp, sp, 0.0, -sp, cp);
  return ry * rx;
}
` + sh.vertexShader
        .replace('#include <beginnormal_vertex>', `#include <beginnormal_vertex>
  float hw = smoothstep(uNeck - uSoft, uNeck + uSoft, position.y);
  mat3 HR = headRot(hw);
  objectNormal = HR * objectNormal;`)
        .replace('#include <begin_vertex>', `#include <begin_vertex>
  vec3 piv = vec3(0.0, uNeck, uPivotZ);
  transformed = HR * (transformed - piv) + piv;`);
    };
    o.material.needsUpdate = true;
  });
  return U;
}
