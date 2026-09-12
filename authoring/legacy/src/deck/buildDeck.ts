import { laboratories } from '../data/courseData'
import { learningHeadlines } from '../data/learningHeadlines'
import type { CourseConfig, LectureTopic, Slide, SlideVisual, TestTask, TopicQuestion } from '../types'

const mainLiterature = [
  {
    label: 'Архитектура вычислительных систем и компьютерных сетей : учебник / А. Н. Алексахин, Н. М. Вершинина, А. В. Джебилов [и др.] ; под редакцией А. М. Нечаева, Н. М. Вершининой, Е. В. Устинова. — Москва : Университет «Синергия», 2025. — 436 с. — ISBN 978-5-4257-0681-2. — Текст : электронный // Образовательная платформа IPR СМАРТ : [сайт]. — URL: https://www.iprbookshop.ru/books/156708/details',
    shortLabel: 'Архитектура вычислительных систем и компьютерных сетей',
    url: 'https://www.iprbookshop.ru/books/156708/details',
    assetPath: 'qr/lit-main-01.png',
  },
  {
    label: 'Юсупова, С. М. Управление качеством : учебник / С. М. Юсупова. — Москва : Ай Пи Ар Медиа, 2026. — 301 с. — ISBN 978-5-4497-5034-1. — Текст : электронный // Образовательная платформа IPR СМАРТ : [сайт]. — URL: https://www.iprbookshop.ru/books/156513/details',
    shortLabel: 'Управление качеством',
    url: 'https://www.iprbookshop.ru/books/156513/details',
    assetPath: 'qr/lit-main-02.png',
  },
]

const additionalLiterature = [
  {
    label: 'Ермакова, А. Н. Управление ИТ-проектами. Ч.I : учебник / А. Н. Ермакова. — Ставрополь : АГРУС, 2024. — 196 с. — Текст : электронный // Образовательная платформа IPR СМАРТ : [сайт]. — URL: https://www.iprbookshop.ru/books/156620/details',
    shortLabel: 'Управление ИТ-проектами. Ч.I',
    url: 'https://www.iprbookshop.ru/books/156620/details',
    assetPath: 'qr/lit-additional-01.png',
  },
  {
    label: 'Швечкова, О. Г. Информационная безопасность. Ч.1. Теоретические основы : учебник / О. Г. Швечкова, С. И. Бабаев. — Москва : КУРС, 2024. — 144 с. — ISBN 978-5-907352-37-7. — Текст : электронный // Образовательная платформа IPR СМАРТ : [сайт]. — URL: https://www.iprbookshop.ru/books/144785/details',
    shortLabel: 'Информационная безопасность. Ч.1',
    url: 'https://www.iprbookshop.ru/books/144785/details',
    assetPath: 'qr/lit-additional-02.png',
  },
]

const introductionTheory: Record<string, string> = {
  's07-01-quality-and-failures': 'Качество системы оценивают по наблюдаемому выполнению требований. Ошибка относится к действию или состоянию, дефект — к артефакту, а отказ — к недоступной или неверно выполненной функции.',
  's07-02-reliability-metrics': 'Показатели надёжности превращают журнал событий в сопоставимые величины. Для каждого расчёта нужны границы периода, единицы измерения, правило учёта отказов и заранее заданный критерий.',
  's07-03-reliability-threats-prevention': 'Надёжность снижают не только дефекты программы, но и данные, нагрузка, среда и ошибки эксплуатации. Мера выбирается по механизму влияния и проверяется по наблюдаемому результату.',
  's07-04-observing-operating-system': 'Наблюдаемость связывает состояние системы с журналами, метриками и трассировками. Отдельный сигнал ещё не доказывает причину: важны базовый уровень, динамика и контекст.',
  's08-01-threats-and-malware': 'Анализ угроз начинается с активов, границ доверия и допустимых последствий. Сценарий угрозы описывает путь воздействия, а не просто называет нежелательное событие.',
  's08-02-protection-controls': 'Средство защиты оценивают не по факту установки, а по сценарию, настройке и результату проверки. Каждое разрешение должно иметь основание, а каждый запрет — безопасный негативный тест.',
  's08-03-encryption-and-security-testing': 'Шифрование защищает конфиденциальность в конкретном состоянии данных и не заменяет контроль доступа, целостность и управление ключами. Вывод о защите ограничивается областью выполненных тестов.',
}

const caseRoles: Record<string, string> = {
  's07-01-quality-and-failures': 'аналитики качества восстанавливают цепочку «условие — событие — влияние»',
  's07-02-reliability-metrics': 'инженеры эксплуатации готовят расчётную ведомость по журналу',
  's07-03-reliability-threats-prevention': 'разработчики укрепляют модуль импорта без дублирования операций',
  's07-04-observing-operating-system': 'дежурная смена ищет ранний признак ухудшения до отказа',
  's08-01-threats-and-malware': 'группа защиты строит модель угроз для учебной системы',
  's08-02-protection-controls': 'администраторы проверяют защитные настройки на изолированном стенде',
  's08-03-encryption-and-security-testing': 'аудиторы подтверждают защиту синтетического файла при хранении и передаче',
}

const visuals: Record<string, { questionIndex: number; visual: SlideVisual }> = {
  's07-01-quality-and-failures': {
    questionIndex: 7,
    visual: {
      type: 'bar', title: 'События в учебной выборке',
      items: [
        { label: 'HTTP 503', value: 3, max: 5, displayValue: '3' },
        { label: 'Тайм-аут', value: 2, max: 5, displayValue: '2' },
        { label: 'Дублирование', value: 1, max: 5, displayValue: '1' },
      ],
      caption: '200 операций за один период наблюдения. Абсолютные числа читаются только вместе со знаменателем.',
    },
  },
  's07-02-reliability-metrics': {
    questionIndex: 4,
    visual: {
      type: 'bar', title: 'Готовность: расчёт и требование',
      items: [
        { label: 'Расчёт', value: 95.24, max: 100, displayValue: '95,24 %' },
        { label: 'Порог', value: 95, max: 100, displayValue: '95,00 %' },
      ],
      caption: '40 / (40 + 2) = 0,9524. Учебное требование выполнено на выбранном периоде.',
    },
  },
  's07-03-reliability-threats-prevention': {
    questionIndex: 2,
    visual: {
      type: 'table', title: 'Фактор, мера и свидетельство',
      columns: ['Фактор', 'Мера', 'Что увидим'],
      rows: [
        ['Повреждённая строка', 'Валидация до записи', 'Отклонение без изменения состояния'],
        ['Обрыв соединения', 'Идемпотентный повтор', 'Одна операция вместо дубля'],
        ['Частичная запись', 'Откат транзакции', 'Согласованное состояние'],
      ],
    },
  },
  's07-04-observing-operating-system': {
    questionIndex: 1,
    visual: {
      type: 'bar', title: 'Рост времени ответа',
      items: [
        { label: '10:00', value: 180, max: 1000, displayValue: '180 мс' },
        { label: '10:15', value: 420, max: 1000, displayValue: '420 мс' },
        { label: '10:30', value: 870, max: 1000, displayValue: '870 мс' },
      ],
      caption: 'Три точки показывают тенденцию, но причину подтверждают журналом и состоянием ресурсов.',
    },
  },
  's08-01-threats-and-malware': {
    questionIndex: 1,
    visual: {
      type: 'table', title: 'Карта границ доверия',
      columns: ['Переход', 'Риск', 'Контроль'],
      rows: [
        ['Файл → модуль импорта', 'Подмена содержимого', 'Проверка формата и источника'],
        ['Пользователь → заявка', 'Лишнее действие', 'Минимальные полномочия'],
        ['Модуль → хранилище', 'Изменение записи', 'Проверка состояния и журнал'],
      ],
    },
  },
  's08-02-protection-controls': {
    questionIndex: 2,
    visual: {
      type: 'table', title: 'Учебный снимок защитных мер',
      columns: ['Компонент', 'Сценарий', 'Результат'],
      rows: [
        ['Антивирусная защита', 'Безопасный тест обнаружения', 'Событие записано'],
        ['Сетевой экран', 'Разрешённый и запрещённый поток', 'Оба исхода подтверждены'],
        ['Права роли', 'Чтение без изменения', 'Лишнее действие отклонено'],
      ],
    },
  },
  's08-03-encryption-and-security-testing': {
    questionIndex: 1,
    visual: {
      type: 'table', title: 'Состояния данных и способы проверки',
      columns: ['Состояние', 'Учебное средство', 'Проверка'],
      rows: [
        ['На носителе', 'Шифрование тома', 'Чтение без полномочия недоступно'],
        ['В канале', 'TLS-соединение', 'Защищённый сеанс подтверждён'],
        ['После восстановления', 'Контрольный хэш', 'Хэш совпадает с исходным'],
      ],
    },
  },
}

const visualForQuestion = (topic: LectureTopic, questionIndex: number) => {
  const item = visuals[topic.id]
  return item?.questionIndex === questionIndex ? item.visual : undefined
}

const learningRhythms = [
  {
    divider: 'Сначала зададим точный смысл, затем проверим его на конкретной ситуации.',
    sequence: [
      ['Условие', 'Запишите, к какому объекту и ситуации относится правило.'],
      ['Действие', 'Сформулируйте шаг, который следует из исходных условий.'],
      ['Критерий', 'Заранее определите, по чему будет принят результат.'],
    ],
  },
  {
    divider: 'Проследим, какое решение зависит от ответа и кому нужен результат.',
    sequence: [
      ['Вопрос', 'Уточните, какое решение должен поддержать ответ.'],
      ['Данные', 'Оставьте только сведения, относящиеся к этому решению.'],
      ['Следующий шаг', 'Назовите действие, которое меняется после анализа.'],
    ],
  },
  {
    divider: 'Разложим сложную идею на уровни и восстановим связи между ними.',
    sequence: [
      ['Цель', 'Начните с вопроса, ради которого выполняется анализ.'],
      ['Связь', 'Покажите переход от общего положения к конкретному действию.'],
      ['Свидетельство', 'Укажите наблюдение, которое подтверждает каждый переход.'],
    ],
  },
  {
    divider: 'Проведём границы между близкими случаями и отделим факт от объяснения.',
    sequence: [
      ['Наблюдение', 'Зафиксируйте то, что действительно произошло.'],
      ['Объяснение', 'Отдельно сформулируйте предполагаемую связь или категорию.'],
      ['Проверка', 'Назовите данные, способные подтвердить или опровергнуть объяснение.'],
    ],
  },
  {
    divider: 'Проверим причинную цепочку: от исходного состояния до наблюдаемого последствия.',
    sequence: [
      ['Исходное состояние', 'Опишите состояние системы до рассматриваемого события.'],
      ['Изменение', 'Зафиксируйте, что именно изменилось и при каких условиях.'],
      ['Последствие', 'Свяжите изменение с наблюдением, не выдавая гипотезу за факт.'],
    ],
  },
  {
    divider: 'Уточним границы применимости и найдём условия, при которых правило проявляется.',
    sequence: [
      ['Контекст', 'Запишите состояние среды, данных и нагрузки до действия.'],
      ['Граничный случай', 'Проверьте условие, на котором поведение может измениться.'],
      ['Повтор', 'Сохраните шаги и ожидаемый результат для воспроизведения.'],
    ],
  },
  {
    divider: 'Создадим единый язык описания, чтобы результаты можно было сопоставлять.',
    sequence: [
      ['Единица анализа', 'Определите, какой объект или случай считается одной записью.'],
      ['Правило обработки', 'Зафиксируйте одинаковый порядок для всех случаев.'],
      ['Сопоставимость', 'Проверьте, что другой участник применит то же правило.'],
    ],
  },
  {
    divider: 'Научимся читать результат вместе с периодом, условиями и ограничениями.',
    sequence: [
      ['Границы данных', 'Укажите период, объект, объём и правило отбора.'],
      ['Вывод', 'Сформулируйте только то, что подтверждает наблюдаемая выборка.'],
      ['Ограничение', 'Отдельно запишите, на какие случаи результат не распространяется.'],
    ],
  },
] as const

const noteLabels = ['Опорное определение', 'Смысл для конспекта', 'Ключевая связь', 'Различие терминов', 'Причинная опора', 'Граница применения', 'Правило записи', 'Ограниченный вывод']

const conceptPrompts = [
  ['Граница понятия', 'Что относится к этому понятию, а что требует отдельного термина?'],
  ['Назначение', 'Какое профессиональное решение невозможно принять без точного ответа?'],
  ['Место в системе', 'С каким более общим и более конкретным понятием оно связано?'],
  ['Признак различия', 'По какому наблюдаемому признаку различаются близкие случаи?'],
  ['Начало цепочки', 'Какое состояние или событие принимается за исходное?'],
  ['Условия действия', 'При каких данных, нагрузке или состоянии среды сохраняется смысл?'],
  ['Единица записи', 'Что считается отдельным объектом наблюдения или проверки?'],
  ['Границы вывода', 'Какими периодом, объёмом данных и условиями ограничен ответ?'],
] as const

const casePromptSets = [
  [['Исходные условия', 'Назовите объект и обстановку до события.'], ['Ожидаемое поведение', 'Запишите, что должно было произойти по условию.'], ['Наблюдение', 'Отделите зарегистрированный факт от его объяснения.']],
  [['Участник', 'Уточните, кому нужен результат разбора.'], ['Нужные данные', 'Выделите сведения, влияющие на решение.'], ['Изменение решения', 'Покажите, что будет сделано после анализа.']],
  [['Общая цель', 'Сформулируйте верхний уровень рассматриваемой задачи.'], ['Промежуточная связь', 'Объясните переход от общего положения к частному.'], ['Свидетельство', 'Назовите наблюдение на самом конкретном уровне.']],
  [['Факт', 'Выпишите событие без оценки и предполагаемой причины.'], ['Объяснение', 'Сформулируйте версию отдельно от наблюдения.'], ['Проверка', 'Назовите данные, которые различат факт и гипотезу.']],
  [['До изменения', 'Зафиксируйте исходное состояние и существенные условия.'], ['После изменения', 'Опишите наблюдаемое последствие без обобщения.'], ['Связь состояний', 'Укажите, чем можно проверить переход между ними.']],
  [['Контекст', 'Запишите данные, среду и состояние до действия.'], ['Граница', 'Найдите условие, на котором поведение меняется.'], ['Безопасный повтор', 'Сохраните шаги и ожидаемый результат воспроизведения.']],
  [['Единица наблюдения', 'Определите, какой случай считается отдельной записью.'], ['Обработка', 'Примените одинаковое правило к сопоставимым случаям.'], ['Сохранённая деталь', 'Проверьте, что группировка не уничтожила исходные данные.']],
  [['Выборка', 'Укажите период, объект и объём наблюдения.'], ['Наблюдаемая картина', 'Опишите то, что действительно показывают данные.'], ['Допустимый вывод', 'Ограничьте утверждение условиями этой выборки.']],
] as const

const decisionPromptSets = [
  [['Действие', 'Назовите конкретный шаг и объект воздействия.'], ['Наблюдаемый след', 'Укажите результат, который останется после выполнения.']],
  [['Получатель', 'Свяжите решение с ролью, которой нужен результат.'], ['Следующий шаг', 'Покажите, какое действие меняется после вывода.']],
  [['Структура', 'Соберите решение от общего основания к детали.'], ['Проверяемая связь', 'Для каждого перехода укажите свидетельство.']],
  [['Категория', 'Выберите формулировку по месту проявления.'], ['Основание', 'Поставьте рядом факт, подтверждающий выбор.']],
  [['Главный шаг', 'Отделите исходное действие от последствий.'], ['Ограничение', 'Укажите, какая часть причинной связи ещё проверяется.']],
  [['Сценарий', 'Сохраните условия, при которых действие применимо.'], ['Условия повтора', 'Зафиксируйте безопасную среду и ожидаемый результат.']],
  [['Правило', 'Запишите единый порядок обработки всех случаев.'], ['Трассировка', 'Сохраните связь результата с исходной записью.']],
  [['Вывод', 'Ответьте на вопрос только в пределах собранных данных.'], ['Граница переноса', 'Назовите условия, где потребуется новая проверка.']],
] as const

const warningPromptSets = [
  [['Слишком общо', 'Оценка без объекта и условия не задаёт способа проверки.'], ['Перепишите точно', 'Добавьте объект, контекст и измеримый признак.']],
  [['Данные без решения', 'Накопление сведений само по себе не объясняет их назначение.'], ['Верните адресата', 'Свяжите результат с получателем и следующим действием.']],
  [['Часть вместо целого', 'Один признак не заменяет систему связанных уровней.'], ['Восстановите связи', 'Покажите место признака между целью и свидетельством.']],
  [['Метка вместо факта', 'Название категории ещё не доказывает причину события.'], ['Разведите записи', 'Отдельно зафиксируйте наблюдение, категорию и гипотезу.']],
  [['«После» не значит «из-за»', 'Последовательность во времени не доказывает механизм.'], ['Проверьте переход', 'Ищите связь состояний, альтернативу и воспроизводимый сценарий.']],
  [['Симптом вместо условий', 'Исправление проявления может скрыть контекст возникновения.'], ['Сохраните контекст', 'Запишите данные, среду и границу до изменения системы.']],
  [['Незаметная смена правила', 'Результаты становятся несопоставимыми без истории обработки.'], ['Верните прозрачность', 'Опубликуйте правило и сохраните исходные записи.']],
  [['Число без контекста', 'Отдельное значение провоцирует слишком широкий вывод.'], ['Добавьте границы', 'Подпишите период, объём, знаменатель и ограничение.']],
] as const

const recallPromptSets = [
  [['Дайте определение', 'Назовите объект, условия и главный признак.'], ['Проверьте себя', 'Какой критерий превращает формулировку в проверяемую?']],
  [['Объясните назначение', 'Кому нужен результат и для какого решения?'], ['Продолжите цепочку', 'Какие данные приведут к следующему действию?']],
  [['Восстановите уровни', 'Перейдите от общей цели к конкретному наблюдению.'], ['Покажите связь', 'Какое свидетельство подтверждает каждый переход?']],
  [['Отделите факт', 'Произнесите наблюдение без категории и причины.'], ['Верните объяснение', 'Как его проверить, не выдавая гипотезу за доказательство?']],
  [['Постройте цепочку', 'Опишите состояние до события, изменение и последствие.'], ['Найдите альтернативу', 'Что ещё могло бы привести к тому же наблюдению?']],
  [['Назовите контекст', 'При каких условиях рассматриваемое правило действует?'], ['Повторите безопасно', 'Какие шаги и границы нужны для воспроизведения?']],
  [['Опубликуйте правило', 'Что должен знать другой участник для той же обработки?'], ['Сверьте результат', 'Получится ли одинаковый вывод из одинаковой записи?']],
  [['Назовите границы', 'Какие период и данные поддерживают утверждение?'], ['Сформулируйте вывод', 'Что можно сказать уверенно, а что остаётся гипотезой?']],
] as const

const toStudyBlocks = (items: readonly (readonly [string, string])[]) =>
  items.map(([label, text]) => ({ label, text }))

const laboratoryStages = [
  {
    title: 'Сначала оформите паспорт работы',
    label: 'Состав записи',
    text: 'Укажите тему, цель, номер варианта, объект, границы стенда и ожидаемый результат.',
    note: 'Паспорт работы отвечает на вопросы: что проверяем, где проверяем, по какому правилу и ради какого результата.',
  },
  {
    title: 'Соберите исходные данные без домыслов',
    label: 'Подготовка данных',
    text: 'Отделите выданные условия от собственных предположений; единицы, версии и временные границы подпишите сразу.',
    note: 'Исходные данные должны позволять другому студенту начать работу с той же точки.',
  },
  {
    title: 'Назначьте критерий до выполнения',
    label: 'Условие приёмки',
    text: 'Запишите ожидаемый результат, допустимое отклонение и признак, по которому будет принято решение.',
    note: 'Критерий формулируют до действия, иначе результат легко подогнать под ожидание.',
  },
  {
    title: 'Выполняйте действие и ведите журнал',
    label: 'Ход работы',
    text: 'Фиксируйте существенные шаги, время, параметры и наблюдения; не заменяйте протокол пересказом после выполнения.',
    note: 'Хороший журнал хранит не все движения подряд, а сведения, необходимые для проверки вывода.',
  },
  {
    title: 'Добавьте граничный или негативный сценарий',
    label: 'Вторая проверка',
    text: 'Измените одно условие и проверьте, сохраняется ли ожидаемое поведение без воздействия на чужие данные и системы.',
    note: 'Позитивный результат показывает, что действие сработало; граничный или негативный — где проходит предел.',
  },
  {
    title: 'Разберите отклонение, а не скрывайте его',
    label: 'Работа с расхождением',
    text: 'Сохраните фактический результат, сравните его с ожидаемым и отдельно запишите возможные причины для проверки.',
    note: 'Отклонение — часть результата работы, если оно описано, объяснение отделено от факта, а повтор возможен.',
  },
  {
    title: 'Сопоставьте свидетельство с критерием',
    label: 'Проверка вывода',
    text: 'Покажите, какое наблюдение подтверждает каждый пункт критерия и какие данные остаются неоднозначными.',
    note: 'Вывод принимается не по уверенности автора, а по связи «критерий — свидетельство — решение».',
  },
  {
    title: 'Завершите отчёт выводом и ограничениями',
    label: 'Финальная сборка',
    text: 'Кратко ответьте на цель работы, перечислите доказательства, границы результата и следующий проверяемый шаг.',
    note: 'Итоговый вывод не пересказывает ход работы: он отвечает на цель, опирается на факты и называет ограничения.',
  },
] as const

const formatPoints = (points: number) => {
  const lastTwo = points % 100
  const last = points % 10
  const word = lastTwo >= 11 && lastTwo <= 14 ? 'баллов' : last === 1 ? 'балл' : last >= 2 && last <= 4 ? 'балла' : 'баллов'
  return `${points} ${word}`
}

const rotate = <T,>(items: T[], offset: number) => {
  const shift = offset % items.length
  return [...items.slice(shift), ...items.slice(0, shift)]
}

const choiceTest = (id: string, prompt: string, correct: string, distractors: string[], offset: number, explanation: string): TestTask => {
  const options = rotate([correct, ...distractors], offset)
  return {
    id, mode: 'single', prompt, options, correctIndexes: [options.indexOf(correct)], correctAnswer: correct,
    explanation, hint: 'Выберите вариант, который следует из рассмотренного вопроса.', criteria: 'Выбран ответ, совпадающий с правилом и проверкой из текущего вопроса.',
  }
}

const wordFromFocus = (focus: string) => {
  const words = focus.match(/[А-Яа-яЁёA-Za-z-]{5,}/g) || []
  return [...words].sort((a, b) => b.length - a.length)[0] || words[0] || 'ответ'
}

const makeQuestionTests = (topic: LectureTopic, question: TopicQuestion, questionIndex: number): TestTask[] => {
  const number = questionIndex + 1
  const word = wordFromFocus(question.focus)
  const maskedFocus = question.focus.replace(word, '_____')
  const pairs = [
    { left: question.rule, right: 'Правило' },
    { left: question.decision, right: 'Решение' },
    { left: question.check, right: 'Проверка' },
  ]
  return [
    choiceTest(
      `${topic.id}-q${number}-choice-rule`,
      `Какое правило относится к вопросу «${question.title}»?`,
      question.rule,
      [question.pitfall, question.decision, question.check],
      questionIndex % 4,
      `Правило текущего вопроса: ${question.rule}`,
    ),
    {
      id: `${topic.id}-q${number}-word`, mode: 'word',
      prompt: `Впишите пропущенное слово: «${maskedFocus}»`, correctAnswer: word,
      explanation: `Полная формулировка: ${question.focus}`, hint: `Первая буква: «${word[0]}».`,
      criteria: 'Слово совпадает без учёта регистра и лишних пробелов.',
    },
    {
      id: `${topic.id}-q${number}-matching`, mode: 'matching',
      prompt: `Установите соответствия для вопроса «${question.title}».`, pairs,
      options: rotate(pairs.map((pair) => pair.right), (questionIndex + 1) % pairs.length),
      correctAnswer: pairs.map((pair) => `${pair.right}: ${pair.left}`).join('; '),
      explanation: 'Правило задаёт способ действия, решение применяет его, а проверка подтверждает результат.',
      hint: 'Различайте правило, решение и проверку.', criteria: 'Для каждой формулировки выбрана правильная роль.',
    },
    choiceTest(
      `${topic.id}-q${number}-choice-check`,
      `Как проверить понимание вопроса «${question.title}»?`,
      question.check,
      [question.pitfall, question.example, question.focus],
      (questionIndex + 2) % 4,
      `Проверка текущего вопроса: ${question.check}`,
    ),
  ]
}

export const buildDeck = (topic: LectureTopic, course: CourseConfig): Slide[] => {
  const sourceIds = Array.from(new Set(['rpd-okfks-text', ...topic.sourceIds]))
  const topicLabs = laboratories.filter((lab) => lab.topicId === topic.id)
  const slides: Omit<Slide, 'number'>[] = [
    {
      kind: 'title', kicker: `${course.discipline} · ${topic.semester}-й семестр`, title: topic.displayTitle,
      sourceIds: ['rpd-okfks-text', 'okfks-rhino', 'synergy-logo'],
    },
    {
      kind: 'service', kicker: `${topic.semester}-й семестр`, title: course.semesterThemes[topic.semester],
      bullets: [topic.sourceTitle, ...topic.sourceContent], sourceIds,
    },
    {
      kind: 'service', kicker: 'Литература', title: 'Основная литература', bullets: mainLiterature.map((item) => item.label),
      links: mainLiterature.map((item) => ({ label: 'Открыть источник', url: item.url })),
      qrCodes: mainLiterature.map((item) => ({ label: item.shortLabel, url: item.url, assetPath: item.assetPath })),
      sourceIds: ['lit-main-01', 'lit-main-02'],
    },
    {
      kind: 'service', kicker: 'Литература', title: 'Дополнительная литература', bullets: additionalLiterature.map((item) => item.label),
      links: additionalLiterature.map((item) => ({ label: 'Открыть источник', url: item.url })),
      qrCodes: additionalLiterature.map((item) => ({ label: item.shortLabel, url: item.url, assetPath: item.assetPath })),
      sourceIds: ['lit-additional-01', 'lit-additional-02'],
    },
    {
      kind: 'service', kicker: 'Материалы к занятиям', title: 'Презентации, задания и исходные файлы',
      body: 'Отсканируйте QR-код или откройте ссылку на общую папку курса.',
      links: [{ label: course.materialsUrl, url: course.materialsUrl }], sourceIds: ['okfks-materials', 'synergy-logo'],
    },
    {
      kind: 'intro', kicker: 'Контекст темы', title: 'Почему без точных понятий решение нельзя проверить', body: introductionTheory[topic.id], sourceIds,
    },
    {
      kind: 'intro', kicker: 'Ожидаемый результат', title: 'К концу занятия у вас будет рабочее решение', body: topic.objective,
      note: topic.projectArtifact, noteLabel: 'Итоговый материал', sourceIds,
    },
    {
      kind: 'example', kicker: 'Сквозной кейс', title: 'От исходной ситуации — к доказанному выводу', body: topic.caseBrief,
      studyBlocks: [
        { label: 'Роль группы', text: caseRoles[topic.id] },
        { label: 'Границы работы', text: 'Используются синтетические данные и изолированный стенд; действующие пароли, ключи, токены и персональные данные не применяются.' },
      ],
      layout: 'columns', sourceIds,
    },
    {
      kind: 'intro', kicker: 'Маршрут изучения', title: 'Восемь вопросов образуют одну цепочку', sourceIds,
      visual: {
        type: 'topicPath', title: 'От понятия — к применению и проверке',
        items: topic.questions.map((question) => ({ label: question.title, text: '' })),
      },
    },
    {
      kind: 'concept', kicker: topic.codeLabel, title: 'Практика проходит только в разрешённой среде',
      body: 'Перед действием проверьте разрешение, границы учебного стенда, версию средства и способ возврата. Команды вне разрешённой среды не выполняются.',
      code: topic.codeSample, codeLabel: topic.codeLabel, sourceIds,
    },
    {
      kind: 'intro', kicker: 'Как вести записи', title: 'Конспект строим по связям, а не по числу страниц',
      bullets: [`объяснить ключевые понятия темы «${topic.displayTitle}» простыми словами;`, `создать и обосновать артефакт: ${topic.projectArtifact};`, 'проверить решение позитивным, граничным и негативным сценарием;', 'отделить наблюдаемый факт от предположения и общего вывода.'], sourceIds,
    },
    { kind: 'check', kicker: 'Входная диагностика', title: topic.diagnostic, body: 'Сформулируй предварительный ответ. В конце темы сравни его с итогами занятия.', sourceIds },
  ]

  topic.questions.forEach((question, index) => {
    const number = index + 1
    const evidenceVisual = visualForQuestion(topic, index)
    const rhythm = learningRhythms[index]
    const headlineTopic = learningHeadlines[topic.id as keyof typeof learningHeadlines] as Record<string, readonly string[]>
    const subjectTitles = headlineTopic[question.title]
    if (!subjectTitles) throw new Error(`Missing learning headlines for ${topic.id}: ${question.title}`)
    const [definitionTitle, ruleTitle, exampleTitle, decisionTitle, warningTitle, checkTitle] = subjectTitles
    const previousQuestion = topic.questions[index - 1]
    const nextQuestion = topic.questions[index + 1]
    slides.push(
      index % 2 === 0
        ? {
            kind: 'divider', kicker: `Глава ${index / 2 + 1} из 4 · вопрос ${number}`, title: question.title,
            body: rhythm.divider, sourceIds, questionNumber: number,
          }
        : {
            kind: 'intro', kicker: `Связь внутри главы · вопрос ${number}`, title: question.title,
            studyBlocks: [
              { label: 'Опора', text: `Предыдущий вопрос — «${previousQuestion.title}». Его вывод остаётся частью текущего рассуждения.` },
              { label: 'Новый шаг', text: rhythm.divider },
            ],
            layout: 'columns', sourceIds, questionNumber: number,
          },
      {
        kind: 'concept', kicker: `Опорное понятие · ${number}`, title: definitionTitle,
        note: question.focus, noteLabel: noteLabels[index],
        studyBlocks: [
          { label: conceptPrompts[index][0], text: conceptPrompts[index][1] },
          { label: 'Связь с практикой', text: `Ответьте письменно: какое решение по теме «${question.title}» станет точнее после этого определения?` },
        ],
        layout: 'notebook', sourceIds, questionNumber: number,
      },
      {
        kind: 'concept', kicker: `Логика применения · ${number}`, title: ruleTitle, body: question.rule,
        studyBlocks: toStudyBlocks(rhythm.sequence), layout: 'sequence', sourceIds, questionNumber: number,
      },
      {
        kind: 'example', kicker: `Разбор ситуации · ${number}`, title: exampleTitle,
        body: question.example,
        studyBlocks: evidenceVisual ? undefined : toStudyBlocks(casePromptSets[index]),
        layout: evidenceVisual ? 'standard' : 'case', visual: evidenceVisual, sourceIds, questionNumber: number,
      },
      {
        kind: 'decision', kicker: `Профессиональное решение · ${number}`, title: decisionTitle, body: question.decision,
        studyBlocks: toStudyBlocks(decisionPromptSets[index]), layout: 'columns', sourceIds, questionNumber: number,
      },
      {
        kind: 'warning', kicker: `Антиошибка · ${number}`, title: warningTitle, body: question.pitfall,
        studyBlocks: toStudyBlocks(warningPromptSets[index]), layout: 'contrast', sourceIds, questionNumber: number,
      },
      {
        kind: 'check', kicker: `Контроль понимания · ${number}`, title: checkTitle, body: question.check,
        studyBlocks: toStudyBlocks(recallPromptSets[index]), layout: 'recall',
        transition: nextQuestion ? `Дальше: «${nextQuestion.title}». Сохраните текущий вывод — он станет опорой для следующего вопроса.` : 'Все восемь вопросов связаны. Теперь применим их в лабораторном маршруте.',
        sourceIds, questionNumber: number,
      },
    )
    makeQuestionTests(topic, question, index).forEach((test, testIndex) => slides.push({
      kind: 'test', kicker: `Самопроверка · вопрос ${number} · ${testIndex + 1} из 4`,
      title: testIndex === 0 ? 'Выберите правило' : testIndex === 1 ? 'Восстановите слово' : testIndex === 2 ? 'Установите соответствия' : 'Выберите способ проверки',
      sourceIds, questionNumber: number, test,
    }))
  })

  topic.questions.forEach((question, index) => {
    const stage = laboratoryStages[index]
    const labIndex = Math.min(topicLabs.length - 1, Math.floor((index * topicLabs.length) / laboratoryStages.length))
    const lab = topicLabs[labIndex]
    const previousLabIndex = index === 0 ? -1 : Math.min(topicLabs.length - 1, Math.floor(((index - 1) * topicLabs.length) / laboratoryStages.length))
    const startsLab = labIndex !== previousLabIndex
    const nextStage = laboratoryStages[index + 1]
    slides.push({
      kind: 'practice', kicker: `ЛР № ${lab.number} · этап ${index + 1} из 8`, title: stage.title,
      body: startsLab ? `${lab.title}. ${lab.hours} ч · ${formatPoints(lab.points)}.` : undefined,
      studyBlocks: [
        { label: 'Опора из лекции', text: question.decision },
        { label: stage.label, text: stage.text },
        { label: 'Приёмка', text: question.check },
      ],
      note: stage.note, noteLabel: 'В рабочую тетрадь',
      transition: startsLab ? undefined : nextStage ? `Следующий этап: «${nextStage.title}».` : 'Маршрут завершён. Переходим к самопроверке без конспекта.',
      layout: index % 2 === 0 ? 'sequence' : 'case', sourceIds, questionNumber: index + 1,
    })
  })

  slides.push(
    {
      kind: 'summary', kicker: 'Синтез · часть 1', title: 'Первые четыре опоры собираются в единую модель',
      body: 'Не переписывайте ответы изолированно: покажите, как каждый следующий вывод уточняет предыдущий.',
      bullets: topic.questions.slice(0, 4).map((question) => `${question.title}: ${question.decision}`),
      sourceIds,
    },
    {
      kind: 'summary', kicker: 'Синтез · часть 2', title: 'Последние четыре опоры задают границы решения',
      body: 'В этой части особенно важны условия применения, доказательства и ограничения итогового вывода.',
      bullets: topic.questions.slice(4).map((question) => `${question.title}: ${question.decision}`),
      sourceIds,
    },
    {
      kind: 'summary', kicker: 'Рабочий результат', title: 'Конспект завершён, когда по нему можно действовать', body: topic.projectArtifact,
      studyBlocks: [
        { label: 'Проверка полноты', text: 'Есть исходные условия, ход рассуждения, наблюдаемое свидетельство, критерий и ограничение.' },
        { label: 'Перенос', text: `Следующий шаг: ${topic.nextStep}.` },
      ],
      layout: 'columns', sourceIds,
    },
    { kind: 'questions', kicker: 'Финал занятия', title: 'Что осталось непонятным после проверки памяти', body: 'Сформулируйте вопрос так, чтобы группа могла восстановить контекст и предложить способ проверки.', bullets: ['Какой термин вы пока не можете объяснить своими словами?', 'Где в цепочке рассуждения не хватает свидетельства?', 'Какой вывод трудно перенести в новую ситуацию?', 'Как проверить спорное место безопасно и воспроизводимо?'], sourceIds: ['rpd-okfks-text', 'okfks-rhino', 'synergy-logo'] },
  )

  const numbered = slides.map((slide, index) => ({ ...slide, number: index + 1 }))
  if (numbered.length !== 112) throw new Error(`Deck invariant failed for ${topic.id}: expected 112 slides, got ${numbered.length}`)
  return numbered
}

export const countServiceSlides = (slides: Slide[]) => slides.filter((slide) => slide.kind === 'service' || slide.kind === 'questions').length
