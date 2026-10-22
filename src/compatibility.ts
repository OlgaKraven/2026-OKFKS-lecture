import type { Course, Note } from '@olgakraven/lecture-engine'

type Manifest = {
  courseId: string
  previousVersion: string
  contentVersion: string
  unchangedTaskIds: string[]
  noteHashes: Record<string, Record<string, string>>
  noteSeconds: Record<string, number>
  previousManifests?: Manifest[]
}
const fields = ['script', 'preparation', 'notebook', 'questions', 'answer'] as const
const object = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v)
const sha256 = async (value: string) => [...new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value)))].map(n => n.toString(16).padStart(2, '0')).join('')

// The author removed the closing study checklist. Old links and reading
// positions now lead to the surviving final questions in the same lecture.
export function resolveCourseSlideId(course: Course, lectureId: string, slideId: string) {
  const lecture = course.lectures.find(item => item.id === lectureId)
  if (lecture && slideId === `${lectureId}-s111` && !lecture.slides.some(slide => slide.id === slideId)) {
    return lecture.slides.find(slide => slide.id === `${lectureId}-s112`)?.id || slideId
  }
  return slideId
}

// The old namespace remains intact. Only identical tasks and authored note
// edits migrate; an old baseline script must not mask a revised publication.
export async function migrateCompatibleSession(course: Course, base: string, raw: unknown, storage: Pick<Storage, 'getItem' | 'setItem'>) {
  const validate = (value: unknown, target: string, ancestors = new Set<string>()): Manifest => {
    if (!object(value) || value.courseId !== course.id || value.contentVersion !== target
      || typeof value.previousVersion !== 'string' || !value.previousVersion || value.previousVersion === target || ancestors.has(value.previousVersion)
      || !Array.isArray(value.unchangedTaskIds) || !value.unchangedTaskIds.every(id => typeof id === 'string')
      || !object(value.noteHashes) || !object(value.noteSeconds)
      || value.previousManifests !== undefined && !Array.isArray(value.previousManifests)) throw new Error('Некорректная карта обновления')
    const manifest = value as Manifest
    for (const previous of manifest.previousManifests || []) validate(previous, manifest.previousVersion, new Set([...ancestors, target]))
    return manifest
  }
  // Validate the whole chain before writing any migration step.
  const manifest = validate(raw, course.contentVersion)
  const prefix = `lecture:${base}:${course.id}`
  const read = (key: string) => { const value = storage.getItem(key); return value === null ? null : JSON.parse(value) as unknown }
  const taskIds = new Set(course.lectures.flatMap(l => l.slides.flatMap(s => s.task ? [s.task.id] : [])))
  const ids = new Set(course.lectures.flatMap(l => l.slides.map(s => s.id)))
  const migrate = async (manifest: Manifest, historical = false): Promise<string[]> => {
    const previousArchives: string[] = []
    for (const previous of manifest.previousManifests || []) previousArchives.push(...await migrate(previous, true))
    const safe = new Set(manifest.unchangedTaskIds.filter(id => taskIds.has(id)))
    const oldAttemptKey = `${prefix}:${manifest.previousVersion}:attempts`
    const newAttemptKey = `${prefix}:${manifest.contentVersion}:attempts`
    const attemptMigrationKey = `${prefix}:${manifest.contentVersion}:migrated-attempts:${manifest.previousVersion}`
    const attempts = read(oldAttemptKey)
    const current = read(newAttemptKey)
    if (attempts !== null && !object(attempts) || current !== null && !object(current)) throw new Error('Повреждены сохранённые результаты')
    // Resetting a task removes its entry. Do not resurrect it from an older
    // namespace on the next launch, even when the target map is now empty.
    if (storage.getItem(attemptMigrationKey) === null) {
      // Older releases had no marker. An existing intermediate map already
      // belongs to that release and may deliberately be empty after reset.
      if (object(attempts) && (!historical || current === null)) {
        const imported = Object.fromEntries(Object.entries(attempts).filter(([id,v]) => safe.has(id) && object(v)
          && Number.isFinite(v.seed) && Number.isFinite(v.attempts)))
        const merged = { ...imported, ...current as Record<string, unknown> | null }
        if (Object.keys(merged).length) storage.setItem(newAttemptKey, JSON.stringify(merged))
      }
      storage.setItem(attemptMigrationKey, '1')
    }
    for (const lecture of course.lectures) {
      const oldKey = `${prefix}:${manifest.previousVersion}:${lecture.id}:progress`
      const newKey = `${prefix}:${manifest.contentVersion}:${lecture.id}:progress`
      const currentId = read(newKey)
      const previousId = currentId === null ? read(oldKey) : currentId
      if (typeof previousId !== 'string') continue
      const id = resolveCourseSlideId(course, lecture.id, previousId)
      if ((currentId === null || id !== currentId) && lecture.slides.some(slide => slide.id === id)) storage.setItem(newKey, JSON.stringify(id))
    }
    const oldNotes = read(`${prefix}:private:${manifest.previousVersion}`)
    const newNotesKey = `${prefix}:private:${manifest.contentVersion}`
    const newNotes = read(newNotesKey)
    if (oldNotes !== null && !object(oldNotes) || newNotes !== null && !object(newNotes)) throw new Error('Повреждены личные заметки')
    if (object(oldNotes)) {
      const edits: Record<string, Note> = {}
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
    return [...new Set([...(object(attempts) && Object.keys(attempts).length ? [manifest.previousVersion] : []), ...previousArchives])]
  }
  const archiveVersions = await migrate(manifest)
  return { previousVersion: archiveVersions[0] || manifest.previousVersion, archiveAvailable: archiveVersions.length > 0, archiveVersions }
}

export function exportPreviousResults(course: Course, base: string, previousVersion: string, storage: Pick<Storage, 'getItem'>) {
  const raw = storage.getItem(`lecture:${base}:${course.id}:${previousVersion}:attempts`)
  return { courseId:course.id, contentVersion:previousVersion, notice:'Результаты прежней редакции; не оценка изменённых заданий.', attempts:raw ? JSON.parse(raw) : {} }
}
