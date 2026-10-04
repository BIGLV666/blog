// 每周一北京时间 09:00 发送博客访问周报（统计/邮件逻辑与 Pages Functions 共用）
import { sendReport } from "../../functions/lib/mailer.js";

export default {
  async fetch() {
    return new Response("biglv666-blog cron worker（仅定时任务，无 HTTP 接口）\n", {
      headers: { "content-type": "text/plain; charset=utf-8" },
    });
  },
  async scheduled(event, env, ctx) {
    ctx.waitUntil((async () => {
      if (!env.SMTP_PASS) { console.log("skip report: SMTP_PASS 未配置"); return; }
      const r = await sendReport(env, "");
      console.log(r.ok ? "日报已发送" : "日报发送失败: " + r.err);
    })());
  },
};
