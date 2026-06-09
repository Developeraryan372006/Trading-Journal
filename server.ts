import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Let's parser body as JSON
  app.use(express.json({ limit: "5mb" }));

  // Shared Gemini client utility with telemetry User-Agent
  let ai: GoogleGenAI | null = null;
  const apiKey = process.env.GEMINI_API_KEY;

  if (apiKey) {
    ai = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }

  // API Check Status Endpoint
  app.get("/api/health", (req, res) => {
    res.json({
      status: "healthy",
      hasApiKey: !!apiKey,
    });
  });

  // API Endpoint for Gemini analysis
  app.post("/api/gemini/analyze", async (req, res) => {
    try {
      if (!process.env.GEMINI_API_KEY) {
        return res.status(400).json({
          error: "GEMINI_API_KEY environment variable is not configured. Please add it in Settings > Secrets.",
        });
      }

      const { date, trades, manualReflections, tradingPlan } = req.body;

      if (!ai) {
        ai = new GoogleGenAI({
          apiKey: process.env.GEMINI_API_KEY,
          httpOptions: {
            headers: {
              "User-Agent": "aistudio-build",
            },
          },
        });
      }

      // Generate context prompt string from trades and user notes
      const tradesSummary = trades && trades.length > 0
        ? trades.map((t: any, i: number) => {
            return `Trade #${i + 1}:
- Asset/Symbol: ${t.symbol}
- Direction: ${t.direction}
- Entry Price: ${t.entryPrice}
- Exit Price: ${t.exitPrice}
- Quantity: ${t.quantity}
- net Profit/Loss: $${t.pnl}
- Emotional State: ${t.emotion}
- Trade Notes: ${t.notes || "None"}`;
          }).join("\n\n")
        : "No trades were logged for this day.";

      const planSummary = tradingPlan
        ? `Trading Plan & Boundaries:
- Max Daily Loss Allowed: $${tradingPlan.maxDailyLoss || "No limit"}
- Max Trades Per Day: ${tradingPlan.maxTradesPerDay || "No limit"}
- Target Risk per Trade: ${tradingPlan.riskPerTradePercent || "No specified"}%
- CORE RULES:\n${(tradingPlan.rules || []).map((r: string) => `  * ${r}`).join("\n")}`
        : "No specific trading plan rules configured.";

      const promptMsg = `Please analyze my trading performance for ${date}.

${planSummary}

Here is the log of trades I conducted today:
${tradesSummary}

My manual reflections / notes for today:
"${manualReflections || "No manual notes written."}"

Synthesize this trading data and perform a psychological and risk-based assessment. Write an elite-level, daily review card for my trades notebook. Keep the tone analytical, realistic, constructive, and centered on self-discipline.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: promptMsg,
        config: {
          systemInstruction: "You are 'Trading Coach', an elite Trading Performance Coach, Quant Analyst, and Trading Psychologist. Your job is to analyze a trader's daily logs and specified Trading Plan, evaluate their discipline, and output a highly polished, structured, and deep daily review page for their trade notebook. Grade the trader (A to F) strictly on their compliance with their Trading Plan rules and risk boundaries, NOT on their Pnl. An A-grade trader executes their stop-loss perfectly and logs disciplined entries, even if they end red. An F-grade trader breaks their rules, overtrades, or suffers emotional FOMO, even if they end green. Provide clear, direct performance metrics, evaluate psychological states, write a professional, engaging historical journal text of what occurred, and suggest 2 key concrete actionable focus points for tomorrow.",
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              performanceSummary: { 
                type: Type.STRING, 
                description: "A summary evaluating the trade metrics, quality of setup, risk-to-reward parameters, and compliance with the loss limits and trading rules." 
              },
              mindsetAnalysis: { 
                type: Type.STRING, 
                description: "Detailed analysis of the trader's emotional states (calm, fomo, greedy, fearful, impatient) across their trades, suggesting psychological adjustments." 
              },
              journalText: { 
                type: Type.STRING, 
                description: "A beautifully written, continuous narrative (2-3 paragraphs) as a formal journal entry describing the day's market experience, actions, and lessons." 
              },
              marketAdvice: { 
                type: Type.STRING, 
                description: "Exactly two concise, direct, bulleted Action Items for tomorrow based on this day's mistakes or achievements." 
              },
              grade: { 
                type: Type.STRING, 
                description: "The grade for the day: 'A' (perfect rules compliance), 'B' (good execution with minor errors), 'C' (moderate rule breaches but salvaged), 'D' (severe overtrading or rule violations), or 'F' (complete loss of discipline)." 
              }
            },
            required: ["performanceSummary", "mindsetAnalysis", "journalText", "marketAdvice", "grade"]
          }
        }
      });

      const responseText = response.text;
      if (!responseText) {
        throw new Error("No response content from Gemini API.");
      }

      // Parse JSON from Gemini
      const parsedData = JSON.parse(responseText.trim());
      return res.json(parsedData);
    } catch (err: any) {
      console.error("Gemini Analyze Error:", err);
      return res.status(500).json({
        error: err.message || "An error occurred during trade journal generation.",
      });
    }
  });

  // Vite integration
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Trade Journal Server] running at http://localhost:${PORT}`);
  });
}

startServer();
