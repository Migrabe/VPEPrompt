import { computeFromState } from "../server/prompt_engine.js";
import { normalizePromptRequestState } from "../server/request_state.js";
import {
  buildRedirectTarget,
  isPhoneHeaders,
  shouldSkipVersionRouting,
  stripMobilePrefix,
  withoutViewParam
} from "../server/version_routing.js";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const FACE_CONSTRAINTS = [
  "Keep the facial features of the person exactly consistent with the reference image",
  "Do not modify their identity",
  "Preserve all unique identifiers including exact eye color and hair color",
  "Maintain identical bone structure, skin tone, and facial imperfections like moles and scars across all variations"
];

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function fail(message) {
  throw new Error(message);
}

function assert(condition, message) {
  if (!condition) fail(message);
}

function assertExactArray(actual, expected, label) {
  assert(Array.isArray(actual), `${label}: expected array`);
  assert(actual.length === expected.length, `${label}: expected ${expected.length} items, got ${actual.length}`);
  expected.forEach((value, i) => {
    assert(actual[i] === value, `${label}: item ${i + 1} mismatch`);
  });
}

function assertPromptPanelIsolationContract() {
  const clientLogicPath = path.join(__dirname, "..", "public", "js", "client_logic_full.js");
  const source = fs.readFileSync(clientLogicPath, "utf8");

  // Tolerate both single and double quotes, and any whitespace around tokens.
  assert(
    /!sec\.classList\.contains\(["']prompt-box["']\)/.test(source),
    "Global section collapse must explicitly exclude .prompt-box sections"
  );
  assert(
    !/const\s+keepOpen\s*=\s*\[[\s\S]*?["']promptSection["'][\s\S]*?\]/.test(source),
    "Legacy keepOpen list must not include promptSection"
  );
  assert(
    !/const\s+keepOpen\s*=\s*\[[\s\S]*?["']jsonSection["'][\s\S]*?\]/.test(source),
    "Legacy keepOpen list must not include jsonSection"
  );
}

function assertEngineCapabilityContracts() {
  const capsPath = path.join(__dirname, "..", "public", "config", "engine-capabilities.json");
  const caps = JSON.parse(fs.readFileSync(capsPath, "utf8"));

  const defaults = caps?.default_capabilities || {};
  assert(Number(defaults.max_prompt_chars) > 0, "default_capabilities.max_prompt_chars must be a positive number");
  assert(
    Array.isArray(defaults.json_required_fields) && defaults.json_required_fields.length > 0,
    "default_capabilities.json_required_fields must be a non-empty array"
  );

  const models = caps?.models || {};
  Object.entries(models).forEach(([model, data]) => {
    const maxChars = Number(data?.max_prompt_chars ?? defaults.max_prompt_chars);
    assert(maxChars > 0, `${model}: max_prompt_chars must resolve to a positive number`);
    const requiredFields = Array.isArray(data?.json_required_fields) && data.json_required_fields.length
      ? data.json_required_fields
      : defaults.json_required_fields;
    assert(Array.isArray(requiredFields) && requiredFields.length > 0, `${model}: json_required_fields must resolve to a non-empty array`);
  });
}

function assertVersionRoutingContracts() {
  assert(buildRedirectTarget("/", "", true) === "/mobile/", "Phone root requests must redirect to /mobile/");
  assert(buildRedirectTarget("/gallery", "?tab=1", true) === "/mobile/gallery?tab=1", "Phone desktop routes must keep query strings when redirected to /mobile/");
  assert(buildRedirectTarget("/mobile/", "", false) === "/", "Desktop override must strip the /mobile/ prefix");
  assert(stripMobilePrefix("/mobile/settings") === "/settings", "stripMobilePrefix must keep the trailing desktop route");

  const cleanedDesktop = withoutViewParam("/?view=desktop&tab=1");
  assert(cleanedDesktop.pathname === "/", "withoutViewParam must preserve pathname");
  assert(cleanedDesktop.search === "?tab=1", "withoutViewParam must remove only the view query parameter");

  assert(isPhoneHeaders({ "sec-ch-ua-mobile": "?1" }), "Client Hints mobile flag must be treated as a phone request");
  assert(
    isPhoneHeaders({ "user-agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)" }),
    "Legacy iPhone UA must be treated as a phone request"
  );
  assert(
    !isPhoneHeaders({ "user-agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0)" }),
    "Desktop macOS UA must not be treated as a phone request"
  );

  assert(shouldSkipVersionRouting("/api/prompt"), "API routes must bypass device redirects");
  assert(shouldSkipVersionRouting("/mobile/sw.js"), "Static service worker assets must bypass device redirects");
  assert(!shouldSkipVersionRouting("/collections"), "HTML routes must still participate in version routing");
}

function assertMobileShellContracts() {
  const desktopHtmlPath = path.join(__dirname, "..", "public", "index.html");
  const mobileHtmlPath = path.join(__dirname, "..", "public", "mobile", "index.html");
  const mobileShellPath = path.join(__dirname, "..", "public", "mobile", "js", "mobile-shell.js");
  const serviceWorkerPath = path.join(__dirname, "..", "public", "mobile", "sw.js");

  const desktopHtml = fs.readFileSync(desktopHtmlPath, "utf8");
  const mobileHtml = fs.readFileSync(mobileHtmlPath, "utf8");
  const mobileShell = fs.readFileSync(mobileShellPath, "utf8");
  const swSource = fs.readFileSync(serviceWorkerPath, "utf8");

  assert(
    /rel="alternate"\s+media="only screen and \(max-width: 640px\)"\s+href="\/mobile\/"/.test(desktopHtml),
    "Desktop HTML must advertise the mobile alternate URL"
  );
  assert(
    /<script src="js\/version-chooser\.js"><\/script>/.test(desktopHtml),
    "Desktop HTML must load the shared version chooser"
  );
  assert(
    /window\.VPE_CONFIG_BASE_URL\s*=\s*["']\/config["']/.test(mobileHtml),
    "Mobile HTML must point shared runtime config requests to /config"
  );
  assert(
    /<link rel="canonical" href="\/">/.test(mobileHtml),
    "Mobile HTML must keep canonical pointing to the desktop URL"
  );
  assert(
    /<script src="\/js\/client_logic_full\.js"><\/script>/.test(mobileHtml) &&
    /<script src="\/js\/action-buttons\.js"><\/script>/.test(mobileHtml) &&
    /<script src="\/js\/section-visibility\.js"><\/script>/.test(mobileHtml) &&
    /<script src="\/js\/version-chooser\.js"><\/script>/.test(mobileHtml),
    "Mobile HTML must reuse shared desktop runtime scripts"
  );
  assert(
    /<script src="\/mobile\/js\/mobile-shell\.js"><\/script>/.test(mobileHtml),
    "Mobile HTML must keep its dedicated mobile shell script"
  );
  assert(
    /localStorage\.setItem\("prefer-desktop", "1"\)/.test(mobileShell) &&
    /document\.cookie = DESKTOP_COOKIE/.test(mobileShell),
    "Mobile shell must persist the explicit desktop choice"
  );
  assert(
    /"\/js\/client_logic_full\.js"/.test(swSource) &&
    /"\/js\/version-chooser\.js"/.test(swSource) &&
    /"\/config\/engine-capabilities\.json"/.test(swSource),
    "Mobile service worker must cache shared JS and config assets"
  );
}

async function run() {
  assertPromptPanelIsolationContract();
  assertEngineCapabilityContracts();
  assertVersionRoutingContracts();
  assertMobileShellContracts();

  const baseState = {
    promptFormat: "flat",
    mainSubject: "portrait of a person",
    maxConsistency: true,
    referenceImages: [{
      name: "reference.jpg",
      url: "https://example.com/reference.jpg",
      width: 1024,
      height: 1024,
      extract: ["Лицо", "Стиль"],
      description: "keep the leather jacket"
    }]
  };

  const nbp = computeFromState({ ...baseState, aiModel: "nano-banana-pro" });
  assert(nbp.prompt.startsWith("Generate an image."), "NBP flat prompt must keep Generate an image at the top");
  assert(/Face ID locked from reference\./.test(nbp.prompt), "NBP flat prompt must include the flat face lock text");
  assert(/Use 1 uploaded reference image as guidance\./.test(nbp.prompt), "NBP visible prompt must describe uploaded reference guidance");
  assert(/Reference 1: extract face \/ identity, style, keep the leather jacket\./i.test(nbp.prompt), "NBP visible prompt must preserve per-reference extract instructions");
  assert(nbp.json && nbp.json.model === "nano-banana-pro", "NBP JSON model mismatch");
  assert(nbp.json.type === "text-to-image", "NBP JSON type must stay text-to-image because uploaded references are prompt guidance only");
  assert(
    !String(nbp.json.prompt || "").startsWith("Generate an image."),
    "NBP JSON prompt must omit the Generate an image service line"
  );
  assert(
    !/\[Aspect:|\[Resolution:|--- Reference images ---|--- REFERENCES ---/.test(String(nbp.json.prompt || "")),
    "NBP JSON prompt must omit visual prompt headers and reference footer blocks"
  );
  assert(
    !/^subject:\s*/i.test(String(nbp.json.prompt || "")),
    "NBP JSON prompt must omit the redundant subject prefix"
  );
  assert(
    /Use 1 uploaded reference image as guidance\./.test(String(nbp.json.prompt || "")) &&
    /Reference 1: extract face \/ identity, style, keep the leather jacket\./i.test(String(nbp.json.prompt || "")),
    "NBP JSON prompt must keep semantic reference guidance"
  );
  assertExactArray(nbp.json.face_constraints, FACE_CONSTRAINTS, "NBP face_constraints");
  assert(nbp.json.modes?.maxConsistency === true, "NBP JSON must include categorized modes for active selections");
  assert(nbp.json?.references?.count === 1, "NBP JSON references must keep uploaded image count");
  assert(nbp.json?.references?.images?.[0]?.index === 1, "NBP JSON references must keep per-image index");
  assertExactArray(nbp.json?.references?.images?.[0]?.extract || [], ["Лицо", "Стиль", "keep the leather jacket"], "NBP reference extract");
  assert(!Object.prototype.hasOwnProperty.call(nbp.json?.references?.images?.[0] || {}, "description"), "NBP JSON references must not keep a separate description field");
  assert(!Object.prototype.hasOwnProperty.call(nbp.json || {}, "image_urls"), "NBP JSON must not embed uploaded image URLs");
  assert(!Object.prototype.hasOwnProperty.call(nbp.json?.references?.images?.[0] || {}, "url"), "NBP JSON references must not embed uploaded image URL metadata");
  assert(!Object.prototype.hasOwnProperty.call(nbp.json?.references?.images?.[0] || {}, "name"), "NBP JSON references must not embed uploaded filename metadata");
  assert(!Object.prototype.hasOwnProperty.call(nbp.json?.references?.images?.[0] || {}, "size"), "NBP JSON references must not embed uploaded filesize metadata");
  assert(!Object.prototype.hasOwnProperty.call(nbp.json?.references?.images?.[0] || {}, "width"), "NBP JSON references must not embed uploaded width metadata");
  assert(!Object.prototype.hasOwnProperty.call(nbp.json?.references?.images?.[0] || {}, "height"), "NBP JSON references must not embed uploaded height metadata");
  assert(!Object.prototype.hasOwnProperty.call(nbp.json || {}, "parameters"), "NBP JSON must omit empty categorized parameters block");

  const nbpCategorized = computeFromState({
    ...baseState,
    aiModel: "nano-banana-pro",
    negativePrompt: "bad anatomy, blur",
    seed: "12345",
    cameraBody: "shot on ARRI Alexa 35, digital cinema, organic textures, high dynamic range",
    lens: "shot on Arri Signature Primes, velvety bokeh, magnetic skin tones, ultra-smooth background separation, warm and natural atmosphere",
    shotSize: "close-up portrait, head and shoulders, emotional connection, facial expression focus, detailed features",
    focalLength: "shot on 85mm lens, flattering portrait perspective, facial features compression, elegant subject separation",
    aperture: "f/1.4, shallow depth of field, creamy bokeh, subject isolation, soft background blur",
    angle: "eye level shot, neutral perspective, straight on angle, direct engagement",
    composition: "rule of thirds composition, subject on grid intersection, balanced negative space",
    lightScheme: "Rembrandt lighting setup, exactly one key light positioned at 45 degree angle slightly above eye level",
    typography: ["bold sans-serif typography"]
  });
  assert(nbpCategorized.json?.negative === "bad anatomy, blur", "NBP JSON must keep negative prompt as a separate categorized field");
  assert(nbpCategorized.json?.seed === "12345", "NBP JSON must keep seed as a separate categorized field");
  assert(nbpCategorized.json?.parameters && typeof nbpCategorized.json.parameters === "object", "NBP JSON must include categorized parameters when values exist");
  assert(nbpCategorized.json?.parameters?.camera?.body, "NBP JSON must expose camera body in categorized parameters");
  assert(nbpCategorized.json?.parameters?.camera?.lens, "NBP JSON must expose lens in categorized parameters");
  assert(nbpCategorized.json?.parameters?.camera?.shot_size, "NBP JSON must expose shot size in categorized parameters");
  assert(nbpCategorized.json?.parameters?.typography?.[0] === "bold sans-serif typography", "NBP JSON must keep typography even without text content");
  assert(!Object.prototype.hasOwnProperty.call(nbpCategorized.json?.parameters || {}, "fashion_food_style"), "NBP JSON must prune empty fields inside categorized parameters");

  const generic = computeFromState({ ...baseState, aiModel: "stable-diffusion" });
  assert(generic.json && generic.json.schema === "vpe-prompt-builder-v2", "Generic JSON schema mismatch");
  assert(
    !String(generic.json.prompt || "").startsWith("Generate an image."),
    "Generic JSON prompt must omit the Generate an image service line"
  );
  assert(
    !/\[Aspect:|\[Resolution:|--- Reference images ---|--- REFERENCES ---/.test(String(generic.json.prompt || "")),
    "Generic JSON prompt must omit visual prompt headers and reference footer blocks"
  );
  assert(
    !/^subject:\s*/i.test(String(generic.json.prompt || "")),
    "Generic JSON prompt must omit the redundant subject prefix"
  );
  assert(
    !String(generic.json.prompt_flat || "").startsWith("Generate an image."),
    "Generic JSON prompt_flat must omit the Generate an image service line"
  );
  assert(
    !/\[Aspect:|\[Resolution:|--- Reference images ---|--- REFERENCES ---/.test(String(generic.json.prompt_flat || "")),
    "Generic JSON prompt_flat must omit visual prompt headers and reference footer blocks"
  );
  assert(
    !/^subject:\s*/i.test(String(generic.json.prompt_flat || "")),
    "Generic JSON prompt_flat must omit the redundant subject prefix"
  );
  assert(
    /^Generate an image\./.test(String(generic.prompt || "")) &&
    /subject:\s*portrait of a person/i.test(String(generic.prompt || "")) &&
    /Use 1 uploaded reference image as guidance\./.test(String(generic.prompt || "")) &&
    /Reference 1: extract face \/ identity, style, keep the leather jacket\./i.test(String(generic.prompt || "")),
    "Visible flat prompt must keep subject and semantic reference guidance"
  );
  assertExactArray(generic.json.face_constraints, FACE_CONSTRAINTS, "Generic face_constraints");
  assert(
    generic.json?.references?.count === 1,
    "Generic JSON references must keep uploaded image count"
  );
  assert(
    generic.json?.references?.images?.[0]?.index === 1,
    "Generic JSON references must keep per-image index"
  );
  assertExactArray(generic.json?.references?.images?.[0]?.extract || [], ["Лицо", "Стиль", "keep the leather jacket"], "Generic reference extract");
  assert(!Object.prototype.hasOwnProperty.call(generic.json?.references?.images?.[0] || {}, "description"), "Generic JSON references must not keep a separate description field");
  assert(!Object.prototype.hasOwnProperty.call(generic.json?.references?.images?.[0] || {}, "url"), "Generic JSON references must not embed uploaded image URL metadata");
  assert(!Object.prototype.hasOwnProperty.call(generic.json?.references?.images?.[0] || {}, "name"), "Generic JSON references must not embed uploaded filename metadata");
  assert(!Object.prototype.hasOwnProperty.call(generic.json?.references?.images?.[0] || {}, "size"), "Generic JSON references must not embed uploaded filesize metadata");
  assert(!Object.prototype.hasOwnProperty.call(generic.json?.references?.images?.[0] || {}, "width"), "Generic JSON references must not embed uploaded width metadata");
  assert(!Object.prototype.hasOwnProperty.call(generic.json?.references?.images?.[0] || {}, "height"), "Generic JSON references must not embed uploaded height metadata");
  assert(
    /Use 1 uploaded reference image as guidance\./.test(String(generic.json.prompt || "")) &&
    /Reference 1: extract face \/ identity, style, keep the leather jacket\./i.test(String(generic.json.prompt || "")),
    "Generic JSON prompt must keep semantic reference guidance"
  );
  assert(Array.isArray(generic.warnings), "computeFromState must return warnings array");

  const genericTypographyOnly = computeFromState({
    promptFormat: "flat",
    aiModel: "stable-diffusion",
    mainSubject: "poster concept",
    typography: ["bold sans-serif typography"]
  });
  assert(
    genericTypographyOnly.json?.parameters?.typography?.[0] === "bold sans-serif typography",
    "Generic JSON must keep standalone typography in categorized parameters"
  );

  const quickStyleDerivedProfile = computeFromState({
    promptFormat: "flat",
    aiModel: "stable-diffusion",
    mainSubject: "editorial portrait",
    quickStyle: "blade-runner-2049"
  });
  assert(
    quickStyleDerivedProfile.json?.parameters?.quick_style === "blade-runner-2049",
    "Quick style key must remain in categorized parameters"
  );
  assert(
    /Roger Deakins/i.test(String(quickStyleDerivedProfile.json?.parameters?.quick_style_profile?.overview || "")),
    "Quick style profile must expose the preset overview"
  );
  assert(
    /volumetric fog/i.test(String(quickStyleDerivedProfile.json?.parameters?.quick_style_profile?.lighting || "")),
    "Quick style profile must expose derived lighting"
  );
  assert(
    /orange and teal/i.test(String(quickStyleDerivedProfile.json?.parameters?.quick_style_profile?.color_grading || "")),
    "Quick style profile must expose derived color grading"
  );
  assert(
    /8K IMAX resolution/i.test(String(quickStyleDerivedProfile.json?.parameters?.quick_style_profile?.quality || "")),
    "Quick style profile must expose derived quality"
  );

  const fashionFoodDerivedProfile = computeFromState({
    promptFormat: "flat",
    aiModel: "stable-diffusion",
    mainSubject: "dessert still life",
    fashionFoodStyle: "food-neon-gloss"
  });
  assert(
    fashionFoodDerivedProfile.json?.parameters?.fashion_food_style === "food-neon-gloss",
    "Fashion/Food style key must remain in categorized parameters"
  );
  assert(
    /nightlife campaign/i.test(String(fashionFoodDerivedProfile.json?.parameters?.fashion_food_style_profile?.overview || "")),
    "Fashion/Food style profile must expose the preset overview"
  );
  assert(
    /dual-color gel setup/i.test(String(fashionFoodDerivedProfile.json?.parameters?.fashion_food_style_profile?.lighting || "")),
    "Fashion/Food style profile must expose derived lighting"
  );
  assert(
    /cyberpunk-inspired teal-magenta/i.test(String(fashionFoodDerivedProfile.json?.parameters?.fashion_food_style_profile?.color_grading || "")),
    "Fashion/Food style profile must expose derived color grading"
  );
  assert(
    !Object.prototype.hasOwnProperty.call(fashionFoodDerivedProfile.json?.parameters?.fashion_food_style_profile || {}, "quality"),
    "Fashion/Food style profile must not invent an empty quality field"
  );

  const genericGrid3x3 = computeFromState({
    promptFormat: "structured",
    aiModel: "stable-diffusion",
    mainSubject: "portrait study",
    grid3x3Mode: true,
    quickStyle: "blade-runner-2049"
  });
  assert(
    genericGrid3x3.json?.schema === "vpe-prompt-builder-v2",
    "Generic 3x3 JSON must preserve the standard schema envelope"
  );
  assert(
    typeof genericGrid3x3.json?.prompt === "string" && genericGrid3x3.json.prompt.length > 0,
    "Generic 3x3 JSON must keep a top-level prompt field"
  );
  assert(
    typeof genericGrid3x3.json?.prompt_flat === "string" && genericGrid3x3.json.prompt_flat.length > 0,
    "Generic 3x3 JSON must keep a top-level prompt_flat field"
  );
  assert(
    !!genericGrid3x3.json?.mode_payload?.contact_sheet_3x3,
    "Generic 3x3 JSON must keep structured mode payload"
  );
  assert(
    !!genericGrid3x3.json?.output_requirements,
    "Generic 3x3 JSON must preserve the legacy top-level 3x3 block during envelope migration"
  );
  assert(
    !genericGrid3x3.warnings.some((warning) => /JSON не содержит обязательные поля модели/i.test(String(warning || ""))),
    "Generic 3x3 warnings must not report missing required JSON fields after envelope fix"
  );

  const noRefConsistency = computeFromState({
    promptFormat: "flat",
    aiModel: "stable-diffusion",
    mainSubject: "portrait of a person",
    maxConsistency: true,
    referenceImages: []
  });
  assert(
    noRefConsistency.prompt.startsWith("Generate an image."),
    "Flat prompts must keep Generate an image at the top even with Max Consistency"
  );
  assert(
    /Face ID locked from reference\./.test(noRefConsistency.prompt),
    "Max Consistency must still include the flat identity lock even without reference images"
  );

  const structured = computeFromState({ ...baseState, aiModel: "nano-banana-pro", promptFormat: "structured" });
  assert(
    structured.prompt.startsWith("FACE ID LOCKED from reference."),
    "Structured max consistency prefix must keep legacy structured text"
  );

  const structuredSanitized = computeFromState({
    ...baseState,
    aiModel: "nano-banana-pro",
    promptFormat: "structured",
    aspectRatio: "3:4",
    resolution: "1024x1024"
  });
  assert(
    !/\[Model:|\[Aspect:|\[Resolution:/.test(String(structuredSanitized.json?.prompt || "")),
    "Structured JSON prompt must strip visual model/aspect/resolution headers even after Max Consistency prefix"
  );

  const midjourneyFormatSync = computeFromState({
    promptFormat: "flat",
    aiModel: "midjourney",
    mainSubject: "cat astronaut",
    aspectRatio: "16:9",
    mjVersion: "7"
  });
  assert(
    /--ar 16:9/.test(midjourneyFormatSync.prompt),
    "Midjourney model must force Midjourney prompt format server-side"
  );
  assert(
    !midjourneyFormatSync.prompt.startsWith("Generate an image."),
    "Midjourney model should not emit flat prompt wrapper text"
  );

  const macroWide = computeFromState({
    promptFormat: "flat",
    aiModel: "stable-diffusion",
    mainSubject: "product still life",
    lens: "shot on Canon EF 100mm f/2.8L Macro IS USM, macro photography, extreme close-up, intricate textures",
    shotSize: "wide shot, full body visible, feet to head, environmental context included, establishing feel"
  });
  assert(/macro|100mm/i.test(macroWide.prompt), "Macro lens should remain in prompt after conflict pruning");
  assert(!/wide shot/i.test(macroWide.prompt), "Macro + wide shotSize must prune incompatible wide shot");

  const flatLayAngle = computeFromState({
    promptFormat: "flat",
    aiModel: "stable-diffusion",
    mainSubject: "desk setup",
    shotSize: "overhead flat lay photography, knolling arrangement, organized composition, geometric order, top-down view",
    angle: "low angle shot, looking up at subject, imposing perspective, heroic stature"
  });
  assert(/flat lay/i.test(flatLayAngle.prompt), "Flat lay shotSize should remain in prompt");
  assert(!/low angle shot/i.test(flatLayAngle.prompt), "Flat lay must prune non-top-down angle");

  const mediumCamera = computeFromState({
    promptFormat: "flat",
    aiModel: "stable-diffusion",
    mainSubject: "portrait study",
    medium: "oil on canvas, thick impasto texture, layered glazing, visible weave",
    cameraBody: "shot on ARRI Alexa 35, digital cinema, organic textures, high dynamic range",
    lens: "shot on Canon EF 50mm f/1.8 STM, classic nifty fifty look, natural rendering, clean bokeh"
  });
  assert(/oil on canvas/i.test(mediumCamera.prompt), "Selected artistic medium should remain in prompt");
  assert(!/shot on arri alexa 35/i.test(mediumCamera.prompt), "Artistic medium must prune camera body");
  assert(!/nifty fifty/i.test(mediumCamera.prompt), "Artistic medium must prune lens");

  const mediumUnicodeRange = computeFromState({
    promptFormat: "flat",
    aiModel: "stable-diffusion",
    mainSubject: "portrait study",
    medium: "graphite pencil 2B\u20136B range, fine cross-hatching, subtle tonal gradation",
    cameraBody: "shot on ARRI Alexa 35, digital cinema, organic textures, high dynamic range",
    lens: "shot on Canon EF 50mm f/1.8 STM, classic nifty fifty look, natural rendering, clean bokeh"
  });
  assert(/graphite pencil 2b/i.test(mediumUnicodeRange.prompt), "Unicode medium token should remain after normalization");
  assert(!/shot on arri alexa 35/i.test(mediumUnicodeRange.prompt), "Unicode medium token must prune camera body");
  assert(!/nifty fifty/i.test(mediumUnicodeRange.prompt), "Unicode medium token must prune lens");

  const artStyleCamera = computeFromState({
    promptFormat: "flat",
    aiModel: "stable-diffusion",
    mainSubject: "portrait study",
    artStyle: "\u0410\u043d\u0438\u043c\u0435",
    cameraBody: "shot on ARRI Alexa 35, digital cinema, organic textures, high dynamic range",
    lens: "shot on Canon EF 50mm f/1.8 STM, classic nifty fifty look, natural rendering, clean bokeh"
  });
  assert(!/shot on arri alexa 35/i.test(artStyleCamera.prompt), "Art style input must prune camera body for API parity");
  assert(!/nifty fifty/i.test(artStyleCamera.prompt), "Art style input must prune lens for API parity");

  const quickVsFashion = computeFromState({
    promptFormat: "flat",
    aiModel: "stable-diffusion",
    mainSubject: "editorial portrait",
    quickStyle: "1917",
    fashionFoodStyle: "vogue-polished"
  });
  assert(
    quickVsFashion.json?.parameters?.quick_style === "1917",
    "Quick Style must win over Fashion/Food when both are provided"
  );
  assert(
    !quickVsFashion.json?.parameters?.fashion_food_style,
    "Fashion/Food style must be cleared when Quick Style is active"
  );

  const photoVsCinema = computeFromState({
    promptFormat: "flat",
    aiModel: "stable-diffusion",
    mainSubject: "editorial portrait",
    photoStyle: "in the style of Annie Leibovitz, dramatic portrait lighting, rich colors",
    cinemaStyle: "shot by Roger Deakins, naturalistic lighting, golden hour realism"
  });
  assert(
    photoVsCinema.json?.parameters?.photo_style,
    "Photo style must be preserved in photoStyle + cinemaStyle conflict"
  );
  assert(
    !photoVsCinema.json?.parameters?.cinema_style,
    "Cinema style must be pruned when photo style conflicts"
  );

  const photoVsDirector = computeFromState({
    promptFormat: "flat",
    aiModel: "stable-diffusion",
    mainSubject: "editorial portrait",
    photoStyle: "in the style of Annie Leibovitz, dramatic portrait lighting, rich colors",
    directorStyle: "in the style of Christopher Nolan, IMAX realism, practical effects"
  });
  assert(
    photoVsDirector.json?.parameters?.photo_style,
    "Photo style must be preserved in photoStyle + directorStyle conflict"
  );
  assert(
    !photoVsDirector.json?.parameters?.director_style,
    "Director style must be pruned when photo style conflicts"
  );

  const nonCollabCinemaDirector = computeFromState({
    promptFormat: "flat",
    aiModel: "stable-diffusion",
    mainSubject: "editorial portrait",
    cinemaStyle: "shot by Roger Deakins, naturalistic lighting, golden hour realism",
    directorStyle: "in the style of Christopher Nolan, IMAX realism, practical effects"
  });
  assert(
    nonCollabCinemaDirector.json?.parameters?.cinema_style,
    "Cinema style must remain when non-collab director/cinema pair conflicts"
  );
  assert(
    !nonCollabCinemaDirector.json?.parameters?.director_style,
    "Non-collab director style must be pruned from output"
  );

  const knownCollabCinemaDirector = computeFromState({
    promptFormat: "flat",
    aiModel: "stable-diffusion",
    mainSubject: "editorial portrait",
    cinemaStyle: "shot by Hoyte van Hoytema, IMAX large format, deep contrast",
    directorStyle: "in the style of Christopher Nolan, IMAX realism, practical effects"
  });
  assert(
    knownCollabCinemaDirector.json?.parameters?.cinema_style &&
    knownCollabCinemaDirector.json?.parameters?.director_style,
    "Known director/cinematographer collaboration must stay enabled"
  );

  const motionBlurVsGenerate = computeFromState({
    promptFormat: "flat",
    aiModel: "stable-diffusion",
    mainSubject: "runner in the rain",
    motionBlurMode: true,
    generateFourMode: true
  });
  assert(
    motionBlurVsGenerate.json?.modes?.motion_blur === true,
    "Motion blur must stay enabled in motionBlur + generate4 conflict"
  );
  assert(
    !motionBlurVsGenerate.prompt.startsWith("Generate 4 distinct variations"),
    "Generate 4 wrapper must be disabled when motion blur is enabled"
  );

  const seamlessVsShot = computeFromState({
    promptFormat: "flat",
    aiModel: "stable-diffusion",
    mainSubject: "fabric pattern",
    seamlessPattern: true,
    shotSize: "medium shot, waist up, standard cinematic framing, character with context, neutral distance"
  });
  assert(
    !/medium shot/i.test(seamlessVsShot.prompt),
    "Seamless pattern must prune non-flat-lay shot size"
  );

  const dallENegative = computeFromState({
    promptFormat: "flat",
    aiModel: "dall-e-3",
    mainSubject: "poster concept",
    negativePrompt: "bad anatomy, blur"
  });
  assert(
    !Object.prototype.hasOwnProperty.call(dallENegative.json || {}, "negative"),
    "DALL-E 3 output must not include negative prompt field"
  );

  const fluxNegative = computeFromState({
    promptFormat: "flat",
    aiModel: "flux",
    mainSubject: "poster concept",
    negativePrompt: "bad anatomy, blur"
  });
  assert(
    !Object.prototype.hasOwnProperty.call(fluxNegative.json || {}, "negative"),
    "Flux output must not include negative prompt field"
  );

  const sdNegative = computeFromState({
    promptFormat: "flat",
    aiModel: "stable-diffusion",
    mainSubject: "poster concept",
    negativePrompt: "bad anatomy, blur"
  });
  assert(sdNegative.json?.negative === "bad anatomy, blur", "Stable Diffusion must keep negative prompt field");
  assert(
    /Negative prompt:\s*bad anatomy, blur/i.test(sdNegative.prompt),
    "Stable Diffusion prompt text must append the visible negative prompt block"
  );

  const midjourneyReferences = computeFromState({
    promptFormat: "flat",
    aiModel: "midjourney",
    mainSubject: "editorial portrait",
    referenceImages: [{
      url: "https://example.com/mj-ref.jpg",
      width: 1024,
      height: 1024,
      extract: ["Позу"],
      description: "keep the silhouette"
    }]
  });
  assert(
    midjourneyReferences.json?.references?.count === 1,
    "Midjourney JSON must keep uploaded reference guidance because refs now belong to the builder, not the engine transport"
  );
  assert(
    /reference 1: pose, keep the silhouette/i.test(String(midjourneyReferences.prompt || "")),
    "Midjourney prompt must keep semantic reference guidance without file metadata"
  );

  const aliasGrid3x3 = computeFromState({
    promptFormat: "structured",
    aiModel: "nano-banana",
    mainSubject: "portrait study",
    grid3x3Mode: true
  });
  assert(aliasGrid3x3.json?.model === "nano-banana-pro", "3x3 JSON model must be canonicalized through aliases");
  assert(aliasGrid3x3.json?.modes?.grid3x3 === true, "NBP 3x3 JSON must keep grid3x3 mode flag in categorized JSON");
  assert(aliasGrid3x3.json?.mode_payload?.contact_sheet_3x3, "NBP 3x3 JSON must expose structured mode payload");

  const unknownModelFallback = computeFromState({
    promptFormat: "midjourney",
    aiModel: "unknown-model-x",
    mainSubject: "poster concept",
    negativePrompt: "bad anatomy, blur",
    referenceImages: [{
      url: "https://example.com/unknown-ref.jpg",
      width: 1024,
      height: 1024,
      extract: ["Палитру"],
      description: "keep the muted tones"
    }]
  });
  assert(
    !Object.prototype.hasOwnProperty.call(unknownModelFallback.json || {}, "negative"),
    "Unknown models must default to negative-prompt unsupported"
  );
  assert(
    unknownModelFallback.json?.references?.count === 1,
    "Unknown models must still keep uploaded reference guidance in JSON"
  );
  assert(
    unknownModelFallback.prompt.startsWith("Generate an image."),
    "Unknown models must fall back to flat/structured prompt formats"
  );

  const promptLengthWarning = computeFromState({
    promptFormat: "flat",
    aiModel: "stable-diffusion",
    mainSubject: "x".repeat(9500)
  });
  assert(
    promptLengthWarning.warnings.some((warning) => /Промпт превышает лимит для модели/i.test(String(warning || ""))),
    "Shared warnings must expose prompt length violations"
  );

  const minimalGeneric = computeFromState({
    promptFormat: "flat",
    aiModel: "stable-diffusion",
    mainSubject: "minimal generic audit"
  });
  assert(
    !minimalGeneric.warnings.some((warning) => /JSON не содержит обязательные поля модели/i.test(String(warning || ""))),
    "Generic JSON warnings must not require empty categorized blocks that are intentionally pruned"
  );

  const normalizedRequestState = await normalizePromptRequestState(
    {
      referenceImages: [
        { extract: ["Лицо"], description: "keep only the first face" },
        { extract: ["Палитру"], description: "keep only the muted palette" }
      ]
    },
    [
      {
        originalname: "ref_test.png",
        buffer: fs.readFileSync(path.join(__dirname, "..", "tmp", "ref_test.png"))
      },
      {
        originalname: "ref_test_2.png",
        buffer: fs.readFileSync(path.join(__dirname, "..", "tmp", "ref_test_2.png"))
      }
    ]
  );
  assert(normalizedRequestState.referenceImages.length === 2, "Request normalization must preserve uploaded reference count");
  assertExactArray(
    normalizedRequestState.referenceImages[0].extract || [],
    ["Лицо"],
    "Request normalization first reference extract"
  );
  assert(
    normalizedRequestState.referenceImages[0].description === "keep only the first face",
    "Request normalization must preserve the first reference freeform extract"
  );
  assertExactArray(
    normalizedRequestState.referenceImages[1].extract || [],
    ["Палитру"],
    "Request normalization second reference extract"
  );
  assert(
    normalizedRequestState.referenceImages[1].description === "keep only the muted palette",
    "Request normalization must preserve the second reference freeform extract"
  );

  console.log("Runtime smoke checks passed.");
}

try {
  await run();
} catch (error) {
  console.error(`Runtime smoke checks failed: ${error.message}`);
  process.exit(1);
}
