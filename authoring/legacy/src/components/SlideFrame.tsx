import { ExternalLink } from 'lucide-react'
import type { ChangeEvent } from 'react'
import type { CourseConfig, LectureTopic, Slide, TeacherProfile, TestAnswers } from '../types'
import { evaluateTest } from '../lib/testScoring'
import { SlideInfographic } from './SlideInfographic'

type Props = {
  slide: Slide
  course: CourseConfig
  topic: LectureTopic
  profile: TeacherProfile
  answers?: TestAnswers
  onAnswer?: (testId: string, value: TestAnswers[string]) => void
  printVariant?: 'student' | 'teacher'
  compact?: boolean
}

const profileLines = (profile: TeacherProfile) =>
  [profile.fullName, profile.position, profile.organizationUnit].filter(Boolean)

export function SlideFrame({ slide, course, topic, profile, answers = {}, onAnswer, printVariant, compact = false }: Props) {
  const asset = (path: string) => `${import.meta.env.BASE_URL}${path}`
  const isPrint = Boolean(printVariant)
  const showTeacherNotes = printVariant === 'teacher'
  const testAnswer = slide.test ? answers[slide.test.id] : undefined
  const testResult = slide.test ? evaluateTest(slide.test, testAnswer) : undefined
  const showProfile = ['title', 'divider', 'questions'].includes(slide.kind)
  const isMaterialsSlide = slide.links?.some((link) => link.url === course.materialsUrl) && !slide.qrCodes
  const isBibliography = slide.kicker === 'Литература'
  const showMascot = slide.kind === 'title'
  const longTitle = slide.kind === 'title' && slide.title.length > 34

  const changeChoice = (event: ChangeEvent<HTMLInputElement>, index: number, multiple: boolean) => {
    if (!slide.test || !onAnswer) return
    if (!multiple) {
      onAnswer(slide.test.id, [index])
      return
    }
    const current = Array.isArray(testAnswer) && testAnswer.every((item) => typeof item === 'number') ? testAnswer : []
    onAnswer(slide.test.id, event.target.checked ? [...new Set([...current, index])] : current.filter((item) => item !== index))
  }

  return (
    <article
      className={`slide-frame kind-${slide.kind} layout-${slide.layout || 'standard'} ${compact ? 'compact' : ''} ${longTitle ? 'long-title' : ''} ${slide.visual ? 'has-visual' : ''} ${slide.studyBlocks ? 'has-study-blocks' : ''} ${showMascot ? 'has-mascot' : ''}`}
      aria-label={`Экран ${slide.number}: ${slide.title}`}
      data-source-ids={slide.sourceIds.join(',')}
    >
      <img className="side-ornament" src={asset('brand/side-ornament.png')} alt="" aria-hidden="true" />
      <header className="slide-header">
        <div className="slide-brand">
          <img src={asset('brand/synergy-logo.png')} alt="" aria-hidden="true" />
          <span>МДК.04.02 · {topic.semester}-й семестр</span>
        </div>
        <span className="slide-number">{String(slide.number).padStart(2, '0')}</span>
      </header>

      <div className="slide-content">
        <div className="slide-copy">
          <p className="slide-kicker">{slide.kicker}</p>
          <h2>{slide.title}</h2>
          {slide.body && <p className="slide-body-copy">{slide.body}</p>}
          {slide.studyBlocks && (
            <div className="study-blocks" aria-label="Опорный конспект">
              {slide.studyBlocks.map((block, index) => (
                <section className="study-block" key={`${slide.number}-${block.label}-${index}`}>
                  <h3>{block.label}</h3>
                  <p>{block.text}</p>
                </section>
              ))}
            </div>
          )}
          {slide.note && <aside className="write-note"><span>{slide.noteLabel || 'Запишите'}</span><strong>{slide.note}</strong></aside>}
          {slide.transition && <p className="slide-transition">{slide.transition}</p>}

          {isMaterialsSlide && (
            <div className="materials-panel">
              <a className="materials-qr-card" href={course.materialsUrl} target="_blank" rel="noreferrer">
                <img src={asset('qr/okfks-materials.png')} alt="QR-код: материалы МДК.04.02" />
                <strong>Отсканируйте меня</strong>
              </a>
              <div className="materials-link-card">
                <span>Ссылка на материалы</span>
                <a href={course.materialsUrl} target="_blank" rel="noreferrer">{course.materialsUrl} <ExternalLink size={16} /></a>
              </div>
            </div>
          )}

          {slide.qrCodes && slide.bullets && (
            <div className="literature-layout">
              <ul className="bibliography-list">
                {slide.bullets.map((bullet, index) => <li key={`${slide.number}-${index}`}>{bullet}</li>)}
              </ul>
              <div className="literature-qr-grid" aria-label={`QR-коды: ${slide.title}`}>
                {slide.qrCodes.map((item) => (
                  <a className="literature-qr-card" key={item.url} href={item.url} target="_blank" rel="noreferrer">
                    <img src={asset(item.assetPath)} alt={`QR-код: ${item.label}`} />
                    <span><strong>{item.label}</strong><small>Открыть источник <ExternalLink size={12} /></small></span>
                  </a>
                ))}
              </div>
            </div>
          )}

          {slide.bullets && !slide.qrCodes && (
            <ul className={isBibliography ? 'bibliography-list' : ''}>
              {slide.bullets.map((bullet, index) => <li key={`${slide.number}-${index}`}>{bullet}</li>)}
            </ul>
          )}

          {slide.visual && <SlideInfographic visual={slide.visual} />}

          {slide.code && (
            <div className="code-block">
              <span>{slide.codeLabel || 'Пример'}</span>
              <pre><code>{slide.code}</code></pre>
            </div>
          )}

          {slide.links && !isMaterialsSlide && !slide.qrCodes && (
            <div className="slide-links">
              {slide.links.map((link) => <a key={link.url} href={link.url} target="_blank" rel="noreferrer">{link.label} <ExternalLink size={14} /></a>)}
            </div>
          )}

          {slide.test && (
            <section className="test-task" aria-labelledby={`test-${slide.test.id}`}>
              <h3 id={`test-${slide.test.id}`}>{slide.test.prompt}</h3>
              {slide.test.options && !['order', 'matching'].includes(slide.test.mode) && (
                <div className="test-options">
                  {slide.test.options.map((option, index) => {
                    const multiple = slide.test?.mode === 'multiple'
                    const checked = Array.isArray(testAnswer) && testAnswer.some((item) => item === index)
                    return (
                      <label key={`${index}-${option}`}>
                        <input
                          type={multiple ? 'checkbox' : 'radio'}
                          name={slide.test?.id}
                          checked={checked}
                          disabled={isPrint}
                          onChange={(event) => changeChoice(event, index, multiple)}
                        />
                        <strong className="option-letter" aria-hidden="true">{String.fromCharCode(1040 + index)}</strong>
                        <span>{option}</span>
                      </label>
                    )
                  })}
                </div>
              )}
              {slide.test.mode === 'order' && (
                <div className="order-task">
                  <ol>{slide.test.options?.map((option) => <li key={option}>{option.replace(/^\d+\.\s*/, '')}</li>)}</ol>
                  {!isPrint && <label>Твоя последовательность<input value={typeof testAnswer === 'string' ? testAnswer : ''} onChange={(event) => onAnswer?.(slide.test!.id, event.target.value)} placeholder="Например: 1 → 2 → 3 → 4" /></label>}
                </div>
              )}
              {slide.test.mode === 'short' && !isPrint && (
                <label className="short-answer">Твой ответ<textarea value={typeof testAnswer === 'string' ? testAnswer : ''} onChange={(event) => onAnswer?.(slide.test!.id, event.target.value)} /></label>
              )}
              {slide.test.mode === 'word' && !isPrint && (
                <label className="word-answer">Пропущенное слово<input value={typeof testAnswer === 'string' ? testAnswer : ''} onChange={(event) => onAnswer?.(slide.test!.id, event.target.value)} autoComplete="off" /></label>
              )}
              {slide.test.mode === 'matching' && slide.test.pairs && (
                <div className="matching-task">
                  {slide.test.pairs.map((pair, index) => {
                    const current = Array.isArray(testAnswer) && testAnswer.every((item) => typeof item === 'string') ? testAnswer : []
                    return (
                      <label key={`${index}-${pair.left}`}>
                        <span>{pair.left}</span>
                        <select
                          value={current[index] || ''}
                          disabled={isPrint}
                          onChange={(event) => {
                            const next = Array.from({ length: slide.test!.pairs!.length }, (_, pairIndex) => current[pairIndex] || '')
                            next[index] = event.target.value
                            onAnswer?.(slide.test!.id, next)
                          }}
                        >
                          <option value="">Выберите роль</option>
                          {slide.test!.options?.map((option) => <option key={option} value={option}>{option}</option>)}
                        </select>
                      </label>
                    )
                  })}
                </div>
              )}
              {!isPrint && testResult && testResult.status !== 'unanswered' && (
                <div className={`answer-feedback ${testResult.status}`} role="status">
                  <strong>{testResult.status === 'correct' ? 'Правильно' : 'Есть ошибка'}</strong>
                  {testResult.status === 'incorrect' && <p>Проверьте ответ и попробуйте ещё раз. Точное место ошибки показано в разделе «Результат».</p>}
                </div>
              )}
              <details className="test-hint" open={showTeacherNotes}>
                <summary>Подсказка</summary>
                <p>{slide.test.hint}</p>
              </details>
              {showTeacherNotes && (
                <div className="teacher-answer">
                  <strong>Правильный ответ</strong>
                  <p>{slide.test.correctAnswer}</p>
                  <strong>Пояснение</strong>
                  <p>{slide.test.explanation}</p>
                  <strong>Критерии проверки</strong>
                  <p>{slide.test.criteria}</p>
                </div>
              )}
            </section>
          )}
        </div>

        {slide.kind === 'divider' && <img className="divider-arrow" src={asset('brand/divider-arrow-light.png')} alt="" aria-hidden="true" />}
        {showMascot && (
          <div className="mascot-mask" aria-hidden="true">
            <img src={asset(isPrint ? 'brand/mascot/okfks-rhino-pdf.png' : 'brand/mascot/okfks-rhino.webp')} alt="" />
          </div>
        )}
      </div>

      <footer className="slide-footer">
        <div className="profile-lines">
          {showProfile && profileLines(profile).map((line) => <span key={line}>{line}</span>)}
        </div>
      </footer>
    </article>
  )
}
