// api/room-redesign.js
//
// Vercel serverless function — lives at the PROJECT ROOT, in an /api
// folder next to package.json (NOT inside src/). Vercel auto-detects
// any file in /api/*.js as a function, regardless of frontend framework.
//
// Setup:
//   npm install @google/genai formidable
//   Add GEMINI_API_KEY to your .env.local (https://aistudio.google.com/apikey)
//
// Local dev: `npm run dev` (plain Vite) does NOT run this function —
// Vite has no concept of serverless functions. Use the Vercel CLI instead:
//   npm i -g vercel
//   vercel dev
// `vercel dev` serves your Vite app AND /api functions together on one
// port, so fetch("/api/room-redesign") works locally exactly like prod.

import { GoogleGenAI, Modality } from "@google/genai";
import formidable from "formidable";
import fs from "fs";

// Vercel doesn't auto-parse multipart/form-data (file uploads) — only
// json/urlencoded get parsed automatically. We parse the raw request
// ourselves with formidable, so tell Vercel not to touch the body first.
export const config = {
  api: {
    bodyParser: false,
  },
};

const MODEL = process.env.GEMINI_IMAGE_MODEL || "gemini-2.5-flash-image";
const MAX_UPLOAD_BYTES = 10 * 1024 * 1024; // 10MB

// Four styles, mapped 1:1 to the "Standard" principles from the Feature
// section (Proportion / Light / Material / Silence) — same vocabulary,
// each producing a genuinely different-looking result.
const STYLE_PROMPTS = {
  proportion:
    "Redesign this room applying the principle of PROPORTION: rebalance the furniture layout for symmetry and correct scale, choose tailored pieces sized deliberately for the room, and open up generous negative space. Keep the room's architecture, walls, windows, doors and camera angle exactly as they are in the original photo — only the interior design changes.",
  light:
    "Redesign this room applying the principle of LIGHT: introduce a soft, sunlit palette of warm whites and pale neutrals, sheer natural-fiber textiles, and light-catching surfaces, so the room feels shaped by daylight rather than fixtures. Keep the room's architecture, walls, windows, doors and camera angle exactly as they are in the original photo — only the interior design changes.",
  material:
    "Redesign this room applying the principle of MATERIAL: bring in rich, tactile natural materials — walnut wood, honed marble, bouclé upholstery, warm brushed-brass accents — chosen for how they will age, not how they shine. Keep the room's architecture, walls, windows, doors and camera angle exactly as they are in the original photo — only the interior design changes.",
  silence:
    "Redesign this room applying the principle of SILENCE: strip back to what's essential, a quiet tonal palette, very few objects, nothing competing for attention. Keep the room's architecture, walls, windows, doors and camera angle exactly as they are in the original photo — only the interior design changes.",
};

const SYSTEM_PRIMER =
  "You are M Prime Interiors' senior designer. You redesign real rooms from photographs into elevated, magazine-quality interiors while strictly preserving the room's actual architecture: same walls, same windows and doors, same room shape, same camera angle and framing as the input photo. Output only the redesigned photo itself — photorealistic, professionally lit, no added text, labels, or watermarks.";

function parseForm(req) {
  return new Promise((resolve, reject) => {
    const form = formidable({ maxFileSize: MAX_UPLOAD_BYTES, multiples: false });
    form.parse(req, (err, fields, files) => {
      if (err) reject(err);
      else resolve({ fields, files });
    });
  });
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  let tempFilePath = null;

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      res.status(500).json({ error: "Server is missing GEMINI_API_KEY." });
      return;
    }

    const { fields, files } = await parseForm(req);

    const style = Array.isArray(fields.style) ? fields.style[0] : fields.style;
    const fileEntry = Array.isArray(files.image) ? files.image[0] : files.image;

    if (!fileEntry) {
      res.status(400).json({ error: "No photo was uploaded." });
      return;
    }
    if (!STYLE_PROMPTS[style]) {
      res.status(400).json({ error: "Please choose a style." });
      return;
    }

    const mimeType = fileEntry.mimetype || fileEntry.type || "";
    if (!mimeType.startsWith("image/")) {
      res.status(400).json({ error: "Please upload an image file." });
      return;
    }

    tempFilePath = fileEntry.filepath || fileEntry.path;
    const buffer = fs.readFileSync(tempFilePath);
    const base64 = buffer.toString("base64");

    const ai = new GoogleGenAI({ apiKey });

    const response = await ai.models.generateContent({
      model: MODEL,
      contents: [
        { text: `${SYSTEM_PRIMER}\n\n${STYLE_PROMPTS[style]}` },
        { inlineData: { data: base64, mimeType } },
      ],
      config: {
        responseModalities: [Modality.TEXT, Modality.IMAGE],
      },
    });

    const parts = response?.candidates?.[0]?.content?.parts || [];
    const imagePart = parts.find((p) => p.inlineData);

    if (!imagePart) {
      const textPart = parts.find((p) => p.text)?.text;
      res.status(502).json({
        error:
          textPart ||
          "Couldn't generate a redesign from that photo. Try a clearer, well-lit shot of the room.",
      });
      return;
    }

    const outMime = imagePart.inlineData.mimeType || "image/png";
    const dataUrl = `data:${outMime};base64,${imagePart.inlineData.data}`;

    res.status(200).json({ image: dataUrl });
  } catch (err) {
    console.error("room-redesign error:", err);
    res.status(500).json({
      error: "Something went wrong generating your redesign. Please try again.",
    });
  } finally {
    if (tempFilePath) {
      fs.unlink(tempFilePath, () => {}); // best-effort cleanup of formidable's temp file
    }
  }
}