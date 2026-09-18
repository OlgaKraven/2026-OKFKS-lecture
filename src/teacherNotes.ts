import type { Course, Note, TeacherPack } from '@olgakraven/lecture-engine'

export function prepareTeacherNotes(course: Course, base: string, value: unknown, storage: Pick<Storage, 'getItem'>) {
  const pack = value as TeacherPack
  if (!pack || pack.schemaVersion !== 1 || pack.courseId !== course.id || pack.contentVersion !== course.contentVersion || !pack.notes || typeof pack.notes !== 'object') {
    throw new Error('Заметки относятся к другому курсу или версии')
  }
  const ids = new Set(course.lectures.flatMap(lecture => lecture.slides.map(slide => slide.id)))
  const fields = ['script', 'preparation', 'notebook', 'questions', 'answer'] as const
  const validNote = (note: unknown): note is Note => !!note && typeof note === 'object'
    && fields.every(field => typeof (note as Note)[field] === 'string')
    && Number.isFinite((note as Note).estimatedSeconds) && (note as Note).estimatedSeconds >= 0
  if (Object.keys(pack.notes).length !== ids.size || Object.entries(pack.notes).some(([id, note]) => !ids.has(id) || !validNote(note))) {
    throw new Error('Неполный или повреждённый комплект заметок')
  }
  // Storage contract of the pinned lecture-engine version. Preserve local edits.
  const key = `lecture:${base}:${course.id}:private:${course.contentVersion}`
  let saved: Record<string, Note> = {}
  try {
    const raw = storage.getItem(key)
    if (raw) {
      const parsed: unknown = JSON.parse(raw)
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('Повреждены сохранённые заметки')
      saved = Object.fromEntries(Object.entries(parsed).filter(([id, note]) => ids.has(id) && validNote(note)).map(([id, note]) => {
        // Empty local sections must not hide the published script or other sections.
        const local = note as Note
        const merged = { ...pack.notes[id], estimatedSeconds: local.estimatedSeconds }
        for (const field of fields) if (local[field].trim()) merged[field] = local[field]
        return [id, merged]
      }))
    }
  } catch {
    // Storage may be unavailable or contain an old malformed record. Published
    // notes still render from memory; never destroy the user's saved data here.
  }
  return { ...pack.notes, ...saved }
}
