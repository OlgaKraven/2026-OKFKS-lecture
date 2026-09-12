import fs from 'node:fs/promises'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import ts from 'typescript'
import { context } from '../authoring/context.mjs'

// Compile the preserved authoring sources; they are never imported by the site.
const sourceRoot = 'authoring/legacy/src'
const compiledRoot = 'work/legacy-js'
async function compile(directory) {
  for (const entry of await fs.readdir(directory, { withFileTypes: true })) {
    const file = path.join(directory, entry.name)
    if (entry.isDirectory()) { await compile(file); continue }
    if (!file.endsWith('.ts')) continue
    const target = path.join(compiledRoot, path.relative(sourceRoot, file)).replace(/\.ts$/, '.js')
    const result = ts.transpileModule(await fs.readFile(file, 'utf8'), {
      compilerOptions: { target: ts.ScriptTarget.ES2023, module: ts.ModuleKind.ESNext },
    }).outputText.replace(/(from\s+['"])(\.[^'"]+)(['"])/g, '$1$2.js$3')
    await fs.mkdir(path.dirname(target), { recursive: true })
    await fs.writeFile(target, result)
  }
}
await compile(sourceRoot)
const { course: oldCourse, topics, semesterWorkloads, laboratories, selfStudy } = await import(pathToFileURL(path.resolve(compiledRoot, 'data/courseData.js')))
const { sourceRegistry } = await import(pathToFileURL(path.resolve(compiledRoot, 'data/sourceRegistry.js')))
const { buildDeck } = await import(pathToFileURL(path.resolve(compiledRoot, 'deck/buildDeck.js')))
topics[6].questions[2].focus = 'Алгоритм задаёт преобразование, протокол — взаимодействие, ключ — параметр криптографической операции, средство — конкретная реализация. Ключи бывают открытыми и секретными.'
topics[6].questions[2].pitfall = 'Выдавать название алгоритма за полный сценарий защиты.'
const version = '2.0.0-template-aba617d'
context[1][7] = [
  'Неполная запись ограничивает вывод даже при безошибочной арифметике. Незавершённое восстановление нельзя записать как нулевое или незаметно исключить. Оценка по завершённым случаям и характеристика всей текущей выборки — разные утверждения.',
  'К учебной выборке с тремя завершёнными восстановлениями за 6 ч добавился четвёртый отказ; его восстановление ещё продолжается.',
  'По завершённым случаям среднее равно 6/3 = 2 ч. Для всех четырёх длительность пока неизвестна; 6/4 = 1,5 ч ошибочно считает незавершённый случай нулевым.',
  'Сообщаем 2 ч только для трёх завершённых случаев и отдельно отмечаем открытый случай. Полная оценка требует уточнения данных.',
  'Исключение самого длительного незавершённого случая без оговорки может создать ложное улучшение среднего.',
  'Можно ли завершить общий вывод по текущим четырём случаям? Нет; фиксируем предварительную оценку, ограничение и план обновления журнала.',
]
const decks = topics.map(topic => buildDeck(topic, oldCourse))
const reading = old => old.bullets.map((citation, index) => ({ citation, url: old.links[index].url }))
const course = {
  schemaVersion: 1, contentVersion: version, id: oldCourse.id,
  code: 'МДК.04.02', discipline: 'Обеспечение качества функционирования компьютерных систем',
  year: '', heroTitle: 'Качество, надёжность', heroAccent: 'и защита систем',
  slogan: 'От наблюдаемого события и измеримого показателя — к обоснованной мере и проверяемому заключению.',
  mascot: 'brand/mascot/okfks-rhino.webp', mascotAlt: 'Носорог — инженер по качеству и защите компьютерных систем',
  logo: 'brand/synergy-logo.png', ornament: 'brand/side-ornament.png', font: 'fonts/raleway-cyrillic.woff2',
  topicArrow: 'brand/topic-arrow.webp', materialsUrl: oldCourse.materialsUrl,
  literature: { primary: reading(decks[0][2]), additional: reading(decks[0][3]) },
  assessment: { mode: 'autonomous', url: 'assessment.json' }, demo: false,
  semesters: oldCourse.semesters, lectures: [],
}
const bank = { schemaVersion: 1, courseId: course.id, contentVersion: version, mode: 'autonomous-educational', notice: 'Учебная автономная самопроверка. Ключи доступны в файлах сайта; это не защищённый экзамен.', keys: {} }
const pack = { schemaVersion: 1, courseId: course.id, contentVersion: version, notes: {} }
const mapping = [], questionMap = [], glossary = [], registry = []
const rotate = (list, n) => [...list.slice(n % list.length), ...list.slice(0, n % list.length)]
const idOf = (topic, old) => `${topic.id}-s${String(old.number).padStart(3, '0')}`
const types = { title: 'title', service: 'theory', intro: 'theory', divider: 'section', concept: 'theory', example: 'example', decision: 'example', warning: 'warning', check: 'summary', practice: 'example', test: 'test', summary: 'summary', questions: 'questions' }

function taskFor(old, q, qi) {
  const previous = old.test
  const task = { id: previous.id, type: 'single', prompt: previous.prompt }
  const key = { type: 'single', explanation: previous.explanation }
  if (previous.mode === 'word') {
    task.type = key.type = 'short'; key.accepted = [previous.correctAnswer]
  } else if (previous.mode === 'matching') {
    task.type = key.type = 'matching'
    const pairs = [...previous.pairs, { left: q.example, right: 'Пример' }]
    task.items = pairs.map((p, i) => ({ id: `i${i + 1}`, text: p.left }))
    task.options = rotate(pairs.map((p, i) => ({ id: `o${i + 1}`, text: p.right })), (qi % 3) + 1)
    key.pairs = Object.fromEntries(pairs.map((_, i) => [`i${i + 1}`, `o${i + 1}`]))
    key.explanation = `${previous.explanation} Пример описывает исходную ситуацию: ${q.example}`
  } else if (previous.id.endsWith('choice-check')) {
    // Replace a redundant second single-choice task with the required multiple-choice task.
    task.type = key.type = 'multiple'; task.choose = 2
    task.prompt = `Выберите два пункта: рекомендуемое действие и критерий его проверки по вопросу «${q.title}». Остальные пункты — описание ситуации, определение или ошибка.`
    const values = [q.decision, q.check, q.pitfall, q.example, q.focus]
    task.options = rotate(values.map((text, i) => ({ id: `o${i + 1}`, text })), qi + 1)
    key.correct = ['o1', 'o2']
    key.explanation = `Действие: ${q.decision} Критерий: ${q.check}`
    key.optionExplanations = { o1: `Рекомендуемое действие: ${q.decision}`, o2: `Проверяемый результат: ${q.check}`, o3: `Это типичная ошибка: ${q.pitfall}`, o4: 'Это исходный пример, а не действие или критерий.', o5: 'Это определение, а не действие или критерий.' }
  } else {
    task.options = previous.options.map((text, i) => ({ id: `o${i + 1}`, text }))
    key.correct = previous.correctIndexes.map(i => `o${i + 1}`)
    key.optionExplanations = Object.fromEntries(task.options.map(o => [o.id, key.correct.includes(o.id) ? `Верно: ${q.rule}` : o.text === q.pitfall ? `Это ошибка: ${q.pitfall}` : o.text === q.decision ? 'Это конкретное решение; вопрос просит общее правило.' : 'Это критерий проверки; вопрос просит общее правило.']))
  }
  bank.keys[task.id] = key
  return task
}
function convert(topic, old) {
  const q = topic.questions[(old.questionNumber || 1) - 1]
  const s = { id: idOf(topic, old), kind: types[old.kind], title: old.title, kicker: old.kicker }
  if (old.body) s.body = old.body
  if (old.bullets) s.bullets = old.bullets
  if (old.note) s.notebook = old.note
  if (old.studyBlocks) s.bullets = [...(s.bullets || []), ...old.studyBlocks.map(b => `${b.label}: ${b.text}`)]
  if (old.transition) s.bullets = [...(s.bullets || []), old.transition]
  if (old.visual?.type === 'bar') {
    const v = old.visual
    const unit = v.items[0].displayValue.includes('%') ? '%' : v.items[0].displayValue.includes('мс') ? 'мс' : 'событий'
    s.visual = { type: 'bars', max: Math.max(...v.items.map(x => x.max)), unit, items: v.items.map(({ label, value }) => ({ label, value })), caption: `Учебные данные. ${v.caption || v.title}` }
  }
  if (old.visual?.type === 'table') { s.columns = old.visual.columns; s.rows = old.visual.rows }
  if (old.code) s.bullets = [...(s.bullets || []), ...old.code.split('\n')]
  if (old.test) s.task = taskFor(old, q, old.questionNumber - 1)
  if (old.number === 3 || old.number === 4) {
    s.kind = 'literature'; s.readingGroup = old.number === 3 ? 'primary' : 'additional'; delete s.bullets
  }
  if (old.number === 5) { s.kind = 'materials'; s.title = 'Материалы к занятиям'; delete s.body }
  if (old.number === 9) { s.kind = 'agenda'; s.title = 'Вопросы темы'; s.kicker = 'Карта темы'; delete s.visual }
  if (old.questionNumber && old.number < 101 && !old.test && old.title === q.title) {
    s.kind = 'section'; s.kicker = `Вопрос ${old.questionNumber}`; s.body = q.focus; delete s.bullets
  }
  if (s.kind === 'questions') s.title = 'Вопросы от аудитории'
  return s
}
for (let ti = 0; ti < topics.length; ti++) {
  const topic = topics[ti], oldSlides = decks[ti]
  let slides = oldSlides.map(old => convert(topic, old))
  // Put bibliography and materials immediately after the title, and the agenda before the introduction.
  const byNumber = n => slides.find(s => s.id === idOf(topic, oldSlides[n - 1]))
  const leading = [1, 3, 4, 5, 9]
  slides = [...leading.map(byNumber), ...slides.filter(s => !leading.some(n => s === byNumber(n)))]
  for (let qi = 0; qi < topic.questions.length; qi++) {
    const q = topic.questions[qi], qid = `${topic.id}-q${qi + 1}`
    const oldGroup = oldSlides.filter(s => s.questionNumber === qi + 1 && s.number < 101)
    const testIds = oldGroup.filter(s => s.test).map(s => idOf(topic, s))
    const tests = slides.filter(s => testIds.includes(s.id)).sort((a, b) => ['single', 'multiple', 'short', 'matching'].indexOf(a.task.type) - ['single', 'multiple', 'short', 'matching'].indexOf(b.task.type))
    tests.forEach((s, i) => { s.kicker = `Самопроверка · вопрос ${qi + 1} · ${i + 1} из 4`; if (s.task.type === 'multiple') s.title = 'Выберите два ответа' })
    const insert = slides.findIndex(s => testIds.includes(s.id))
    slides.splice(insert, tests.length, ...tests)
    const [explain, setup, reasoning, result, error, discussion] = context[ti][qi]
    const section = slides.find(s => s.id === idOf(topic, oldGroup[0]))
    section.body = qi ? `После вопроса «${topic.questions[qi - 1].title}» разберём следующий шаг: ${setup}` : setup
    const definition = slides.find(s => s.id === idOf(topic, oldGroup[1]))
    definition.body = explain
    delete definition.bullets
    // Subject-specific visual: the actual conditions, reasoning and result.
    const ruleSlide = slides.find(s => s.id === idOf(topic, oldGroup[2]))
    ruleSlide.visual = { type: 'process', items: [{ title: 'Условия', text: setup }, { title: 'Результат', text: result }], caption: `${q.rule} ${reasoning}` }
    delete ruleSlide.body
    delete ruleSlide.bullets
    const example = slides.find(s => s.id === idOf(topic, oldGroup[3]))
    if (!example.visual && !example.rows) { example.body = setup; example.bullets = [reasoning, result] }
    else { example.body = oldGroup[3].body; delete example.bullets }
    example.kicker = `Учебный пример · вопрос ${qi + 1}`
    const decision = slides.find(s => s.id === idOf(topic, oldGroup[4]))
    decision.body = result; decision.bullets = [q.decision, q.check]
    const warningSlide = slides.find(s => s.id === idOf(topic, oldGroup[5]))
    warningSlide.columns = ['Ошибочный подход', 'Обоснованный подход']
    warningSlide.rows = [[q.pitfall, q.decision]]
    warningSlide.body = error
    delete warningSlide.bullets
    const summary = slides.find(s => s.id === idOf(topic, oldGroup[6]))
    summary.body = discussion; summary.notebook = q.check; delete summary.bullets
    for (const old of oldGroup.filter(s => !s.test)) {
      const changed = slides.find(s => s.id === idOf(topic, old))
      changed.source = 'Авторский учебный разбор · МДК.04.02'
    }
    const explanationIds = oldGroup.filter(s => !s.test).map(s => idOf(topic, s))
    questionMap.push({ lectureId: topic.id, questionId: qid, title: q.title, outcome: q.check, explanationIds, taskIds: tests.map(s => s.task.id) })
    glossary.push({ lectureId: topic.id, questionId: qid, term: q.title, explanation: q.focus })
  }
  const lecture = { id: topic.id, title: topic.displayTitle, sourceTitle: topic.sourceTitle, semester: topic.semester, question: 'МДК.04.02 · учебные материалы', slides }
  const titleCorrections = {
    '0-82': 'Сообщения группируют по операции с сохранением исходных записей',
    '0-93': 'Частоты событий читают вместе с числом операций',
    '2-82': 'Хэш выявляет изменение, но не делает копии независимыми',
    '3-27': 'Ряд времени ответа дополняют событиями журнала',
    '3-60': 'Рост очереди и задержки обосновывает раннее предупреждение',
    '4-27': 'Границы доверия связывают риск с контролем',
    '5-38': 'Компоненты сравнивают по одинаковым сценариям',
    '6-27': 'BitLocker защищает том, TLS — соединение',
    '6-49': 'В отчёте сохраняют идентификатор, а не значение ключа',
  }
  for (const old of oldSlides) { const title = titleCorrections[`${ti}-${old.number}`]; if (title) slides.find(s => s.id === idOf(topic, old)).title = title }
  if (ti === 0) slides.find(s => s.id.endsWith('-s093')).body = 'Учебная выборка: 200 операций за один период. На диаграмме — частоты отдельных типов событий; это не автоматически число независимых отказов.'
  if (ti === 3) slides.find(s => s.id.endsWith('-s027')).body = 'Учебные измерения времени ответа: 180, 420 и 870 мс. Для объяснения тенденции нужны события журнала тех же интервалов и экземпляра.'
  // The engine's SVG composition has three rows (kicker, heading, figure).
  // Explanatory text belongs in the figure caption, not a fourth overlapping row.
  for (const s of slides) if (s.visual && s.body) { s.visual.caption = `${s.body} ${s.visual.caption}`; delete s.body }
  course.lectures.push(lecture)
  for (const old of oldSlides) {
    const s = slides.find(s => s.id === idOf(topic, old))
    mapping.push({ lectureId: topic.id, sourceFile: 'authoring/legacy/src/deck/buildDeck.ts', oldNumber: old.number, oldTitle: old.title, slideIds: [s.id], change: old.test?.id.endsWith('choice-check') ? 'Повторный single заменён на multiple по тем же действию и критерию' : old.questionNumber && old.number < 101 && !old.test ? 'Общие поручения и несвязанные ритмические блоки заменены предметным объяснением и разобранным примером из authoring/context.mjs; исходные формулировки доступны в legacy' : s.kind !== old.kind ? `Макет ${old.kind} → ${s.kind}` : 'Перенос содержания', sourceIds: old.sourceIds })
    const at = slides.indexOf(s), q = topic.questions[(old.questionNumber || 1) - 1]
    const key = s.task && bank.keys[s.task.id]
    let script = [s.body, s.notebook, ...(s.bullets || [])].filter(Boolean).join(' ')
    if (s.rows) script += ` Сопоставим два подхода. ${s.rows.map(row => row.map((value, i) => `${s.columns[i]}: ${value}`).join(' ')).join(' ')}`
    if (s.visual) {
      const v = s.visual
      script += v.type === 'process' ? ` Читаем схему от условий к результату. ${v.items.map(i => `${i.title}: ${i.text}`).join(' ')} ${v.caption}` : v.type === 'beforeAfter' ? ` Слева ошибочный подход: ${v.before.fields[0].value} Справа обоснованное действие: ${v.after.fields[0].value} ${v.changes.join(' ')} ${v.caption}` : v.type === 'bars' ? ` Сравним значения на шкале от нуля: ${v.items.map(i => `${i.label}: ${i.value} ${v.unit}`).join('; ')}. ${v.caption}` : ` Сопоставим строки таблицы: ${v.rows.map(row => row.map((value, i) => `${v.columns[i]}: ${value}`).join('; ')).join('. ')}. ${v.caption}`
    }
    if (s.kind === 'title') script = `Тема нашего занятия — «${topic.displayTitle}». ${topic.objective}. Начнём с источников, затем разберём ситуацию: ${topic.caseBrief}`
    if (s.kind === 'literature') script = s.readingGroup === 'primary' ? 'В основном списке два учебника: по архитектуре вычислительных систем и по управлению качеством. Первый даёт контекст устройства системы, второй — язык требований и оценки качества. Полные библиографические описания и ссылки приведены на экране.' : 'Дополнительный список связывает работу над ИТ-проектом с теоретическими основами информационной безопасности. Эти источники помогают различать организацию работы и свойства защиты. Используем указанные издания; конкретные страницы в исходных материалах не заданы.'
    if (s.kind === 'materials') script = 'Здесь ссылка на общую папку курса. Её можно открыть непосредственно или по QR-коду. Состав папки в исходном проекте не проверен, поэтому конкретные файлы сейчас не перечисляем.'
    if (s.kind === 'agenda') script = `Двигаемся в таком порядке: ${topic.questions.map((q, i) => `${i + 1}. ${q.title}`).join('; ')}. К концу этой последовательности ${topic.objective.charAt(0).toLowerCase() + topic.objective.slice(1)}.`
    if (s.kind === 'questions') script = `Вернёмся к входному вопросу: ${topic.diagnostic} Теперь для ответа есть предметные основания: ${context[ti][0][0]} В итоговом разборе важно не потерять ограничение: ${context[ti][7][4]} Предложите уточнение по нашей ситуации: ${topic.caseBrief} Мы завершаем тему результатом «${topic.projectArtifact}». Если вопрос пока не решён, сформулируем, каких наблюдений не хватает для вывода, и запишем следующий шаг: ${topic.nextStep}.`
    if (s.kind === 'section') script = `${s.body} ${q.focus} К завершению блока мы сможем объяснить, почему принято такое решение: ${context[ti][old.questionNumber - 1][3]}`
    if (s.task) script = `${s.task.prompt} Сначала сформулируйте ответ самостоятельно, затем нажмите «Проверить». ${key.explanation}`
    if (old.questionNumber && !s.task && s.kind !== 'section') script += ` ${context[ti][old.questionNumber - 1][5]}`
    const next = slides[at + 1]
    if (next) script += ` Далее — «${next.title}».`
    const words = script.split(/\s+/).length
    pack.notes[s.id] = {
      script,
      preparation: `${topic.sourceTitle}. ${old.sourceIds.map(id => sourceRegistry.find(x => x.id === id)?.title || id).join('; ')}. ${s.visual ? 'Схема читается по подписанным элементам; числовой пример является учебным.' : ''}`,
      notebook: s.notebook ? `Запишите: ${s.notebook}` : s.task ? 'Сначала ответьте без конспекта; после проверки запишите причину ошибки, если она была.' : '',
      questions: old.questionNumber ? context[ti][old.questionNumber - 1][5] : '',
      answer: key ? `${key.explanation}\n${Object.values(key.optionExplanations || {}).join('\n')}${key.pairs ? '\n' + s.task.items.map(i => `${i.text} → ${s.task.options.find(o => o.id === key.pairs[i.id]).text}`).join('\n') : ''}${key.accepted ? '\nДопустимый ответ: ' + key.accepted.join(' / ') : ''}` : '',
      estimatedSeconds: Math.round(words / 2.1 + (s.task ? 60 : s.notebook ? 45 : s.visual ? 35 : 10)),
    }
  }
  registry.push({ lectureId: topic.id, title: topic.displayTitle, semester: topic.semester, lectureHours: topic.lectureHours, slides: slides.length, questions: topic.questions.length, tests: slides.filter(s => s.task).length, visuals: slides.filter(s => s.visual || s.rows).length, contentVersion: version, estimatedMinutes: Math.round(slides.reduce((n, s) => n + pack.notes[s.id].estimatedSeconds, 0) / 60), officialMinutes: topic.lectureHours * 45 })
}
async function json(file, data) { await fs.mkdir(path.dirname(file), { recursive: true }); await fs.writeFile(file, JSON.stringify(data, null, 2) + '\n') }
await json('public/course.json', course)
await json('public/assessment.json', bank)
// Never overwrite an edited private pack. A new generated draft is explicitly separate.
const packPath = await fs.access('private/teacher-pack.json').then(() => 'private/teacher-pack.generated.json').catch(() => 'private/teacher-pack.json')
await json(packPath, pack)
await json('authoring/migration-map.json', mapping)
await json('authoring/question-map.json', questionMap)
await json('authoring/glossary.json', glossary)
await json('authoring/course-map.json', { topics, semesterWorkloads, laboratories, selfStudy, source: 'PROMPT.md, предоставленный текст РПД; исторические команды не исполняются' })
await json('authoring/source-registry.json', sourceRegistry)
await json('reports/lecture-registry.json', registry)
await fs.writeFile('private/teacher.md', course.lectures.map(l => `# ${l.title}\n\n` + l.slides.map(s => `## ${s.id} — ${s.title}\n\n${pack.notes[s.id].script}\n\n${pack.notes[s.id].notebook}\n\n${pack.notes[s.id].answer}`).join('\n\n')).join('\n\n'))
console.log(JSON.stringify({ lectures: course.lectures.length, slides: mapping.length, tasks: Object.keys(bank.keys).length, teacherPack: packPath }, null, 2))
