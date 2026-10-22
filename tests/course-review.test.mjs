import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import { isDeepStrictEqual } from 'node:util'
import { migrateCompatibleSession, exportPreviousResults } from '../src/compatibility.ts'

const read = file => JSON.parse(fs.readFileSync(file, 'utf8'))
const course = read('public/course.json'), bank = read('public/assessment.json')
const notes = read('public/teaching/notes.json').notes
const pilot = read('authoring/baseline-pilot-20261021.json')
const manifest = read('public/teaching/compatibility.json')
const slides = course.lectures.flatMap(lecture => lecture.slides)
const previousSlides = pilot.course.lectures.flatMap(lecture => lecture.slides)
const tasks = slides.flatMap(slide => slide.task ? [slide.task] : [])
const oldTasks = new Map(previousSlides.flatMap(slide => slide.task ? [[slide.task.id, slide.task]] : []))
const oldVersion = '2.0.1-content-review-20260918'
const middleVersion = '2.0.2-compatible-enrichment-20261002'
const pilotVersion = '2.0.3-four-slide-pilot-20261021'
const base = '/2026-OKFKS-lecture/', prefix = `lecture:${base}:${course.id}`
const attemptsKey = version => `${prefix}:${version}:attempts`
const progressKey = (version, lectureId) => `${prefix}:${version}:${lectureId}:progress`
const storage = () => {
  const values = new Map()
  return { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value) }
}
const attempt = seed => ({ seed, attempts: 3, draft: ['o1'], submitted: ['o1'], result: { status: 'correct', score: 1 } })

test('the full review removes the retired semester overviews and summaries and preserves all surviving IDs, order, brand assets and notebook anchors', () => {
  const removedIds = new Set(pilot.course.lectures.flatMap(lecture => [`${lecture.id}-s002`,...Array.from({length:11},(_,i)=>`${lecture.id}-s${101+i}`)]))
  assert.equal(removedIds.size, 84)
  assert.equal(previousSlides.filter(slide => removedIds.has(slide.id)).length, 84)
  assert.equal(slides.length, 756)
  assert.equal(new Set(slides.map(slide => slide.id)).size, 756)
  assert.deepEqual(course.lectures.map(lecture => lecture.id), pilot.course.lectures.map(lecture => lecture.id))
  assert.deepEqual(slides.filter(s=>!s.activityPassport).map(slide => slide.id), previousSlides.filter(slide => !removedIds.has(slide.id)).map(slide => slide.id))
  for (let i = 0; i < course.lectures.length; i++) {
    assert.equal(course.lectures[i].slides.length, 108)
    const { slides: currentSlides, ...metadata } = course.lectures[i]
    const { slides: oldSlides, ...oldMetadata } = pilot.course.lectures[i]
    assert.deepEqual(metadata, {...oldMetadata, question: oldMetadata.question.replace(' · учебные материалы', '')})
    const survivingOldSlides = oldSlides.filter(slide => !removedIds.has(slide.id))
    currentSlides.filter(s=>!s.activityPassport&&!s.definitionEntries).forEach(slide => assert.equal(slide.notebook, survivingOldSlides.find(old=>old.id===slide.id).notebook, slide.id))
  }
  for (const field of ['id', 'code', 'discipline', 'year', 'heroTitle', 'heroAccent', 'slogan', 'mascot', 'mascotAlt', 'logo', 'ornament', 'font', 'topicArrow', 'materialsUrl', 'literature', 'semesters']) {
    assert.deepEqual(course[field], pilot.course[field], field)
  }
})

test('169 of 224 task-and-key pairs change; remaining assessment results have exactly the compatibility manifest coverage', () => {
  assert.equal(tasks.length, 224)
  assert.equal(new Set(tasks.map(task => task.id)).size, 224)
  assert.deepEqual(tasks.map(task => task.id).sort(), [...oldTasks.keys()].sort())
  const unchanged = tasks.filter(task => isDeepStrictEqual(task, oldTasks.get(task.id)) && isDeepStrictEqual(bank.keys[task.id], pilot.bank.keys[task.id]))
  const changed = tasks.filter(task => !unchanged.includes(task))
  assert.equal(changed.length, 169)
  assert.deepEqual(changed.reduce((counts, task) => ({ ...counts, [task.type]: (counts[task.type] || 0) + 1 }), {}), { single: 2, multiple: 55, short: 56, matching: 56 })
  assert.deepEqual(changed.filter(task => task.type === 'single').map(task => task.id).sort(), [
    's07-01-quality-and-failures-q2-choice-rule',
    's07-02-reliability-metrics-q7-choice-rule',
  ])
  assert.equal(unchanged.length, 55)
  assert.equal(new Set(manifest.unchangedTaskIds).size, 55)
  assert.deepEqual([...manifest.unchangedTaskIds].sort(), unchanged.map(task => task.id).sort())
  assert.equal(manifest.courseId, course.id)
  assert.equal(manifest.contentVersion, course.contentVersion)
  assert.equal(bank.contentVersion, course.contentVersion)
  assert.equal(manifest.previousVersion, pilot.course.contentVersion)
  assert.deepEqual(manifest.noteHashes, pilot.noteHashes)
})

test('equal criticality is explicit, and rounding never turns a 0.04 percentage-point deficit into a positive margin', () => {
  const priority = tasks.find(task => task.id === 's07-01-quality-and-failures-q2-choice-rule')
  assert.match(priority.prompt, /Критичность и срочность заявок одинаковы/)
  const thresholdTask = tasks.find(task => task.id === 's07-02-reliability-metrics-q7-choice-rule')
  const thresholdKey = bank.keys[thresholdTask.id]
  assert.match(thresholdTask.prompt, /0,9496/)
  const correct = thresholdTask.options.filter(option => thresholdKey.correct.includes(option.id)).map(option => option.text).join(' ')
  assert.match(correct, /Нет|не выполнено|ниже/i)
  const deficit = thresholdKey.explanation.match(/не хватает[\s\S]*?=\s*(\d+(?:[.,]\d+)?)\s*процентного пункта/)
  assert.ok(deficit, thresholdKey.explanation)
  assert.equal(Number(deficit[1].replace(',', '.')), 0.04)
  assert.ok(Math.abs((0.95 - 0.9496) * 100 - 0.04) < 1e-12)
  assert.match(notes['s07-02-reliability-metrics-s086'].answer, /не хватает[\s\S]*0,04 процентного пункта/)

  const positiveTransfer = slides.find(slide => slide.id === 's07-02-reliability-metrics-s083')
  assert.match(positiveTransfer.body, /0,9504/)
  assert.match(notes[positiveTransfer.id].answer, /Да: 0,9504 ≥ 0,95/)
  const margin = notes[positiveTransfer.id].answer.match(/Запас[\s\S]*?=\s*(\d+(?:[.,]\d+)?)\s*процентного пункта/)
  assert.ok(margin, notes[positiveTransfer.id].answer)
  assert.equal(Number(margin[1].replace(',', '.')), 0.04)
  assert.ok(Math.abs((0.9504 - 0.95) * 100 - 0.04) < 1e-12)
})

test('new transfer cases distinguish hours from minutes and a finite retry budget from a per-minute rate', () => {
  const unitId = 's07-02-reliability-metrics-s072'
  assert.match(slides.find(slide => slide.id === unitId).body, /24 ч.*60 мин/)
  assert.match(notes[unitId].answer, /60 мин = 1 ч/)
  // A prose comma follows “0,96, или 96%”; it is not part of the number.
  const availability = notes[unitId].answer.match(/24\/25\s*=\s*(\d+(?:[.,]\d+)?)/)
  assert.ok(availability, notes[unitId].answer)
  assert.equal(Number(availability[1].replace(',', '.')), 24 / (24 + 60 / 60))
  assert.match(notes[unitId].answer, /96%/)

  const intervalId = 's07-02-reliability-metrics-s050'
  assert.match(slides.find(slide => slide.id === intervalId).body, /14:00[\s\S]*14:10[\s\S]*15:30/)
  const intervalAnswer = notes[intervalId].answer
  assert.match(intervalAnswer, /Один отказ A/)
  const downtime = intervalAnswer.match(/15:30\s*[−-]\s*14:00\s*=\s*(\d+)\s*ч\s*(\d+)\s*мин\s*=\s*(\d+(?:[.,]\d+)?)\s*ч/)
  assert.ok(downtime, intervalAnswer)
  assert.equal(Number(downtime[1]) * 60 + Number(downtime[2]), 90)
  assert.equal(Number(downtime[3].replace(',', '.')), 90 / 60)
  assert.match(intervalAnswer, /Повтор[\s\S]*14:10[\s\S]*того же случая[\s\S]*не новый отказ/)
  const retryId = 's07-03-reliability-threats-prevention-s094'
  assert.match(slides.find(slide => slide.id === retryId).body, /80 исходных.*два повтора/)
  const retryAnswer = notes[retryId].answer
  const retryBudget = retryAnswer.match(/(\d+)\s*×\s*\(1\s*\+\s*(\d+)\)\s*=\s*(\d+)\s*попыток/)
  assert.ok(retryBudget, retryAnswer)
  assert.deepEqual(retryBudget.slice(1).map(Number), [80, 2, 240])
  assert.equal(Number(retryBudget[3]), Number(retryBudget[1]) * (1 + Number(retryBudget[2])))
  assert.match(retryAnswer, /одного набора/)
  assert.match(retryAnswer, /не гарантированный минутный лимит/)
  assert.match(retryAnswer, /без модели поступления[\s\S]*задержек[\s\S]*накопления повторов/)
})

test('self-checks use technical distinctions and answers rather than phrase-category sorting or cloze recall', () => {
  for (const task of tasks) {
    const key = bank.keys[task.id]
    assert.equal(key.type, task.type, task.id)
    if (task.type === 'multiple') {
      assert.doesNotMatch(task.prompt, /рекомендуемое действие и критерий|Остальные пункты.+определение/i, task.id)
      assert.equal(key.correct.length, 2, task.id)
      assert.ok(key.correct.every(id => task.options.some(option => option.id === id)), task.id)
    }
    if (task.type === 'matching') {
      assert.ok(!task.options.some(option => ['Правило', 'Решение', 'Проверка', 'Пример'].includes(option.text)), task.id)
      assert.equal(task.items.length, 4, task.id)
      assert.deepEqual(task.items.map(item => key.pairs[item.id]).sort(), task.options.map(option => option.id).sort(), task.id)
    }
    if (task.type === 'short') {
      assert.doesNotMatch(task.prompt, /Впишите пропущенное|_{3,}/i, task.id)
      assert.ok(key.numeric || key.accepted?.length, task.id)
    }
  }
})

test('skipping all three releases never regrades old 2.0.1 answers as changed 2.1.0 questions; reading position and archive survive', async () => {
  assert.equal(manifest.previousManifests.length, 1)
  const pilotEdge = manifest.previousManifests[0]
  assert.equal(pilotEdge.previousVersion, middleVersion)
  assert.equal(pilotEdge.contentVersion, pilotVersion)
  assert.equal(pilotEdge.previousManifests.length, 1)
  const legacyEdge = pilotEdge.previousManifests[0]
  assert.equal(legacyEdge.previousVersion, oldVersion)
  assert.equal(legacyEdge.contentVersion, middleVersion)
  assert.equal((legacyEdge.previousManifests || []).length, 0)
  // No question is unchanged through every historical revision. In particular,
  // 2.0.1 singles changed in 2.0.2; the remaining old task types changed now.
  const safeThroughAll = manifest.unchangedTaskIds.filter(id => pilotEdge.unchangedTaskIds.includes(id) && legacyEdge.unchangedTaskIds.includes(id))
  assert.deepEqual(safeThroughAll, [])
  const s = storage(), oldTasks = read('authoring/baseline-20260918.json').bank.keys
  const prior = Object.fromEntries(Object.keys(oldTasks).map((id, index) => [id, attempt(index + 1)]))
  s.setItem(attemptsKey(oldVersion), JSON.stringify(prior))
  const lecture = course.lectures[4], position = lecture.slides[33].id
  s.setItem(progressKey(oldVersion, lecture.id), JSON.stringify(position))
  const result = await migrateCompatibleSession(course, base, manifest, s)
  assert.deepEqual(JSON.parse(s.getItem(attemptsKey(course.contentVersion)) || '{}'), {})
  assert.equal(JSON.parse(s.getItem(progressKey(course.contentVersion, lecture.id))), position)
  assert.ok(result.archiveVersions.includes(oldVersion))
  assert.deepEqual(exportPreviousResults(course, base, oldVersion, s).attempts, prior)
})

test('real unchanged 2.0.2 scores survive a skipped pilot, while revised scores stay archived and a later engine reset remains empty', async () => {
  const s = storage(), safe = 's07-02-reliability-metrics-q2-choice-rule'
  const edited = 's07-02-reliability-metrics-q2-choice-check'
  const changedDuringPilot = 's08-03-encryption-and-security-testing-q3-choice-check'
  const currentSafe = 's07-02-reliability-metrics-q3-choice-rule'
  const prior = { [safe]: attempt(10), [edited]: attempt(11), [changedDuringPilot]: attempt(12) }
  const oldArchive = { [edited]: attempt(1) }
  s.setItem(attemptsKey(oldVersion), JSON.stringify(oldArchive))
  s.setItem(attemptsKey(middleVersion), JSON.stringify(prior))
  s.setItem(attemptsKey(course.contentVersion), JSON.stringify({ [currentSafe]: attempt(99) }))
  assert.ok(manifest.unchangedTaskIds.includes(safe))
  assert.ok(manifest.unchangedTaskIds.includes(changedDuringPilot))
  const lecture = course.lectures[1], position = lecture.slides[40].id
  s.setItem(progressKey(middleVersion, lecture.id), JSON.stringify(position))
  const result = await migrateCompatibleSession(course, base, manifest, s)
  assert.deepEqual(JSON.parse(s.getItem(attemptsKey(course.contentVersion))), { [safe]: prior[safe], [currentSafe]: attempt(99) })
  assert.equal(JSON.parse(s.getItem(progressKey(course.contentVersion, lecture.id))), position)
  assert.ok(result.archiveVersions.includes(oldVersion))
  assert.ok(result.archiveVersions.includes(middleVersion))
  assert.deepEqual(exportPreviousResults(course, base, middleVersion, s).attempts, prior)
  assert.deepEqual(exportPreviousResults(course, base, oldVersion, s).attempts, oldArchive)
  // This is the pinned engine's persisted reset contract, followed by startup.
  s.setItem(attemptsKey(course.contentVersion), '{}')
  await migrateCompatibleSession(course, base, manifest, s)
  await migrateCompatibleSession(course, base, manifest, s)
  assert.deepEqual(JSON.parse(s.getItem(attemptsKey(course.contentVersion))), {})
  assert.deepEqual(exportPreviousResults(course, base, middleVersion, s).attempts, prior)
})

test('pre-upgrade resets in either historical intermediate version are not undone by the three-edge import', async () => {
  const safe = 's07-02-reliability-metrics-q2-choice-rule'
  for (const resetVersion of [middleVersion, pilotVersion]) {
    const s = storage()
    s.setItem(attemptsKey(oldVersion), JSON.stringify({ 's07-02-reliability-metrics-q2-choice-check': attempt(1) }))
    s.setItem(attemptsKey(middleVersion), JSON.stringify({ [safe]: attempt(2) }))
    s.setItem(attemptsKey(resetVersion), '{}')
    await migrateCompatibleSession(course, base, manifest, s)
    await migrateCompatibleSession(course, base, manifest, s)
    assert.deepEqual(JSON.parse(s.getItem(attemptsKey(resetVersion))), {})
    assert.deepEqual(JSON.parse(s.getItem(attemptsKey(course.contentVersion)) || '{}'), {})
  }
})
