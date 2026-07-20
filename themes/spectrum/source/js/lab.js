/* Spectrum · 实验室脚本：双缝干涉控制 + 棱镜色散 */
(function () {
  'use strict';

  /* ---- 双缝干涉（复用涟漪引擎，波源开关） ---- */
  var tank = document.getElementById('slitTank');
  if (tank && window.SpectrumRipple) {
    var FREQ = 0.35, AMP = 3;
    var single = [{ x: 0.5, y: 0.3, freq: FREQ, amp: AMP }];
    var double = [
      { x: 0.38, y: 0.3, freq: FREQ, amp: AMP },
      { x: 0.62, y: 0.3, freq: FREQ, amp: AMP }
    ];
    var sim = window.SpectrumRipple.mount(tank, { rain: false, interactive: true, cell: 4 });
    sim.setSources(single);

    var b1 = document.getElementById('srcSingle');
    var b2 = document.getElementById('srcDouble');
    var b3 = document.getElementById('srcClear');
    function pick(which) {
      sim.clear();
      sim.setSources(which === 'double' ? double : single);
      b1.classList.toggle('is-on', which !== 'double');
      b2.classList.toggle('is-on', which === 'double');
    }
    if (b1) b1.addEventListener('click', function () { pick('single'); });
    if (b2) b2.addEventListener('click', function () { pick('double'); });
    if (b3) b3.addEventListener('click', function () { sim.clear(); });
  }

  /* ---- 棱镜色散：入射角滑块 ---- */
  var slider = document.getElementById('prismAngle');
  var rayIn = document.getElementById('rayIn');
  var fan = document.getElementById('fanOut');
  if (slider && rayIn && fan) {
    var apply = function () {
      var deg = parseFloat(slider.value);
      /* 入射点固定在棱镜左腰 (252,222)，入射线绕该点旋转 */
      var rad = deg * Math.PI / 180;
      var len = 215;
      var base = Math.atan2(222 - 180, 252 - 40); /* 原始方向 */
      var ang = base + rad;
      rayIn.setAttribute('x1', String(252 - len * Math.cos(ang)));
      rayIn.setAttribute('y1', String(222 - len * Math.sin(ang)));
      /* 出射扇形随之整体摆动：色散角随入射角轻微变化 */
      var spread = 1 + Math.abs(deg) / 48;
      fan.setAttribute('transform',
        'rotate(' + String(-deg * 0.6) + ' 388 222) scale(1 ' + spread.toFixed(3) + ') translate(0 ' + String(222 * (1 - spread)) + ')');
    };
    slider.addEventListener('input', apply);
    apply();
  }
})();
