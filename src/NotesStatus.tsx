import type { Course } from '@olgakraven/lecture-engine'
import './notes-status.css'
import { exportPreviousResults } from './compatibility'

export function NotesStatus({ course, error, previousVersion, archiveAvailable, compatibilityError }: { course: Course, error: string, previousVersion: string, archiveAvailable: boolean, compatibilityError: string }) {
  if (!error && !archiveAvailable && !compatibilityError) return null
  return <aside className={`notes-status ${error ? 'notes-status-error' : ''}`} aria-label="Заметки преподавателя">
    {compatibilityError && <span role="status">{compatibilityError}</span>}
    {archiveAvailable && <button type="button" onClick={() => {
      try {
        const url = URL.createObjectURL(new Blob([JSON.stringify(exportPreviousResults(course, import.meta.env.BASE_URL, previousVersion, localStorage), null, 2)], { type:'application/json' }))
        const link = document.createElement('a')
        link.href = url; link.download = 'okfks-previous-results.json'; link.click()
        setTimeout(() => URL.revokeObjectURL(url), 1000)
      }
      catch { alert('Не удалось прочитать прежние результаты. Данные не удалены.') }
    }}>Сохранить прежние результаты</button>}
    {error && <div>
      <strong>Заметки не загрузились</strong>
      <span>{error}</span>
    </div>}
    {error && <button type="button" onClick={() => location.reload()}>Повторить загрузку</button>}
  </aside>
}
