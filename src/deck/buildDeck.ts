import type { CourseConfig, LectureTopic, Slide, TestTask } from '../types'

const mainLiterature = [
  {
    label: 'Архитектура вычислительных систем и компьютерных сетей : учебник / А. Н. Алексахин, Н. М. Вершинина, А. В. Джебилов [и др.] ; под редакцией А. М. Нечаева, Н. М. Вершининой, Е. В. Устинова. — Москва : Университет «Синергия», 2025. — 436 с. — ISBN 978-5-4257-0681-2. — Текст : электронный // Образовательная платформа IPR СМАРТ : [сайт]. — URL: https://www.iprbookshop.ru/books/156708/details',
    url: 'https://www.iprbookshop.ru/books/156708/details',
  },
  {
    label: 'Юсупова, С. М. Управление качеством : учебник / С. М. Юсупова. — Москва : Ай Пи Ар Медиа, 2026. — 301 с. — ISBN 978-5-4497-5034-1. — Текст : электронный // Образовательная платформа IPR СМАРТ : [сайт]. — URL: https://www.iprbookshop.ru/books/156513/details',
    url: 'https://www.iprbookshop.ru/books/156513/details',
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

const makeTests = (topic: LectureTopic): TestTask[] => {
  const [q1, q2, q3, q4, q5, q6] = topic.questions
  const specialMode = topic.id.includes('metrics') ? 'calculation' : topic.id.includes('quality') ? 'classification' : 'matching'
  return [
    {
      id: `${topic.id}-single`, mode: 'single', prompt: `Какое действие корректно для вопроса «${q1.title}»?`,
      options: [q1.decision, q1.pitfall, 'Скрыть исходные условия', 'Сделать вывод без критерия'], correctIndexes: [0], correctAnswer: q1.decision,
      explanation: `Решение следует из правила: ${q1.rule}`, hint: 'Выберите вариант с наблюдаемым результатом.', criteria: 'Выбрано действие, связанное с условием и проверкой.',
    },
    {
      id: `${topic.id}-multiple`, mode: 'multiple', prompt: `Какие два элемента нужны для доказательной работы с вопросом «${q2.title}»?`,
      options: [q2.rule, q2.check, q2.pitfall, 'Непроверяемая оценка'], correctIndexes: [0, 1], correctAnswer: `${q2.rule}; ${q2.check}`,
      explanation: 'Правило задаёт действие, критерий — наблюдаемое подтверждение.', hint: 'Нужны действие и проверка.', criteria: 'Отмечены оба верных пункта и не отмечены ошибки.',
    },
    {
      id: `${topic.id}-boolean`, mode: 'boolean', prompt: `Верно ли, что «${q3.pitfall}» — корректный способ?`,
      options: ['Верно', 'Неверно'], correctIndexes: [1], correctAnswer: 'Неверно', explanation: `Корректное правило: ${q3.rule}`,
      hint: 'Проверьте, сохраняются ли исходные условия и доказательства.', criteria: 'Ответ «Неверно» обоснован риском из темы.',
    },
    {
      id: `${topic.id}-special`, mode: specialMode, prompt: `Выберите корректную пару для вопроса «${q4.title}».`,
      options: [`${q4.example} → ${q4.decision}`, `${q4.example} → ${q4.pitfall}`, 'Наблюдение → скрыть отклонение', 'Любой результат → требование выполнено'],
      correctIndexes: [0], correctAnswer: `${q4.example} → ${q4.decision}`, explanation: 'Ситуация связана с обоснованным действием и критерием.',
      hint: 'Ищите пару без подмены факта предположением.', criteria: 'Выбрана связная пара «условие → решение».',
    },
    {
      id: `${topic.id}-order`, mode: 'order', prompt: `Восстановите порядок работы с вопросом «${q5.title}».`,
      options: ['1. Зафиксировать исходные условия', '2. Применить согласованное правило', '3. Получить и сохранить результат', '4. Выполнить контрольную проверку'],
      correctIndexes: [0, 1, 2, 3], correctAnswer: `1 → 2 → 3 → 4; решение: ${q5.decision}`, explanation: 'Контроль выполняется после получения результата, но критерий задаётся заранее.',
      hint: 'Начните с условий, закончите проверкой.', criteria: 'Все четыре шага расположены в воспроизводимом порядке.',
    },
    {
      id: `${topic.id}-short`, mode: 'short', prompt: `Коротко объясните, как проверить вопрос «${q6.title}» в учебном сценарии.`,
      correctAnswer: q6.check, explanation: `Ориентир: ${q6.decision}`, hint: 'Назовите условие, действие, свидетельство и критерий.',
      criteria: 'Ответ содержит проверяемый результат; автоматическая оценка свободного текста не выполняется.',
    },
  ]
}

export const buildDeck = (topic: LectureTopic, course: CourseConfig): Slide[] => {
  const sourceIds = Array.from(new Set(['rpd-okfks-text', ...topic.sourceIds]))
  const slides: Omit<Slide, 'number'>[] = [
    {
      kind: 'title', kicker: `${course.discipline} · ${topic.semester}-й семестр`, title: topic.displayTitle, body: topic.caseBrief,
      bullets: [`${topic.lectureHours} ч лекций · ${topic.laboratoryHours} ч лабораторных работ`, `Лабораторные № ${topic.labNumbers.join(', ')} · компетенции: ${topic.competencies.join(' · ')}`],
      sourceIds: ['rpd-okfks-text', 'okfks-rhino', 'synergy-logo'],
    },
    {
      kind: 'service', kicker: `${topic.semester}-й семестр`, title: course.semesterThemes[topic.semester],
      body: 'Навигационное название семестрового блока. Официальная формулировка темы и содержание сохранены из текста РПД.', bullets: [topic.sourceTitle, ...topic.sourceContent], sourceIds,
    },
    {
      kind: 'service', kicker: 'Учебная навигация', title: 'Основная литература', bullets: mainLiterature.map((item) => item.label),
      links: mainLiterature.map((item) => ({ label: 'Открыть источник', url: item.url })), sourceIds: ['lit-main-01', 'lit-main-02'],
    },
    {
      kind: 'service', kicker: 'Учебная навигация', title: 'Дополнительная литература', bullets: additionalLiterature.map((item) => item.label),
      links: additionalLiterature.map((item) => ({ label: 'Открыть источник', url: item.url })), sourceIds: ['lit-additional-01', 'lit-additional-02'],
    },
    {
      kind: 'service', kicker: 'Материалы к занятиям', title: 'Просканируй меня',
      body: 'QR-код и ссылка ведут на папку материалов, указанную пользователем. Состав папки не проверялся и наличие файлов не заявляется.',
      links: [{ label: course.materialsUrl, url: course.materialsUrl }], sourceIds: ['okfks-materials', 'synergy-logo'],
    },
    {
      kind: 'intro', kicker: 'Введение', title: 'Зачем нужна эта тема', body: topic.caseBrief,
      bullets: ['Используем только условные учебные исходные данные.', 'Разделяем наблюдение, гипотезу и доказанный вывод.', 'Формируем проверяемый артефакт.'], sourceIds,
    },
    { kind: 'intro', kicker: 'Цель занятия', title: topic.objective, body: `Результат: ${topic.projectArtifact}.`, sourceIds },
    {
      kind: 'example', kicker: 'Сквозной кейс', title: 'Изолированная учебная компьютерная система', body: topic.caseBrief,
      bullets: ['Данные синтетические.', 'Действующие пароли, ключи, токены и персональные данные не используются.', `Платформа: ${course.learningPlatform}.`], sourceIds,
    },
    { kind: 'intro', kicker: 'Карта темы', title: 'Восемь смысловых вопросов', bullets: topic.questions.map((question, index) => `${index + 1}. ${question.title}`), sourceIds },
    {
      kind: 'concept', kicker: topic.codeLabel, title: 'Рабочая модель и безопасный пример',
      body: 'Перед действием проверьте разрешение, границы учебного стенда, версию средства и способ возврата. Команды вне разрешённой среды не выполняются.',
      code: topic.codeSample, codeLabel: topic.codeLabel, sourceIds,
    },
    {
      kind: 'intro', kicker: 'Результаты обучения', title: 'После занятия ты сможешь',
      bullets: [`объяснить тему «${topic.displayTitle}»;`, `создать артефакт: ${topic.projectArtifact};`, 'проверить результат позитивным и негативным сценарием;', `связать работу с кодами ${topic.competencies.join(', ')}.`], sourceIds,
    },
    { kind: 'check', kicker: 'Входная диагностика', title: topic.diagnostic, body: 'Сформулируй предварительный ответ. На экране 83 сравни его с итоговой памяткой.', sourceIds },
  ]

  topic.questions.forEach((question, index) => {
    const number = index + 1
    slides.push(
      { kind: 'divider', kicker: `ВОПРОС ${number}`, title: question.title, body: question.focus, sourceIds, questionNumber: number },
      { kind: 'concept', kicker: `Вопрос ${number} · определение`, title: `Что означает «${question.title}»`, body: question.focus, bullets: ['Определение относится к конкретному объекту темы.', 'Границы задаёт учебный сценарий.', 'Смысл подтверждается наблюдаемым свидетельством.'], sourceIds, questionNumber: number },
      { kind: 'concept', kicker: `Вопрос ${number} · правило`, title: 'Принцип, формула или правило', body: question.rule, bullets: ['Исходные условия фиксируются до действия.', 'Единицы и термины используются последовательно.', 'Критерий качества задаётся заранее.'], sourceIds, questionNumber: number },
      { kind: 'example', kicker: `Вопрос ${number} · учебный пример`, title: 'Исходные условия и ожидаемый результат', body: question.example, bullets: [`Условные исходные данные: ${topic.caseBrief}`, `Ожидаемый артефакт: ${topic.projectArtifact}.`, `Способ проверки: ${question.check}`], sourceIds, questionNumber: number },
      { kind: 'decision', kicker: `Вопрос ${number} · применение`, title: 'Обоснованное действие', body: question.decision, bullets: ['Действие выполняется только в разрешённой учебной среде.', 'Результат фиксируется без секретов и реальных персональных данных.', `Критерий приёмки: ${question.check}`], sourceIds, questionNumber: number },
      { kind: 'warning', kicker: `Вопрос ${number} · ограничение`, title: 'Типичная ошибка и её последствия', body: question.pitfall, bullets: ['Ошибка искажает вывод, нарушает воспроизводимость или увеличивает риск.', `Возврат к правилу: ${question.rule}`, 'Исправление подтверждается повторной проверкой.'], sourceIds, questionNumber: number },
      { kind: 'check', kicker: `Вопрос ${number} · самопроверка`, title: 'Критерий качества', body: question.check, bullets: [`Понятие: ${question.focus}`, `Решение: ${question.decision}`, 'Ответ связывает условия, действие и наблюдаемый результат.'], sourceIds, questionNumber: number },
    )
  })

  topic.questions.forEach((question, index) => slides.push({
    kind: 'practice', kicker: `Практический блок · шаг ${index + 1} из 8`, title: question.title, body: question.example,
    bullets: [`Выполни: ${question.decision}`, `Ожидаемый результат: ${question.check}`, `Типичная ошибка: ${question.pitfall}`, `Связь с лабораторными работами: № ${topic.labNumbers.join(', ')}.`],
    code: index === 0 ? topic.codeSample : undefined, codeLabel: index === 0 ? topic.codeLabel : undefined, sourceIds, questionNumber: index + 1,
  }))

  makeTests(topic).forEach((test, index) => slides.push({ kind: 'test', kicker: `Итоговое задание ${index + 1} из 6 · ${test.mode}`, title: 'Проверь решение', body: test.prompt, sourceIds, test }))

  slides.push(
    { kind: 'summary', kicker: 'Итоговая памятка', title: 'От условия к проверенному артефакту', body: topic.objective, bullets: topic.questions.map((question) => `${question.title}: ${question.decision}`), sourceIds },
    { kind: 'summary', kicker: 'Результат и следующий шаг', title: topic.projectArtifact, body: `Следующий шаг: ${topic.nextStep}`, bullets: ['Сохрани прогресс и ответы.', 'Открой окно результатов отдельной кнопкой.', 'Печатная кнопка в интерфейсе предназначена только для преподавателя.'], sourceIds },
    { kind: 'questions', kicker: 'Финал занятия', title: 'Вопросы от аудитории', body: 'Сформулируй вопрос через исходные условия, наблюдение, ожидаемый результат и способ проверки.', bullets: ['Какой термин требует уточнения?', 'Какое свидетельство стоит разобрать ещё раз?', 'Как проверить вывод безопасно и воспроизводимо?'], sourceIds: ['rpd-okfks-text', 'okfks-rhino', 'synergy-logo'] },
  )

  const numbered = slides.map((slide, index) => ({ ...slide, number: index + 1 }))
  if (numbered.length !== 85) throw new Error(`Deck invariant failed for ${topic.id}: expected 85 slides, got ${numbered.length}`)
  return numbered
}

export const countServiceSlides = (slides: Slide[]) => slides.filter((slide) => [2, 3, 4, 5, 85].includes(slide.number)).length
