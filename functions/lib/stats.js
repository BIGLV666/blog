// 统计公共逻辑（Pages Functions 与 cron Worker 共用）
export function b64(s) {
  const bytes = new TextEncoder().encode(s);
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin);
}

// 北京时间日期串（offsetDays=1 即昨天）
export function cstDate(offsetDays = 0) {
  return new Date(Date.now() + 8 * 3600e3 - offsetDays * 86400e3).toISOString().slice(0, 10);
}

export async function readAllDays(env) {
  const days = {};
  let total = 0, done = false, cursor;
  while (!done) {
    const list = await env.STATS.list({ prefix: "d:", cursor });
    for (const k of list.keys) {
      const v = (await env.STATS.get(k.name, "json")) || {};
      days[k.name.slice(2)] = v;
      for (const n of Object.values(v)) total += n;
    }
    done = list.list_complete;
    cursor = list.cursor;
  }
  return { days, total };
}

export async function hitCount(env, path, day) {
  const key = "d:" + day;
  const cur = (await env.STATS.get(key, "json")) || {};
  cur[path] = (cur[path] || 0) + 1;
  await env.STATS.put(key, JSON.stringify(cur));
}
