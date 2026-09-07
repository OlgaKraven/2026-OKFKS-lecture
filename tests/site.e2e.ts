import { expect, test } from '@playwright/test'
import { course, topics } from '../src/data/courseData'
import { buildDeck } from '../src/deck/buildDeck'

const deckLength = buildDeck(topics[0], course).length

test('catalog contains approved topics and semester filters', async ({ page }) => {
  const errors: string[] = []
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text())
  })
  await page.goto('./')
  await expect(page.locator('.topic-card')).toHaveCount(topics.length)
  for (const semester of course.semesters) {
    await page.getByRole('button', { name: `${semester} семестр` }).click()
    await expect(page.locator('.topic-card')).toHaveCount(topics.filter((topic) => topic.semester === semester).length)
  }
  await expect(page.locator('.brand-lockup img')).toHaveJSProperty('complete', true)
  await expect(page.locator('.hero-mascot img')).toHaveJSProperty('complete', true)
  await expect(page.locator('.setup-panel')).toHaveCount(0)
  const profileButton = page.getByRole('button', { name: 'Данные преподавателя' })
  await expect(profileButton).toHaveCount(1)
  await expect(page.getByRole('button', { name: /тёмную тему|светлую тему/ })).toBeVisible()
  await expect(page.locator('.topic-card').first()).not.toContainText('ОК 01')
  await expect(page.locator('.topic-card').first()).not.toContainText('ПК 4.3')
  await expect(page.locator('.topic-card').first()).not.toContainText('ПК 4.4')
  await expect(page.locator('.topic-card').first()).not.toContainText(/\d+ ч/)
  await expect(page.locator('.topic-card').first().getByRole('link', { name: /Сохранить лекцию/ })).toBeVisible()
  await expect(page.locator(`a[href="${course.repository}"]`)).toHaveCount(0)
  await expect(page.locator('link[rel="icon"]')).toHaveAttribute('href', /brand\/synergy-logo\.png$/)
  await profileButton.click()
  await expect(page.getByRole('dialog', { name: 'Данные преподавателя' })).toBeVisible()
  await expect(page.getByRole('group', { name: 'Сохранить лекции в PDF' }).getByRole('link')).toHaveCount(3)
  expect(errors).toEqual([])
})

test('responsive catalog has no horizontal overflow at required sizes', async ({ page }) => {
  const viewports = [
    { width: 1920, height: 1080 },
    { width: 1366, height: 768 },
    { width: 768, height: 1024 },
    { width: 390, height: 844 },
    { width: 360, height: 800 },
  ]
  for (const viewport of viewports) {
    await page.setViewportSize(viewport)
    await page.goto('./')
    const sizes = await page.evaluate(() => ({ scroll: document.documentElement.scrollWidth, client: document.documentElement.clientWidth }))
    expect(sizes.scroll, `overflow at ${viewport.width}x${viewport.height}`).toBeLessThanOrEqual(sizes.client)
    await expect(page.getByRole('button', { name: 'Открыть' }).first()).toBeVisible()
  }
})

test('direct links, keyboard navigation and final screen work', async ({ page }) => {
  await page.goto(`./?topic=${topics[0].id}&slide=1`)
  await expect(page.locator('.slide-counter')).toHaveText(`1 / ${deckLength}`)
  await expect(page.getByRole('button', { name: 'Назад' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Вперёд' })).toBeVisible()
  await expect(page.locator('.progress-track')).toHaveAttribute('aria-label', `Прогресс ${Math.round(100 / deckLength)}%`)
  await expect(page.locator('.active-slide')).not.toContainText(/ч лекций|ч лабораторных работ|Лабораторные №|компетенции:/i)
  await page.keyboard.press('ArrowRight')
  await expect(page.locator('.slide-counter')).toHaveText(`2 / ${deckLength}`)
  await page.goto(`./?topic=${topics[0].id}&slide=${deckLength}`)
  await expect(page.getByRole('heading', { name: 'Что осталось непонятным после проверки памяти' })).toBeVisible()
  await expect(page.locator('.mascot-mask')).toHaveCount(0)
})

test('every approved topic opens directly with the complete deck', async ({ page }) => {
  for (const topic of topics) {
    await page.goto(`./?topic=${topic.id}&slide=1`)
    await expect(page.locator('.slide-counter'), topic.id).toHaveText(`1 / ${buildDeck(topic, course).length}`)
    await expect(page.getByRole('heading', { name: topic.displayTitle })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Сохранить в PDF' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Печать для студента' })).toHaveCount(0)
  }
})

test('long topic titles fit the title slide without an inner scrollbar', async ({ page }) => {
  await page.setViewportSize({ width: 1366, height: 768 })
  for (const topic of topics) {
    await page.goto(`./?topic=${topic.id}&slide=1`)
    const titleCopy = page.locator('.active-slide .kind-title .slide-copy')
    const sizes = await titleCopy.evaluate((element) => ({ scrollHeight: element.scrollHeight, clientHeight: element.clientHeight }))
    expect(sizes.scrollHeight, topic.displayTitle).toBeLessThanOrEqual(sizes.clientHeight + 1)
  }
})

test('fullscreen hides only the top toolbar and keeps the slide visible', async ({ page }) => {
  await page.goto(`./?topic=${topics[0].id}&slide=42`)
  await page.evaluate(() => document.documentElement.requestFullscreen())
  await expect(page.locator('.deck-toolbar')).toBeHidden()
  await expect(page.locator('.active-slide .slide-frame')).toBeVisible()
  await expect(page.locator('.deck-controls')).toBeVisible()
  const slideBox = await page.locator('.active-slide .slide-frame').boundingBox()
  const stageBox = await page.locator('.player-stage').boundingBox()
  const controlsBox = await page.locator('.deck-controls').boundingBox()
  expect(slideBox?.width).toBeGreaterThan(600)
  expect(slideBox?.height).toBeGreaterThan(300)
  expect(stageBox?.height).toBeGreaterThan(300)
  expect(controlsBox?.height).toBeLessThan(100)
  await page.evaluate(() => document.exitFullscreen())
})

test('question section dividers use the light wide-heading layout', async ({ page }) => {
  await page.setViewportSize({ width: 1366, height: 768 })
  await page.goto(`./?topic=${topics[0].id}&slide=13`)
  const divider = page.locator('.active-slide .kind-divider')
  await expect(divider).toBeVisible()
  const style = await divider.evaluate((element) => {
    const frame = element.getBoundingClientRect()
    const copy = element.querySelector<HTMLElement>('.slide-copy')!
    const heading = element.querySelector<HTMLElement>('h2')!
    return {
      background: getComputedStyle(element).backgroundColor,
      color: getComputedStyle(element).color,
      copyRatio: copy.getBoundingClientRect().width / frame.width,
      headingSize: Number.parseFloat(getComputedStyle(heading).fontSize),
    }
  })
  expect(style.background).toBe('rgb(255, 255, 255)')
  expect(style.color).toBe('rgb(28, 28, 28)')
  expect(style.copyRatio).toBeGreaterThan(0.7)
  expect(style.headingSize).toBeLessThanOrEqual(52)
})

test('tests follow each question and vary the correct option position', async ({ page }) => {
  const testSlides = buildDeck(topics[0], course).filter((slide) => slide.test)
  expect(testSlides).toHaveLength(32)
  expect(new Set(testSlides.filter((slide) => slide.test?.mode === 'single').map((slide) => slide.test!.correctIndexes![0]))).toEqual(new Set([0, 1, 2, 3]))

  await page.goto(`./?topic=${topics[0].id}&slide=20`)
  await expect(page.locator('.option-letter')).toHaveText(['А', 'Б', 'В', 'Г'])
  await page.goto(`./?topic=${topics[0].id}&slide=21`)
  await expect(page.locator('.word-answer input')).toBeVisible()
  await page.goto(`./?topic=${topics[0].id}&slide=22`)
  await expect(page.locator('.matching-task select')).toHaveCount(3)
})

test('self-check counts errors and identifies the incorrect answer', async ({ page }) => {
  const testSlide = buildDeck(topics[0], course).find((slide) => slide.test?.mode === 'single')!
  const correctIndex = testSlide.test!.correctIndexes![0]
  const wrongIndex = (correctIndex + 1) % testSlide.test!.options!.length
  await page.goto(`./?topic=${topics[0].id}&slide=${testSlide.number}`)
  await page.locator('.test-options label').nth(wrongIndex).click()
  await expect(page.locator('.answer-feedback')).toContainText('Есть ошибка')
  await page.getByRole('button', { name: 'Открыть результаты' }).click()
  const dialog = page.getByRole('dialog', { name: 'Результат' })
  await expect(dialog.locator('.score-card.correct strong')).toHaveText('0')
  await expect(dialog.locator('.score-card.incorrect strong')).toHaveText('1')
  await expect(dialog.locator('.score-card.unanswered strong')).toHaveText('31')
  await expect(dialog.locator('.result-item.incorrect')).toHaveCount(1)
  await expect(dialog.locator('.result-item.incorrect')).toContainText('Ваш ответ:')
  await expect(dialog.locator('.result-item.incorrect')).toContainText('Правильный ответ:')
})

test('invalid topic and slide recover without runtime crash', async ({ page }) => {
  await page.goto('./?topic=does-not-exist&slide=900')
  await expect(page.getByRole('status')).toContainText('не найдена')
  await expect(page.locator('.topic-card')).toHaveCount(topics.length)
})

test('materials QR and printable route are complete', async ({ page }) => {
  await page.goto(`./?topic=${topics[0].id}&slide=5`)
  await expect(page.getByRole('heading', { name: 'Презентации, задания и исходные файлы' })).toBeVisible()
  await expect(page.getByText('Отсканируйте QR-код или откройте ссылку на общую папку курса.')).toBeVisible()
  await expect(page.getByText('Отсканируйте меня')).toBeVisible()
  await expect(page.getByText('Ссылка на материалы')).toBeVisible()
  await expect(page.getByAltText('QR-код: материалы МДК.04.02')).toHaveJSProperty('complete', true)
  await expect(page.getByRole('link', { name: course.materialsUrl })).toHaveAttribute('href', course.materialsUrl)

  await page.goto(`./?topic=${topics[0].id}&slide=3`)
  await expect(page.getByAltText('QR-код: Архитектура вычислительных систем и компьютерных сетей')).toHaveJSProperty('complete', true)
  await expect(page.getByAltText('QR-код: Управление качеством')).toHaveJSProperty('complete', true)

  await page.goto(`./?topic=${topics[0].id}&slide=4`)
  await expect(page.getByAltText('QR-код: Управление ИТ-проектами. Ч.I')).toHaveJSProperty('complete', true)
  await expect(page.getByAltText('QR-код: Информационная безопасность. Ч.1')).toHaveJSProperty('complete', true)

  await page.goto(`./print?topic=${topics[0].id}&variant=teacher`)
  await page.waitForFunction(() => document.body.dataset.printReady === 'true')
  await expect(page.locator('.print-page')).toHaveCount(deckLength)
  await expect(page.locator('.print-page').nth(deckLength - 1).getByRole('heading', { name: 'Что осталось непонятным после проверки памяти' })).toBeVisible()
})

test('semester PDF route combines all lectures from the selected semester', async ({ page }) => {
  const semester = 8
  const semesterTopics = topics.filter((topic) => topic.semester === semester)
  await page.goto(`./print?scope=semester-${semester}&variant=student`)
  await page.waitForFunction(() => document.body.dataset.printReady === 'true')
  const expectedPages = semesterTopics.reduce((total, topic) => total + buildDeck(topic, course).length, 0)
  await expect(page.locator('.print-page')).toHaveCount(expectedPages)
})

test('all printable slides fit without hidden or clipped content', async ({ page }) => {
  await page.setViewportSize({ width: 1600, height: 900 })
  for (const topic of topics) {
    await page.goto(`./print?topic=${topic.id}&variant=teacher`)
    await page.waitForFunction(() => document.body.dataset.printReady === 'true')
    const defects = await page.locator('.print-page').evaluateAll((pages) => pages.flatMap((item, pageIndex) => {
      const selectors = ['.slide-copy', '.slide-visual', '.study-blocks', '.test-task', '.code-block', '.literature-layout']
      return selectors.flatMap((selector) => Array.from(item.querySelectorAll<HTMLElement>(selector)).flatMap((element) => {
        const style = getComputedStyle(element)
        const clipsVertically = !['visible', 'unset'].includes(style.overflowY)
        const clipsHorizontally = !['visible', 'unset'].includes(style.overflowX)
        const clipped = (clipsVertically && element.scrollHeight > element.clientHeight + 2) || (clipsHorizontally && element.scrollWidth > element.clientWidth + 2)
        return clipped ? [`${pageIndex + 1}:${selector}:${element.scrollWidth}x${element.scrollHeight}/${element.clientWidth}x${element.clientHeight}`] : []
      }))
    }))
    expect(defects, topic.id).toEqual([])
    await expect(page.locator('.source-links')).toHaveCount(0)
    const undersizedText = await page.locator('.print-page').evaluateAll((pages) => pages.flatMap((item, pageIndex) => {
      const selectors = ['.slide-body-copy', '.slide-copy > ul:not(.bibliography-list)', '.study-block h3', '.study-block p', '.slide-transition', '.bar-row', '.table-visual table', '.topic-path li strong']
      return selectors.flatMap((selector) => Array.from(item.querySelectorAll<HTMLElement>(selector)).flatMap((element) => {
        const fontSize = Number.parseFloat(getComputedStyle(element).fontSize)
        return fontSize < 15 ? [`${pageIndex + 1}:${selector}:${fontSize}px`] : []
      }))
    }))
    expect(undersizedText, topic.id).toEqual([])
  }
})
