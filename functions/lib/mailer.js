// 邮件周报：QQ 邮箱 SMTP（465 SSL + AUTH LOGIN）
import { b64, cstDate, readAllDays } from "./stats.js";

export const MAIL_USER = "379299583@qq.com";
const SMTP_HOST = "smtp.qq.com";
const SMTP_PORT = 465;

export async function sendReport(env, tag) {
  try {
    const { days, total } = await readAllDays(env);

    // 近 7 天（截至昨天）
    const last7 = [];
    for (let i = 7; i >= 1; i--) {
      const d = cstDate(i);
      const v = days[d] || {};
      last7.push([d, Object.values(v).reduce((a, b) => a + b, 0)]);
    }
    const weekSum = last7.reduce((a, [, n]) => a + n, 0);
    const range = `${last7[0][0].slice(5)} ~ ${last7[6][0].slice(5)}`;

    // 7 天聚合 Top 页面
    const agg = {};
    for (let i = 7; i >= 1; i--) {
      const v = days[cstDate(i)] || {};
      for (const [pg, n] of Object.entries(v)) agg[pg] = (agg[pg] || 0) + n;
    }
    const top = Object.entries(agg).sort((a, b) => b[1] - a[1]).slice(0, 10);

    let t = `博客访问周报 ${tag}· ${range}\n\n本周 PV：${weekSum}    累计 PV：${total}\n\n【每日明细】\n`;
    const max = Math.max(1, ...last7.map(x => x[1]));
    for (const [d, n] of last7) t += "  " + d + "  " + "█".repeat(Math.round(n / max * 24)).padEnd(24) + " " + n + "\n";
    t += "\n【本周 Top 页面】\n";
    if (top.length === 0) t += "  （本周无访问）\n";
    for (const [pg, n] of top) t += "  " + pg.padEnd(42) + String(n).padStart(4) + "\n";
    t += "\n--\nbiglv666-blog.pages.dev · Cloudflare 每周一 09:00 自动发送";

    const subject = `博客周报 ${tag}· ${range} · PV ${weekSum}`;
    const msg =
      `From: =?utf-8?B?${b64("博客访问统计")}?= <${MAIL_USER}>\r\n` +
      `To: <${MAIL_USER}>\r\n` +
      `Subject: =?utf-8?B?${b64(subject)}?=\r\n` +
      `Date: ${new Date().toUTCString()}\r\n` +
      `MIME-Version: 1.0\r\n` +
      `Content-Type: text/plain; charset=UTF-8\r\n` +
      `Content-Transfer-Encoding: base64\r\n\r\n` +
      b64(t);

    await smtpSend(msg, env.SMTP_PASS);
    return { ok: true };
  } catch (e) {
    return { ok: false, err: e.message || String(e) };
  }
}

// 极简 SMTP 客户端
async function smtpSend(msg, pass) {
  const { connect } = await import("cloudflare:sockets");
  const sock = connect({ hostname: SMTP_HOST, port: SMTP_PORT }, { secureTransport: "on" });
  const reader = sock.readable.getReader();
  const writer = sock.writable.getWriter();
  const enc = new TextEncoder(), dec = new TextDecoder();
  let buf = "";

  async function readReply() {
    for (;;) {
      let i;
      while ((i = buf.indexOf("\r\n")) >= 0) {
        const line = buf.slice(0, i);
        buf = buf.slice(i + 2);
        if (/^\d{3} /.test(line)) return line; // 末行（带空格），忽略 250- 续行
      }
      const { value, done } = await reader.read();
      if (done) throw new Error("SMTP 连接中断: " + buf);
      buf += dec.decode(value, { stream: true });
    }
  }
  async function cmd(s) {
    await writer.write(enc.encode(s + "\r\n"));
    return readReply();
  }
  const expect = (r, code, step) => {
    if (!r.startsWith(code)) throw new Error(`${step}: ${r}`);
  };

  let r = await readReply();                              expect(r, "220", "banner");
  r = await cmd("EHLO biglv666-blog");                    expect(r, "250", "ehlo");
  r = await cmd("AUTH LOGIN");                            expect(r, "334", "auth");
  r = await cmd(b64(MAIL_USER));                          expect(r, "334", "auth-user");
  r = await cmd(b64(pass));                               expect(r, "235", "auth-pass");
  r = await cmd(`MAIL FROM:<${MAIL_USER}>`);              expect(r, "250", "mail-from");
  r = await cmd(`RCPT TO:<${MAIL_USER}>`);                expect(r, "250", "rcpt-to");
  r = await cmd("DATA");                                  expect(r, "354", "data");
  await writer.write(enc.encode(msg + "\r\n.\r\n"));
  r = await readReply();                                  expect(r, "250", "data-end");
  await cmd("QUIT").catch(() => {});
  try { await writer.close(); } catch (e) {}
}
