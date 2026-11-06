const { checkRateLimit } = require("./lib/ratelimit");
async function run() {
  console.log("Testing Rate Limit Logic...");
  // Test 1: Memory Fallback (No Env)
  process.env.UPSTASH_REDIS_REST_URL = "";
  const res1 = await checkRateLimit("test1", { limit: 2, windowMs: 1000 });
  console.log("Memory Fallback:", res1.success ? "✅" : "❌");

  // Test 2: Fail-Closed in Prod on Auth Route
  process.env.NODE_ENV = "production";
  process.env.UPSTASH_REDIS_REST_URL = "";
  const res2 = await checkRateLimit("test2", { limit: 10, windowMs: 60000, isAuthRoute: true });
  console.log("Prod Fail-Closed (Auth):", !res2.success ? "✅" : "❌");
}
run().catch(console.error);
