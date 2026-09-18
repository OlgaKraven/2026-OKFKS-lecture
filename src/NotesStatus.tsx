import type { Course } from '@olgakraven/lecture-engine'
import './notes-status.css'

export function NotesStatus({ course, error }: { course: Course, error: string }) {
  const open = () => {
    const url = new URL(location.href)
    const lectureId = url.searchParams.get('lecture') || url.searchParams.get('topic')
    const lecture = course.lectures.find(item => item.id === lectureId) || course.lectures[0]
    const current = url.searchParams.get('slide')
    const slide = lecture.slides.find(item => item.id === current) || lecture.slides[0]
    url.search = new URLSearchParams({ mode: 'presenter', lecture: lecture.id, slide: slide.id, session: crypto.randomUUID() }).toString()
    location.assign(url.href)
  }
  return <aside className={`notes-status ${error ? 'notes-status-error' : ''}`} aria-label="Заметки преподавателя">
    <div>
      <strong>{error ? 'Заметки не загрузились' : 'Заметки преподавателя загружены'}</strong>
      <span>{error || 'Сценарии, вопросы и ответы доступны в панели преподавателя для всех 784 слайдов.'}</span>
    </div>
    {error
      ? <button type="button" onClick={() => location.reload()}>Повторить загрузку</button>
      : <button type="button" onClick={open}>Открыть заметки</button>}
  </aside>
}
