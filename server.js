import http from "http";
import https from "https";
import url from "url";
import fs from "fs";

try {
  fs.readFileSync(".env", "utf8")
    .split("\n")
    .forEach((line) => {
      const [k, ...v] = line.split("=");
      if (k && v.length) process.env[k.trim()] = v.join("=").trim();
    });
} catch (e) {}

const PORT = process.env.PORT || 3001;
const GROQ_KEY = process.env.GROQ_API_KEY;
const TAVILY_KEY = process.env.TAVILY_API_KEY;

const rateLimitMap = new Map();
setInterval(() => rateLimitMap.clear(), 60000);

function sendJSON(res, statusCode, payload) {
  res.writeHead(statusCode, {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  });
  res.end(JSON.stringify(payload));
}

function sanitizeHypothesis(input) {
  if (!input || typeof input !== "string") return null;
  const trimmed = input.trim();
  if (trimmed.length < 20) return null;
  if (trimmed.length > 2000) return trimmed.slice(0, 2000);
  return trimmed;
}

function safeParseJSON(str) {
  if (!str || typeof str !== "string") return null;
  let cleaned = str.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
  try {
    return JSON.parse(cleaned);
  } catch (e) {}

  const objectMatch = cleaned.match(/\{[\s\S]*\}/);
  if (objectMatch) {
    try {
      return JSON.parse(objectMatch[0]);
    } catch (e) {}
  }

  const arrayMatch = cleaned.match(/\[[\s\S]*\]/);
  if (arrayMatch) {
    try {
      return JSON.parse(arrayMatch[0]);
    } catch (e) {}
  }

  return null;
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
    });
    req.on("end", () => {
      if (!body) return resolve({});
      try {
        resolve(JSON.parse(body));
      } catch (err) {
        reject(err);
      }
    });
    req.on("error", reject);
  });
}

function httpsPost(hostname, path, headers, body) {
  return new Promise((resolve, reject) => {
    const req = https.request(
      {
        hostname,
        path,
        method: "POST",
        headers,
      },
      (res) => {
        let data = "";
        res.on("data", (chunk) => {
          data += chunk;
        });
        res.on("end", () => {
          try {
            const parsed = JSON.parse(data);
            if ((res.statusCode || 500) < 200 || (res.statusCode || 500) >= 300) {
              const message =
                parsed?.error?.message ||
                parsed?.message ||
                `HTTP ${res.statusCode || 500}`;
              reject(new Error(message));
              return;
            }
            resolve(parsed);
          } catch (e) {
            reject(new Error("Invalid JSON response"));
          }
        });
      },
    );
    req.on("error", reject);
    req.write(JSON.stringify(body));
    req.end();
  });
}

function httpsPostRaw(hostname, path, headers, body) {
  return new Promise((resolve, reject) => {
    const req = https.request(
      {
        hostname,
        path,
        method: "POST",
        headers,
      },
      (res) => {
        let data = "";
        res.on("data", (chunk) => {
          data += chunk;
        });
        res.on("end", () => {
          if ((res.statusCode || 500) < 200 || (res.statusCode || 500) >= 300) {
            try {
              const parsed = JSON.parse(data);
              reject(new Error(parsed?.error?.message || parsed?.message || `HTTP ${res.statusCode || 500}`));
              return;
            } catch (e) {
              reject(new Error(`HTTP ${res.statusCode || 500}`));
              return;
            }
          }
          resolve(data);
        });
      },
    );
    req.on("error", reject);
    req.write(JSON.stringify(body));
    req.end();
  });
}

async function makeGroqCall(messages, maxTokens = 1000) {
  if (!GROQ_KEY) return null;
  try {
    const responseBody = await httpsPostRaw(
      "api.groq.com",
      "/openai/v1/chat/completions",
      {
        Authorization: `Bearer ${GROQ_KEY}`,
        "Content-Type": "application/json",
      },
      {
        model: "llama-3.1-8b-instant",
        messages,
        max_tokens: maxTokens,
        temperature: 0.3,
      },
    );
    const data = JSON.parse(responseBody);
    return data.choices?.[0]?.message?.content || null;
  } catch (error) {
    console.error("Groq call failed:", error?.message || "unknown error");
    return null;
  }
}

async function makeTavilyCall(query) {
  if (!TAVILY_KEY) return [];
  try {
    const response = await httpsPost(
      "api.tavily.com",
      "/search",
      {
        "Content-Type": "application/json",
      },
      {
        api_key: TAVILY_KEY,
        query,
        max_results: 3,
        search_depth: "basic",
        include_answer: false,
      },
    );
    return Array.isArray(response?.results) ? response.results : [];
  } catch (error) {
    console.error("Tavily call failed:", error?.message || "unknown error");
    return [];
  }
}

function buildFewShot(corrections, section) {
  if (!Array.isArray(corrections)) return "";
  const filtered = corrections.filter((c) => c && c.section === section);
  if (!filtered.length) return "";
  return (
    "CORRECTIONS FROM PREVIOUS EXPERT REVIEWS (apply these lessons):\n" +
    filtered
      .map(
        (c) =>
          `- Issue: ${String(c.original_text || "")}\n  Correction: ${String(c.correction || "")}`,
      )
      .join("\n")
  );
}

const server = http.createServer(async (req, res) => {
  const start = Date.now();
  const parsedUrl = url.parse(req.url || "", true);
  const path = parsedUrl.pathname || "/";
  const method = req.method || "GET";
  const ip =
    req.socket?.remoteAddress ||
    req.headers["x-forwarded-for"] ||
    "unknown";
  const ipKey = Array.isArray(ip) ? ip[0] : String(ip);

  let statusCode = 500;
  try {
    if (method === "OPTIONS") {
      statusCode = 204;
      res.writeHead(204, {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      });
      res.end();
      return;
    }

    const current = rateLimitMap.get(ipKey) || 0;
    if (current >= 20) {
      statusCode = 429;
      sendJSON(res, 429, { error: "Too many requests. Max 20/min." });
      return;
    }
    rateLimitMap.set(ipKey, current + 1);

    if (method === "GET" && path === "/health") {
      statusCode = 200;
      sendJSON(res, 200, {
        status: "ok",
        groq: !!GROQ_KEY,
        tavily: !!TAVILY_KEY,
        timestamp: Date.now(),
      });
      return;
    }

    if (method === "GET" && path === "/api/test-groq") {
      const messages = [
        {
          role: "user",
          content: "Return this exact JSON: {test: true, value: 42}",
        },
      ];
      const raw = await makeGroqCall(messages, 80);
      console.log("=== RAW GROQ RESPONSE ===", raw?.slice(0, 500));
      statusCode = 200;
      sendJSON(res, 200, { raw });
      return;
    }

    if (method !== "POST" || !path.startsWith("/api/")) {
      statusCode = 404;
      sendJSON(res, 404, { error: "Not found" });
      return;
    }

    const body = await readBody(req);

    if (path === "/api/parse") {
      const hypothesis = sanitizeHypothesis(body?.hypothesis);
      if (!hypothesis) {
        statusCode = 400;
        sendJSON(res, 400, {
          error: "Hypothesis too short or missing. Min 20 chars.",
        });
        return;
      }

      const groqText = await makeGroqCall([
        {
          role: "system",
          content:
            "You are a scientific hypothesis parser. Return ONLY valid JSON with no markdown fences, no explanation, no preamble. JSON schema: {intervention: string, outcome: string, mechanism: string, control: string}",
        },
        {
          role: "user",
          content:
            "Parse this scientific hypothesis into its 4 components: " +
            hypothesis,
        },
      ]);
      console.log("=== RAW GROQ RESPONSE ===", groqText?.slice(0, 500));

      let parsed = safeParseJSON(groqText || "");
      if (!parsed || typeof parsed !== "object") {
        parsed = {
          intervention: hypothesis.slice(0, 100),
          outcome: "See hypothesis",
          mechanism: "See hypothesis",
          control: "Not specified",
        };
      }

      const result = {
        intervention: parsed.intervention || "Not specified",
        outcome: parsed.outcome || "Not specified",
        mechanism: parsed.mechanism || "Not specified",
        control: parsed.control || "Not specified",
      };

      statusCode = 200;
      sendJSON(res, 200, result);
      return;
    }

    if (path === "/api/literature") {
      const hypothesis = sanitizeHypothesis(body?.hypothesis);
      if (!hypothesis) {
        statusCode = 400;
        sendJSON(res, 400, {
          error: "Hypothesis too short or missing. Min 20 chars.",
        });
        return;
      }

      const tavilyResults = await makeTavilyCall(
        hypothesis + " laboratory protocol experiment published peer-reviewed",
      );

      const groqText = await makeGroqCall([
        {
          role: "system",
          content:
            "You are a scientific literature analyst. Return ONLY valid JSON, no markdown.",
        },
        {
          role: "user",
          content:
            "Classify the novelty of this hypothesis. Choose exactly one: 'not_found' (no similar work), 'similar' (related work exists), 'exact_match' (this exact experiment published). Extract up to 3 references from the search results. Return JSON: {novelty: 'not_found'|'similar'|'exact_match', references: [{title: string, authors: string, year: number, doi: string}]}. If no DOI found use the URL. Hypothesis: " +
            hypothesis +
            " Search results: " +
            JSON.stringify(
              tavilyResults.slice(0, 3).map((r) => ({
                title: r.title,
                url: r.url,
                content: r.content ? r.content.slice(0, 300) : "",
              })),
            ),
        },
      ]);
      console.log("=== RAW GROQ RESPONSE ===", groqText?.slice(0, 500));

      const parsed = safeParseJSON(groqText || "");
      const fallback = { novelty: "similar", references: [] };
      const result =
        parsed && typeof parsed === "object"
          ? {
              novelty:
                parsed.novelty === "not_found" ||
                parsed.novelty === "similar" ||
                parsed.novelty === "exact_match"
                  ? parsed.novelty
                  : "similar",
              references: Array.isArray(parsed.references)
                ? parsed.references.slice(0, 3)
                : [],
            }
          : fallback;

      statusCode = 200;
      sendJSON(res, 200, result);
      return;
    }

    if (path === "/api/protocol") {
      const hypothesis = sanitizeHypothesis(body?.hypothesis);
      if (!hypothesis) {
        statusCode = 400;
        sendJSON(res, 400, {
          error: "Hypothesis too short or missing. Min 20 chars.",
        });
        return;
      }

      const parsedData = body?.parsed || {};
      const corrections = Array.isArray(body?.corrections) ? body.corrections : [];

      const protocolResults = await makeTavilyCall(
        hypothesis +
          " step by step protocol methods site:protocols.io OR site:bio-protocol.org",
      );
      const fewShotBlock = buildFewShot(corrections, "protocol");
      const groqText = await makeGroqCall(
        [
          {
            role: "system",
            content:
              "You are an expert laboratory scientist. Return ONLY a valid JSON array, no markdown, no explanation.",
          },
          {
            role: "user",
            content:
              (fewShotBlock ? fewShotBlock + "\n" : "") +
              "Return a JSON array of 6 lab protocol steps for this experiment. Each step has: number (1-6), title (string), description (string), source (null). Return ONLY the JSON array, nothing else, no markdown. Experiment: " +
              hypothesis,
          },
        ],
        1500,
      );
      console.log("=== RAW GROQ RESPONSE ===", groqText?.slice(0, 500));

      const parsed = safeParseJSON(groqText || "");
      const result = Array.isArray(parsed) ? parsed : [];
      statusCode = 200;
      sendJSON(res, 200, result);
      return;
    }

    if (path === "/api/materials") {
      const hypothesis = sanitizeHypothesis(body?.hypothesis);
      if (!hypothesis) {
        statusCode = 400;
        sendJSON(res, 400, {
          error: "Hypothesis too short or missing. Min 20 chars.",
        });
        return;
      }

      const steps = Array.isArray(body?.steps) ? body.steps : [];
      const corrections = Array.isArray(body?.corrections) ? body.corrections : [];
      const supplierResults = await makeTavilyCall(
        "site:sigmaaldrich.com OR site:thermofisher.com " +
          hypothesis +
          " reagent catalog",
      );
      const fewShotBlock = buildFewShot(corrections, "materials");
      const groqText = await makeGroqCall(
        [
          {
            role: "system",
            content:
              "You are a lab supply specialist. Return ONLY a valid JSON array, no markdown.",
          },
          {
            role: "user",
            content:
              (fewShotBlock ? fewShotBlock + "\n" : "") +
              "Return a JSON array of materials for this lab experiment. Each item: {item: string, catalog: string, supplier: string, status: 'verified' or 'verify'} Include 6-8 real reagents with real catalog numbers. Return ONLY the JSON array, no markdown. Experiment: " +
              hypothesis,
          },
        ],
        1200,
      );
      console.log("=== RAW GROQ RESPONSE ===", groqText?.slice(0, 500));
      const parsed = safeParseJSON(groqText || "");
      statusCode = 200;
      sendJSON(res, 200, Array.isArray(parsed) ? parsed : []);
      return;
    }

    if (path === "/api/budget") {
      const materials = Array.isArray(body?.materials) ? body.materials : [];
      const corrections = Array.isArray(body?.corrections) ? body.corrections : [];
      const fewShotBlock = buildFewShot(corrections, "budget");
      const groqText = await makeGroqCall(
        [
          {
            role: "system",
            content:
              "You are a lab budget specialist. Return ONLY valid JSON, no markdown.",
          },
          {
            role: "user",
            content:
              (fewShotBlock ? fewShotBlock + "\n" : "") +
              "Estimate realistic 2024 USD costs for these lab materials. Include equipment rental options where purchase cost exceeds $1000. Return JSON: {total: number, reagents: number, equipment: number, consumables: number, lineItems: [{item: string, qty: number, unit: number, total: number, verified: boolean}]}\n\nMaterials list:\n" +
              JSON.stringify(materials),
          },
        ],
        1200,
      );
      console.log("=== RAW GROQ RESPONSE ===", groqText?.slice(0, 500));
      let result = safeParseJSON(groqText || "");
      if (!result || typeof result !== "object") {
        result = {
          total: 500,
          reagents: 300,
          equipment: 150,
          consumables: 50,
          lineItems: [{ item: "See materials list", qty: 1, unit: 500, total: 500, verified: false }],
        };
      }
      statusCode = 200;
      sendJSON(res, 200, result);
      return;
    }

    if (path === "/api/timeline") {
      const hypothesis = sanitizeHypothesis(body?.hypothesis);
      if (!hypothesis) {
        statusCode = 400;
        sendJSON(res, 400, {
          error: "Hypothesis too short or missing. Min 20 chars.",
        });
        return;
      }

      const steps = Array.isArray(body?.steps) ? body.steps : [];
      const corrections = Array.isArray(body?.corrections) ? body.corrections : [];
      const fewShotBlock = buildFewShot(corrections, "timeline");
      const groqText = await makeGroqCall(
        [
          {
            role: "system",
            content:
              "You are a scientific project manager. Return ONLY valid JSON, no markdown.",
          },
          {
            role: "user",
            content:
              (fewShotBlock ? fewShotBlock + "\n" : "") +
              "Return JSON for experiment timeline. Format: {minWeeks: 8, criticalCount: 3, tasks: [{name: string, start: number, duration: number, critical: boolean}]} Include 5-7 realistic tasks. Return ONLY JSON, no markdown. Experiment: " +
              hypothesis,
          },
        ],
        1000,
      );
      console.log("=== RAW GROQ RESPONSE ===", groqText?.slice(0, 500));
      const parsed = safeParseJSON(groqText || "");
      statusCode = 200;
      sendJSON(
        res,
        200,
        parsed && typeof parsed === "object"
          ? parsed
          : { minWeeks: 0, criticalCount: 0, tasks: [] },
      );
      return;
    }

    if (path === "/api/validation") {
      const hypothesis = sanitizeHypothesis(body?.hypothesis);
      if (!hypothesis) {
        statusCode = 400;
        sendJSON(res, 400, {
          error: "Hypothesis too short or missing. Min 20 chars.",
        });
        return;
      }

      const parsedData = body?.parsed || {};
      const corrections = Array.isArray(body?.corrections) ? body.corrections : [];
      const fewShotBlock = buildFewShot(corrections, "validation");
      const groqText = await makeGroqCall(
        [
          {
            role: "system",
            content:
              "You are a scientific methods expert. Return ONLY valid JSON, no markdown.",
          },
          {
            role: "user",
            content:
              (fewShotBlock ? fewShotBlock + "\n" : "") +
              "Define complete validation criteria. Choose the correct statistical test based on experiment design. Return JSON: {endpoint: string, stat_test: string, sample_size: string, negative_criteria: string}\n\nHypothesis: " +
              hypothesis +
              "\nParsed: " +
              JSON.stringify(parsedData),
          },
        ],
        1000,
      );
      console.log("=== RAW GROQ RESPONSE ===", groqText?.slice(0, 500));
      const parsed = safeParseJSON(groqText || "");
      statusCode = 200;
      sendJSON(
        res,
        200,
        parsed && typeof parsed === "object"
          ? parsed
          : { endpoint: "", stat_test: "", sample_size: "", negative_criteria: "" },
      );
      return;
    }

    if (path === "/api/recombine") {
      const literature = body?.literature || null;
      const protocol = Array.isArray(body?.protocol) ? body.protocol : [];
      const materials = Array.isArray(body?.materials) ? body.materials : [];
      const budget = body?.budget || {};
      const timeline = body?.timeline || {};
      const validation = body?.validation || {};

      const rules = [
        {
          check: (p, m) =>
            p.some((s) =>
              String(s.description || "")
                .toLowerCase()
                .includes("flow cytometr"),
            ) &&
            !m.some((i) =>
              String(i.item || "")
                .toLowerCase()
                .includes("flow cytometr"),
            ),
          text: "Protocol mentions flow cytometry but no flow cytometer in materials list.",
        },
        {
          check: (p, m) =>
            p.some((s) =>
              String(s.description || "")
                .toLowerCase()
                .includes("pcr"),
            ) &&
            !m.some(
              (i) =>
                String(i.item || "")
                  .toLowerCase()
                  .includes("polymerase") ||
                String(i.catalog || "").includes("PCR"),
            ),
          text: "Protocol mentions PCR but no polymerase or PCR kit in materials.",
        },
        {
          check: (p, m) =>
            p.some((s) =>
              String(s.description || "")
                .toLowerCase()
                .includes("elisa"),
            ) &&
            !m.some((i) =>
              String(i.item || "")
                .toLowerCase()
                .includes("elisa"),
            ),
          text: "Protocol mentions ELISA but no ELISA kit in materials.",
        },
        {
          check: (p, m) =>
            p.some((s) =>
              String(s.description || "")
                .toLowerCase()
                .includes("centrifug"),
            ) &&
            !m.some((i) =>
              String(i.item || "")
                .toLowerCase()
                .includes("centrifug"),
            ),
          text: "Centrifugation step in protocol but no centrifuge in materials.",
        },
        {
          check: (p, m) =>
            p.some((s) =>
              String(s.description || "")
                .toLowerCase()
                .includes("incubat"),
            ) &&
            !m.some((i) =>
              String(i.item || "")
                .toLowerCase()
                .includes("incubator"),
            ),
          text: "Incubation step in protocol but no incubator listed in materials.",
        },
      ];

      const ruleViolations = rules
        .filter((r) => {
          try {
            return r.check(protocol || [], materials || []);
          } catch (e) {
            return false;
          }
        })
        .map((r) => ({ resolved: false, text: r.text }));

      const groqText = await makeGroqCall(
        [
          {
            role: "system",
            content:
              "You are a scientific plan auditor. Return ONLY valid JSON, no markdown.",
          },
          {
            role: "user",
            content:
              "Find conflicts, missing items, or inconsistencies across these experiment plan sections. Focus on: items mentioned in protocol but missing from materials, costs missing from budget, timeline assumptions that conflict with typical reagent delivery times. Return JSON: {conflicts: [{resolved: boolean, text: string}]}. If no additional conflicts: return {conflicts: []}. Plan summary: " +
              JSON.stringify({
                protocolSteps: protocol?.length,
                materialItems: materials?.length,
                budgetTotal: budget?.total,
                timelineWeeks: timeline?.minWeeks,
                validationEndpoint: String(validation?.endpoint || "").slice(0, 100),
                literatureSeen: !!literature,
              }),
          },
        ],
        800,
      );
      console.log("=== RAW GROQ RESPONSE ===", groqText?.slice(0, 500));
      const parsed = safeParseJSON(groqText || "");
      const aiConflicts = Array.isArray(parsed?.conflicts) ? parsed.conflicts : [];
      const total =
        ruleViolations.length +
        aiConflicts.filter((c) => c && !c.resolved).length;
      const trustLevel = total === 0 ? "high" : total <= 2 ? "amber" : "low";

      statusCode = 200;
      sendJSON(res, 200, {
        conflicts: [...ruleViolations, ...aiConflicts],
        trustLevel,
        totalViolations: total,
      });
      return;
    }

    statusCode = 404;
    sendJSON(res, 404, { error: "Not found" });
  } catch (error) {
    statusCode = 500;
    sendJSON(res, 500, {
      error: "Internal server error",
      message: error?.message || "unknown",
    });
  } finally {
    const elapsedMs = Date.now() - start;
    console.log(
      `[${new Date().toISOString()}] ${method} ${path} ${statusCode} ${elapsedMs}ms`,
    );
  }
});

server.listen(PORT, () => {
  console.log(`WhiteCoat API server running on http://localhost:${PORT}`);
});
