/* ==========================================================================
   场景脚本.js · 渲染层
   --------------------------------------------------------------------------
   这个文件里没有写死任何一个作品名、分类名或颜色。
   它只做三件事：
     1. 读 window.PORTFOLIO（作品数据.js），用 DOM API 生成左侧列表 / 统计 / 图例 / 详情
     2. 把同一份数据「聚合」成柱子定义 deriveBars()，交给 Three.js 画出来
     3. 处理交互：拖动旋转、相机推拉（滚轮 / 按钮 / 滑杆 / 双指）、3D 空间放缩、
        射线拾取、视图切换、昼夜、数据扰动

   数据驱动最关键的一行是 deriveBars()：
   换一种聚合方式（按作品 / 按分类 / 按年份），3D 场景就换一副样子，
   而 HTML 一行都不用改。
   ========================================================================== */
(function () {
  'use strict';

  const D = window.PORTFOLIO;
  const CATS = D.categories;
  const VIEWS = D.views;
  const $ = function (id) { return document.getElementById(id); };

  /* ---------- 运行状态 ---------- */
  let works = D.works.map(function (w) { return Object.assign({}, w); });
  let viewId = VIEWS[0].id;
  let selectedId = null;
  let hoverId = null;
  let night = false;

  /* 也支持用地址直接指定初始状态：作品数据立方.html?view=cats&night=1&select=cat:nav
     方便截图、调试，或者把某个视图直接分享给别人 */
  const params = new URLSearchParams(window.location.search);
  const startView = params.get('view');
  if (startView && VIEWS.some(function (v) { return v.id === startView; })) viewId = startView;
  if (params.get('night') === '1') night = true;
  const startRadius = parseFloat(params.get('radius'));
  const startScale = parseFloat(params.get('scale'));

  function node(tag, cls, text) {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text !== undefined && text !== null) n.textContent = text;
    return n;
  }
  function catOf(id) {
    for (let i = 0; i < CATS.length; i++) if (CATS[i].id === id) return CATS[i];
    return CATS[0];
  }
  function viewOf(id) {
    for (let i = 0; i < VIEWS.length; i++) if (VIEWS[i].id === id) return VIEWS[i];
    return VIEWS[0];
  }

  /* 作品徽标：有 icon 就用图片，没有就用分类色 + 一个字 */
  function iconEl(item, cls) {
    const box = node('span', cls || 'toc-icon');
    if (item.icon) {
      const img = document.createElement('img');
      img.src = item.icon;
      img.alt = '';
      img.loading = 'lazy';
      box.appendChild(img);
      box.classList.add('has-img');
    } else {
      box.textContent = item.iconText || (item.title || item.name || '·').slice(0, 1);
      box.style.background = item.color || (item.cat ? catOf(item.cat).color : '#166b59');
    }
    return box;
  }

  /* ======================================================================
     一、DOM：全部由数据生成
     ====================================================================== */
  function renderStatic() {
    $('page-title').textContent = D.meta.title;
    $('page-lead').textContent = D.meta.subtitle + '。页面上的目录、统计条、图例、3D 柱子和详情卡，读的都是 作品数据.js 里同一份数组。';
    $('site-footer').textContent = '© 2026 ' + D.meta.owner + '的作品 · 数据更新 ' + D.meta.updated + ' · 改 作品数据.js 就能改整页';
    $('stage-note').textContent = '离线提示：' + D.meta.note;
  }

  function renderViewSwitch() {
    const box = $('view-switch');
    box.innerHTML = '';
    VIEWS.forEach(function (v) {
      const b = node('button', 'view-btn' + (v.id === viewId ? ' active' : ''), v.label);
      b.type = 'button';
      b.title = v.hint;
      b.addEventListener('click', function () { setView(v.id); });
      box.appendChild(b);
    });
  }

  function renderStats() {
    const box = $('stat-strip');
    box.innerHTML = '';
    const usedCats = {};
    let total = 0;
    works.forEach(function (w) { usedCats[w.cat] = 1; total += w.weight; });
    const rows = [
      ['作品总数', works.length + ' 个'],
      ['分类数', Object.keys(usedCats).length + ' 类'],
      ['体量合计', total],
      ['数据版本', D.meta.updated]
    ];
    rows.forEach(function (r) {
      const d = node('div', 'stat');
      d.appendChild(node('b', '', r[1]));
      d.appendChild(node('span', '', r[0]));
      box.appendChild(d);
    });
    $('work-count').textContent = works.length + ' 项';
  }

  function renderToc() {
    const box = $('toc-list');
    box.innerHTML = '';
    works.forEach(function (w, i) {
      const li = document.createElement('li');
      const b = node('button', 'toc-link' + (selectedId === w.id ? ' active' : ''));
      b.type = 'button';
      b.title = '查看「' + w.title + '」的详情 · 体量 ' + w.weight;
      b.appendChild(node('span', 'idx', ('0' + (i + 1)).slice(-2)));
      b.appendChild(iconEl(w, 'toc-icon'));
      b.appendChild(node('span', 'txt', w.title));
      b.addEventListener('click', function () {
        if (viewId !== 'works') setView('works');
        selectBar(w.id, true);
      });
      li.appendChild(b);
      box.appendChild(li);
    });
    $('toc-hint').textContent = '改 作品数据.js 的作品数组，左边列表、上面统计、右边柱子和详情会一起变。试试上面的「扰动数据」，柱子高度是平滑长过去的。';
  }

  function renderLegend() {
    const box = $('legend');
    box.innerHTML = '';
    CATS.forEach(function (c) {
      /* 数据里没有成员的空分类不画，图例和柱子才对得上 */
      const count = works.filter(function (w) { return w.cat === c.id; }).length;
      if (!count) return;
      const s = node('span');
      const i = node('i');
      i.style.background = c.color;
      s.appendChild(i);
      s.appendChild(document.createTextNode(c.name));
      box.appendChild(s);
    });
  }

  /* 详情卡：作品视图显示一条作品，分组视图列出该组的成员 */
  function renderDetail(bar) {
    const body = $('detail-body');
    body.innerHTML = '';
    const panel = $('detail');

    if (!bar) { panel.classList.remove('open'); return; }

    const isWork = bar.kind === 'work';
    const w = isWork ? bar.members[0] : null;
    const c = isWork ? catOf(w.cat) : null;

    const tag = node('div', 'detail-tag', isWork ? c.name : (viewId === 'cats' ? '分类聚合' : '年份聚合'));
    tag.style.background = isWork ? c.color : '#155e8b';

    /* 图标 + 分类标签并排，点开就知道是哪个作品 */
    const head = node('div', 'detail-head');
    head.appendChild(iconEl(isWork ? w : {
      title: bar.label, iconText: (bar.label || '·').slice(0, 1), color: bar.color
    }, 'detail-icon'));
    head.appendChild(tag);
    body.appendChild(head);

    body.appendChild(node('h2', '', bar.title || bar.label));
    body.appendChild(node('p', 'detail-sub', isWork ? w.sub : '共 ' + bar.members.length + ' 项 · 由数据自动分组'));
    body.appendChild(node('p', 'detail-desc', isWork
      ? w.desc
      : (viewId === 'cats' ? catOf(bar.catId).desc + '。下面这些作品都属于这一类。' : '这一年放进来的作品，全部来自 作品数据.js 的 year 字段。')));

    const metric = node('div', 'detail-metric');
    metric.appendChild(node('span', '', isWork ? w.metric.label : '组内体量合计'));
    const sum = bar.members.reduce(function (a, x) { return a + x.weight; }, 0);
    metric.appendChild(node('strong', '', isWork ? w.metric.value : String(sum)));
    body.appendChild(metric);

    if (isWork) {
      const tags = node('div', 'detail-tags');
      w.tags.forEach(function (t) { tags.appendChild(node('span', '', t)); });
      body.appendChild(tags);
      const a = node('a', 'detail-link', '打开这个页面 ↗');
      a.href = w.link;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      body.appendChild(a);
    } else {
      const ul = node('ul', 'detail-members');
      bar.members.forEach(function (m) {
        const li = node('li', '', '· ' + m.title + '（体量 ' + m.weight + '）');
        li.style.cursor = 'pointer';
        li.title = '切换到这个作品';
        li.addEventListener('click', function () {
          setView('works');
          selectBar(m.id, true);
        });
        ul.appendChild(li);
      });
      body.appendChild(ul);
    }
    panel.classList.add('open');
    panel.scrollTop = 0;
  }

  /* ======================================================================
     二、数据聚合：同一份 works，三种「看数据的角度」
     ====================================================================== */
  function barHeight(value) { return 2 + value * 1.45; }
  const GAP = 7.2;   /* 柱子间距要略大于标签宽度，相邻标签才不会互相压住 */

  function deriveBars() {
    let defs = [];
    if (viewId === 'works') {
      defs = works.map(function (w) {
        return {
          id: w.id, label: w.short || w.title, title: w.title, value: w.weight,
          color: catOf(w.cat).color, members: [w], kind: 'work',
          shape: w.shape || 'box', prop: w.prop || null
        };
      });
    } else if (viewId === 'cats') {
      defs = CATS.map(function (c) {
        const members = works.filter(function (w) { return w.cat === c.id; });
        return {
          id: 'cat:' + c.id, catId: c.id, label: c.short || c.name, title: c.name,
          value: members.length * 3, color: c.color, members: members, kind: 'group',
          shape: 'prism', prop: null
        };
      }).filter(function (d) { return d.members.length > 0; });
    } else {
      const years = [];
      works.forEach(function (w) { if (years.indexOf(w.year) === -1) years.push(w.year); });
      years.sort();
      defs = years.map(function (y) {
        const members = works.filter(function (w) { return w.year === y; });
        return {
          id: 'year:' + y, label: String(y), title: y + ' 年',
          value: members.length * 3, color: '#166b59', members: members, kind: 'group',
          shape: 'prism', prop: null
        };
      });
    }
    defs.forEach(function (d, i) {
      d.x = (i - (defs.length - 1) / 2) * GAP;
      d.h = barHeight(d.value);
    });
    return defs;
  }

  /* ======================================================================
     三、Three.js：把 deriveBars() 的结果画成 3D 柱子
     ====================================================================== */
  const canvas = $('scene');
  const stage = $('stage');
  const renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(stage.clientWidth, stage.clientHeight, false);
  renderer.setClearColor(0x000000, 0);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0xeaf5f0, 70, 170);

  /* 所有可见内容放进 world：对 world 做 scale，就是「缩放整个 3D 空间」，
     与「把相机推近 / 拉远」是两件不同的事，页面上各给一条滑杆做对比。 */
  const world = new THREE.Group();
  scene.add(world);

  const camera = new THREE.PerspectiveCamera(45, stage.clientWidth / stage.clientHeight, 0.1, 500);
  const HOME = { theta: 0.38, phi: 1.0, radius: 58, tx: 0, ty: 9.5, tz: 0 };
  const view = { theta: HOME.theta, phi: HOME.phi, radius: HOME.radius, target: new THREE.Vector3(0, HOME.ty, 0) };
  let tween = null;

  const MIN_R = 14, MAX_R = 180;
  let targetRadius = HOME.radius;
  let spaceScale = 1;

  const hemi = new THREE.HemisphereLight(0xffffff, 0x9fae9d, 0.9);
  scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xffffff, 1.7);
  sun.position.set(26, 42, 24);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  sun.shadow.camera.left = -40; sun.shadow.camera.right = 40;
  sun.shadow.camera.top = 40; sun.shadow.camera.bottom = -40;
  sun.shadow.camera.near = 1; sun.shadow.camera.far = 120;
  sun.shadow.bias = -0.0006;
  scene.add(sun);
  const fill = new THREE.DirectionalLight(0xcfe4f2, 0.35);
  fill.position.set(-24, 16, -18);
  scene.add(fill);

  const groundMat = new THREE.MeshStandardMaterial({ color: 0xe9f3ed, roughness: 0.95 });
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(160, 160), groundMat);
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.02;
  ground.receiveShadow = true;
  world.add(ground);

  const grid = new THREE.GridHelper(160, 40, 0x166b59, 0xbcd8cb);
  grid.position.y = 0.01;
  grid.material.transparent = true;
  grid.material.opacity = 0.14;
  world.add(grid);

  /* ---------- 小几何辅助：拼道具用 ---------- */
  function matOf(color, rough, metal) {
    return new THREE.MeshStandardMaterial({
      color: color,
      roughness: rough === undefined ? 0.6 : rough,
      metalness: metal || 0
    });
  }
  function meshOf(geo, mat, x, y, z) {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x || 0, y || 0, z || 0);
    m.castShadow = true;
    m.receiveShadow = true;
    return m;
  }
  function boxM(w, h, d, mat, x, y, z) { return meshOf(new THREE.BoxGeometry(w, h, d), mat, x, y, z); }
  function cylM(rt, rb, h, seg, mat, x, y, z) { return meshOf(new THREE.CylinderGeometry(rt, rb, h, seg), mat, x, y, z); }

  /* 柱身形状：数据里的 shape 字段决定，不再清一色长方体 */
  function shaftGeometry(shape) {
    if (shape === 'cylinder') return new THREE.CylinderGeometry(1.55, 1.55, 1, 30);
    if (shape === 'prism') return new THREE.CylinderGeometry(1.6, 1.8, 1, 6);
    if (shape === 'taper') return new THREE.CylinderGeometry(1.15, 1.95, 1, 4);
    return new THREE.BoxGeometry(2.7, 1, 2.7);
  }
  function capMesh(shape, color) {
    const m = matOf(color, 0.45, 0.05);
    if (shape === 'cylinder') return cylM(1.62, 1.62, 0.16, 30, m);
    if (shape === 'prism' || shape === 'taper') return cylM(1.72, 1.72, 0.16, 6, m);
    return boxM(2.86, 0.16, 2.86, m);
  }

  /* ---------- 柱顶的小模型：让每根柱子「像那个作品」 ----------
     全部用基础几何现拼，没有外部模型；原点放在模型底部，方便坐在柱顶上。 */
  const PROP_BUILDERS = {
    /* 作品总展示：三本叠起来的册子 */
    boards: function (color) {
      const g = new THREE.Group();
      g.add(boxM(2.3, 0.26, 1.55, matOf(color, 0.7), 0, 0.13, 0));
      const b2 = boxM(2.05, 0.22, 1.4, matOf(0xf2f6f3, 0.85), 0.15, 0.37, 0.06);
      b2.rotation.y = 0.16; g.add(b2);
      const b3 = boxM(1.75, 0.2, 1.2, matOf(0xd9e8e2, 0.8), -0.1, 0.58, -0.05);
      b3.rotation.y = -0.22; g.add(b3);
      g.add(boxM(0.14, 0.05, 1.15, matOf(0xffffff, 0.5), 0.42, 0.7, -0.05));
      return g;
    },
    /* 日程助手：一页日历 + 两个挂环 + 一个对勾 */
    calendar: function (color) {
      const g = new THREE.Group();
      g.add(boxM(2.3, 1.75, 0.24, matOf(0xf7fbf8, 0.85), 0, 0.95, 0));
      const ringMat = matOf(0x9fb5ab, 0.4, 0.7);
      [-0.42, 0.42].forEach(function (x) {
        const ring = new THREE.Mesh(new THREE.TorusGeometry(0.13, 0.045, 8, 18), ringMat);
        ring.position.set(x, 1.86, 0);
        ring.castShadow = true;
        g.add(ring);
      });
      g.add(boxM(1.5, 0.1, 0.06, matOf(0x9dc6b8, 0.8), -0.15, 1.35, 0.14));
      g.add(boxM(1.1, 0.1, 0.06, matOf(0x9dc6b8, 0.8), -0.35, 1.05, 0.14));
      const checkMat = matOf(color, 0.5);
      const a = boxM(0.18, 0.55, 0.16, checkMat, 0.35, 0.62, 0.16);
      a.rotation.z = -0.7; g.add(a);
      const b = boxM(0.18, 0.95, 0.16, checkMat, 0.72, 0.78, 0.16);
      b.rotation.z = 0.55; g.add(b);
      return g;
    },
    /* 墨识：一张写了字的纸 + 橙点 + 一支笔 */
    ink: function (color) {
      const g = new THREE.Group();
      const paper = matOf(0xfbfdfb, 0.9);
      const sheet = boxM(2.0, 2.5, 0.16, paper, -0.2, 1.25, 0);
      sheet.rotation.z = 0.06; g.add(sheet);
      const inkMat = matOf(0x1e332e, 0.65);
      g.add(boxM(0.62, 0.62, 0.06, inkMat, 0.12, 1.5, 0.12));
      g.add(boxM(0.6, 0.62, 0.06, inkMat, -0.62, 1.5, 0.12));
      g.add(boxM(0.48, 0.48, 0.06, paper, 0.12, 1.5, 0.15));
      const dot = new THREE.Mesh(new THREE.SphereGeometry(0.2, 16, 12), matOf(0xf2994a, 0.5));
      dot.position.set(0.9, 2.18, 0.12);
      dot.castShadow = true;
      g.add(dot);
      const pen = new THREE.Group();
      pen.add(cylM(0.09, 0.11, 1.5, 10, matOf(0x2c4a5e, 0.4, 0.4), 0, 0.75, 0));
      pen.add(cylM(0.01, 0.09, 0.28, 10, matOf(0xd8c39a, 0.5), 0, -0.14, 0));
      pen.position.set(0.98, 0.36, 0.34);
      pen.rotation.z = -0.35;
      g.add(pen);
      return g;
    },
    /* 城市模型：三栋楼 + 一台转起来的小风机 */
    city: function (color) {
      const g = new THREE.Group();
      g.add(boxM(0.7, 1.6, 0.7, matOf(color, 0.55), -0.7, 0.8, 0));
      g.add(boxM(0.55, 1.1, 0.55, matOf(0xdff0ea, 0.7), 0.02, 0.55, 0.25));
      g.add(boxM(0.62, 2.0, 0.62, matOf(0x8fd3c4, 0.6), 0.75, 1.0, -0.15));
      g.add(cylM(0.05, 0.07, 1.9, 8, matOf(0xe8f2ee, 0.6), -0.95, 1.0, 0.78));
      const hub = new THREE.Group();
      const bladeMat = matOf(0xffffff, 0.4);
      for (let i = 0; i < 3; i++) {
        const holder = new THREE.Group();
        holder.rotation.z = i * Math.PI * 2 / 3;
        holder.add(boxM(0.1, 0.85, 0.04, bladeMat, 0, 0.42, 0));
        hub.add(holder);
      }
      hub.position.set(-0.95, 1.95, 0.78);
      g.add(hub);
      g.userData.spin = hub;
      return g;
    }
  };

  /* 中文标签：用 canvas 现画一张贴图，贴在 Sprite 上（不需要字体文件，离线可用） */
  function makeLabel(text) {
    const c = document.createElement('canvas');
    c.width = 360; c.height = 180;   /* 2:1，字可以画得比标签框更大 */
    const g = c.getContext('2d');
    g.fillStyle = 'rgba(255,255,255,0.92)';
    if (g.roundRect) { g.beginPath(); g.roundRect(8, 24, 344, 132, 22); g.fill(); }
    else { g.fillRect(8, 24, 344, 132); }
    g.strokeStyle = 'rgba(22,107,89,0.30)';
    g.lineWidth = 3;
    if (g.roundRect) { g.beginPath(); g.roundRect(8, 24, 344, 132, 22); g.stroke(); }
    g.fillStyle = '#182f24';
    g.font = '600 72px "Microsoft YaHei", "PingFang SC", sans-serif';
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    let t = text;
    while (g.measureText(t).width > 320 && t.length > 2) t = t.slice(0, -2) + '…';
    g.fillText(t, 180, 90);
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false }));
    sprite.scale.set(6.8, 3.4, 1);
    return sprite;
  }

  const barGroup = new THREE.Group();
  world.add(barGroup);
  let bars = [];

  function disposeGroup() {
    barGroup.traverse(function (o) {
      if (o.geometry) o.geometry.dispose();
      if (o.material) {
        if (o.material.map) o.material.map.dispose();
        o.material.dispose();
      }
    });
    barGroup.clear();
  }

  const baseMat = matOf(0xe3ece7, 0.92);

  function rebuildBars() {
    disposeGroup();
    bars = [];
    deriveBars().forEach(function (d, i) {
      const shape = d.shape || 'box';
      const mat = new THREE.MeshStandardMaterial({
        color: d.color, roughness: 0.55, metalness: 0.08,
        emissive: new THREE.Color(d.color), emissiveIntensity: 0.04
      });
      const mesh = new THREE.Mesh(shaftGeometry(shape), mat);
      mesh.position.set(d.x, 0, 0);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.userData.barId = d.id;
      barGroup.add(mesh);

      /* 柱顶亮色顶盖，跟着柱高一起走 */
      const cap = capMesh(shape, new THREE.Color(d.color).lerp(new THREE.Color(0xffffff), 0.32));
      cap.position.set(d.x, 0, 0);
      cap.userData.barId = d.id;
      barGroup.add(cap);

      /* 底座圆盘：像展台，也让每根柱子有落点 */
      const base = cylM(2.3, 2.4, 0.14, 28, baseMat, d.x, 0.07, 0);
      base.userData.barId = d.id;
      barGroup.add(base);

      /* 底座外圈用作品色描一道细环，展台更像展台 */
      const ring = new THREE.Mesh(new THREE.TorusGeometry(2.26, 0.045, 8, 40), matOf(d.color, 0.4));
      ring.rotation.x = -Math.PI / 2;
      ring.position.set(d.x, 0.15, 0);
      ring.userData.barId = d.id;
      barGroup.add(ring);

      /* 柱顶道具：数据里的 prop 字段决定 */
      let prop = null;
      if (d.prop && PROP_BUILDERS[d.prop]) {
        prop = PROP_BUILDERS[d.prop](d.color);
        prop.position.set(d.x, 0.2, 0);
        prop.scale.setScalar(1.2);   /* 小模型稍微放大，远看也认得出 */
        prop.userData.barId = d.id;
        barGroup.add(prop);
      }

      const label = makeLabel(d.label);
      label.position.set(d.x, 3, 0);
      label.userData.barId = d.id;
      barGroup.add(label);

      bars.push({
        data: d, mesh: mesh, cap: cap, prop: prop, label: label,
        h: 0.01, targetH: d.h, lift: 0
      });
    });
  }

  function updateBarHeights() {
    const defs = deriveBars();
    if (defs.length !== bars.length) { rebuildBars(); return; }
    defs.forEach(function (d, i) {
      bars[i].data = d;
      bars[i].targetH = d.h;
    });
  }

  /* ======================================================================
     四、交互：相机、拾取、视图、昼夜、数据变更
     ====================================================================== */
  function applyCamera() {
    const sp = Math.sin(view.phi), cp = Math.cos(view.phi);
    camera.position.set(
      view.target.x + view.radius * sp * Math.sin(view.theta),
      view.target.y + view.radius * cp,
      view.target.z + view.radius * sp * Math.cos(view.theta)
    );
    camera.lookAt(view.target);
  }
  function ease(t) { return 1 - Math.pow(1 - t, 3); }
  function cameraTo(to, dur) {
    tween = {
      t: 0, dur: dur,
      from: { theta: view.theta, phi: view.phi, radius: view.radius, target: view.target.clone() },
      to: {
        theta: to.theta === undefined ? view.theta : to.theta,
        phi: to.phi === undefined ? view.phi : to.phi,
        radius: to.radius === undefined ? view.radius : to.radius,
        tx: to.tx === undefined ? view.target.x : to.tx,
        ty: to.ty === undefined ? view.target.y : to.ty,
        tz: to.tz === undefined ? view.target.z : to.tz
      }
    };
    targetRadius = tween.to.radius;
    syncZoomUI();
  }

  /* ---------- 远近拉取：改的是相机到目标的距离 ---------- */
  function syncZoomUI() {
    const v = Math.round(targetRadius);
    $('zoom-range').value = String(Math.max(MIN_R, Math.min(MAX_R, v)));
    $('zoom-val').textContent = String(v);
  }
  function setRadius(r, instant) {
    targetRadius = Math.max(MIN_R, Math.min(MAX_R, r));
    if (instant) view.radius = targetRadius;
    syncZoomUI();
  }
  function zoomBy(factor) {
    tween = null;                 /* 手动缩放打断相机补间 */
    setRadius(targetRadius * factor);
  }

  /* ---------- 空间放缩：直接改 world 的缩放矩阵 ---------- */
  function syncScaleUI() {
    $('scale-range').value = String(Math.round(spaceScale * 100));
    $('scale-val').textContent = spaceScale.toFixed(2) + '×';
  }
  function setSpaceScale(s) {
    spaceScale = Math.max(0.6, Math.min(1.8, s));
    world.scale.setScalar(spaceScale);
    /* 世界放大后，雾、阴影范围、聚焦距离都要跟着放大，不然远处会被裁掉 */
    scene.fog.far = 170 * Math.max(1, spaceScale);
    const ext = 60 * spaceScale;
    sun.shadow.camera.left = -ext; sun.shadow.camera.right = ext;
    sun.shadow.camera.top = ext; sun.shadow.camera.bottom = -ext;
    sun.shadow.camera.far = 120 * Math.max(1, spaceScale);
    sun.shadow.camera.updateProjectionMatrix();
    syncScaleUI();
  }
  function homeParams() {
    const k = Math.max(1, spaceScale);
    /* 柱子少的时候自动靠近一点，画面不会显得空 */
    const n = Math.max(1, bars.length);
    const fit = 0.62 + n * 0.04;
    return { theta: HOME.theta, phi: HOME.phi, radius: HOME.radius * fit * k, tx: 0, ty: HOME.ty * k, tz: 0 };
  }

  const raycaster = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  function pick(e) {
    const rect = canvas.getBoundingClientRect();
    ndc.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    ndc.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(ndc, camera);
    /* 柱身、顶盖、底座、道具、标签都能点，命中后向上找带 barId 的那一层 */
    const hits = raycaster.intersectObjects(barGroup.children, true);
    if (!hits.length) return null;
    let o = hits[0].object;
    while (o && !o.userData.barId) o = o.parent;
    return o ? o.userData.barId : null;
  }

  let dragging = false, moved = false, lastX = 0, lastY = 0, downX = 0, downY = 0, downTime = 0;
  const pointers = new Map();
  let pinchStartDist = 0, pinchStartRadius = 0;
  function pinchDistance() {
    const p = Array.from(pointers.values());
    return Math.hypot(p[0].x - p[1].x, p[0].y - p[1].y);
  }
  function endPointer(e) {
    pointers.delete(e.pointerId);
    if (pointers.size < 2) pinchStartDist = 0;
  }

  canvas.addEventListener('pointerdown', function (e) {
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    /* 第二根手指落下：从「旋转」切到「双指拉近 / 推远」 */
    if (pointers.size === 2) {
      dragging = false;
      canvas.classList.remove('dragging');
      pinchStartDist = pinchDistance();
      pinchStartRadius = targetRadius;
      tween = null;
      return;
    }
    if (e.button !== 0) return;
    dragging = true; moved = false;
    lastX = downX = e.clientX; lastY = downY = e.clientY;
    downTime = performance.now();
    tween = null;
    canvas.classList.add('dragging');
    try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* 合成事件可能失败 */ }
  });
  canvas.addEventListener('pointermove', function (e) {
    if (pointers.has(e.pointerId)) pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.size === 2) {
      const d = pinchDistance();
      if (pinchStartDist > 0 && d > 0) setRadius(pinchStartRadius * (pinchStartDist / d));
      return;
    }
    if (dragging) {
      const dx = e.clientX - lastX, dy = e.clientY - lastY;
      lastX = e.clientX; lastY = e.clientY;
      if (Math.abs(e.clientX - downX) + Math.abs(e.clientY - downY) > 5) moved = true;
      view.theta -= dx * 0.005;
      view.phi = Math.max(0.25, Math.min(1.45, view.phi - dy * 0.004));
    } else {
      hoverId = pick(e);
      canvas.classList.toggle('pointing', !!hoverId);
    }
  });
  canvas.addEventListener('pointerup', function (e) {
    endPointer(e);
    if (!dragging) return;
    dragging = false;
    canvas.classList.remove('dragging');
    const dist = Math.abs(e.clientX - downX) + Math.abs(e.clientY - downY);
    if (!moved && dist < 6 && performance.now() - downTime < 600) {
      const id = pick(e);
      if (id) selectBar(id); else deselect();
    }
  });
  canvas.addEventListener('pointercancel', function (e) {
    endPointer(e);
    dragging = false; canvas.classList.remove('dragging');
  });
  canvas.addEventListener('wheel', function (e) {
    e.preventDefault();
    zoomBy(1 + e.deltaY * 0.0012);
  }, { passive: false });

  /* 面板按钮 / 滑杆 / 键盘：四种方式改的都是同一个 targetRadius */
  $('zoom-in').addEventListener('click', function () { zoomBy(0.82); });
  $('zoom-out').addEventListener('click', function () { zoomBy(1.22); });
  $('zoom-range').addEventListener('input', function (e) { tween = null; setRadius(Number(e.target.value)); });
  $('scale-range').addEventListener('input', function (e) { setSpaceScale(Number(e.target.value) / 100); });
  document.addEventListener('keydown', function (e) {
    if (e.key === '+' || e.key === '=') zoomBy(0.88);
    if (e.key === '-' || e.key === '_') zoomBy(1.14);
  });

  function findBar(id) {
    for (let i = 0; i < bars.length; i++) if (bars[i].data.id === id) return bars[i];
    return null;
  }
  function selectBar(id, focus) {
    const b = findBar(id);
    if (!b) return;
    selectedId = id;
    renderDetail(b.data);
    renderToc();
    if (focus !== false) {
      cameraTo({
        tx: b.data.x * spaceScale,
        ty: Math.max(5, b.data.h * 0.45 * spaceScale),
        tz: 0,
        radius: 38 * Math.max(1, spaceScale),
        phi: 0.95
      }, 850);
    }
  }
  function deselect() {
    if (!selectedId) return;
    selectedId = null;
    renderDetail(null);
    renderToc();
    cameraTo(homeParams(), 900);
  }
  $('detail-close').addEventListener('click', deselect);
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') deselect(); });

  function setView(id) {
    viewId = id;
    const v = viewOf(id);
    selectedId = null;
    renderDetail(null);
    renderViewSwitch();
    renderToc();
    $('stage-hud').textContent = '拖动旋转 · 滚轮 / 双指缩放 · 点柱子或小模型 · ' + v.hint;
    rebuildBars();
    cameraTo(homeParams(), 700);
  }

  function applyNight() {
    document.body.classList.toggle('night', night);
    $('btn-night').textContent = night ? '☀ 白天' : '☾ 夜间';
    scene.fog.color.set(night ? 0x0a0a14 : 0xeaf5f0);
    hemi.intensity = night ? 0.55 : 0.9;
    sun.intensity = night ? 0.85 : 1.7;
    sun.color.set(night ? 0x9dc6ff : 0xffffff);
    fill.intensity = night ? 0.5 : 0.35;
    groundMat.color.set(night ? 0x101c2e : 0xe9f3ed);
    grid.material.opacity = night ? 0.24 : 0.14;
    renderer.toneMappingExposure = night ? 1.0 : 1.15;
  }
  $('btn-night').addEventListener('click', function () { night = !night; applyNight(); });

  function jitter() {
    works.forEach(function (w) {
      w.weight = Math.max(1, Math.min(12, w.weight + Math.round(Math.random() * 4 - 2)));
    });
    if (viewId !== 'works') setView('works'); else updateBarHeights();
    renderStats(); renderToc();
    if (selectedId) {
      const b = findBar(selectedId);
      if (b) renderDetail(b.data);
    }
  }
  function reset() {
    works = D.works.map(function (w) { return Object.assign({}, w); });
    if (viewId !== 'works') setView('works'); else updateBarHeights();
    renderStats(); renderToc();
    if (selectedId) {
      const b = findBar(selectedId);
      if (b) renderDetail(b.data);
    }
  }
  $('btn-jitter').addEventListener('click', jitter);
  $('btn-reset').addEventListener('click', reset);

  /* ======================================================================
     五、主循环：每帧只做「插值 + 渲染」
     ====================================================================== */
  let prev = performance.now();
  function loop(now) {
    requestAnimationFrame(loop);
    const dt = Math.min(64, now - prev);
    prev = now;
    const k = Math.min(1, 0.12 * (dt / 16.67));

    /* 相机距离带阻尼：滚轮 / 滑杆改目标值，这里一帧帧平滑推过去 */
    if (!tween) view.radius += (targetRadius - view.radius) * k;

    bars.forEach(function (b) {
      b.h += (b.targetH - b.h) * k;
      const liftTarget = b.data.id === selectedId ? 0.45 : 0;
      b.lift += (liftTarget - b.lift) * k;
      b.mesh.scale.y = Math.max(0.01, b.h);
      b.mesh.position.y = b.h / 2 + b.lift;
      b.cap.position.y = b.h + b.lift + 0.08;
      if (b.prop) {
        /* 小模型轻轻上下浮动，像摆在展台上的样品 */
        b.prop.position.y = b.h + 0.2 + b.lift + Math.sin(now * 0.0015 + b.data.x) * 0.05;
        b.prop.rotation.y = Math.sin(now * 0.0006 + b.data.x) * 0.1;
        const spin = b.prop.userData.spin;
        if (spin) spin.rotation.z += dt * 0.0022;   /* 小风车转起来 */
      }
      b.label.position.y = b.h + 4.1 + b.lift;
      const target = (b.data.id === selectedId ? 0.5 : (b.data.id === hoverId ? 0.26 : 0)) + (night ? 0.14 : 0.04);
      const m = b.mesh.material;
      m.emissiveIntensity += (target - m.emissiveIntensity) * k;
    });

    if (tween) {
      tween.t += dt;
      const p = ease(Math.min(1, tween.t / tween.dur));
      view.theta = tween.from.theta + (tween.to.theta - tween.from.theta) * p;
      view.phi = tween.from.phi + (tween.to.phi - tween.from.phi) * p;
      view.radius = tween.from.radius + (tween.to.radius - tween.from.radius) * p;
      view.target.set(
        tween.from.target.x + (tween.to.tx - tween.from.target.x) * p,
        tween.from.target.y + (tween.to.ty - tween.from.target.y) * p,
        tween.from.target.z + (tween.to.tz - tween.from.target.z) * p
      );
      if (tween.t >= tween.dur) tween = null;
    }

    applyCamera();
    renderer.render(scene, camera);
  }

  /* 尺寸跟着舞台走：比只监听 window.resize 更准（左栏折叠时也会触发） */
  function resize() {
    const w = stage.clientWidth, h = stage.clientHeight;
    if (!w || !h) return;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h, false);
  }
  if (window.ResizeObserver) new ResizeObserver(resize).observe(stage);
  window.addEventListener('resize', resize);

  /* ---------- 开场 ---------- */
  renderStatic();
  renderViewSwitch();
  renderStats();
  renderToc();
  renderLegend();
  $('stage-hud').textContent = '拖动旋转 · 滚轮 / 双指缩放 · 点柱子或小模型 · ' + viewOf(viewId).hint;
  applyNight();
  rebuildBars();
  syncZoomUI();
  syncScaleUI();
  if (isFinite(startRadius)) setRadius(startRadius, true);
  if (isFinite(startScale)) {
    setSpaceScale(startScale);
    if (!isFinite(startRadius)) setRadius(HOME.radius * Math.max(1, spaceScale), true);
  }
  if (!isFinite(startRadius)) {
    const home0 = homeParams();
    view.radius = home0.radius;
    targetRadius = home0.radius;
    syncZoomUI();
  }
  view.target.set(0, HOME.ty * Math.max(1, spaceScale), 0);
  applyCamera();
  const startSelect = params.get('select');
  if (startSelect) selectBar(startSelect, false);
  requestAnimationFrame(loop);

  /* 控制台里可以直接玩：__cube.jitter() / __cube.setView('cats') / __cube.select('moshi') */
  window.__cube = {
    data: D,
    getWorks: function () { return works; },
    setView: setView,
    select: function (id) { selectBar(id, false); },
    jitter: jitter,
    reset: reset,
    zoom: function (r) { tween = null; setRadius(r); },
    spaceScale: function (s) { setSpaceScale(s); }
  };
})();
