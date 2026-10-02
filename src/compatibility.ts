import type { Course, Note } from '@olgakraven/lecture-engine'

type Manifest = {
  courseId: string
  previousVersion: string
  contentVersion: string
  unchangedTaskIds: string[]
  noteHashes: Record<string, Record<string, string>>
  noteSeconds: Record<string, number>
}
const fields = ['script', 'preparation', 'notebook', 'questions', 'answer'] as const
const object = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v)
const sha256 = async (value: string) => [...new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value)))].map(n => n.toString(16).padStart(2, '0')).join('')

// The old namespace remains intact. Only identical tasks and authored note
// edits migrate; an old baseline script must not mask a revised publication.
export async function migrateCompatibleSession(course: Course, base: string, raw: unknown, storage: Pick<Storage, 'getItem' | 'setItem'>) {
  const manifest = raw as Manifest
  if (!manifest || manifest.courseId !== course.id || manifest.contentVersion !== course.contentVersion
    || typeof manifest.previousVersion !== 'string' || manifest.previousVersion === course.contentVersion
    || !Array.isArray(manifest.unchangedTaskIds) || !object(manifest.noteHashes) || !object(manifest.noteSeconds)) throw new Error('Некорректная карта обновления')
  const prefix = `lecture:${base}:${course.id}`
  const read = (key: string) => { const value = storage.getItem(key); return value === null ? null : JSON.parse(value) as unknown }
  const taskIds = new Set(course.lectures.flatMap(l => l.slides.flatMap(s => s.task ? [s.task.id] : [])))
  const safe = new Set(manifest.unchangedTaskIds.filter(id => taskIds.has(id)))
  const oldAttemptKey = `${prefix}:${manifest.previousVersion}:attempts`
  const newAttemptKey = `${prefix}:${course.contentVersion}:attempts`
  const attempts = read(oldAttemptKey)
  const current = read(newAttemptKey)
  if (attempts !== null && !object(attempts) || current !== null && !object(current)) throw new Error('Повреждены сохранённые результаты')
  if (object(attempts)) {
    const imported = Object.fromEntries(Object.entries(attempts).filter(([id,v]) => safe.has(id) && object(v)
      && Number.isFinite(v.seed) && Number.isFinite(v.attempts)))
    const merged = { ...imported, ...current as Record<string, unknown> | null }
    if (Object.keys(merged).length) storage.setItem(newAttemptKey, JSON.stringify(merged))
  }
  for (const lecture of course.lectures) {
    const oldKey = `${prefix}:${manifest.previousVersion}:${lecture.id}:progress`
    const newKey = `${prefix}:${course.contentVersion}:${lecture.id}:progress`
    if (storage.getItem(newKey) !== null) continue
    const id = read(oldKey)
    if (typeof id === 'string' && lecture.slides.some(s => s.id === id)) storage.setItem(newKey, JSON.stringify(id))
  }
  const oldNotes = read(`${prefix}:private:${manifest.previousVersion}`)
  const newNotesKey = `${prefix}:private:${course.contentVersion}`
  const newNotes = read(newNotesKey)
  if (oldNotes !== null && !object(oldNotes) || newNotes !== null && !object(newNotes)) throw new Error('Повреждены личные заметки')
  if (object(oldNotes)) {
    const edits: Record<string, Note> = {}
    const ids = new Set(course.lectures.flatMap(l => l.slides.map(s => s.id)))
    for (const [id, note] of Object.entries(oldNotes)) {
      if (!ids.has(id) || !object(note) || !fields.every(f => typeof note[f] === 'string') || !Number.isFinite(note.estimatedSeconds) || (note.estimatedSeconds as number) < 0) continue
      const timeEdited = await sha256(String(note.estimatedSeconds)) !== manifest.noteHashes[id]?.estimatedSeconds
      const local: Note = { script:'', preparation:'', notebook:'', questions:'', answer:'', estimatedSeconds: timeEdited ? note.estimatedSeconds as number : manifest.noteSeconds[id] }
      let edited = timeEdited
      for (const field of fields) {
        const value = note[field] as string
        if (value.trim() && await sha256(value) !== manifest.noteHashes[id]?.[field]) { local[field] = value; edited = true }
      }
      if (edited) edits[id] = local
    }
    // Preserve current fields independently: partial new edits must not erase
    // other older authored fields during a repeated migration.
    const merged: Record<string, unknown> = { ...edits }
    if (object(newNotes)) for (const [id, note] of Object.entries(newNotes)) {
      if (object(note) && edits[id]) {
        const value: Record<string, unknown> = { ...edits[id], ...note }
        for (const field of fields) if (typeof note[field] === 'string' && !(note[field] as string).trim()) value[field] = edits[id][field]
        merged[id] = value
      } else merged[id] = note
    }
    if (Object.keys(merged).length) storage.setItem(newNotesKey, JSON.stringify(merged))
  }
  return { previousVersion: manifest.previousVersion, archiveAvailable: object(attempts) && Object.keys(attempts).length > 0 }
}

export function exportPreviousResults(course: Course, base: string, previousVersion: string, storage: Pick<Storage, 'getItem'>) {
  const raw = storage.getItem(`lecture:${base}:${course.id}:${previousVersion}:attempts`)
  return { courseId:course.id, contentVersion:previousVersion, notice:'Результаты прежней редакции; не оценка изменённых заданий.', attempts:raw ? JSON.parse(raw) : {} }
}
