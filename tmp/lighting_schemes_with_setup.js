const LIGHTING_SCHEMES_PRESETS = {
  // === Классические портретные схемы ===
  "rembrandt-lighting": {
    name: "Рембрандтовский свет (Rembrandt Lighting)",
    description: "Классический живописный свет, создающий драматичную, но естественную светотень. Главная особенность — светлый треугольник на теневой щеке, прямо под глазом.",
    setup: "Один источник жесткого или средне-жесткого света стоит под углом 45 градусов в сторону от модели и на 45 градусов выше уровня глаз. Противоположная сторона лица либо уходит в глубокую тень, либо слегка подсвечивается слабым отражателем.",
    prompt: "Rembrandt lighting setup, exactly one key light positioned at 45 degree angle slightly above eye level, distinct inverted light triangle under the eye on the shadow side of the face, chiaroscuro shading, dramatic painterly shadows, classic moody portraiture"
  },
  
  "split-lighting": {
    name: "Разделяющий свет / Боковой (Split Lighting)",
    description: "Максимально драматичный свет, буквально разрезающий лицо пополам. Идеально для брутальных мужских портретов, передачи внутреннего конфликта героя или создания нуарной атмосферы.",
    setup: "Один жесткий источник света ставится ровно сбоку от модели, под прямым углом (90 градусов) к оси объектива, на уровне головы. Половина лица ярко освещена, вторая — проваливается в абсолютную черноту.",
    prompt: "Split lighting setup, exact 90 degree side lighting, severe contrast, face divided perfectly in half down the midline, one side brightly lit, opposite side plunging into pitch black shadow, intense dramatic cinematic noir portrait"
  },
  
  "butterfly-lighting": {
    name: "Свет «Бабочка» / Голливудский (Butterfly / Paramount)",
    description: "Классический гламурный свет родом из Голливуда 1930-х. Выделяет скулы, визуально делает лицо более узким, скрывает морщины и подчеркивает чистоту кожи.",
    setup: "Ключевой источник света (часто портретная тарелка или софтбокс) ставится прямо перед лицом модели, соосно камере, но высоко поднят (угол около 45 градусов вниз). В результате под носом образуется характерная симметричная тень в форме бабочки. Снизу часто ставят отражатель для смягчения теней на шее.",
    setup_short: "Свет прямо спереди и высоко сверху. Тень от носа падает вниз по центру.",
    prompt: "Paramount Butterfly lighting setup, frontal key light placed high completely centered above the camera axis pointing down, distinctive symmetrical butterfly-shaped shadow directly under the nose, glowing pristine skin texture, vintage Hollywood glamour photography"
  },
  
  "loop-lighting": {
    name: "Петлевой свет (Loop Lighting)",
    description: "Самая универсальная и естественная схема. Создает приятный мягкий объем, подходит для большинства типов лиц. Часто используется в корпоративной и семейной фотографии.",
    setup: "Источник мягкого света сдвинут от камеры в сторону примерно на 30-40 градусов и немного приподнят. Тень от носа падает вбок и вниз, образуя небольшую темную «петлю» на щеке (она не должна касаться тени от края лица).",
    prompt: "Loop lighting setup, flattering softbox key light placed at a 30 degree angle, gentle soft loop-shaped shadow falling diagonally from the nose onto the cheek, well-lit even features, pleasing natural volumetric dimension, corporate commercial photography"
  },
  
  "clamshell-lighting": {
    name: "Схема «Ракушка» / Бьюти (Clamshell / Beauty Lighting)",
    description: "Идеально плоский, бестеневой свет для рекламы косметики и бьюти-портретов. Создает эффект сияющей, безупречной кожи и красивые двойные блики в глазах.",
    setup: "Два источника света (или свет + белый отражатель) стоят прямо перед моделью: один светит сверху вниз (как в схеме Бабочка), а второй — снизу вверх, прямо из-под подбородка. Лицо оказывается «зажатым» между ними, как жемчужина в раковине, что полностью убивает тени.",
    prompt: "Clamshell beauty lighting setup, flawless flat shadowless flat illumination, key light high and fill reflector directly below the chin, glowing immaculate skin texture, striking double catchlights in the eyes, high-end macro cosmetic advertising portrait"
  },
  
  // === Схемы для работы с пространством и фоном ===
  
  "rim-lighting": {
    name: "Контровой свет (Rim / Backlighting)",
    description: "Силуэтное освещение, отрывающее объект от фона. Создает светящийся ареол вокруг фигуры. Добавляет эпичности, таинственности или ощущению «сияния» героя.",
    setup: "Источник (часто жесткий) ставится строго позади объекта и направлен в сторону камеры (или на затылок/спину модели). Лицо при этом находится в полной темноте (если не используется дополнительный заполняющий свет спереди). Образует четкий светлый контур по краям.",
    prompt: "Rim lighting setup, strong pure backlighting, pitch black unlit face, camera facing the dark silhouette, brilliant glowing halo of light outlining the hair and shoulders, subject distinctly separated from the deep dark background, epic cinematic mood"
  },
  
  "high-key-lighting": {
    name: "Высокий ключ (High-Key Lighting)",
    description: "Очень светлая, воздушная сцена с практически полным отсутствием глубоких теней. Создает ощущение чистоты, стерильности, оптимизма и легкости (часто используется Apple).",
    setup: "Требует нескольких источников. Мощный заливающий свет спереди со всех сторон стирает тени с лица, а отдельный сверх-яркий свет (часто 2 источника) направлен на чисто белый фон, чтобы пересветить ("выбить") его до абсолютной белизны.",
    prompt: "High-key lighting setup, hyper-bright pure white background, completely shadowless environment, intense uniform wrap-around softbox illumination, overexposed brilliant highlights, ethereal airy atmosphere, pristine optimistic commercial product photography"
  },
  
  "low-key-lighting": {
    name: "Низкий ключ (Low-Key Lighting)",
    description: "Максимально темная, мрачная сцена, где большая часть кадра — глубокая чернота. Только резкий пучок света выхватывает самую важную деталь. Создает тревогу, интимность или нуарную угрозу.",
    setup: "Абсолютно темное помещение и черный светопоглощающий фон. Используется один узконаправленный источник света (например, с насадкой-тубусом «snoot» или шторками), который точечно светит на часть лица модели.",
    prompt: "Low-Key lighting setup, pitch black environment, single harsh directional spotlight beam cutting through darkness, 90% of the image in crushing deep shadows, intense dramatic chiaroscuro focus only on the subject's face, moody somber thriller aesthetic"
  },
  
  // === Схемы коррекции формы лица ===
  
  "broad-lighting": {
    name: "Широкое освещение (Broad Lighting)",
    description: "Схема, делающая лицо визуально шире. Идеально для узких, вытянутых лиц. Открытый, документальный стиль, но подчеркивает все неровности кожи.",
    setup: "Модель сидит вполоборота к камере (не смотрит прямо). Источник света освещает ту щеку (широкую часть лица), которая ближе всего к камере. Часть лица, отвернутая вглубь кадра, уходит в тень.",
    prompt: "Broad lighting setup, subject's face turned diagonally away from light, intense illumination falling on the broad side of the face nearest to the camera lens, stark realistic honest portraiture, expansive well-lit facial structure"
  },
  
  "short-lighting": {
    name: "Узкое освещение (Short Lighting)",
    description: "Самая популярная схема для «похудения» лица в кадре. Скрывает дефекты кожи в тени, делает скулы резче, а портрет — более задумчивым.",
    setup: "Модель сидит вполоборота к камере. Свет светит на ту половину лица, которая отвернута от камеры (дальнюю). Ближняя к объективу широкая щека оказывается в глубокой, скульптурирующей тени.",
    prompt: "Short lighting setup, subject body turned towards the light source, front broad half of the face nearest the camera in deep sculpting shadow, far narrow side brightly lit, slimming dramatic facial contouring, atmospheric psychological portrait"
  }
};

// Экспортируем в JSON для копирования
// Скопируй содержимое прямо в свои конфигурационные файлы!
