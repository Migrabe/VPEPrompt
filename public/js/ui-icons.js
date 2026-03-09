(function () {
  const ICONS = {
    "undo-2": `<path d="M9 14 4 9l5-5"/><path d="M4 9h11a5 5 0 1 1 0 10h-1"/>`,
    "rotate-ccw": `<path d="M3 2v6h6"/><path d="M3 8a9 9 0 1 0 2.6-6.4L3 4"/>`,
    "languages": `<path d="m5 8 6 6"/><path d="m4 14 6-6 2-3"/><path d="M2 5h12"/><path d="M7 2h1"/><path d="m22 22-5-10-5 10"/><path d="M14 18h6"/>`,
    "sparkles": `<path d="M12 3l1.8 3.7L18 8.5l-3 2.9.7 4.1L12 13.8l-3.7 1.7.7-4.1-3-2.9 4.2-1.8L12 3z"/><path d="m19 3 1 2 2 1-2 1-1 2-1-2-2-1 2-1 1-2z"/>`,
    "dice-5": `<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8" cy="8" r="1"/><circle cx="16" cy="8" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="8" cy="16" r="1"/><circle cx="16" cy="16" r="1"/>`,
    "x": `<path d="M18 6 6 18"/><path d="m6 6 12 12"/>`,
    "copy": `<rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>`,
    "zap": `<path d="M13 2 3 14h7l-1 8 10-12h-7z"/>`,
    "save": `<path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><path d="M17 21v-8H7v8"/><path d="M7 3v5h8"/>`,
    "trash-2": `<path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/>`,

    palette: `<path d="M12 21a9 9 0 1 1 0-18 9 9 0 0 1 0 18Z"/><path d="M7.5 10.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z"/><path d="M12 8a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z"/><path d="M16.5 10.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z"/><path d="M12 21c0-3 2-4 4-4h1a2 2 0 1 0 0-4"/>`,
    bolt: `<path d="M13 2 3 14h7l-1 8 10-12h-7z"/>`,
    shirt: `<path d="M20.4 4.6 16 3l-1 2h-6l-1-2-4.4 1.6L2 9l4 2v9h12v-9l4-2-1.6-4.4z"/>`,
    utensils: `<path d="M3 2v7a3 3 0 0 0 6 0V2"/><path d="M6 2v20"/><path d="M13 2v8a2 2 0 1 0 4 0V2"/><path d="M17 12v10"/>`,
    bot: `<rect x="4" y="8" width="16" height="12" rx="3"/><path d="M12 2v3"/><path d="M8 13h.01"/><path d="M16 13h.01"/>`,
    target: `<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="2"/>`,
    masks: `<path d="M4 7c2 0 3-2 8-2s6 2 8 2v6c0 4-3 7-8 7s-8-3-8-7V7z"/><path d="M9 12h.01"/><path d="M15 12h.01"/><path d="M9 16c1 .8 2 .8 3 .8s2 0 3-.8"/>`,
    ratio: `<rect x="3" y="5" width="8" height="14" rx="1.5"/><rect x="13" y="8" width="8" height="8" rx="1.5"/>`,
    ruler: `<path d="M4 20 20 4"/><path d="m8 16 2 2"/><path d="m12 12 2 2"/><path d="m16 8 2 2"/><rect x="2" y="2" width="20" height="20" rx="2"/>`,
    camera: `<path d="M4 7h3l2-3h6l2 3h3v13H4z"/><circle cx="12" cy="13" r="4"/>`,
    aperture: `<circle cx="12" cy="12" r="9"/><path d="m14.2 4.3-4.4 7.7"/><path d="m19.7 10-8.8.2"/><path d="m16.2 19.2-4.5-7.6"/><path d="m7.8 19.2 4.5-7.6"/><path d="m4.3 10 8.8.2"/><path d="m9.8 4.3 4.4 7.7"/>`,
    image: `<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="8" cy="9" r="1.5"/><path d="m21 15-5-5-8 8"/>`,
    film: `<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M7 4v16"/><path d="M17 4v16"/><path d="M3 8h4"/><path d="M3 12h4"/><path d="M3 16h4"/><path d="M17 8h4"/><path d="M17 12h4"/><path d="M17 16h4"/>`,
    clapperboard: `<path d="M4 8h16v11a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8z"/><path d="M4 8 8 3h4l-4 5"/><path d="M12 8 16 3h4l-4 5"/>`,
    lightbulb: `<path d="M9 18h6"/><path d="M10 22h4"/><path d="M12 2a7 7 0 0 0-4 12c.8.7 1.3 1.7 1.4 2.8h5.2c.1-1.1.6-2.1 1.4-2.8A7 7 0 0 0 12 2z"/>`,
    cloud: `<path d="M20 17.5a4.5 4.5 0 0 0-.7-8.9A6 6 0 0 0 7.8 7a4 4 0 0 0 .2 8h12Z"/>`,
    layers: `<path d="m12 3 9 5-9 5-9-5 9-5z"/><path d="m3 13 9 5 9-5"/><path d="m3 18 9 5 9-5"/>`,
    type: `<path d="M4 7V4h16v3"/><path d="M12 4v16"/><path d="M8 20h8"/>`,
    "sliders-horizontal": `<path d="M3 6h18"/><path d="M8 6v12"/><path d="M16 6v12"/><path d="M3 18h18"/>`,
    images: `<rect x="3" y="5" width="12" height="12" rx="2"/><path d="m15 13 3-3 3 3"/><path d="M9 9h.01"/><path d="M7 19h12a2 2 0 0 0 2-2V7"/>`,
    flag: `<path d="M5 3v18"/><path d="M5 4h11l-2 3 2 3H5"/>`,
    ban: `<circle cx="12" cy="12" r="9"/><path d="m5 5 14 14"/>`,
    tags: `<path d="M20 10V4h-6l-8 8 6 6 8-8z"/><path d="M14 7h.01"/>`,
    "clipboard-list": `<rect x="8" y="3" width="8" height="4" rx="1"/><path d="M8 5H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/><path d="M9 12h6"/><path d="M9 16h6"/>`,
    braces: `<path d="M8 3c-2 0-3 1-3 3v2c0 1-.5 1.5-1.5 2 1 .5 1.5 1 1.5 2v2c0 2 1 3 3 3"/><path d="M16 3c2 0 3 1 3 3v2c0 1 .5 1.5 1.5 2-1 .5-1.5 1-1.5 2v2c0 2-1 3-3 3"/>
  };

  const EMOJI_MAP = {
    "🎨": "palette",
    "✨": "sparkles",
    "⚡": "bolt",
    "👗": "shirt",
    "🍜": "utensils",
    "🤖": "bot",
    "🎯": "target",
    "🎭": "masks",
    "📐": "ratio",
    "📏": "ruler",
    "📷": "camera",
    "🔭": "aperture",
    "🖼️": "image",
    "🖼": "image",
    "🎞️": "film",
    "🎞": "film",
    "🎥": "clapperboard",
    "💡": "lightbulb",
    "🌫️": "cloud",
    "🌫": "cloud",
    "🧬": "layers",
    "📝": "type",
    "⚙️": "sliders-horizontal",
    "⚙": "sliders-horizontal",
    "🏁": "flag",
    "🚫": "ban",
    "🏷️": "tags",
    "🏷": "tags",
    "📋": "clipboard-list",
    "🧾": "braces"
  };

  function render(name, className) {
    const key = String(name || "").trim();
    const paths = ICONS[key];
    if (!paths) return "";
    const cls = className ? ` ${className}` : "";
    return `<svg class="vpe-svg-icon${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths}</svg>`;
  }

  function resolveEmojiIcon(token) {
    const raw = String(token || "").trim();
    if (!raw) return "";
    const first = raw.split(/\s+/)[0];
    return EMOJI_MAP[first] || EMOJI_MAP[raw] || "";
  }

  function applySystemIcons(root) {
    const scope = root && root.querySelectorAll ? root : document;
    scope.querySelectorAll(".section-header .icon").forEach((node) => {
      if (node.dataset.svgApplied === "true") return;
      const mapped = resolveEmojiIcon(node.textContent) || "sparkles";
      const svg = render(mapped, "section-icon-svg");
      if (!svg) return;
      node.innerHTML = svg;
      node.dataset.svgApplied = "true";
      node.setAttribute("aria-hidden", "true");
    });
  }

  function observeIcons() {
    if (!document.body) return;
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((added) => {
          if (!added || added.nodeType !== 1) return;
          applySystemIcons(added);
        });
      });
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }

  window.VPEIcons = {
    render,
    resolveEmojiIcon,
    applySystemIcons
  };

  document.addEventListener("DOMContentLoaded", function () {
    applySystemIcons(document);
    observeIcons();
  });
})();
