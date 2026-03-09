import { computeFromState } from "../server/prompt_engine.js";

const base = {
  aiModel: "nano-banana-pro",
  promptFormat: "flat",
  mainSubject: "portrait of a middle-aged woman in a red coat",
  aspectRatio: "16:9",
  resolution: "4K",
  referenceImages: [
    {
      url: "https://example.com/ref.jpg",
      description: "source face reference"
    }
  ]
};

const cases = [
  {
    name: "flat_ref_max",
    state: {
      ...base,
      maxConsistency: true,
      emotion: "confident",
      negativePrompt: "blurry, low quality"
    }
  },
  {
    name: "structured_ref_max",
    state: {
      ...base,
      promptFormat: "structured",
      maxConsistency: true,
      emotion: "confident",
      negativePrompt: "blurry, low quality"
    }
  },
  {
    name: "flat_no_ref",
    state: {
      aiModel: "nano-banana-pro",
      promptFormat: "flat",
      mainSubject: "a city street at dawn",
      aspectRatio: "16:9",
      resolution: "2K",
      maxConsistency: false,
      referenceImages: []
    }
  }
];

for (const c of cases) {
  const out = computeFromState(c.state);
  console.log("=== " + c.name + " ===");
  console.log(JSON.stringify(out.json, null, 2));
  console.log();
}
