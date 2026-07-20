/* Spectrum · 四时场景：按访客本地时辰切换纸面色相
   晨曦 5-8 / 白昼 8-17 / 黄昏 17-20 / 子夜 20-5（自动等效暗房）。
   会话内的手动明暗选择优先于场景自动切换（sessionStorage 标记）。
   仅在页面加载时应用，无持续动画。 */
(function () {
  'use strict';

  function sceneOf(d) {
    var h = d.getHours();
    if (h >= 5 && h < 8) return 'dawn';
    if (h >= 8 && h < 17) return 'day';
    if (h >= 17 && h < 20) return 'dusk';
    return 'midnight';
  }

  function read(k, session) {
    try { return (session ? sessionStorage : localStorage).getItem(k); } catch (e) { return null; }
  }
  function write(k, v, session) {
    try { (session ? sessionStorage : localStorage).setItem(k, v); } catch (e) {}
  }

  function resolve() {
    var scene = sceneOf(new Date());
    var manual = read('spectrum-manual', true) === '1';
    var saved = read('spectrum-theme');
    var theme;
    if (manual && saved) theme = saved;                    /* 会话内手动选择优先 */
    else if (scene === 'midnight') theme = 'dark';         /* 子夜自动暗房 */
    else if (saved) theme = saved;                         /* 既有跨会话偏好 */
    else theme = (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) ? 'dark' : 'light';
    return { scene: scene, theme: theme };
  }

  function apply() {
    var s = resolve();
    var de = document.documentElement;
    de.setAttribute('data-theme', s.theme);
    de.setAttribute('data-scene', s.scene);
    return s;
  }

  var state = apply();

  window.SpectrumScenes = {
    scene: function () { return state.scene; },
    theme: function () { return state.theme; },
    refresh: function () { state = apply(); return state; },
    /* 手动切换明暗：记录为本会话的手动选择 */
    setManual: function (theme) {
      write('spectrum-theme', theme);
      write('spectrum-manual', '1', true);
      state = apply();
    }
  };
})();
