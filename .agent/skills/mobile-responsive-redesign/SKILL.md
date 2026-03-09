---
name: mobile-responsive-redesign
description: >
  Инструкции для полного цикла адаптации десктопного сайта под мобильные устройства.
  Поддерживает ДВА архитектурных подхода: (A) responsive single-codebase и (B) отдельная
  мобильная страница с сохранением десктопной версии нетронутой.
  Используй этот скилл ВСЕГДА когда пользователь упоминает: адаптивный дизайн,
  мобильная версия сайта, responsive layout, mobile-first, отдельная мобильная страница,
  m.site.com, редирект на мобильную версию, рефакторинг под телефон/планшет,
  медиазапросы, «сайт не работает на телефоне», адаптация интерфейса,
  «сохранить десктоп и сделать мобильную версию», Tailwind mobile-first,
  мобильная адаптация, touch-friendly, бургер-меню, viewport, safe-area.
---

# Mobile Responsive Redesign Skill

> Актуальность: **март 2026**. Мобильный трафик — ~60–67% всего веб-трафика.

Ты выступаешь в роли **Senior Mobile-First UI инженера**. Цель — реализовать мобильную
поддержку сайта **без нарушения десктопной версии**.

---

## Фаза 0: Выбор архитектурной стратегии

**Сначала определи подход вместе с разработчиком — от этого зависит всё остальное.**

### Стратегия A — Responsive (единая кодовая база)
Одни и те же HTML-файлы, CSS адаптирует layout под размер экрана.

**Выбирай когда:**
- Новый проект или возможна глубокая переработка кода
- Контент одинаков на mobile и desktop
- Важен единый URL для SEO
- Команда небольшая, нет ресурсов поддерживать две версии

> Полные инструкции по Стратегии A — в `references/strategy-a-responsive.md`.

### Стратегия B — Separate Mobile Page (отдельная мобильная страница)
Десктопная версия не трогается. Создаётся отдельный файл/маршрут для мобильных.

**Выбирай когда:**
- Нужно сохранить десктопную версию полностью нетронутой
- Мобильный и десктопный UX принципиально разные
- Сжатые сроки — быстрее создать отдельную страницу, чем переписывать всё
- Legacy-код, который опасно трогать

> Если пользователь хочет **сохранить десктоп и добавить мобильную версию** — используй
> **Стратегию B** (далее в этом файле), затем `references/css-snippets.md` для CSS-деталей.

---

## ═══ СТРАТЕГИЯ B: ОТДЕЛЬНАЯ МОБИЛЬНАЯ СТРАНИЦА ═══

---

## Б-1: Заморозка и резервирование десктопной версии

**Первый шаг — защита существующего кода.**

```bash
# 1. Создать ветку для мобильной работы
git checkout -b feature/mobile-version

# 2. Зафиксировать текущее состояние desktop
git tag desktop-stable-v1

# 3. Сделать скриншоты всех ключевых страниц desktop (baseline)
# Инструменты: Percy, Playwright screenshots, или вручную
```

**Чеклист защиты desktop:**
- [ ] Созданы baseline screenshots всех состояний desktop
- [ ] Desktop-файлы вынесены в `/src/desktop/` или помечены — не трогать
- [ ] Добавлен комментарий в `<head>` десктопных файлов: `<!-- DESKTOP VERSION - DO NOT MODIFY -->`
- [ ] Настроены тесты, которые проверяют desktop после каждого коммита

### Регрессионный скриншот (Playwright)
```js
// tests/desktop-regression.spec.js
const { test, expect } = require('@playwright/test');

const PAGES = ['/', '/about', '/contacts']; // замени на свои

for (const page of PAGES) {
  test(`Desktop не изменился: ${page}`, async ({ page: pw }) => {
    await pw.setViewportSize({ width: 1440, height: 900 });
    await pw.goto(`http://localhost:3000${page}`);
    await expect(pw).toHaveScreenshot(`desktop${page.replace('/', '-')}.png`, {
      maxDiffPixelRatio: 0.01
    });
  });
}
```

> **КРИТИЧЕСКОЕ ПРЕДУПРЕЖДЕНИЕ — НЕ НАРУШАТЬ:**
> При работе со Стратегией B **НЕЛЬЗЯ**:
> - Добавлять `<meta name="viewport">` в десктопные HTML-файлы
> - Изменять десктопные CSS/JS-файлы
> - Добавлять responsive медиазапросы в существующий CSS
>
> Добавление viewport meta в desktop HTML сделает его резиновым на планшетах и сломает вёрстку.

---

## Б-2: Device Detection — определение устройства

> **Решение по планшетам (принять заранее):** iPad и Android-планшеты — показывать
> мобильную или десктопную версию? Рекомендация: ≤ 768px → mobile, > 768px → desktop.

> **Ориентация устройства:** смена landscape/portrait не вызывает повторный редирект —
> версия зафиксирована до перезагрузки.

### Вариант 1: JavaScript (рекомендуется для SPA/React)

```js
// utils/deviceDetect.js

/**
 * ВАЖНО (март 2026):
 * - Chrome/Edge используют User-Agent Reduction (замороженный UA с Chrome 110+).
 *   Модель устройства скрыта. ОБЯЗАТЕЛЬНО используй Client Hints API как основной метод.
 * - navigator.userAgentData.mobile — булевый флаг, работает в Chromium-браузерах.
 * - Safari и Firefox НЕ поддерживают Client Hints — для них fallback на legacy UA.
 * - НЕ используй navigator.maxTouchPoints без UA-проверки —
 *   ловит MacBook с Touch Bar и Surface в режиме ноутбука.
 * - iPadOS 13+ представляется как Macintosh в UA — отдельная обработка.
 */

export function isMobileDevice() {
  // 1. Client Hints API (Chromium: Chrome, Edge, Opera, Samsung Internet)
  if (navigator.userAgentData) {
    return navigator.userAgentData.mobile === true;
  }

  // 2. Legacy UA fallback (Safari, Firefox)
  const ua = navigator.userAgent;
  const phoneUA = /Android.*Mobile|webOS|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i;
  if (phoneUA.test(ua)) return true;

  // 3. Узкий экран как последний резерв
  if (window.screen.width < 768) return true;

  return false;
}

export function isTablet() {
  // Client Hints: mobile=false но touch + средний экран
  if (navigator.userAgentData) {
    if (navigator.userAgentData.mobile) return false; // это телефон
    // Планшет: не mobile, но touch-экран среднего размера
    if (navigator.maxTouchPoints > 0 &&
        window.screen.width >= 768 && window.screen.width <= 1366) {
      return true;
    }
    return false;
  }

  const ua = navigator.userAgent;

  // iPadOS 13+ — представляется как Mac, но имеет touch
  // Safari на Mac НЕ имеет maxTouchPoints > 0 (исключение: iPhone mirroring в macOS 15+)
  if (/Macintosh/i.test(ua) && navigator.maxTouchPoints > 1) return true;

  // Android без "Mobile" = планшет
  if (/Android/i.test(ua) && !/Mobile/i.test(ua)) return true;

  return false;
}

export function shouldRedirectToMobile() {
  return isMobileDevice(); // планшеты → desktop по умолчанию
  // Альтернатива: return isMobileDevice() || isTablet();
}
```

### Вариант 2: CSS-определение (без JavaScript, без redirect)
```css
/* Оба варианта загружаются в браузер — не настоящий redirect */
.desktop-only { display: block; }
.mobile-only  { display: none; }

@media (max-width: 767px) {
  .desktop-only { display: none; }
  .mobile-only  { display: block; }
}

/* Touch-устройства (дополнительно) */
@media (hover: none) and (pointer: coarse) {
  .hover-tooltip { display: none; }
}
```

### Вариант 3: Server-Side Detection (лучший для SEO)

```nginx
# nginx.conf — с поддержкой Client Hints и cookie prefer-desktop

map $http_sec_ch_ua_mobile $is_mobile_ch {
  default 0;
  "?1"    1;
}

map $http_user_agent $is_mobile_ua {
  default 0;
  "~*(android.*mobile|iphone|ipod|blackberry|iemobile|opera mini)" 1;
}

# Используем Client Hints если есть, иначе fallback на UA
map "$is_mobile_ch:$is_mobile_ua" $is_mobile {
  default 0;
  "1:0"   1;
  "1:1"   1;
  "0:1"   1;
}

# Извлекаем cookie prefer-desktop
map $http_cookie $prefer_desktop {
  default 0;
  "~*prefer-desktop=1" 1;
}

server {
  # Запрос Client Hints у браузера
  add_header Accept-CH "Sec-CH-UA-Mobile, Sec-CH-UA-Platform" always;
  add_header Critical-CH "Sec-CH-UA-Mobile" always;

  location / {
    # Не редиректим если пользователь выбрал десктоп
    if ($prefer_desktop) {
      break;
    }
    if ($is_mobile) {
      return 302 /mobile$request_uri;
    }
  }

  location /mobile/ {
    try_files $uri $uri/ /mobile/index.html;
  }
}
```

```python
# Python/Flask
from flask import request, redirect
import re

MOBILE_UA = re.compile(r'Android.*Mobile|webOS|iPhone|iPod|BlackBerry|IEMobile|Opera Mini', re.I)

@app.before_request
def redirect_mobile():
    if request.path == '/mobile' or request.path.startswith('/mobile/'):
        return
    if request.cookies.get('prefer-desktop') == '1':
        return
    # Собираем целевой URL с сохранением query string
    qs = ('?' + request.query_string.decode()) if request.query_string else ''
    target = '/mobile' + request.path + qs
    # Client Hints (приоритет)
    ch_mobile = request.headers.get('Sec-CH-UA-Mobile', '')
    if ch_mobile == '?1':
        return redirect(target, 302)
    # Legacy UA fallback
    ua = request.headers.get('User-Agent', '')
    if MOBILE_UA.search(ua):
        return redirect(target, 302)
```

```js
// Node.js / Express
// Требует: app.use(require('cookie-parser')());
const mobileRe = /Android.*Mobile|webOS|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i;

app.use((req, res, next) => {
  if (req.path === '/mobile' || req.path.startsWith('/mobile/')) return next();
  if (req.cookies?.['prefer-desktop'] === '1') return next();

  const ua = req.headers['user-agent'] || '';
  const chMobile = req.headers['sec-ch-ua-mobile'] === '?1';
  const isMobile = chMobile || mobileRe.test(ua);

  if (isMobile) {
    // req.originalUrl содержит path + query string (hash не доходит до сервера)
    const target = '/mobile' + req.originalUrl;
    return res.redirect(302, target);
  }
  next();
});
```

### Вариант 4: JS Redirect в `<head>` (для статических сайтов)

```html
<!-- Добавить в <head> десктопной страницы — ДО других скриптов -->
<script>
  (function() {
    var MOBILE_KEY = 'prefer-desktop';
    if (localStorage.getItem(MOBILE_KEY)) return;
    var p = window.location.pathname;
    if (p === '/mobile' || p.indexOf('/mobile/') === 0) return;

    var isMobile = false;

    // Client Hints API (Chromium)
    if (navigator.userAgentData) {
      isMobile = navigator.userAgentData.mobile === true;
    } else {
      // Legacy UA (Safari, Firefox)
      var ua = navigator.userAgent;
      isMobile = /Android.*Mobile|webOS|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
    }

    // Fallback: узкий экран
    if (!isMobile && window.screen.width < 768) isMobile = true;

    if (isMobile) {
      var mobilePath = '/mobile' + window.location.pathname + window.location.search + window.location.hash;
      window.location.replace(mobilePath);
    }
  })();
</script>
```

### 302 vs 301 — что выбрать

| Код | Когда использовать |
|-----|-------------------|
| **302** (временный) | Рекомендуется для device redirect — Google понимает что это device-based |
| 301 (постоянный) | Только если URL навсегда переезжает. Кешируется — сложно откатить |

### Защита от Redirect Loop

Все примеры в Вариантах 1–4 уже содержат защиту от loop. Ключевые правила:

1. **Проверяй `alreadyMobile` строго**: `path === '/mobile' || path.startsWith('/mobile/')` — иначе путь `/mobilex` тоже совпадёт.
2. **Проверяй `prefer-desktop` cookie**: если пользователь выбрал «Полная версия», не редиректь.
3. **`/mobile/` location на сервере — без обратного редиректа.**

```nginx
# nginx: /mobile/ — обслуживаем напрямую, без условий
location /mobile/ {
  try_files $uri $uri/ /mobile/index.html;
}
```

---

## Б-3: URL-стратегия

| Вариант | URL | Плюсы | Минусы |
|---------|-----|--------|--------|
| **Subdomain** | `m.site.com` | Чистое разделение | Требует DNS, SSL на поддомен |
| **Path prefix** | `site.com/mobile/` | Проще настроить, единый домен | Нужна настройка роутинга |
| **Query param** | `site.com/?view=mobile` | Легче реализовать | Хуже для SEO |
| **Separate file** | `site.com/index-mobile.html` | Максимально просто | Только для статики |

**Рекомендация:** Path prefix `/mobile/` — баланс между простотой и SEO.

---

## Б-4: Структура файлов

### HTML/Vanilla проект
```
project/
├── index.html               ← десктоп (НЕ ТРОГАТЬ)
├── about.html               ← десктоп (НЕ ТРОГАТЬ)
├── css/
│   ├── desktop.css          ← десктоп стили (НЕ ТРОГАТЬ)
│   └── mobile.css           ← только мобильные стили
├── mobile/
│   ├── index.html           ← мобильная главная
│   ├── about.html           ← мобильная версия
│   ├── sw.js                ← Service Worker (scope: /mobile/)
│   ├── offline.html         ← offline fallback страница
│   └── components/
├── js/
│   ├── app.js               ← общая бизнес-логика (shared)
│   └── device-redirect.js   ← логика редиректа
└── manifest.json            ← Web App Manifest
```

### React проект (React Router v7 / TanStack Router)
```
src/
├── pages/
│   ├── desktop/             ← десктоп страницы (НЕ ТРОГАТЬ)
│   │   ├── Home.jsx
│   │   └── About.jsx
│   └── mobile/              ← мобильные страницы
│       ├── MobileHome.jsx
│       └── MobileAbout.jsx
├── components/
│   ├── desktop/
│   └── mobile/
├── shared/                  ← ОБЩАЯ логика, хуки, утилиты
│   ├── hooks/
│   ├── api/
│   └── utils/
└── router/
    └── AppRouter.jsx        ← роутинг с device detection
```

### React Router с device detection
```jsx
// AppRouter.jsx — совместимо с React Router v6.4+ / v7
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router';
import { isMobileDevice } from '../shared/utils/deviceDetect';

import DesktopHome from '../pages/desktop/Home';
import MobileHome from '../pages/mobile/MobileHome';

const mobile = isMobileDevice();

const router = createBrowserRouter([
  {
    path: '/',
    element: mobile ? <Navigate to="/mobile" replace /> : <DesktopHome />,
  },
  {
    path: '/mobile',
    element: <MobileHome />,
  },
]);

export default function AppRouter() {
  return <RouterProvider router={router} />;
}
```

### Next.js структура (App Router)
```
app/
├── (desktop)/              ← Desktop route group (НЕ ТРОГАТЬ)
│   ├── layout.tsx
│   ├── page.tsx
│   └── about/page.tsx
├── mobile/                 ← Mobile route group
│   ├── layout.tsx
│   ├── page.tsx
│   └── about/page.tsx
└── middleware.ts           ← device detection + redirect
```

```ts
// middleware.ts — Next.js 14+ / 15
import { NextRequest, NextResponse } from 'next/server';

const PHONE_UA = /Android.*Mobile|webOS|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i;

export function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;
  const isMobilePath = path === '/mobile' || path.startsWith('/mobile/');
  if (isMobilePath || path.startsWith('/_next') || path.startsWith('/api')) {
    return NextResponse.next();
  }

  const preferDesktop = req.cookies.get('prefer-desktop')?.value === '1';
  if (preferDesktop) return NextResponse.next();

  // Client Hints (приоритет)
  const chMobile = req.headers.get('sec-ch-ua-mobile');
  const ua = req.headers.get('user-agent') || '';
  const isMobile = chMobile === '?1' || PHONE_UA.test(ua);

  if (isMobile) {
    const url = req.nextUrl.clone();
    url.pathname = '/mobile' + path;
    const response = NextResponse.redirect(url, 302);
    response.headers.set('Accept-CH', 'Sec-CH-UA-Mobile');
    return response;
  }

  const response = NextResponse.next();
  response.headers.set('Accept-CH', 'Sec-CH-UA-Mobile');
  return response;
}

export const config = {
  matcher: ['/((?!_next|favicon|api|.*\\..*).*)'],
};
```

### Vite/SPA без роутера (статический сайт)
```js
// vite.config.js — multi-page build: desktop + mobile
import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main:   'index.html',         // desktop
        mobile: 'mobile/index.html',  // mobile
      }
    }
  }
});
```
Редирект — через JS `<script>` в `<head>` (Вариант 4 из Б-2).

---

## Б-5: Шаблон мобильной страницы

```html
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
  <title>Название сайта</title>

  <!-- SEO: canonical → desktop (обязательно на мобильной странице) -->
  <link rel="canonical" href="https://site.com/">
  <!-- НЕ добавляй rel=alternate сюда — он нужен только на ДЕСКТОПНОЙ странице -->

  <!-- Тема и PWA -->
  <meta name="theme-color" content="#1a1a2e">
  <link rel="manifest" href="/manifest.json">

  <link rel="stylesheet" href="/css/mobile.css">
</head>
<body>
  <header class="mobile-header">
    <button class="burger-btn" aria-label="Меню" aria-expanded="false">☰</button>
    <a href="/" class="logo"><img src="/img/logo.svg" alt="Лого" width="120" height="40"></a>
  </header>

  <nav class="mobile-nav" id="mobile-nav" aria-hidden="true">
    <!-- Навигация -->
  </nav>

  <main class="mobile-main">
    <!-- Контент -->
  </main>

  <footer class="mobile-footer">
    <button onclick="preferDesktop()" class="desktop-link">
      Перейти на полную версию сайта
    </button>
  </footer>

  <script>
    function preferDesktop() {
      localStorage.setItem('prefer-desktop', '1');
      document.cookie = 'prefer-desktop=1; path=/; max-age=31536000; SameSite=Lax';
      var desktopPath = window.location.pathname.replace(/^\/mobile/, '') || '/';
      window.location.href = desktopPath + window.location.search;
    }
  </script>

  <!-- Service Worker для offline fallback (scope ограничен /mobile/) -->
  <script>
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/mobile/sw.js').catch(function() {});
    }
  </script>
</body>
</html>
```

### Минимальный Service Worker (offline fallback)
```js
// mobile/sw.js — scope автоматически = /mobile/
const CACHE = 'mobile-shell-v1';
const OFFLINE_URL = '/mobile/offline.html';

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll([OFFLINE_URL, '/css/mobile.css']))
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  // Очистка старых кешей при обновлении версии
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
});

self.addEventListener('fetch', e => {
  if (e.request.mode === 'navigate') {
    e.respondWith(
      fetch(e.request).catch(() => caches.match(OFFLINE_URL))
    );
  }
});
```

---

## Б-5б: Паритет контента и изоляция ассетов

### Чеклист паритета
- [ ] Все ссылки навигации присутствуют (в бургер-меню)
- [ ] Все формы перенесены с теми же `name`/`id` атрибутами
- [ ] Все бизнес-действия доступны (купить, отправить, скачать)
- [ ] Контактная информация присутствует
- [ ] Юридические ссылки (политика, оферта) присутствуют
- [ ] SEO-контент (h1, описание) присутствует
- [ ] Open Graph / meta tags скопированы
- [ ] Структурированные данные (JSON-LD) скопированы

### Изоляция ассетов
```html
<!-- ПЛОХО: mobile грузит десктопный CSS -->
<link rel="stylesheet" href="/css/desktop.css">

<!-- ХОРОШО: только мобильный CSS + shared -->
<link rel="stylesheet" href="/css/mobile.css">
<link rel="stylesheet" href="/css/shared-utils.css">
```

### Бюджет производительности

| Ресурс | Цель |
|--------|------|
| Общий вес страницы | ≤ 500 KB |
| JS (parse + execute) | ≤ 150 KB gzip |
| CSS | ≤ 50 KB gzip |
| Изображения hero | WebP/AVIF, ≤ 100 KB |
| LCP | ≤ 2.5 сек на 4G |

---

## Б-6: Синхронизация состояния desktop ↔ mobile

```js
// shared/sessionSync.js
export function preserveStateOnSwitch(targetUrl) {
  const state = {
    scrollY: window.scrollY,
    formData: collectFormData(),
    userId: localStorage.getItem('userId'),
    cartItems: JSON.parse(localStorage.getItem('cart') || '[]'),
  };
  sessionStorage.setItem('switchState', JSON.stringify(state));
  window.location.href = targetUrl;
}

export function restoreStateAfterSwitch() {
  const saved = sessionStorage.getItem('switchState');
  if (!saved) return;
  const state = JSON.parse(saved);
  sessionStorage.removeItem('switchState');
  if (state.cartItems?.length) {
    localStorage.setItem('cart', JSON.stringify(state.cartItems));
  }
  return state;
}

function collectFormData() {
  const data = {};
  document.querySelectorAll('input[name], select[name], textarea[name]').forEach(el => {
    data[el.name] = el.value;
  });
  return data;
}
```

### Извлечение shared логики из desktop БЕЗ его поломки

**Правило:** desktop-файлы не трогаем. Копируем в shared/, затем desktop переключаем на shared/.

```
Шаг 1: Найди логику для извлечения (API-вызовы, утилиты, валидация)
Шаг 2: Скопируй в shared/ (НЕ вырезай — сначала копируй)
Шаг 3: Убедись что копия работает — напиши тест
Шаг 4: После тестов — замени в desktop на импорт из shared/
Шаг 5: Прогони регрессионные тесты desktop
```

---

## Б-7: SEO для dual-URL

```html
<!-- На ДЕСКТОПНОЙ странице: мобильный alternate -->
<link rel="alternate" media="only screen and (max-width: 640px)"
      href="https://site.com/mobile/">

<!-- На МОБИЛЬНОЙ странице: canonical на desktop -->
<link rel="canonical" href="https://site.com/">
```

```nginx
# Vary header — для корректного кеширования CDN
add_header Vary User-Agent;
```

```xml
<!-- sitemap.xml (добавь xmlns:xhtml в корневой <urlset>) -->
<!-- <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
             xmlns:xhtml="http://www.w3.org/1999/xhtml"> -->
<url>
  <loc>https://site.com/</loc>
  <xhtml:link rel="alternate" media="only screen and (max-width: 640px)"
              href="https://site.com/mobile/" />
</url>
```

---

## Б-8: User Toggle

На мобильной странице — кнопка «Полная версия»:
```html
<button onclick="preferDesktop()" style="
  position: fixed; bottom: 1rem; right: 1rem;
  background: rgba(0,0,0,0.7); color: #fff;
  border: none; border-radius: 2rem;
  padding: 0.5rem 1rem; font-size: 0.875rem;
  cursor: pointer; z-index: 1000; min-height: 44px;
">
  Полная версия
</button>

<script>
function preferDesktop() {
  localStorage.setItem('prefer-desktop', '1');
  document.cookie = 'prefer-desktop=1; path=/; max-age=31536000; SameSite=Lax';
  const desktopPath = window.location.pathname.replace(/^\/mobile/, '') || '/';
  window.location.href = desktopPath + window.location.search;
}
</script>
```

На десктопной странице (опционально):
```html
<a href="/mobile/" onclick="localStorage.removeItem('prefer-desktop'); document.cookie='prefer-desktop=; max-age=0; path=/';">
  Мобильная версия
</a>
```

---

## SEO для мобильных (март 2026)

- **Mobile-First Indexing**: Google ранжирует по мобильной версии — она должна содержать весь контент.
- **Responsive (стратегия A)**: единый URL — лучший вариант для SEO.
- **Dual-URL (стратегия B)**: обязательны canonical + rel=alternate + Vary header (Б-7).
- **robots.txt**: разреши сканирование CSS и JS.

---

## Core Web Vitals (март 2026)

| Метрика | Цель | Что делать |
|---------|------|-----------|
| **LCP** ≤ 2.5s | Загрузка | Preload hero, WebP/AVIF, inline critical CSS |
| **INP** ≤ 200ms | Отклик | Разбивать JS-задачи через `scheduler.yield()`, debounce |
| **CLS** ≤ 0.1 | Стабильность | Указывать размеры `img`/`video`, резервировать место |

**Инструменты:** PageSpeed Insights, Chrome DevTools → Lighthouse, Search Console.

---

## Definition of Done

### Стратегия B (Separate Mobile Page)

**Desktop защита:**
- [ ] `git tag desktop-stable-v1` создан до начала работы
- [ ] Playwright baseline screenshots совпадают (регрессия = 0)
- [ ] Desktop работает на 1440px, 1280px, 1024px без изменений
- [ ] В десктопные HTML/CSS/JS НЕ добавлен viewport meta и медиазапросы

**Device detection:**
- [ ] Client Hints API используется как основной метод (Chromium)
- [ ] Legacy UA fallback работает (Safari, Firefox)
- [ ] Телефоны (iPhone, Android phone) → /mobile/
- [ ] Десктоп Chrome/Firefox/Safari → / (desktop)
- [ ] MacBook с Touch Bar → desktop (не mobile!)
- [ ] iPadOS (представляется как Mac) → корректно определяется
- [ ] Решение по планшетам принято и задокументировано
- [ ] Redirect loop не возникает
- [ ] После "Полная версия" — повторного редиректа нет (cookie + localStorage)

**Мобильная страница:**
- [ ] Viewport meta установлен с `viewport-fit=cover`
- [ ] Паритет контента: все формы, ссылки, бизнес-действия
- [ ] Desktop CSS/JS НЕ грузятся на мобильной странице
- [ ] Touch targets ≥ 44×44px
- [ ] Нет горизонтального скролла
- [ ] Кнопка "Полная версия" видна и работает
- [ ] Hash (#якоря) сохраняются при редиректе
- [ ] Service Worker обеспечивает offline fallback

**SEO и производительность:**
- [ ] canonical и rel=alternate настроены
- [ ] Vary: User-Agent header присутствует
- [ ] Accept-CH: Sec-CH-UA-Mobile header отдаётся сервером
- [ ] LCP ≤ 2.5s на реальном мобильном устройстве
- [ ] Общий вес страницы ≤ 500 KB

**Финальное тестирование:**
- [ ] Android Chrome (реальное устройство или DevTools)
- [ ] iPhone Safari (реальное устройство или симулятор)
- [ ] iPad (проверка iPadOS detection)
- [ ] Режим полёта → offline fallback отображается корректно

---

## Финальные артефакты

**Стратегия A:** обновлённый HTML/CSS/JSX → подробности в `references/strategy-a-responsive.md`

**Стратегия B:** device-detect скрипт (с Client Hints), мобильные HTML/JSX страницы,
SEO-конфиг (canonical/alternate/Vary/Accept-CH), Service Worker, инструкция по синхронизации.

---

> CSS сниппеты (media queries, container queries, 2026 фичи) — в `references/css-snippets.md`
> Стратегия A (responsive single-codebase) — в `references/strategy-a-responsive.md`
