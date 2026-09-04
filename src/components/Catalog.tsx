import { BookOpen, ExternalLink, FileDown, Moon, Search, Sun, UserRoundPen } from 'lucide-react'
import { useMemo, useRef, useState } from 'react'
import type { CourseConfig, LectureTopic, TeacherProfile } from '../types'

type Props = {
  course: CourseConfig
  topics: LectureTopic[]
  profile: TeacherProfile
  theme: 'light' | 'dark'
  onThemeChange: (theme: 'light' | 'dark') => void
  onOpenTopic: (topic: LectureTopic) => void
  onEditProfile: (returnFocus: HTMLElement | null) => void
  warning?: string
}
export function Catalog({ course, topics, profile, theme, onThemeChange, onOpenTopic, onEditProfile, warning }: Props) {
  const [search, setSearch] = useState('')
  const [semester, setSemester] = useState<number | 'all'>('all')
  const profileButtonRef = useRef<HTMLButtonElement>(null)
  const setupProfileButtonRef = useRef<HTMLButtonElement>(null)
  const filtered = useMemo(() => {
    const query = search.trim().toLocaleLowerCase('ru-RU')
    return topics.filter((topic) => {
      const semesterMatch = semester === 'all' || topic.semester === semester
      const textMatch = !query || `${topic.displayTitle} ${topic.sourceTitle}`.toLocaleLowerCase('ru-RU').includes(query)
      return semesterMatch && textMatch
    })
  }, [search, semester, topics])

  const asset = (path: string) => `${import.meta.env.BASE_URL}${path}`
  const printCollectionUrl = (scope: number | 'all') => {
    const url = new URL(`${import.meta.env.BASE_URL}print`, window.location.origin)
    url.searchParams.set('scope', scope === 'all' ? 'all' : `semester-${scope}`)
    url.searchParams.set('variant', 'student')
    url.searchParams.set('save', '1')
    return url.toString()
  }

  return (
    <main className="catalog">
      <header className="catalog-header">
        <a className="brand-lockup" href={import.meta.env.BASE_URL} aria-label="Каталог курса">
          <img src={asset('brand/synergy-logo.png')} alt="Фирменный знак" />
          <span><strong>МДК.04.02</strong><small>Обеспечение качества функционирования компьютерных систем</small></span>
        </a>
        <nav aria-label="Действия каталога">
          <button className="button ghost" type="button" ref={profileButtonRef} onClick={() => onEditProfile(profileButtonRef.current)}>
            <UserRoundPen size={18} /> Данные преподавателя
          </button>
          <button className="icon-button" type="button" onClick={() => onThemeChange(theme === 'light' ? 'dark' : 'light')} aria-label={theme === 'light' ? 'Включить тёмную тему' : 'Включить светлую тему'}>
            {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
          </button>
        </nav>
      </header>

      {warning && <div className="notice" role="status">{warning}</div>}

      <section className="catalog-hero">
        <div className="hero-copy">
          <p className="eyebrow">{course.semesters.length === 1 ? `${course.semesters[0]}-й семестр` : '7-й и 8-й семестры'}</p>
          <h1>Качество, надёжность <span>и защита систем</span></h1>
          <p className="hero-lead">От наблюдаемого события и измеримого показателя — к обоснованной мере и проверяемому заключению.</p>
          <div className="teacher-summary">
            <span>Преподаватель</span>
            <strong>{profile.fullName || 'Данные можно заполнить перед занятием'}</strong>
            {profile.position && <small>{profile.position}</small>}
            {profile.organizationUnit && <small>{profile.organizationUnit}</small>}
          </div>
        </div>
        <div className="hero-mascot">
          <div className="chevron-backdrop" />
          <img src={asset('brand/mascot/okfks-rhino-catalog.png')} alt="Носорог — инженер по качеству и защите компьютерных систем" />
        </div>
      </section>

      <section className="setup-panel" aria-labelledby="setup-title">
        <div className="setup-copy">
          <p className="eyebrow">Настройка перед занятием</p>
          <h2 id="setup-title">Подготовьте титульный лист и лекции</h2>
          <p>Введи свои данные для титульного листа. Лекции можно сохранить отдельно по семестрам или одним PDF.</p>
        </div>
        <button className="button secondary" type="button" ref={setupProfileButtonRef} onClick={() => onEditProfile(setupProfileButtonRef.current)}>
          <UserRoundPen size={18} /> Данные преподавателя
        </button>
        <div className="lecture-downloads" role="group" aria-label="Скачать лекции в PDF">
          <strong>Скачать лекции</strong>
          <div>
            {course.semesters.map((item) => (
              <a className="button ghost" key={item} href={printCollectionUrl(item)} target="_blank" rel="noreferrer"><FileDown size={17} /> {item} семестр</a>
            ))}
            <a className="button primary" href={printCollectionUrl('all')} target="_blank" rel="noreferrer"><FileDown size={17} /> Все лекции</a>
          </div>
          <small>В открывшемся окне выберите «Сохранить как PDF».</small>
        </div>
      </section>

      <section className="catalog-tools" aria-label="Поиск и фильтры">
        <label className="search-field">
          <Search size={19} aria-hidden="true" />
          <span className="sr-only">Поиск по темам</span>
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Поиск по темам" />
        </label>
        <div className="semester-filter" aria-label="Фильтр по семестру">
          <button type="button" className={semester === 'all' ? 'active' : ''} onClick={() => setSemester('all')}>Все темы</button>
          {course.semesters.map((item) => (
            <button key={item} type="button" className={semester === item ? 'active' : ''} onClick={() => setSemester(item)}>{item} семестр</button>
          ))}
        </div>
        <a className="materials-link" href={course.materialsUrl} target="_blank" rel="noreferrer"><BookOpen size={18} /> Материалы <ExternalLink size={15} /></a>
      </section>

      <section className="topic-grid" aria-label="Лекционные темы">
        {filtered.map((topic) => (
          <article className={`topic-card semester-${topic.semester}`} key={topic.id}>
            <div className="topic-card-top">
              <span className="topic-index">{String(topics.indexOf(topic) + 1).padStart(2, '0')}</span>
              <span className="semester-tag">{topic.semester} семестр</span>
            </div>
            <h2>{topic.displayTitle}</h2>
            <p>{topic.sourceTitle}</p>
            <div className="topic-card-footer">
              <span>{topic.lectureHours} ч · {topic.competencies.join(' · ')}</span>
              <button className="button primary" type="button" onClick={() => onOpenTopic(topic)}>Открыть</button>
            </div>
          </article>
        ))}
      </section>

      {filtered.length === 0 && <section className="empty-state" role="status"><h2>Темы не найдены</h2><p>Измените запрос или выберите другой семестр.</p></section>}

      <footer className="catalog-footer">
        <span>{course.learningPlatform}</span>
        <span>{course.totals.totalHours} ч · {course.totals.finalAssessment}</span>
      </footer>
    </main>
  )
}
