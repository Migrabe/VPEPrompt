import { computeFromState } from "../server/prompt_engine.js";

const state = {
  aiModel: "nano-banana-pro",
  promptFormat: "flat",
  mainSubject: "portrait of a person",
  maxConsistency: true,
  aspectRatio: "16:9",
  resolution: "4K",
  referenceImages: [{ url: "https://example.com/reference.jpg", width: 1024, height: 1024, description: "reference face" }]
};

const out = computeFromState(state);
console.log("PROMPT_START=" + String(out.prompt || "").slice(0, 240));
console.log("JSON=" + JSON.stringify(out.json));
