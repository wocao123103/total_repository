/* ==========================================================================
   作品数据.js · 唯一数据源（Single source of truth）
   --------------------------------------------------------------------------
   这个页面里所有会变的东西，都只在这里写一次：
     · 左侧「作品入口」列表        ← PORTFOLIO.works
     · 顶部统计数字                ← 由 works 计算
     · 右下角分类图例              ← PORTFOLIO.categories
     · 3D 场景里每根柱子的样子     ← shape / prop 字段
     · 点击柱子后的详情面板        ← 还是 works
   场景脚本.js 里不写死任何作品名，也不写死「哪根柱子长什么样」。

   沿用 作品总览.html 里 LINKS 的做法，并放大成完整的数据驱动：
   数据改了，DOM 和 3D 一起变，不用动 HTML 结构。
   注意：这里用普通 <script> 挂 window 全局，不使用 ES Module，
   因为双击 file:// 打开时 module 会被浏览器的跨域策略拦下。
   ========================================================================== */
(function () {
  'use strict';

  /* 分类表：id 是主键，works[].cat 引用它；color 同时给 DOM 圆点和 3D 柱子用 */
  const categories = [
    { id: 'nav',   name: '导航汇总',     short: '导航',   color: '#166b59', desc: '把作品串起来的目录页' },
    { id: 'work',  name: '作品页',       short: '作品',   color: '#0b8b82', desc: '面向访问者的介绍页' },
    { id: 'three', name: 'Three.js 实验', short: '3D 实验', color: '#155e8b', desc: '3D 与数据可视化' }
  ];

  /* 视图表：三种「看同一份数据的角度」，切换时只换聚合方式，不换数据 */
  const views = [
    { id: 'works', label: '按作品', hint: '一根柱子 = 一个作品，高度 = 体量指数' },
    { id: 'cats',  label: '按分类', hint: '按分类聚合，高度 = 该分类的作品数' },
    { id: 'years', label: '按年份', hint: '按年份聚合，高度 = 那一年的作品数' }
  ];

  /* 作品表：weight / year 是演示用的示例字段，随便改，页面会跟着变。
     icon      有真实图标的写图片路径（相对本文件夹）
     iconText  没有图片时用这个字当徽标，底色取分类色
     shape     柱身形状：box 方柱 / cylinder 圆柱 / prism 六棱柱 / taper 四棱台
     prop      柱顶的小模型：boards 叠书 / calendar 日历 / ink 纸和笔（city 小城市的模型还在，暂时没有作品用）
     local=true 的链接是本机相对路径，双击本页就能点开。 */
  const works = [
    {
      id: 'works', title: '作品总展示', sub: '白绿 + 左目录 + 右留白',
      cat: 'nav', year: 2026, weight: 2, iconText: 'x',
      shape: 'box', prop: 'boards',
      metric: { label: '文件大小', value: '约 3 KB · 75 行' },
      desc: '整个作品的入口页。左边列出能点开的作品，右边刻意留白；这一版的留白，就是下面这个 3D 画布的原型。',
      tags: ['HTML', 'CSS', '样式.css'],
      link: '../前端html学习网页/作品目录.html', local: true
    },
    {
      id: 'schedule', title: '日程助手 · 简介网页', sub: '智能待办助手展示页',
      cat: 'work', year: 2025, weight: 6, icon: '素材/日程助手图标.png',
      shape: 'cylinder', prop: 'calendar',
      metric: { label: '入口', value: 'GitHub Pages' },
      desc: 'Python 课的作品介绍页，深色极光背景、左右两条侧栏，是「夜间模式」配色的来源。',
      tags: ['Python 课', '极光背景', '左右侧栏'],
      link: 'https://wocao123103.github.io/smart_schedule/python%E8%AF%BE%E5%8A%A0%E8%BD%BD%E7%BD%91%E9%A1%B5.html', local: false
    },
    {
      id: 'moshi', title: '墨识 · 本地手写识别', sub: '白绿卡片式介绍页',
      cat: 'work', year: 2026, weight: 8, icon: '素材/墨识图标.png',
      shape: 'prism', prop: 'ink',
      metric: { label: '文件大小', value: '约 56 KB' },
      desc: '白绿视觉、顶栏导航、左侧目录、卡片网格。页面底部用 LINKS 对象集中管理外部地址，是全站「数据驱动」的起点。',
      tags: ['LINKS', 'data-link', '离线可用'],
      link: 'https://wocao123103.github.io/ink_recognition-moshi-/index.html', local: false
    }
  ];

  const meta = {
    owner: 'xxy',
    title: '作品数据立方',
    subtitle: '把留白区换成一个由数据长出来的 3D 场景',
    updated: '2026-11-09',
    note: '离线可用：三维引擎.min.js 与图标都是本地文件，双击 作品总览.html 即可，不需要联网，也不需要起服务器。'
  };

  /* 3D 柱子顶上的短标签。名字太长会挤在一起，所以另给一份短名，
     仍然放在数据层里，场景脚本.js 不自己造名字。 */
  const SHORT = {
    works: '总展示', schedule: '日程助手', moshi: '墨识'
  };
  works.forEach(function (w) { w.short = SHORT[w.id] || w.title; });

  window.PORTFOLIO = { meta: meta, categories: categories, views: views, works: works };
})();
