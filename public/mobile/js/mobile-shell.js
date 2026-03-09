(function () {
  const DESKTOP_COOKIE = "prefer-desktop=1; path=/; max-age=31536000; SameSite=Lax";
  const CLEAR_DESKTOP_COOKIE = "prefer-desktop=; path=/; max-age=0; SameSite=Lax";
  const DEFAULT_OPEN_SECTIONS = [
    "promptSection",
    "quickStyleSection",
    "aiModelSection",
    "descriptionSection",
    "jsonSection"
  ];

  function getDesktopTarget() {
    const pathname = window.location.pathname.replace(/^\/mobile(\/|$)/, "/");
    const normalized = pathname === "" ? "/" : pathname;
    return `${normalized}${window.location.search}${window.location.hash}`;
  }

  function preferDesktop() {
    localStorage.setItem("prefer-desktop", "1");
    document.cookie = DESKTOP_COOKIE;
    window.location.href = getDesktopTarget();
  }

  function ensureMobileMode() {
    localStorage.removeItem("prefer-desktop");
    document.cookie = CLEAR_DESKTOP_COOKIE;
  }

  function openPrioritySections() {
    DEFAULT_OPEN_SECTIONS.forEach((id) => {
      const section = document.getElementById(id);
      if (section) section.classList.remove("collapsed");
    });
    if (typeof window.syncCollapseAllButtonLabel === "function") {
      window.syncCollapseAllButtonLabel();
    }
  }

  function bindBottomBar() {
    document.querySelectorAll("[data-mobile-nav-target]").forEach((button) => {
      button.addEventListener("click", () => {
        const target = document.getElementById(button.dataset.mobileNavTarget);
        if (!target) return;
        target.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    });

    document.querySelectorAll("[data-mobile-action='desktop']").forEach((button) => {
      button.addEventListener("click", preferDesktop);
    });
  }

  function registerServiceWorker() {
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/mobile/sw.js").catch(() => {});
  }

  document.addEventListener("DOMContentLoaded", () => {
    ensureMobileMode();
    openPrioritySections();
    bindBottomBar();
    registerServiceWorker();
    window.preferDesktop = preferDesktop;
    document.body.classList.add("mobile-vpe-shell-ready");
  });
})();
