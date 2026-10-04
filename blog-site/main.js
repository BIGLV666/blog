/* BIGLV666 blog — 交互脚本（零依赖） */
(function () {
  "use strict";
  const $ = (s, el) => (el || document).querySelector(s);
  const $$ = (s, el) => Array.from((el || document).querySelectorAll(s));

  /* ---------- 0. 访问统计埋点 ---------- */
  if (location.hostname.endsWith(".pages.dev")) {
    const vk = "pv:" + location.pathname;
    if (!sessionStorage.getItem(vk)) {  // 会话内去重，刷新不重复计
      sessionStorage.setItem(vk, "1");
      new Image().src = "/api/visit?p=" + encodeURIComponent(location.pathname) + "&t=" + Date.now();
    }
  }

  /* ---------- 1. 粒子背景 ---------- */
  const cv = $("#bg"), ctx = cv.getContext("2d");
  let W, H, pts = [], mouse = { x: -9e3, y: -9e3 };
  function sizeCv() {
    W = cv.width = innerWidth; H = cv.height = innerHeight;
    const n = Math.min(70, Math.floor(W * H / 22000));
    pts = Array.from({ length: n }, () => ({
      x: Math.random() * W, y: Math.random() * H,
      vx: (Math.random() - .5) * .35, vy: (Math.random() - .5) * .35,
      r: Math.random() * 1.6 + .6
    }));
  }
  addEventListener("resize", sizeCv); sizeCv();
  addEventListener("mousemove", e => { mouse.x = e.clientX; mouse.y = e.clientY; });
  function light() { return document.documentElement.dataset.theme === "light"; }
  (function loop() {
    ctx.clearRect(0, 0, W, H);
    const dotC = light() ? "rgba(37,99,235,.35)" : "rgba(140,170,255,.5)";
    const lineC = light() ? "37,99,235" : "94,160,255";
    for (const p of pts) {
      p.x += p.vx; p.y += p.vy;
      if (p.x < 0 || p.x > W) p.vx *= -1;
      if (p.y < 0 || p.y > H) p.vy *= -1;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 7); ctx.fillStyle = dotC; ctx.fill();
    }
    for (let i = 0; i < pts.length; i++) for (let j = i + 1; j < pts.length; j++) {
      const a = pts[i], b = pts[j], dx = a.x - b.x, dy = a.y - b.y, d = dx * dx + dy * dy;
      if (d < 130 * 130) {
        ctx.strokeStyle = `rgba(${lineC},${(1 - d / 16900) * .16})`;
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
      }
    }
    for (const p of pts) { /* 鼠标引力连线 */
      const dx = p.x - mouse.x, dy = p.y - mouse.y, d = dx * dx + dy * dy;
      if (d < 170 * 170) {
        ctx.strokeStyle = `rgba(${lineC},${(1 - d / 28900) * .35})`;
        ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(mouse.x, mouse.y); ctx.stroke();
      }
    }
    requestAnimationFrame(loop);
  })();

  /* ---------- 2. 主题切换 ---------- */
  const themeBtn = $("#themeBtn");
  if (themeBtn) {
  const saved = localStorage.getItem("theme") || "light";
  document.documentElement.dataset.theme = saved;
  themeBtn.textContent = saved === "light" ? "☀️" : "🌙";
  themeBtn.onclick = () => {
    const t = document.documentElement.dataset.theme === "light" ? "dark" : "light";
    document.documentElement.dataset.theme = t;
    localStorage.setItem("theme", t);
    themeBtn.textContent = t === "light" ? "☀️" : "🌙";
  };
  }

  /* ---------- 3. 滚动入场 + 导航高亮 + 进度条 ---------- */
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
  }), { threshold: .12 });
  $$(".reveal").forEach(el => io.observe(el));

  const navLinks = $$("nav a.lk"), sections = navLinks.map(a => $(a.getAttribute("href")));
  const progress = $("#progress");
  addEventListener("scroll", () => {
    const st = scrollY, dh = document.documentElement.scrollHeight - innerHeight;
    progress.style.width = (dh > 0 ? st / dh * 100 : 0) + "%";
    let cur = -1;
    sections.forEach((s, i) => { if (s && s.getBoundingClientRect().top < 140) cur = i; });
    navLinks.forEach((a, i) => a.classList.toggle("on", i === cur));
  }, { passive: true });

  /* ---------- 4. 技术栈标签 ---------- */
  const tags = ["Java 17/21", "Spring Boot 3", "Spring Cloud", "MyBatis-Plus", "MySQL",
    "Redis", "RabbitMQ", "Docker", "GitHub Actions", "Go", "Vue 3"];
  const tagsEl = $("#stackTags");
  if (tagsEl) tagsEl.innerHTML = tags.map(t => `<span class="tag">${t}</span>`).join("");

  /* ---------- 5. 数字滚动 ---------- */
  const statIo = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return;
    statIo.unobserve(e.target);
    $$(".num", e.target).forEach(el => {
      const n = +el.dataset.n, t0 = performance.now();
      (function tick(t) {
        const p = Math.min((t - t0) / 1100, 1), ease = 1 - Math.pow(1 - p, 3);
        el.textContent = Math.round(n * ease);
        if (p < 1) requestAnimationFrame(tick);
      })(t0);
    });
  }), { threshold: .4 });
  const statsEl = $("#stats"); if (statsEl) statIo.observe(statsEl);

  /* ---------- 6. 终端打字机（仅首页） ---------- */
  const term = $("#termBody");
  if (term) {
  const MVN = "mvn dependency:get -Dartifact=io.github.biglv666:auth-kit-spring-boot-starter:RELEASE";
  const LINES = [
    { t: "$ " + MVN, c: "cmd", speed: 26 },
    { t: "\n[INFO] Scanning for projects...                              ", c: "dim", speed: 2 },
    { t: "\n[INFO] Resolving io.github.biglv666 : auth-kit ...           ", c: "dim", speed: 2 },
    { t: "\n[INFO] Downloaded auth-kit-spring-boot-starter.jar           ", c: "dim", speed: 2 },
    { t: "\n✔ 6 starters · Spring Boot 3 · Maven Central  ", c: "hl", speed: 14 },
    { t: "\n$", c: "cmd", speed: 60, cursor: true },
  ];
  function typeAll() {
    term.innerHTML = ""; let li = 0;
    function nextLine() {
      if (li >= LINES.length) return;
      const L = LINES[li++], span = document.createElement("span");
      span.className = L.c; term.appendChild(span);
      if (L.cursor) { const c = document.createElement("span"); c.className = "cur"; term.appendChild(c); }
      let ci = 0;
      (function typeChar() {
        span.textContent = L.t.slice(0, ++ci);
        if (ci < L.t.length) setTimeout(typeChar, L.speed);
        else nextLine();
      })();
    }
    nextLine();
  }
  const tIo = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) { typeAll(); tIo.disconnect(); }
  }), { threshold: .3 });
  tIo.observe(term);
  $("#copyMvn").onclick = e => {
    navigator.clipboard.writeText(MVN).then(() => {
      e.target.textContent = "已复制 ✓";
      setTimeout(() => e.target.textContent = "复制", 1600);
    });
  };
  }

  /* ---------- 7. 组件筛选（仅首页） ---------- */
  $$("#compTabs button").forEach(btn => btn.onclick = () => {
    $$("#compTabs button").forEach(b => b.classList.remove("on"));
    btn.classList.add("on");
    const f = btn.dataset.f;
    $$("#compCards .card").forEach(c => {
      const show = f === "all" || c.dataset.cat === f;
      c.classList.toggle("hide", !show);
      if (show) { c.classList.add("in"); }
    });
  });

  /* ---------- 8. 卡片鼠标光效 ---------- */
  $$(".card").forEach(c => c.addEventListener("mousemove", e => {
    const r = c.getBoundingClientRect();
    c.style.setProperty("--mx", (e.clientX - r.left) + "px");
    c.style.setProperty("--my", (e.clientY - r.top) + "px");
  }));

  /* ---------- 9. 命令面板 ---------- */
  const pal = $("#pal"), input = $("#palInput"), list = $("#palList");
  const ITEMS = [
    { k: "组件", t: "auth-kit — 认证鉴权 Starter", u: "https://github.com/BIGLV666/auth-kit-spring-boot-starter" },
    { k: "组件", t: "api-governance — API 治理 Starter", u: "https://github.com/BIGLV666/api-governance-spring-boot-starter" },
    { k: "组件", t: "guard — 幂等与分布式锁 Starter", u: "https://github.com/BIGLV666/concurrent-guard" },
    { k: "组件", t: "OutboxPro — 事务消息", u: "https://github.com/BIGLV666/OutboxPro" },
    { k: "组件", t: "state-kit — 状态机 Starter", u: "https://github.com/BIGLV666/state-kit-spring-boot-starter" },
    { k: "组件", t: "web-common — Web 通用 Starter", u: "https://github.com/BIGLV666/web-common-spring-boot-starter" },
    { k: "组件", t: "data-scope — 行级数据权限 Starter", u: "https://github.com/BIGLV666/data-scope-spring-boot-starter" },
    { k: "组件", t: "biglv666-spring-boot-bom — 版本聚合", u: "https://github.com/BIGLV666/biglv666-spring-boot-bom" },
    { k: "组件", t: "cache-kit — 三级缓存 Starter v0.3.0", u: "https://github.com/BIGLV666/cache-kit-spring-boot-starter" },
    { k: "项目", t: "CodeWise — 在线判题与 AI 学习平台", u: "https://github.com/BIGLV666/CodeWise" },
    { k: "项目", t: "DevPilot — 多服务开发控制台", u: "https://github.com/BIGLV666/DevPilot" },
    { k: "项目", t: "api-scanner — 接口与 DTO 导出", u: "https://github.com/BIGLV666/api-scanner" },
    { k: "文章", t: "三级缓存组件设计：Caffeine → Redis → DB", u: "/articles/cache-kit-design.html" },
    { k: "文章", t: "auth-kit 架构设计：不透明 Token + 有状态会话", u: "/articles/auth-kit-design.html" },
    { k: "文章", t: "OutboxPro：本地消息表事务消息", u: "/articles/outboxpro-intro.html" },
    { k: "导航", t: "开源组件", u: "#components" },
    { k: "导航", t: "主要项目", u: "#projects" },
    { k: "导航", t: "博客", u: "#blog" },
  ];
  let sel = 0, shown = ITEMS;
  function render() {
    const q = input.value.trim().toLowerCase();
    shown = ITEMS.filter(i => !q || (i.t + i.k).toLowerCase().includes(q));
    sel = 0;
    list.innerHTML = shown.length
      ? shown.map((i, x) => `<li data-i="${x}" class="${x === 0 ? "sel" : ""}"><span class="k">${i.k}</span>${i.t}</li>`).join("")
      : `<li class="none">没有匹配结果</li>`;
  }
  function open() { pal.hidden = false; input.value = ""; render(); input.focus(); }
  function close() { pal.hidden = true; }
  $("#palBtn").onclick = open; $("#palBtn2").onclick = open;
  $("#palMask").onclick = close;
  addEventListener("keydown", e => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") { e.preventDefault(); pal.hidden ? open() : close(); }
    if (e.key === "Escape" && !pal.hidden) close();
    if (pal.hidden) return;
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      sel = Math.max(0, Math.min(shown.length - 1, sel + (e.key === "ArrowDown" ? 1 : -1)));
      $$("#palList li").forEach((li, x) => li.classList.toggle("sel", x === sel));
      const el = $(`#palList li[data-i="${sel}"]`); if (el) el.scrollIntoView({ block: "nearest" });
    }
    if (e.key === "Enter" && shown[sel]) location.href = shown[sel].u;
  });
  input.oninput = render;
  list.onclick = e => {
    const li = e.target.closest("li[data-i]");
    if (li) location.href = shown[+li.dataset.i].u;
  };
})();
