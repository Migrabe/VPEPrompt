# Стратегия A: Responsive (единая кодовая база)

> Этот файл — расширение основного SKILL.md. Используй когда выбрана Стратегия A.

---

## А-1: Аудит страницы

### 1.1 Определи Layout-зоны
Найди и зафикси: Header, Navigation/toolbar, Main area, Parameter panels, Data blocks, Tables, Forms, Action buttons, Modals, Notifications.

### 1.2 Проблемы для рефакторинга
Пометь:
- `fixed width` элементы и жёсткие пиксельные колонки
- `absolute positioning` без fallback
- `overflow: hidden` блоки
- `hover-only` interactions (не работают на touch)
- Отсутствие `viewport` метатега

### 1.3 Тестовые viewport-ширины
Минимально тестировать на: **360px**, **390px**, **412px**, **768px**, **820px**, **1024px**.

---

## А-2: Responsive Foundation

### Viewport метатег
```html
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
```

### Базовые breakpoints (CSS)
```css
@media (max-width: 1023px) {} /* tablet */
@media (max-width: 767px)  {} /* phone */
```

### Базовые breakpoints (Tailwind v3/v4)
| Префикс | Ширина |
|---------|--------|
| (нет)   | < 768px (мобильный) |
| `md:`   | ≥ 768px (планшет) |
| `lg:`   | ≥ 1024px (десктоп) |

**Tailwind v4:** конфигурация через CSS `@theme`, кастомные breakpoints:
```css
@theme {
  --breakpoint-tablet: 900px;
  --breakpoint-desktop: 1200px;
}
```

---

## А-3: Современный CSS (2026)

### Container Queries (Baseline — все браузеры)
```css
.card-wrapper { container-type: inline-size; container-name: card; }

@container card (min-width: 400px) {
  .card { display: flex; flex-direction: row; }
}
```

### Fluid Typography
```css
h1 { font-size: clamp(1.5rem, 4vw, 3rem); }
p  { font-size: clamp(1rem, 2.5vw, 1.125rem); }
```

### Range Media Queries
```css
@media (768px <= width < 1024px) {} /* новый синтаксис */
```

> Полный список CSS 2026 фич с таблицей поддержки — в `references/css-snippets.md`, раздел 19.

---

## А-4: Layout Refactor

### Desktop grid → Mobile flex-column
```css
.layout { display: flex; flex-direction: column; }

@media (min-width: 1024px) {
  .layout { display: grid; grid-template-columns: 250px 1fr; }
}
```

### Самоадаптирующиеся сетки (без медиазапросов)
```css
.cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1rem;
}
```

### Правила единиц
- Избегай `px` для отступов и шрифтов
- Используй `rem`, `svh`, `dvh`, `%`, `clamp()`
- `svh` для стабильных layout, `dvh` для модалок (см. css-snippets.md, раздел 6)

---

## А-5: Компоненты

### Sidebar → Burger Menu (React, без npm-пакетов)
```jsx
const [menuOpen, setMenuOpen] = useState(false);

<button
  onClick={() => setMenuOpen(!menuOpen)}
  className="lg:hidden min-h-[44px] min-w-[44px] p-3"
  aria-expanded={menuOpen}
  aria-label="Меню"
>
  {menuOpen ? '✕' : '☰'}
</button>

<nav className={`fixed inset-y-0 left-0 z-50 w-64 bg-white transform transition-transform
  ${menuOpen ? 'translate-x-0' : '-translate-x-full'} lg:relative lg:translate-x-0`}>
```

### Таблицы — стратегии
- **A: Scroll** → `overflow-x: auto; overscroll-behavior-x: contain;`
- **B: Card layout** — строки становятся карточками
- **C: Expand rows** — детали раскрываются по клику

### Формы
```css
input, select, textarea {
  width: 100%;
  min-height: 44px;
  font-size: 1rem; /* предотвращает zoom на iOS */
}
label { display: block; margin-bottom: 0.25rem; }
```
Используй `type="tel"`, `type="email"`, `type="number"` для правильной клавиатуры.

### Модалки — используй `<dialog>`
```html
<dialog id="myModal">
  <h2>Заголовок</h2>
  <p>Контент</p>
  <button onclick="this.closest('dialog').close()">Закрыть</button>
</dialog>
```
```css
dialog {
  width: min(90vw, 600px);
  max-height: 90svh;
  overflow-y: auto;
}
@media (max-width: 767px) {
  dialog {
    width: 100vw;
    margin: auto auto 0;
    border-radius: 1rem 1rem 0 0;
  }
}
```

---

## А-6: Touch & Accessibility

### Touch Targets — минимум 44×44px
```css
.btn { min-height: 44px; min-width: 44px; padding: 0.75rem 1rem; }
```

### Hover только для устройств с мышью
```css
@media (hover: hover) {
  .card:hover { transform: translateY(-2px); }
}
```

### Типографика
- Основной текст: ≥ **16px** (`1rem`)
- Контрастность: ≥ 4.5:1 (WCAG 2.2 AA)

### User Preferences (обязательно в 2026)
```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { animation-duration: 0.01ms !important; }
}
@media (prefers-color-scheme: dark) {
  :root { --bg: #1a1a1a; --text: #f0f0f0; }
}
@media (forced-colors: active) {
  .btn { border: 2px solid ButtonText; }
}
```

### Стандарты доступности (март 2026)
| Стандарт | Статус |
|----------|--------|
| **WCAG 2.2 AA** | Юридический стандарт. ADA deadline — 28 апреля 2026 |
| WCAG 3.0 | Working Draft — не ранее 2028 |

---

## А-7: Изображения и медиа
```html
<link rel="preload" as="image" href="hero.webp" fetchpriority="high">
<picture>
  <source type="image/avif" srcset="img.avif">
  <source type="image/webp" srcset="img.webp">
  <img src="img.jpg" loading="lazy" width="800" height="600" alt="...">
</picture>
```

---

## А-8: Core Web Vitals (март 2026)

| Метрика | Цель | Что делать |
|---------|------|-----------|
| **LCP** ≤ 2.5s | Загрузка | Preload hero, WebP/AVIF, inline critical CSS |
| **INP** ≤ 200ms | Отклик | `scheduler.yield()`, debounce |
| **CLS** ≤ 0.1 | Стабильность | Указывать width/height на `img`, резервировать место |

**Инструменты:** PageSpeed Insights, Chrome DevTools → Lighthouse, Search Console.

---

## Definition of Done — Стратегия A

- [ ] Весь функционал desktop работает на mobile
- [ ] Viewport метатег установлен с `viewport-fit=cover`
- [ ] Touch targets ≥ 44×44px
- [ ] Нет горизонтального скролла страницы
- [ ] Hover-эффекты защищены `@media (hover: hover)`
- [ ] Все формы, модалки, навигация работают на мобильном
- [ ] CWV: LCP ≤ 2.5s, INP ≤ 200ms, CLS ≤ 0.1
- [ ] `prefers-reduced-motion` обработан
- [ ] Тестирование на 360px, 390px, 412px, 768px, 1024px

---

## Финальные артефакты

Обновлённый HTML/CSS/JSX, список изменённых компонентов, известные ограничения.
