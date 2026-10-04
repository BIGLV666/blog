// /api/[[route]] —— 统计埋点 / 公开统计 / 测试邮件
import { hitCount, cstDate, readAllDays } from "../lib/stats.js";
import { sendReport } from "../lib/mailer.js";

export async function onRequestGet({ request, env, params, waitUntil }) {
  const url = new URL(request.url);
  const route = "/" + (params.route ? params.route.join("/") : "");

  if (route === "/visit") {
    let path = url.searchParams.get("p") || "/";
    if (!path.startsWith("/") || path.length > 200) path = "/";
    waitUntil(hitCount(env, path, cstDate()));
    return new Response(null, { status: 204 });
  }

  if (route === "/stats") {
    const { days, total } = await readAllDays(env);
    return new Response(JSON.stringify({ total, days }, null, 2), {
      headers: { "content-type": "application/json; charset=utf-8" },
    });
  }

  if (route === "/test-email") {
    if (url.searchParams.get("k") !== env.TEST_KEY) return new Response("forbidden", { status: 403 });
    if (!env.SMTP_PASS) return new Response("SMTP_PASS 未配置", { status: 500 });
    const r = await sendReport(env, "【测试】");
    return new Response(r.ok ? "测试邮件已发送 ✓ 请查收" : "发送失败: " + r.err, { status: r.ok ? 200 : 500 });
  }

  return new Response("not found", { status: 404 });
}
