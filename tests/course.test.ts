import { describe, expect, it } from 'vitest'
import { course, laboratories, semesterWorkloads, topics, validateCourseData } from '../src/data/courseData'
import { learningHeadlines } from '../src/data/learningHeadlines'
import { buildDeck, countServiceSlides } from '../src/deck/buildDeck'
import { normalizeOrganizationUnit } from '../src/lib/teacherProfile'

describe('teacher profile normalization', () => {
  it.each([
    ['кафедра кафедра Цифровой экономики', 'кафедра Цифровой экономики'],
    ['Лаборатория лаборатория ИИ', 'Лаборатория ИИ'],
    ['лаборатория искусственного интеллекта', 'лаборатория искусственного интеллекта'],
    ['  Кафедра   информационных   систем  ', 'Кафедра информационных систем'],
  ])('normalizes %s', (input, expected) => expect(normalizeOrganizationUnit(input)).toBe(expected))
})

describe('course and deck invariants', () => {
  it('validates workload, topic order and laboratory mapping', () => {
    expect(validateCourseData()).toBe(true)
    expect(topics).toHaveLength(7)
    expect(topics.filter((topic) => topic.semester === 7)).toHaveLength(4)
    expect(topics.filter((topic) => topic.semester === 8)).toHaveLength(3)
    expect(topics.reduce((sum, topic) => sum + topic.lectureHours, 0)).toBe(32)
    expect(topics.reduce((sum, topic) => sum + topic.laboratoryHours, 0)).toBe(44)
    expect(semesterWorkloads.map((item) => item.selfStudyHours)).toEqual([12, 16])
    expect(laboratories.map((lab) => lab.number)).toEqual(Array.from({ length: 22 }, (_, index) => index + 1))
    expect(laboratories.filter((lab) => lab.number <= 10).reduce((sum, lab) => sum + lab.points, 0)).toBe(50)
    expect(laboratories.filter((lab) => lab.number >= 11).reduce((sum, lab) => sum + lab.points, 0)).toBe(50)
    expect(course.totals).toEqual({ lectureHours: 32, laboratoryHours: 44, selfStudyHours: 28, totalHours: 104, finalAssessment: 'зачёт с оценкой' })
  })

  it('keeps source-only competency codes and required topic fields', () => {
    expect(new Set(topics.map((topic) => topic.id)).size).toBe(7)
    topics.forEach((topic) => {
      expect(topic.competencies).toEqual(['ОК 01', 'ПК 4.3', 'ПК 4.4'])
      expect(topic.sourceTitle).toMatch(/^Тема 04\.02\.0[1-7]\./)
      expect(topic.sourceContent.length).toBeGreaterThan(0)
      expect(topic.sourceIds.length).toBeGreaterThan(0)
      expect(topic.questions).toHaveLength(8)
      expect(topic.laboratoryHours).toBeGreaterThan(0)
    })
  })

  it.each(topics.map((topic) => [topic.id, topic] as const))('builds exactly 86 screens for %s', (_id, topic) => {
    const deck = buildDeck(topic, course)
    expect(deck).toHaveLength(86)
    expect(countServiceSlides(deck)).toBe(5)
    expect(deck.filter((slide) => slide.kind !== 'service' && slide.kind !== 'questions')).toHaveLength(81)
    expect(deck.filter((slide) => slide.kind === 'divider').map((slide) => slide.number)).toEqual([13, 27, 41, 55])
    expect(deck.filter((slide) => slide.kind === 'intro' && slide.kicker.startsWith('Связь внутри главы')).map((slide) => slide.number)).toEqual([20, 34, 48, 62])
    expect(deck[85].kind).toBe('questions')
    expect(deck[85].title).toBe('Что осталось непонятным после проверки памяти')
    expect(deck.filter((slide) => slide.visual).map((slide) => slide.number)).toHaveLength(2)
    expect(deck.filter((slide) => slide.visual && slide.number !== 9).every((slide) => slide.kind === 'example')).toBe(true)
    deck.forEach((slide) => expect(slide.sourceIds.length).toBeGreaterThan(0))
  })

  it('provides six concise subject headlines for every learning question', () => {
    const allHeadlines: string[] = []
    topics.forEach((topic) => {
      const headlineTopic = learningHeadlines[topic.id as keyof typeof learningHeadlines] as Record<string, readonly string[]>
      expect(Object.keys(headlineTopic)).toEqual(topic.questions.map((question) => question.title))
      const headlines = Object.values(headlineTopic).flat()
      allHeadlines.push(...headlines)
      expect(headlines).toHaveLength(48)
      expect(new Set(headlines).size).toBe(48)
      expect(headlines.every((headline) => headline.length <= 65)).toBe(true)
    })
    expect(allHeadlines).toHaveLength(336)
    expect(new Set(allHeadlines).size).toBe(336)
  })

  it.each(topics.map((topic) => [topic.id, topic] as const))('uses varied, note-friendly learning frames in %s', (_id, topic) => {
    const deck = buildDeck(topic, course)
    expect(new Set(deck.map((slide) => slide.title)).size).toBeGreaterThan(75)
    expect(deck.filter((slide) => slide.studyBlocks).length).toBeGreaterThanOrEqual(55)
    expect(new Set(deck.flatMap((slide) => slide.layout || []))).toEqual(new Set(['standard', 'notebook', 'sequence', 'case', 'columns', 'contrast', 'recall']))

    topic.questions.forEach((question, index) => {
      const cluster = deck.slice(12 + index * 7, 19 + index * 7)
      expect(cluster).toHaveLength(7)
      expect(cluster[0].title).toBe(question.title)
      expect(new Set(cluster.map((slide) => slide.title)).size).toBe(7)
      expect(cluster.slice(1).every((slide) => slide.title !== question.title)).toBe(true)
      expect(cluster.some((slide) => slide.layout === 'recall')).toBe(true)
    })

    const testText = JSON.stringify(deck.filter((slide) => slide.test))
    expect(testText).toContain(topic.questions[6].title)
    expect(testText).toContain(topic.questions[7].title)
  })

  it.each(topics.map((topic) => [topic.id, topic] as const))('preserves every approved topic and question field in %s', (_id, topic) => {
    const deckText = JSON.stringify(buildDeck(topic, course))
    expect(deckText).toContain(topic.sourceTitle)
    topic.sourceContent.forEach((item) => expect(deckText).toContain(item))
    topic.questions.forEach((question) => {
      Object.values(question).forEach((value) => expect(deckText).toContain(value))
    })
  })

  it('keeps production and editing labels out of audience-facing copy', () => {
    const forbidden = /\b(слайд|новый слайд|раздел|блок|инфографика|визуализация|ключевой вывод|обновлённая версия|актуализировано|комментарий|примечание для дизайнера|вставить изображение|текст для слайда)\b/i
    topics.forEach((topic) => {
      buildDeck(topic, course).forEach((slide) => {
        const audienceCopy = JSON.stringify({
          title: slide.title,
          kicker: slide.kicker,
          body: slide.body,
          bullets: slide.bullets,
          note: slide.note,
          noteLabel: slide.noteLabel,
          studyBlocks: slide.studyBlocks,
          transition: slide.transition,
          visual: slide.visual,
          test: slide.test,
        })
        expect(audienceCopy).not.toMatch(forbidden)
      })
    })
  })
})
