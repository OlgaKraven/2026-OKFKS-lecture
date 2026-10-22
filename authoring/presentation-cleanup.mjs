// Exclude retired presentation blocks without renumbering surviving slides.
export function applyPresentationCleanup(course, pack, mapping = []) {
  const retired = new Set()
  for (const lecture of course.lectures) {
    const ids = [2,...Array.from({length:10},(_,i)=>101+i)].map(n=>`${lecture.id}-s${String(n).padStart(3,'0')}`)
    ids.forEach(id=>retired.add(id))
    lecture.slides = lecture.slides.filter(slide => !retired.has(slide.id))
    lecture.question = lecture.question?.replace(' · учебные материалы', '')
    for (const slide of lecture.slides) {
      if(slide.kind==='section'&&slide.body) slide.body=slide.body.replace(/^После вопроса «[^»]+» разберём следующий шаг:\s*/, '')
      if (slide.source) slide.source = slide.source.replace('Авторский учебный разбор · ', '').replace(' · учебные материалы', '')
    }
    if (pack?.notes) ids.forEach(id=>delete pack.notes[id])
  }
  for (const entry of mapping) {
    if (entry.slideIds?.some(id => retired.has(id))) {
      entry.slideIds = entry.slideIds.filter(id => !retired.has(id))
      entry.change = 'Удалён из презентации блок обзора, ЛР или синтеза по замечанию автора'
    }
  }
}
