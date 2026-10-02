import fs from 'node:fs/promises'
export async function addWorkshops(course, pack) {
  pack.previousNoteHashes=JSON.parse(await fs.readFile(new URL('./note-revisions.json',import.meta.url),'utf8'))
  const workshops=JSON.parse(await fs.readFile(new URL('./workshops.json',import.meta.url),'utf8'))
  const stages=['map','experiment','game'], labels=['Интерактив: схема','Интерактив: эксперимент','Интерактив: разбор']
  for(const lab of workshops) {
    const lecture=course.lectures.find(l=>l.id===lab.lecture)
    if(!lecture)throw Error(`Нет темы ${lab.lecture}`)
    const entries=[['001','map','Интерактивное дополнение'],...lab.slides.map((n,i)=>[n,stages[i],labels[i]])]
    for(const [number,activity,label] of entries) {
      const slide=lecture.slides.find(s=>s.id.endsWith(`-s${number}`))
      if(!slide || slide.supplement)throw Error(`Нет свободного входа ${lab.lecture}: ${number}`)
      slide.supplement={label,href:`?${new URLSearchParams({mode:'lab',workshop:lab.id,activity,originSlide:slide.id})}`}
      const note=pack.notes[slide.id]
      note.preparation+=`\nИнтерактивное дополнение «${lab.title}» (${lab.teacher.time}), по выбору преподавателя. Вход — в шапке слайда, новая вкладка. Показывайте в одном окне; отдельное окно аудитории не синхронизируется. Используйте вместо части устного разбора, а не сверх времени занятия.`
      note.script+=`\n\nМастерская «${lab.title}», этап ${stages.indexOf(activity)+1}: ${lab.teacher.sequence}`
      note.questions+=`\n\nВопрос мастерской: ${lab.teacher.question}`
      note.answer+=`\n\nОриентир мастерской: ${lab.teacher.answer}`
    }
  }
}
