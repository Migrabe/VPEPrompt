# CSS Snippets Reference

Расширенные сниппеты для адаптивной вёрстки. Актуально: **март 2026**.

---

## Содержание

1. Container Queries
2. Range Media Queries
3. Fluid Typography
4. :has() Selector
5. Media Queries — полный набор breakpoints
6. Viewport Units (dvh / svh / lvh)
7. Flexbox Patterns
8. Grid Patterns
9. Typography Scale
10. Safe Areas (iOS notch / Dynamic Island)
11. Scroll Containers
12. Touch Targets & Input Detection
13. Modals и `<dialog>`
14. Popover API
15. Forms
16. Performance Helpers
17. Оптимизация изображений
18. Core Web Vitals — критические паттерны
19. CSS 2026 — новые фичи

---

## 1. Container Queries (Baseline 2024, production-ready)

```css
/* 1. Объяви контейнер */
.sidebar { container-type: inline-size; container-name: sidebar; }
.main    { container-type: inline-size; container-name: main; }

/* 2. Адаптируй компоненты по размеру их контейнера */
@container sidebar (min-width: 300px) {
  .widget { flex-direction: row; }
}

@container main (min-width: 600px) {
  .card { display: grid; grid-template-columns: 200px 1fr; }
}
```

**Container queries для:** карточек, виджетов, компонентов design system.
**Media queries для:** page-level layout, навигации, глобальных breakpoints.

**Tailwind v4 (январь 2025+):** `@container` поддерживается нативно через `@tw-container`.
**Tailwind v3:** используй `@container` напрямую в CSS.

---

## 2. Range Media Queries (Baseline 2023)

```css
/* Новый синтаксис — более читаемый */
@media (width >= 768px) { }
@media (768px <= width < 1024px) { }
@media (width <= 480px) { }

/* Старый синтаксис (100% совместимость) */
@media (min-width: 768px) { }
@media (min-width: 768px) and (max-width: 1023px) { }
```

---

## 3. Fluid Typography — clamp()

```css
:root {
  --text-base: clamp(1rem, 2.5vw, 1.125rem);
  --text-lg:   clamp(1.125rem, 3vw, 1.5rem);
  --text-xl:   clamp(1.25rem, 4vw, 2rem);
  --text-2xl:  clamp(1.5rem, 5vw, 3rem);

  --space-sm:  clamp(0.5rem, 2vw, 1rem);
  --space-md:  clamp(1rem, 4vw, 2rem);
  --space-lg:  clamp(1.5rem, 6vw, 4rem);
}

h1 { font-size: var(--text-2xl); }
body { font-size: var(--text-base); }
```

---

## 4. :has() Selector (Baseline 2024)

```css
.card:has(img:first-child) { padding-top: 0; }

.nav-item:has(.dropdown[open]) { background: #f5f5f5; }

form:has(input:invalid:not(:placeholder-shown)) .submit-btn {
  opacity: 0.5;
  pointer-events: none;
}
```

---

## 5. Media Queries — полный набор breakpoints

```css
/* Mobile-first подход */
/* Base: мобильный (< 768px) */

@media (min-width: 768px) {}   /* Tablet portrait */
@media (min-width: 1024px) {}  /* Tablet landscape / small desktop */
@media (min-width: 1280px) {}  /* Desktop */
@media (min-width: 1536px) {}  /* Large desktop */

/* Ориентация */
@media (orientation: portrait) {}
@media (orientation: landscape) {}

/* Комбинированные */
@media (min-width: 768px) and (orientation: landscape) {}

/* Input-модальности (определение типа устройства через CSS) */
@media (hover: none) and (pointer: coarse) {
  /* Touch-устройства: телефоны, планшеты */
  .tooltip-on-hover { display: none; }
}
@media (hover: hover) and (pointer: fine) {
  /* Мышь / трекпад */
  .tap-hint { display: none; }
}
@media (any-hover: none) {
  /* Ни одно подключённое устройство не поддерживает hover */
}
```

**Tailwind v4 breakpoints:**
| Префикс | Ширина | Примечание |
|---------|--------|-----------|
| (нет)   | < 768px | Мобильный (base) |
| `md:`   | ≥ 768px | Планшет |
| `lg:`   | ≥ 1024px | Десктоп |
| `xl:`   | ≥ 1280px | Большой десктоп |
| `2xl:`  | ≥ 1536px | Wide |

> **Tailwind v4 vs v3:** v4 использует CSS-first конфигурацию (`@theme` вместо
> `tailwind.config.js`), движок на Lightning CSS. Breakpoints те же, но конфигурация
> кастомных значений переехала в CSS: `@theme { --breakpoint-tablet: 900px; }`.

---

## 6. Viewport Units (dvh / svh / lvh)

**Проблема:** `100vh` на мобильных не учитывает динамическую адресную строку браузера.

```css
/* svh — Small Viewport Height: видимая высота когда UI развёрнут (самый маленький) */
/* lvh — Large Viewport Height: высота когда UI скрыт (самый большой) */
/* dvh — Dynamic Viewport Height: динамически меняется при скролле */

/* Рекомендации: */
.hero-section {
  min-height: 100svh; /* Гарантирует видимость без скролла — SafeOption */
}
.full-screen-modal {
  height: 100dvh; /* Динамически адаптируется к UI */
}
.page-layout {
  min-height: 100svh; /* svh для grid/flex layout — стабильнее */
}

/* Fallback для старых браузеров */
.hero-section {
  min-height: 100vh;            /* fallback */
  min-height: 100svh;           /* modern */
}
```

| Единица | Когда использовать |
|---------|-------------------|
| `svh` | Layout (hero, page grid) — стабильный, не дёргается |
| `dvh` | Модалки, overlay — следит за реальной высотой |
| `lvh` | Редко — фоновые изображения на весь экран |
| `vh` | Только как fallback |

---

## 7. Flexbox Patterns

```css
/* Responsive row → column */
.flex-wrap-mobile {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
}
.flex-wrap-mobile > * {
  flex: 1 1 min(300px, 100%);
}

/* Центрирование */
.center {
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Toolbar: space between, wrap на mobile */
.toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  align-items: center;
}
```

---

## 8. Grid Patterns

```css
/* Авто-сетка без медиазапросов */
.auto-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1rem;
}

/* Sidebar + content */
.sidebar-layout {
  display: grid;
  grid-template-columns: 1fr;
}
@media (min-width: 1024px) {
  .sidebar-layout {
    grid-template-columns: 260px 1fr;
  }
}

/* Holy grail layout */
.page-layout {
  display: grid;
  grid-template-rows: auto 1fr auto;
  min-height: 100svh;
}
```

---

## 9. Typography Scale (rem)

```css
:root {
  --text-xs:   0.75rem;  /* 12px */
  --text-sm:   0.875rem; /* 14px */
  --text-base: 1rem;     /* 16px — минимум для body */
  --text-lg:   1.125rem; /* 18px */
  --text-xl:   1.25rem;  /* 20px */
  --text-2xl:  1.5rem;   /* 24px */
  --text-3xl:  1.875rem; /* 30px */
}

body {
  font-size: var(--text-base);
  line-height: 1.5;
}

h1 { font-size: clamp(1.5rem, 4vw, 3rem); }
```

---

## 10. Safe Areas (iOS notch / Dynamic Island)

```css
/* viewport-fit=cover в meta обязателен для работы env() */
.header {
  padding-top: env(safe-area-inset-top);
}
.footer {
  padding-bottom: env(safe-area-inset-bottom);
}
.sidebar {
  padding-left: env(safe-area-inset-left);
}
/* Полная защита: */
.app-shell {
  padding:
    env(safe-area-inset-top)
    env(safe-area-inset-right)
    env(safe-area-inset-bottom)
    env(safe-area-inset-left);
}
```

---

## 11. Scroll Containers

```css
/* Горизонтальный скролл таблицы */
.table-wrapper {
  overflow-x: auto;
  overscroll-behavior-x: contain;
}

/* Вертикальный скролл контента */
.scrollable-panel {
  overflow-y: auto;
  max-height: 70svh;
  overscroll-behavior: contain;
}

/* Snap-скролл для карточек */
.card-scroll {
  display: flex;
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  gap: 1rem;
  scrollbar-width: thin; /* Firefox */
}
.card-scroll > * {
  scroll-snap-align: start;
  flex-shrink: 0;
  width: min(280px, 80vw);
}

/* Стилизация скроллбара (Baseline 2024) */
.card-scroll {
  scrollbar-width: thin;
  scrollbar-color: rgba(0,0,0,0.3) transparent;
}
```

> Свойство `-webkit-overflow-scrolling: touch` устарело — momentum scrolling включён
> по умолчанию с iOS 13 (2019). Не используй.

---

## 12. Touch Targets & Input Detection

```css
/* Минимальные touch targets (WCAG 2.2 AA) */
.touch-target {
  min-height: 44px;
  min-width: 44px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

/* Увеличение зоны клика без изменения визуала */
.icon-btn {
  position: relative;
  padding: 0.5rem;
}
.icon-btn::after {
  content: '';
  position: absolute;
  inset: -8px;
}

/* Hover-эффекты только для устройств с мышью */
@media (hover: hover) {
  .card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  }
}

/* Touch-специфичные стили */
@media (pointer: coarse) {
  .small-link { padding: 0.75rem; }
}
```

---

## 13. Modals и `<dialog>` (Baseline 2022)

### Нативный `<dialog>` (рекомендуется в 2026)
```html
<dialog id="myDialog">
  <h2>Заголовок</h2>
  <p>Содержимое модалки</p>
  <button onclick="this.closest('dialog').close()">Закрыть</button>
</dialog>
<button onclick="document.getElementById('myDialog').showModal()">Открыть</button>
```

```css
dialog {
  border: none;
  border-radius: 0.75rem;
  width: min(90vw, 600px);
  max-height: 90svh;
  overflow-y: auto;
  padding: 1.5rem;
}

dialog::backdrop {
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
}

/* Fullscreen на мобильном */
@media (max-width: 767px) {
  dialog {
    width: 100vw;
    max-height: 95svh;
    margin: auto auto 0;
    border-radius: 1rem 1rem 0 0;
  }
}
```

**Преимущества `<dialog>` перед кастомными модалками:** нативная фокус-ловушка,
закрытие по Escape, `::backdrop` без JS, доступность из коробки, работает на `<dialog>`.

### Кастомная модалка (если `<dialog>` не подходит)
```css
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.5);
  display: grid;
  place-items: center;
  padding: 1rem;
  z-index: 100;
}

.modal-content {
  background: white;
  border-radius: 0.75rem;
  width: min(90vw, 600px);
  max-height: 90svh;
  overflow-y: auto;
  padding: 1.5rem;
}
```

---

## 14. Popover API (Baseline 2024)

```html
<!-- Нативные попапы без JavaScript -->
<button popovertarget="menu">Меню</button>
<div id="menu" popover>
  <nav>
    <a href="/about">О нас</a>
    <a href="/contacts">Контакты</a>
  </nav>
</div>
```

```css
[popover] {
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  padding: 1rem;
  box-shadow: 0 4px 16px rgba(0,0,0,0.12);
}

/* Анимация появления */
[popover]:popover-open {
  opacity: 1;
  transform: scale(1);
}

/* Начальное состояние (для анимации) */
@starting-style {
  [popover]:popover-open {
    opacity: 0;
    transform: scale(0.95);
  }
}

[popover] {
  transition: opacity 0.2s, transform 0.2s, display 0.2s allow-discrete, overlay 0.2s allow-discrete;
}
```

**Popover vs `<dialog>`:**
- Popover — для dropdowns, tooltips, menus (автоматическое закрытие по клику снаружи).
- `<dialog>` — для модалок (блокирует взаимодействие с фоном).

---

## 15. Forms

```css
.form-field {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  margin-bottom: 0.75rem;
}

.form-field label {
  font-size: 0.875rem;
  font-weight: 500;
}

.form-field input,
.form-field select,
.form-field textarea {
  width: 100%;
  padding: 0.625rem 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  font-size: 1rem; /* предотвращает zoom на iOS */
  min-height: 44px;
}
```
Используй `type="tel"`, `type="email"`, `type="number"` для правильной клавиатуры.

---

## 16. Performance Helpers

```css
/* Prevent reflow на изображениях */
img {
  max-width: 100%;
  height: auto;
  display: block;
}

/* Резервируй aspect ratio — предотвращает CLS */
img, video {
  /* Указывай width и height атрибуты в HTML — браузер вычислит aspect-ratio */
  /* НЕ используй aspect-ratio: attr(width) / attr(height) — не работает */
}

/* Явный aspect-ratio для контейнеров */
.video-container {
  aspect-ratio: 16 / 9;
  width: 100%;
}

/* GPU-ускорение для анимаций */
.animated {
  will-change: transform;
}

/* Smooth scroll (с учётом prefers-reduced-motion) */
@media (prefers-reduced-motion: no-preference) {
  html { scroll-behavior: smooth; }
}

/* Prevent horizontal overflow */
body { overflow-x: hidden; }
```

---

## 17. Оптимизация изображений (LCP / WebP / AVIF)

```html
<!-- Preload LCP-изображения (первый экран) -->
<link rel="preload" as="image" href="hero.webp" fetchpriority="high">

<!-- Современные форматы с fallback -->
<picture>
  <source type="image/avif" srcset="img.avif">
  <source type="image/webp" srcset="img.webp">
  <img src="img.jpg" alt="..." loading="eager" fetchpriority="high"
       width="1200" height="630">
</picture>

<!-- Lazy loading для ниже fold -->
<img src="below-fold.jpg" loading="lazy" width="800" height="600" alt="...">

<!-- srcset для разных экранов -->
<img
  src="image-800.jpg"
  srcset="image-400.jpg 400w, image-800.jpg 800w, image-1200.jpg 1200w"
  sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
  alt="Responsive image"
  width="800" height="600"
>
```

**Форматы по приоритету:** AVIF > WebP > JPEG/PNG
**Экономия:** AVIF — до 50% меньше WebP, до 80% меньше JPEG.

---

## 18. Core Web Vitals — Критические паттерны

```css
/* CLS: Всегда указывай размеры медиаэлементов в HTML (width + height) */
img, video, iframe {
  max-width: 100%;
  height: auto;
}

/* CLS: Резервируй место для динамических блоков */
.ad-container { min-height: 250px; }
.skeleton { min-height: 200px; }

/* CLS: Шрифты */
@font-face {
  font-family: 'MyFont';
  src: url('font.woff2') format('woff2');
  font-display: optional; /* не сдвигает макет при загрузке */
}
```

```js
// INP: Разбивка тяжёлых задач (2026 — scheduler.yield() широко поддержан)
async function processLargeList(items) {
  for (const item of items) {
    process(item);
    // Уступаем управление браузеру
    if (typeof scheduler !== 'undefined' && scheduler.yield) {
      await scheduler.yield();
    } else {
      await new Promise(r => setTimeout(r, 0));
    }
  }
}

// INP: Debounce для инпутов
function debounce(fn, delay = 150) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}
```

---

## 19. CSS 2026 — Новые фичи

### Interop 2025/2026 — статус поддержки (март 2026)

| Фича | Chrome/Edge | Safari | Firefox | Рекомендация |
|------|-------------|--------|---------|-------------|
| Container Queries | ✅ | ✅ | ✅ | Production — используй |
| :has() | ✅ | ✅ | ✅ | Production — используй |
| Popover API | ✅ | ✅ | ✅ | Production — используй |
| `<dialog>` | ✅ | ✅ | ✅ | Production — используй |
| View Transitions (SPA) | ✅ | ✅ | ✅ | Production — используй |
| Anchor Positioning | ✅ | ✅ | 🔄 | С `@supports` + fallback |
| Scroll-Driven Animations | ✅ | ✅ | 🔄 | С `@supports` + fallback |
| @scope | ✅ | ✅ | 🔄 | С `@supports` + fallback |
| CSS Masonry | 🔄 Safari | 🔄 | 🔄 | Только с fallback |

> Используй `@supports` для фич без полной кросс-браузерной поддержки.

### CSS Anchor Positioning
```css
.trigger { anchor-name: --my-anchor; }

.popup {
  position: absolute;
  position-anchor: --my-anchor;
  position-area: bottom span-right;
  position-try-fallbacks: flip-block, flip-inline;
  position-visibility: anchors-visible;
  margin: 0.5rem;
}

@supports not (anchor-name: --a) {
  /* Fallback: Floating UI или абсолютное позиционирование */
  .popup { position: absolute; top: 100%; left: 0; }
}
```

### Scroll-Driven Animations
```css
/* Прогресс чтения */
.progress-bar {
  position: fixed; top: 0; left: 0; height: 3px;
  background: oklch(62% 0.2 260);
  transform-origin: left;
  animation: grow-bar linear forwards;
  animation-timeline: scroll(root block);
}
@keyframes grow-bar { from { scaleX: 0; } to { scaleX: 1; } }

/* Карточки появляются при скролле */
@supports (animation-timeline: view()) {
  .card {
    opacity: 0;
    animation: slide-up linear forwards;
    animation-timeline: view();
    animation-range: entry 0% cover 25%;
  }
  @keyframes slide-up {
    from { opacity: 0; translate: 0 3rem; }
    to   { opacity: 1; translate: 0 0; }
  }
}
```

### @scope
```css
@scope (.card) {
  :scope { border-radius: 0.75rem; overflow: hidden; }
  img { width: 100%; aspect-ratio: 16/9; object-fit: cover; }
  h3 { font-size: 1.125rem; margin: 1rem; }
}

@scope (.article) to (.widget) {
  p { color: #333; line-height: 1.7; }
}
```

### View Transitions API
```css
@view-transition { navigation: auto; }

.card { view-transition-name: card-detail; }
::view-transition-old(card-detail) { animation: slide-out 0.3s ease; }
::view-transition-new(card-detail) { animation: slide-in 0.3s ease; }
```

### oklch() — современная цветовая система
```css
:root {
  --brand:       oklch(62% 0.2 260);
  --brand-light: oklch(80% 0.1 260);
  --brand-dark:  oklch(45% 0.25 260);
}

.btn:hover {
  background: color-mix(in oklch, var(--brand), white 20%);
}
```

### prefers-* — Системные предпочтения (обязательно в 2026)
```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}

@media (prefers-color-scheme: dark) {
  :root {
    --bg: #0f172a; --surface: #1e293b;
    --text: #f1f5f9; --border: #334155;
  }
}

@media (prefers-contrast: more) {
  :root { --text: #000; --bg: #fff; }
  .btn { outline: 2px solid currentColor; }
}

@media (forced-colors: active) {
  .btn { border: 1px solid ButtonText; }
  .icon { fill: ButtonText; }
}
```

### Стандарты доступности (март 2026)

| Стандарт | Статус |
|----------|--------|
| **WCAG 2.2 AA** | Юридический стандарт. ADA deadline США — 28 апреля 2026 |
| WCAG 3.0 | Working Draft. Финальный релиз — не ранее 2028 |
