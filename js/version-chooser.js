(function () {
  const STORAGE_KEY = "vpe-version-choice-seen";
  const OPEN_QUERY = "chooseVersion";

  function isMobilePath() {
    return window.location.pathname === "/mobile" || window.location.pathname.startsWith("/mobile/");
  }

  function getCleanSearch() {
    const url = new URL(window.location.href);
    url.searchParams.delete(OPEN_QUERY);
    url.searchParams.delete("view");
    const search = url.searchParams.toString();
    return search ? `?${search}` : "";
  }

  function getDesktopTarget() {
    const path = window.location.pathname.replace(/^\/mobile(\/|$)/, "/") || "/";
    return `${path}${getCleanSearch()}${window.location.hash}`;
  }

  function getMobileTarget() {
    const path = isMobilePath() ? window.location.pathname : `/mobile${window.location.pathname === "/" ? "/" : window.location.pathname}`;
    return `${path}${getCleanSearch()}${window.location.hash}`;
  }

  function setCurrentChoiceSeen() {
    try {
      localStorage.setItem(STORAGE_KEY, "1");
    } catch (_) {
      // Ignore storage issues.
    }
  }

  function shouldOpenChooser() {
    const url = new URL(window.location.href);
    if (url.searchParams.get(OPEN_QUERY) === "1") return true;
    try {
      return localStorage.getItem(STORAGE_KEY) !== "1";
    } catch (_) {
      return true;
    }
  }

  function injectStyles() {
    if (document.getElementById("vpe-version-chooser-styles")) return;

    const style = document.createElement("style");
    style.id = "vpe-version-chooser-styles";
    style.textContent = `
      .vpe-version-entry {
        position: fixed;
        left: max(14px, env(safe-area-inset-left));
        bottom: calc(14px + env(safe-area-inset-bottom));
        z-index: 80;
        min-height: 44px;
        padding: 10px 14px;
        border-radius: 999px;
        border: 1px solid rgba(255,255,255,0.12);
        background: rgba(6, 16, 26, 0.82);
        color: #f4fbff;
        backdrop-filter: blur(14px);
        font: 700 13px/1.2 "Manrope", "Segoe UI", sans-serif;
      }

      dialog.vpe-version-dialog {
        width: min(92vw, 420px);
        margin: auto;
        padding: 0;
        border: 1px solid rgba(126, 209, 255, 0.18);
        border-radius: 24px;
        background: linear-gradient(180deg, rgba(7, 19, 30, 0.98), rgba(10, 24, 37, 0.96));
        color: #f4fbff;
        box-shadow: 0 32px 84px rgba(0, 0, 0, 0.42);
      }

      dialog.vpe-version-dialog::backdrop {
        background: rgba(1, 6, 12, 0.7);
        backdrop-filter: blur(6px);
      }

      .vpe-version-card {
        padding: 22px;
        display: grid;
        gap: 14px;
      }

      .vpe-version-card h2 {
        margin: 0;
        font: 800 24px/1.04 "Raleway", "Manrope", sans-serif;
      }

      .vpe-version-card p {
        margin: 0;
        color: #9fbdcf;
        line-height: 1.5;
      }

      .vpe-version-actions {
        display: grid;
        gap: 10px;
      }

      .vpe-version-actions button,
      .vpe-version-actions a {
        min-height: 46px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        border-radius: 16px;
        border: 1px solid rgba(126, 209, 255, 0.18);
        background: rgba(255, 255, 255, 0.04);
        color: inherit;
        text-decoration: none;
        font: 800 14px/1.2 "Manrope", "Segoe UI", sans-serif;
      }

      .vpe-version-actions .vpe-version-primary {
        background: linear-gradient(135deg, #79f0ff, #ffb36b);
        color: #05131d;
        border-color: transparent;
      }

      .vpe-version-meta {
        display: flex;
        justify-content: space-between;
        gap: 10px;
        flex-wrap: wrap;
        color: #82a9bc;
        font-size: 12px;
      }
    `;
    document.head.appendChild(style);
  }

  function buildDialog() {
    const dialog = document.createElement("dialog");
    dialog.className = "vpe-version-dialog";
    dialog.innerHTML = `
      <div class="vpe-version-card">
        <div>
          <h2>Выбор версии сайта</h2>
          <p>${isMobilePath()
            ? "Сейчас открыта мобильная версия. Можно оставить автовыбор, зафиксировать desktop или переключиться обратно позже."
            : "Сейчас открыта десктопная версия. Можно оставить автовыбор или сразу зафиксировать mobile или desktop."}</p>
        </div>
        <div class="vpe-version-actions">
          <button type="button" class="vpe-version-primary" data-version-choice="current">Оставить текущую версию</button>
          <a href="${getMobileTarget()}${getMobileTarget().includes("?") ? "&" : "?"}view=mobile" data-version-choice="mobile">Открыть mobile</a>
          <a href="${getDesktopTarget()}${getDesktopTarget().includes("?") ? "&" : "?"}view=desktop" data-version-choice="desktop">Открыть desktop</a>
        </div>
        <div class="vpe-version-meta">
          <span>Автовыбор по устройству уже включен</span>
          <button type="button" data-version-choice="close">Закрыть</button>
        </div>
      </div>
    `;

    dialog.addEventListener("close", setCurrentChoiceSeen);
    dialog.querySelector('[data-version-choice="current"]').addEventListener("click", () => {
      setCurrentChoiceSeen();
      dialog.close();
    });
    dialog.querySelector('[data-version-choice="close"]').addEventListener("click", () => {
      setCurrentChoiceSeen();
      dialog.close();
    });

    return dialog;
  }

  function initChooser() {
    injectStyles();

    const dialog = buildDialog();
    document.body.appendChild(dialog);

    const entry = document.createElement("button");
    entry.type = "button";
    entry.className = "vpe-version-entry";
    entry.textContent = "Версия сайта";
    entry.addEventListener("click", () => {
      if (typeof dialog.showModal === "function") dialog.showModal();
      else dialog.setAttribute("open", "open");
    });
    document.body.appendChild(entry);

    if (shouldOpenChooser()) {
      window.setTimeout(() => {
        if (typeof dialog.showModal === "function") dialog.showModal();
        else dialog.setAttribute("open", "open");
      }, 180);
    }
  }

  document.addEventListener("DOMContentLoaded", initChooser);
})();
