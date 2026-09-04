import { laboratories } from '../data/courseData'
import type { CourseConfig, LectureTopic, Slide, SlideVisual, TestTask } from '../types'

const mainLiterature = [
  {
    label: 'Архитектура вычислительных систем и компьютерных сетей : учебник / А. Н. Алексахин, Н. М. Вершинина, А. В. Джебилов [и др.] ; под редакцией А. М. Нечаева, Н. М. Вершининой, Е. В. Устинова. — Москва : Университет «Синергия», 2025. — 436 с. — ISBN 978-5-4257-0681-2. — Текст : электронный // Образовательная платформа IPR СМАРТ : [сайт]. — URL: https://www.iprbookshop.ru/books/156708/details',
    shortLabel: 'Архитектура вычислительных систем и компьютерных сетей',
    url: 'https://www.iprbookshop.ru/books/156708/details',
    assetPath: 'qr/lit-main-01.png',
  },
  {
    label: 'Юсупова, С. М. Управление качеством : учебник / С. М. Юсупова. — Москва : Ай Пи Ар Медиа, 2026. — 301 с. — ISBN 978-5-4497-5034-1. — Текст : электронный // Образовательная платформа IPR СМАРТ : [сайт]. — URL: https://www.iprbookshop.ru/books/156513/details',
    shortLabel: 'Управление качеством',
    url: 'https://www.iprbookshop.ru/books/156513/details',
    assetPath: 'qr/lit-main-02.png',
  },
]

const additionalLiterature = [
  {
    label: 'Ермакова, А. Н. Управление ИТ-проектами. Ч.I : учебник / А. Н. Ермакова. — Ставрополь : АГРУС, 2024. — 196 с. — Текст : электронный // Образовательная платформа IPR СМАРТ : [сайт]. — URL: https://www.iprbookshop.ru/books/156620/details',
    url: 'https://www.iprbookshop.ru/books/156620/details',
  },
  {
    label: 'Швечкова, О. Г. Информационная безопасность. Ч.1. Теоретические основы : учебник / О. Г. Швечкова, С. И. Бабаев. — Москва : КУРС, 2024. — 144 с. — ISBN 978-5-907352-37-7. — Текст : электронный // Образовательная платформа IPR СМАРТ : [сайт]. — URL: https://www.iprbookshop.ru/books/144785/details',
    url: 'https://www.iprbookshop.ru/books/144785/details',
  },
]

const introductionTheory: Record<string, string> = {
  's07-01-quality-and-failures': 'Качество системы оценивают по наблюдаемому выполнению требований. Ошибка относится к действию или состоянию, дефект — к артефакту, а отказ — к недоступной или неверно выполненной функции.',
  's07-02-reliability-metrics': 'Показатели надёжности превращают журнал событий в сопоставимые величины. Для каждого расчёта нужны границы периода, единицы измерения, правило учёта отказов и заранее заданный критерий.',
  's07-03-reliability-threats-prevention': 'Надёжность снижают не только дефекты программы, но и данные, нагрузка, среда и ошибки эксплуатации. Мера выбирается по механизму влияния и проверяется по наблюдаемому результату.',
  's07-04-observing-operating-system': 'Наблюдаемость связывает состояние системы с журналами, метриками и трассировками. Отдельный сигнал ещё не доказывает причину: важны базовый уровень, динамика и контекст.',
  's08-01-threats-and-malware': 'Анализ угроз начинается с активов, границ доверия и допустимых последствий. Сценарий угрозы описывает путь воздействия, а не просто называет нежелательное событие.',
  's08-02-protection-controls': 'Средство защиты оценивают не по факту установки, а по сценарию, настройке и результату проверки. Каждое разрешение должно иметь основание, а каждый запрет — безопасный негативный тест.',
  's08-03-encryption-and-security-testing': 'Шифрование защищает конфиденциальность в конкретном состоянии данных и не заменяет контроль доступа, целостность и управление ключами. Вывод о защите ограничивается областью выполненных тестов.',
}

const caseRoles: Record<string, string> = {
  's07-01-quality-and-failures': 'аналитики качества восстанавливают цепочку «условие — событие — влияние»',
  's07-02-reliability-metrics': 'инженеры эксплуатации готовят расчётную ведомость по журналу',
  's07-03-reliability-threats-prevention': 'разработчики укрепляют модуль импорта без дублирования операций',
  's07-04-observing-operating-system': 'дежурная смена ищет ранний признак ухудшения до отказа',
  's08-01-threats-and-malware': 'группа защиты строит модель угроз для учебной системы',
  's08-02-protection-controls': 'администраторы проверяют защитные настройки на изолированном стенде',
  's08-03-encryption-and-security-testing': 'аудиторы подтверждают защиту синтетического файла при хранении и передаче',
}

const visuals: Record<string, { questionIndex: number; visual: SlideVisual }> = {
  's07-01-quality-and-failures': {
    questionIndex: 7,
    visual: {
      type: 'bar', title: 'События в учебной выборке',
      items: [
        { label: 'HTTP 503', value: 3, max: 5, displayValue: '3' },
        { label: 'Тайм-аут', value: 2, max: 5, displayValue: '2' },
        { label: 'Дублирование', value: 1, max: 5, displayValue: '1' },
      ],
      caption: '200 операций за один период наблюдения. Абсолютные числа читаются только вместе со знаменателем.',
    },
  },
  's07-02-reliability-metrics': {
    questionIndex: 4,
    visual: {
      type: 'bar', title: 'Готовность: расчёт и требование',
      items: [
        { label: 'Расчёт', value: 95.24, max: 100, displayValue: '95,24 %' },
        { label: 'Порог', value: 95, max: 100, displayValue: '95,00 %' },
      ],
      caption: '40 / (40 + 2) = 0,9524. Учебное требование выполнено на выбранном периоде.',
    },
  },
  's07-03-reliability-threats-prevention': {
    questionIndex: 2,
    visual: {
      type: 'table', title: 'Фактор → мера → свидетельство',
      columns: ['Фактор', 'Мера', 'Что увидим'],
      rows: [
        ['Повреждённая строка', 'Валидация до записи', 'Отклонение без изменения состояния'],
        ['Обрыв соединения', 'Идемпотентный повтор', 'Одна операция вместо дубля'],
        ['Частичная запись', 'Откат транзакции', 'Согласованное состояние'],
      ],
    },
  },
  's07-04-observing-operating-system': {
    questionIndex: 1,
    visual: {
      type: 'bar', title: 'Рост времени ответа',
      items: [
        { label: '10:00', value: 180, max: 1000, displayValue: '180 мс' },
        { label: '10:15', value: 420, max: 1000, displayValue: '420 мс' },
        { label: '10:30', value: 870, max: 1000, displayValue: '870 мс' },
      ],
      caption: 'Три точки показывают тенденцию, но причину подтверждают журналом и состоянием ресурсов.',
    },
  },
  's08-01-threats-and-malware': {
    questionIndex: 1,
    visual: {
      type: 'table', title: 'Карта границ доверия',
      columns: ['Переход', 'Риск', 'Контроль'],
      rows: [
        ['Файл → модуль импорта', 'Подмена содержимого', 'Проверка формата и источника'],
        ['Пользователь → заявка', 'Лишнее действие', 'Минимальные полномочия'],
        ['Модуль → хранилище', 'Изменение записи', 'Проверка состояния и журнал'],
      ],
    },
  },
  's08-02-protection-controls': {
    questionIndex: 2,
    visual: {
      type: 'table', title: 'Учебный снимок защитных мер',
      columns: ['Компонент', 'Сценарий', 'Результат'],
      rows: [
        ['Антивирусная защита', 'Безопасный тест обнаружения', 'Событие записано'],
        ['Сетевой экран', 'Разрешённый и запрещённый поток', 'Оба исхода подтверждены'],
        ['Права роли', 'Чтение без изменения', 'Лишнее действие отклонено'],
      ],
    },
  },
  's08-03-encryption-and-security-testing': {
    questionIndex: 1,
    visual: {
      type: 'table', title: 'Два состояния данных — две проверки',
      columns: ['Состояние', 'Учебное средство', 'Проверка'],
      rows: [
        ['На носителе', 'Шифрование тома', 'Чтение без полномочия недоступно'],
        ['В канале', 'TLS-соединение', 'Защищённый сеанс подтверждён'],
        ['После восстановления', 'Контрольный хэш', 'Хэш совпадает с исходным'],
      ],
    },
  },
}

const visualForQuestion = (topic: LectureTopic, questionIndex: number) => {
  const item = visuals[topic.id]
  return item?.questionIndex === questionIndex ? item.visual : undefined
}

const formatPoints = (points: number) => {
  const lastTwo = points % 100
  const last = points % 10
  const word = lastTwo >= 11 && lastTwo <= 14 ? 'баллов' : last === 1 ? 'балл' : last >= 2 && last <= 4 ? 'балла' : 'баллов'
  return `${points} ${word}`
}

const makeTests = (topic: LectureTopic): TestTask[] => {
  const [q1, q2, q3, q4, q5, q6] = topic.questions
  const specialMode = topic.id.includes('metrics') ? 'calculation' : topic.id.includes('quality') ? 'classification' : 'matching'
  return [
    {
      id: `${topic.id}-single`, mode: 'single', prompt: `Какое решение следует принять в ситуации «${q1.title}»?`,
      options: [q1.decision, q1.pitfall, 'Скрыть исходные условия', 'Сделать вывод без критерия'], correctIndexes: [0], correctAnswer: q1.decision,
      explanation: `Решение следует из правила: ${q1.rule}`, hint: 'Выберите действие с наблюдаемым результатом.', criteria: 'Действие связано с условием и способом проверки.',
    },
    {
      id: `${topic.id}-multiple`, mode: 'multiple', prompt: `Какие два элемента делают вывод по вопросу «${q2.title}» проверяемым?`,
      options: [q2.rule, q2.check, q2.pitfall, 'Непроверяемая оценка'], correctIndexes: [0, 1], correctAnswer: `${q2.rule}; ${q2.check}`,
      explanation: 'Правило задаёт действие, а критерий показывает, какой результат можно принять.', hint: 'Нужны правило и проверка.', criteria: 'Отмечены оба подтверждаемых элемента без типичной ошибки.',
    },
    {
      id: `${topic.id}-boolean`, mode: 'boolean', prompt: `Верно ли утверждение: «${q3.pitfall}»?`,
      options: ['Верно', 'Неверно'], correctIndexes: [1], correctAnswer: 'Неверно', explanation: `Рабочее правило: ${q3.rule}`,
      hint: 'Проверьте, сохраняются ли исходные условия и доказательства.', criteria: 'Ответ «Неверно» обоснован риском из темы.',
    },
    {
      id: `${topic.id}-special`, mode: specialMode, prompt: `Выберите обоснованное продолжение ситуации «${q4.example}».`,
      options: [q4.decision, q4.pitfall, 'Скрыть отклонение', 'Признать любой результат успешным'],
      correctIndexes: [0], correctAnswer: q4.decision, explanation: 'Решение связано с исходным условием и допускает проверку.',
      hint: 'Ищите действие без подмены факта предположением.', criteria: 'Выбрано действие, ведущее к проверяемому результату.',
    },
    {
      id: `${topic.id}-order`, mode: 'order', prompt: `Восстановите порядок работы с задачей «${q5.title}».`,
      options: ['1. Зафиксировать исходные условия', '2. Применить согласованное правило', '3. Получить и сохранить результат', '4. Выполнить контрольную проверку'],
      correctIndexes: [0, 1, 2, 3], correctAnswer: `1 → 2 → 3 → 4; решение: ${q5.decision}`, explanation: 'Критерий задаётся заранее, а контроль выполняется после получения результата.',
      hint: 'Начните с условий, закончите проверкой.', criteria: 'Все четыре шага образуют воспроизводимый порядок.',
    },
    {
      id: `${topic.id}-short`, mode: 'short', prompt: `Коротко объясните, как проверить задачу «${q6.title}» в учебном кейсе.`,
      correctAnswer: q6.check, explanation: `Ориентир: ${q6.decision}`, hint: 'Назовите условие, действие, свидетельство и критерий.',
      criteria: 'В ответе есть условие, действие, наблюдаемое свидетельство и критерий.',
    },
  ]
}

export const buildDeck = (topic: LectureTopic, course: CourseConfig): Slide[] => {
  const sourceIds = Array.from(new Set(['rpd-okfks-text', ...topic.sourceIds]))
  const topicLabs = laboratories.filter((lab) => lab.topicId === topic.id)
  const slides: Omit<Slide, 'number'>[] = [
    {
      kind: 'title', kicker: `${course.discipline} · ${topic.semester}-й семестр`, title: topic.displayTitle, body: topic.caseBrief,
      bullets: [`${topic.lectureHours} ч лекций · ${topic.laboratoryHours} ч лабораторных работ`, `Лабораторные № ${topic.labNumbers.join(', ')} · компетенции: ${topic.competencies.join(' · ')}`],
      sourceIds: ['rpd-okfks-text', 'okfks-rhino', 'synergy-logo'],
    },
    {
      kind: 'service', kicker: `${topic.semester}-й семестр`, title: course.semesterThemes[topic.semester],
      body: 'Темы курса.', bullets: [topic.sourceTitle, ...topic.sourceContent], sourceIds,
    },
    {
      kind: 'service', kicker: 'Учебная навигация', title: 'Основная литература', bullets: mainLiterature.map((item) => item.label),
      links: mainLiterature.map((item) => ({ label: 'Открыть источник', url: item.url })),
      qrCodes: mainLiterature.map((item) => ({ label: item.shortLabel, url: item.url, assetPath: item.assetPath })),
      sourceIds: ['lit-main-01', 'lit-main-02'],
    },
    {
      kind: 'service', kicker: 'Учебная навигация', title: 'Дополнительная литература', bullets: additionalLiterature.map((item) => item.label),
      links: additionalLiterature.map((item) => ({ label: 'Открыть источник', url: item.url })), sourceIds: ['lit-additional-01', 'lit-additional-02'],
    },
    {
      kind: 'service', kicker: 'Материалы к занятиям', title: 'Просканируй меня',
      body: 'QR-код ведёт на папку с материалами.',
      links: [{ label: course.materialsUrl, url: course.materialsUrl }], sourceIds: ['okfks-materials', 'synergy-logo'],
    },
    {
      kind: 'intro', kicker: 'Введение', title: 'Теория, которая понадобится', body: introductionTheory[topic.id],
      transition: 'Сначала разберём понятия и правила, затем применим их к учебному кейсу.', sourceIds,
    },
    { kind: 'intro', kicker: 'Цель занятия', title: topic.objective, body: `Итог работы: ${topic.projectArtifact}.`, sourceIds },
    {
      kind: 'example', kicker: 'Учебный кейс', title: 'Исходная ситуация', body: topic.caseBrief,
      bullets: [`Роль группы: ${caseRoles[topic.id]}.`, 'Данные стенда синтетические; действующие пароли, ключи, токены и персональные данные не используются.', `Рабочий результат: ${topic.projectArtifact}.`], sourceIds,
    },
    { kind: 'intro', kicker: 'Карта темы', title: 'Восемь смысловых вопросов', bullets: topic.questions.map((question, index) => `${index + 1}. ${question.title}`), sourceIds },
    {
      kind: 'concept', kicker: topic.codeLabel, title: 'Рабочая модель и безопасный пример',
      body: 'Перед действием проверьте разрешение, границы учебного стенда, версию средства и способ возврата. Команды вне разрешённой среды не выполняются.',
      code: topic.codeSample, codeLabel: topic.codeLabel, sourceIds,
    },
    {
      kind: 'intro', kicker: 'Результаты обучения', title: 'После занятия ты сможешь',
      bullets: [`объяснить ключевые понятия темы «${topic.displayTitle}» простыми словами;`, `создать и обосновать артефакт: ${topic.projectArtifact};`, 'проверить решение позитивным, граничным и негативным сценарием;', 'отделить наблюдаемый факт от предположения и общего вывода.'], sourceIds,
    },
    { kind: 'check', kicker: 'Входная диагностика', title: topic.diagnostic, body: 'Сформулируй предварительный ответ. В конце темы сравни его с итогами занятия.', sourceIds },
  ]

  topic.questions.forEach((question, index) => {
    const number = index + 1
    const visual = visualForQuestion(topic, index)
    slides.push(
      { kind: 'divider', kicker: `ВОПРОС ${number}`, title: question.title, body: `Уточним смысл понятия «${question.title}», затем проверим его на данных учебного кейса.`, sourceIds, questionNumber: number },
      { kind: 'concept', kicker: `Вопрос ${number} · под запись`, title: 'Краткое определение', note: question.focus, sourceIds, questionNumber: number },
      { kind: 'concept', kicker: `Вопрос ${number} · теория`, title: 'Правило работы', body: question.rule, transition: `Переходим к кейсу: посмотрим, как «${question.title}» влияет на решение команды.`, sourceIds, questionNumber: number },
      { kind: 'example', kicker: `Вопрос ${number} · учебный кейс`, title: 'Исходные данные и наблюдение', body: question.example, visual, sourceIds, questionNumber: number },
      { kind: 'decision', kicker: `Вопрос ${number} · решение`, title: 'Что делает команда', body: question.decision, transition: 'Перед приёмкой результата проверим, какая ошибка способна исказить вывод.', sourceIds, questionNumber: number },
      { kind: 'warning', kicker: `Вопрос ${number} · риск`, title: 'Типичная ошибка', body: question.pitfall, transition: 'Исправление принимается только после повторной проверки по заданному критерию.', sourceIds, questionNumber: number },
      { kind: 'check', kicker: `Вопрос ${number} · контроль`, title: 'Как принять результат', body: question.check, sourceIds, questionNumber: number },
    )
  })

  topic.questions.forEach((question, index) => {
    const lab = topicLabs[index % topicLabs.length]
    slides.push({
      kind: 'practice', kicker: `Лабораторный маршрут · шаг ${index + 1} из 8`, title: question.title,
      body: `Лабораторная работа № ${lab.number}: ${lab.title}. ${lab.hours} ч · ${formatPoints(lab.points)}.`,
      bullets: [`Дано: ${question.example}`, `Сделайте: ${question.decision}`, 'В отчёт: исходные данные, выполненное действие и наблюдаемое свидетельство.', `Критерий приёмки: ${question.check}`, `Контроль риска: ${question.pitfall}`],
      sourceIds, questionNumber: index + 1,
    })
  })

  makeTests(topic).forEach((test, index) => slides.push({ kind: 'test', kicker: `Итоговое задание ${index + 1} из 6`, title: 'Проверь решение', sourceIds, test }))

  slides.push(
    {
      kind: 'summary', kicker: 'Итоговая памятка', title: 'От условия к проверенному артефакту',
      body: 'Сравните ваш первоначальный ответ с итогами занятия: что изменилось в терминах, аргументах и способе проверки?',
      bullets: topic.questions.map((question) => `${question.title}: ${question.decision}`), sourceIds,
    },
    {
      kind: 'summary', kicker: 'Результат и следующий шаг', title: topic.projectArtifact, body: `Следующий шаг: ${topic.nextStep}.`,
      bullets: ['Проверьте, что вывод опирается на исходные условия и наблюдаемое свидетельство.', 'Зафиксируйте ограничения результата и открытые вопросы.', 'Подготовьте артефакт и критерии приёмки к следующей работе.'], sourceIds,
    },
    { kind: 'questions', kicker: 'Финал занятия', title: 'Вопросы от аудитории', body: 'Сформулируй вопрос через исходные условия, наблюдение, ожидаемый результат и способ проверки.', bullets: ['Какой термин требует уточнения?', 'Какое свидетельство стоит разобрать ещё раз?', 'Как проверить вывод безопасно и воспроизводимо?'], sourceIds: ['rpd-okfks-text', 'okfks-rhino', 'synergy-logo'] },
  )

  const numbered = slides.map((slide, index) => ({ ...slide, number: index + 1 }))
  if (numbered.length !== 85) throw new Error(`Deck invariant failed for ${topic.id}: expected 85 slides, got ${numbered.length}`)
  return numbered
}

export const countServiceSlides = (slides: Slide[]) => slides.filter((slide) => [2, 3, 4, 5, 85].includes(slide.number)).length
