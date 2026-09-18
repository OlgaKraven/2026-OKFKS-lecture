import { teachingNotes } from './teaching-notes.mjs'

const diagnosticAnswers = [
  'Нет. Сообщение Error может описывать обработанную ситуацию. Отказ устанавливают по нарушению требуемой функции, а не по уровню журнала.',
  'Нет. Процент должен сопровождаться исходными интервалами, числом отказов, правилом учёта и периодом. Иначе невозможно проверить ни расчёт, ни его смысл.',
  'Нет. Копии могут зависеть от одного носителя и повторять один дефект; повтор операции увеличивает нагрузку и способен создать дубль. Мера должна соответствовать механизму отказа.',
  'Нет. Одновременность показывает связь наблюдений, но не направление причинности. Проверяют механизм, порядок событий и альтернативы: например, общую нагрузку или повреждённый входной файл.',
  'Нет. Уязвимость — слабость, угроза — возможность воздействия, инцидент — событие, оценённое как нарушение защиты. Эти понятия описывают разные уровни.',
  'Установка средства не подтверждает результат защиты. Проверяют состояние, эффективные правила, разрешённый и запрещённый сценарии и свидетельства каждого исхода.',
  'Нет. Шифрование решает задачу конфиденциальности в заданных условиях. Удаление данных, потеря ключа и доступ после расшифрования требуют отдельных мер.',
]

function figureText(slide) {
  const v = slide.visual
  if (v?.type === 'bars') return `На диаграмме: ${v.items.map(i => `${i.label} — ${i.value} ${v.unit}`).join('; ')}. ${v.caption} Сравните значения, затем назовите вывод, которого эти данные не позволяют сделать.`
  const table = slide.rows ? slide : v?.type === 'table' ? v : null
  if (table) return `Разберите строки таблицы: ${table.rows.map(row => row.map((value, i) => `${table.columns[i]} — ${value}`).join('; ')).join('. ')}. Попросите объяснить связь между столбцами на одной выбранной строке.`
  return ''
}

export function buildTeacherNote({ ti, topic, old, slide, key, contexts, groupPosition }) {
  const qi = (old.questionNumber || 1) - 1
  const q = topic.questions[qi]
  const [explain, setup, reasoning, result, error, discussion] = contexts[qi]
  const [transfer, expected] = teachingNotes[ti][qi]
  let script, questions = '', answer = '', preparation = '', notebook = ''
  if (old.questionNumber) {
    preparation = `Цель блока: ${q.check} Подготовьте условия примера: ${setup} Не подменяйте вывод утверждением «${q.pitfall}»`
    questions = transfer
    answer = expected
    if (slide.task) {
      const task = slide.task
      const solution = task.type === 'matching'
        ? task.items.map(i => `${i.text} → ${task.options.find(o => o.id === key.pairs[i.id]).text}`).join('\n')
        : task.type === 'short' ? key.accepted.join(' / ')
          : task.options.filter(o => key.correct.includes(o.id)).map(o => o.text).join('\n')
      script = `Дайте время на самостоятельный ответ: ${task.prompt}\n\nПосле выбора разберите основание: ${key.explanation}`
      if (task.type === 'single') script += `\n\nОбщее правило переносится между ситуациями; действие относится к конкретному решению, а критерий описывает результат. На нашем примере: ${reasoning}`
      if (task.type === 'multiple') script += `\n\nСвяжите два выбранных пункта: сначала «${q.decision}», затем проверяем «${q.check}». Объясните, почему описание ситуации и типичная ошибка не заменяют эту пару.`
      if (task.type === 'short') script += `\n\nВосстановление слова проверяет узнавание формулировки. Чтобы проверить понимание, задайте устный вопрос: ${transfer}`
      if (task.type === 'matching') script += `\n\nПример задаёт исходные условия; правило — способ рассуждения; решение — действие; проверка — признак результата. Попросите объяснить одну пару без чтения её названия.`
      answer = `Ключ задания:\n${solution}\n\nОбоснование:\n${key.explanation}\n${Object.values(key.optionExplanations || {}).join('\n')}\n\nУстный перенос:\n${expected}`
      notebook = `После проверки запишите исправленное рассуждение по вопросу «${q.title}», если была ошибка; буква варианта без причины не нужна.`
    } else if (old.kind === 'practice') {
      script = `Здесь переходим от разбора к самостоятельной работе. Опора текущего этапа — «${q.title}». ${q.decision}\n\nДля пробного выполнения используйте условия: ${setup} Не сообщайте готовый итог до попытки группы. При приёмке проверьте: ${q.check}\n\nЕсли результат неясен, верните обсуждение к конкретному риску: ${error}`
      answer = `Ориентир для учебного примера: ${reasoning} ${result}\n\nДля собственного стенда числа и исходы должны следовать из его данных. ${expected}`
      notebook = `Зафиксировать действие, свидетельство и результат проверки: ${q.check}`
    } else {
      const scripts = [
        `Начните с ситуации: ${setup}\n\nПредложите назвать первое необходимое наблюдение. Зафиксируйте предположения группы, пока не оценивая их. В этом блоке нужно прийти к проверяемому результату: ${q.check}`,
        `${explain}\n\nУстное пояснение на изменённом условии: ${transfer} ${expected}`,
        `Проведите группу по схеме от исходных условий к выводу. ${reasoning}\n\nИменно этот переход обосновывает правило: ${q.rule} Граница рассуждения: ${error}`,
        figureText(slide) || `Разберите исходные условия: ${setup}\n\nДо раскрытия результата предложите выполнить расчёт или назвать ожидаемый исход. Ход разбора: ${reasoning}\n\nИтог: ${result}`,
        `Теперь сформулируем решение: ${q.decision}\n\nНа наших данных оно приводит к следующему: ${result} Для приёмки нужен наблюдаемый критерий: ${q.check}\n\nПроверьте перенос решения: ${transfer} ${expected}`,
        `Предложите объяснить, почему ошибочный подход кажется правдоподобным: ${q.pitfall}\n\nРазберите его последствие: ${error} Верните группу к корректному действию: ${q.decision}\n\nКонтрпример для обсуждения: ${transfer} ${expected}`,
        `Попросите ответить без чтения конспекта: ${transfer}\n\nПосле паузы сопоставьте ответ с рассуждением: ${expected}\n\nЗакрепите границу применения: ${discussion}`,
      ]
      script = scripts[groupPosition]
      if (groupPosition === 0) { questions = `Какое наблюдение понадобится для решения? ${setup}`; answer = `${reasoning} ${result}` }
      if (groupPosition === 3) { questions = `Какой результат следует из условий? ${slide.visual || slide.rows ? 'Опирайтесь на значения и подписи на слайде.' : setup}`; answer = figureText(slide) || `${reasoning} ${result}` }
      notebook = slide.notebook ? `Краткая запись: ${slide.notebook}` : ''
    }
  } else {
    const diag = diagnosticAnswers[ti]
    preparation = `Тема: ${topic.displayTitle}. Итоговый материал: ${topic.projectArtifact}.`
    questions = topic.diagnostic
    answer = diag
    switch (old.number) {
      case 1: script = `Сегодня разбираем тему «${topic.displayTitle}». ${topic.caseBrief}\n\nК концу работы нужен конкретный результат: ${topic.projectArtifact}. Начнём с вопроса «${topic.diagnostic}»; окончательный ответ вернём к свидетельствам из примеров.`; break
      case 2: script = `Покажите место темы в дисциплине: ${topic.sourceContent.join('. ')}. Сквозная задача занятия — ${topic.projectArtifact}. Свяжите названные пункты программы с этой задачей; перечитывать весь список не требуется.`; break
      case 3: script = `Основные источники дают два ракурса: устройство вычислительных систем и постановку требований к качеству. Для темы «${topic.displayTitle}» используйте их, чтобы связать техническое поведение с критерием оценки. Точные страницы в исходных материалах не указаны; не выдавайте наши учебные числа за данные авторов учебника.`; break
      case 4: script = `Дополнительная литература помогает связать организацию ИТ-проекта с основами информационной безопасности. В текущей теме эта связь проявляется в результате «${topic.projectArtifact}». Версии продуктов и технические ограничения уточняются по официальной документации из SOURCES.md.`; break
      case 5: script = `Дайте открыть общую папку курса по ссылке или QR-коду. Перед занятием проверьте доступность нужных вам материалов: состав внешней папки здесь не подтверждён. Рабочий результат для этой темы — ${topic.projectArtifact}; заранее назовите студентам место его сохранения.`; break
      case 6: script = `${slide.body}\n\nПокажите, зачем это различие нужно для решения: ${contexts[0][1]} ${contexts[0][3]}`; break
      case 7: script = `Согласуйте с группой результат работы: ${topic.projectArtifact}. Пример содержательной приёмки: ${topic.questions[0].check} Оформление отчёта помогает проверке, но не заменяет данные и обоснование.`; notebook = topic.projectArtifact; break
      case 8: script = `${topic.caseBrief}\n\nПопросите разделить исходные сведения на известные и требующие проверки. Первый разобранный шаг: ${contexts[0][2]} Итог всей темы должен привести к результату «${topic.projectArtifact}».`; break
      case 9: script = `Обозначьте маршрут: ${topic.questions.map((x, i) => `${i + 1}) ${x.title}`).join('; ')}. Первые вопросы дают понятия и исходные данные, последние помогают проверить и ограничить вывод. Связь маршрута с задачей: ${topic.nextStep}.`; break
      case 10: script = `Разберите учебную запись или пример по строкам:\n${topic.codeSample}\n\nУточните, что здесь является исходным условием, а что результатом наблюдения. Числа и идентификаторы относятся к учебному примеру. При повторении на стенде отдельно фиксируют его состояние и границы проверки.`; break
      case 11: script = `Покажите образец короткой содержательной записи: «${contexts[0][1]} ${contexts[0][3]}» Затем попросите добавить ограничение: «${contexts[0][4]}». Такой конспект сохраняет связь условий и вывода; переписывание всех пунктов не требуется.`; break
      case 12: script = `Задайте входной вопрос: ${topic.diagnostic} Соберите два-три коротких ответа и основания к ним. Не добивайтесь сейчас дословной формулировки; сохраните спорные предположения для финала.\n\nОриентир преподавателя: ${diag}`; break
      case 109:
      case 110: {
        const start = old.number === 109 ? 0 : 4
        script = `Соберите четыре вывода в связный разбор:\n\n${contexts.slice(start, start + 4).map((row, i) => `${topic.questions[start + i].title}: ${row[3]}`).join('\n\n')}\n\nПопросите назвать, какие условия делают каждый вывод обоснованным.`
        questions = teachingNotes[ti][start][0]; answer = teachingNotes[ti][start][1]
        break
      }
      case 111: script = `Проверьте итоговый материал: ${topic.projectArtifact}. В нём должны быть видны условия, действие, свидетельство и предел вывода. Контрольный пример границы: ${contexts[7][4]}\n\nСледующая работа: ${topic.nextStep}.`; notebook = topic.projectArtifact; break
      case 112: script = `Вернитесь к вопросу начала занятия: ${topic.diagnostic}\n\nОбоснованный ответ: ${diag}\n\nПопросите сравнить его с первоначальным и назвать свидетельство, которое изменило мнение. Для переноса задайте вопрос: ${teachingNotes[ti][7][0]}\n\nЕсли возник новый спор, запишите недостающее наблюдение и способ его получить.`; questions = `${topic.diagnostic}\n${teachingNotes[ti][7][0]}`; answer = `${diag}\n${teachingNotes[ti][7][1]}`; break
      default: throw new Error(`No teacher note for ${slide.id}`)
    }
  }
  if (!script) throw new Error(`Empty teacher script: ${slide.id}`)
  const words = script.trim().split(/\s+/).length
  return { script, preparation, notebook, questions, answer, estimatedSeconds: Math.round(words / 2.1 + (slide.task ? 60 : old.kind === 'practice' ? 90 : slide.kind === 'summary' ? 35 : 15)) }
}
