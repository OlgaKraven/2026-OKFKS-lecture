import { createRoot } from 'react-dom/client'
import { LectureSite, validateCourse } from '@olgakraven/lecture-engine'
import '@olgakraven/lecture-engine/style.css'

fetch(`${import.meta.env.BASE_URL}course.json`).then(response => {
  if (!response.ok) throw new Error('Не удалось загрузить курс')
  return response.json()
}).then(course => {
  validateCourse(course)
  // Migrate only the known profile fields, and do not overwrite newer settings.
  try {
    const key = `lecture:${import.meta.env.BASE_URL}:${course.id}:profile`
    const legacy = JSON.parse(localStorage.getItem('okfks.teacherProfile') || 'null')
    if (!localStorage.getItem(key) && legacy && typeof legacy.fullName === 'string') {
      localStorage.setItem(key, JSON.stringify({ fullName: legacy.fullName, position: typeof legacy.position === 'string' ? legacy.position : '', department: typeof legacy.organizationUnit === 'string' ? legacy.organizationUnit : '' }))
    }
  } catch { /* A malformed or unavailable local profile must not prevent viewing. */ }
  // Preserve existing links to the original numbered deck.
  const url = new URL(location.href)
  const oldTopic = url.searchParams.get('topic')
  if (/\/print\/?$/.test(url.pathname)) {
    url.pathname = import.meta.env.BASE_URL
    url.search = new URLSearchParams({ mode: 'print', scope: oldTopic || (url.searchParams.get('semester') ? `semester-${url.searchParams.get('semester')}` : 'all') }).toString()
    history.replaceState({}, '', url)
  }
  else if (oldTopic) {
    const lecture = course.lectures.find(item => item.id === oldTopic)
    const legacyNumber = Number(url.searchParams.get('slide') || 1)
    const id = `${oldTopic}-s${String(legacyNumber).padStart(3, '0')}`
    url.searchParams.delete('topic')
    url.searchParams.set('lecture', oldTopic)
    if (lecture) url.searchParams.set('slide', lecture.slides.find(item => item.id === id)?.id || lecture.slides[0].id)
    history.replaceState({}, '', url)
  }
  document.title = `${course.code} · ${course.discipline}`
  createRoot(document.getElementById('root')!).render(<LectureSite course={course} base={import.meta.env.BASE_URL} />)
}).catch(error => { document.getElementById('root')!.textContent = String(error) })
