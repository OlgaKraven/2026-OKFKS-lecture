export type Cycle = { work: number; repair: number }
export const referenceCycles: Cycle[] = [{ work:20, repair:1 }, { work:50, repair:2 }, { work:50, repair:3 }]

// This model describes equal numbers of failures and completed restorations.
// It does not estimate the duration of an open incident or forecast a failure.
export function calculateReliability(cycles: Cycle[]) {
  if (!cycles.length || cycles.some(c => !Number.isFinite(c.work) || !Number.isFinite(c.repair) || c.work <= 0 || c.repair < 0)) {
    throw new Error('Нужны завершённые циклы с положительной наработкой и неотрицательным простоем')
  }
  const work = cycles.reduce((sum,c)=>sum+c.work,0)
  const repair = cycles.reduce((sum,c)=>sum+c.repair,0)
  const count = cycles.length
  const calendar = work+repair
  return { work, repair, count, calendar, mtbf:work/count, mttr:repair/count, availability:work/calendar }
}
export function meetsRequirement(availability: number, thresholdPercent: number) {
  if (!Number.isFinite(availability) || availability < 0 || availability > 1 || !Number.isFinite(thresholdPercent) || thresholdPercent < 0 || thresholdPercent > 100) throw new Error('Недопустимый порог или готовность')
  return availability*100 >= thresholdPercent
}
export function segments(cycles: Cycle[]) {
  let time=0
  return cycles.flatMap((cycle,i)=>[
    { id:`work-${i}`, cycle:i, kind:'work' as const, start:time, end:(time+=cycle.work), duration:cycle.work },
    { id:`repair-${i}`, cycle:i, kind:'repair' as const, start:time, end:(time+=cycle.repair), duration:cycle.repair },
  ])
}
export const mistakes = [
  {
    id:'units', title:'Часы встретились с минутами', label:'Единицы',
    context:'В ведомости MTBF = 40 ч, MTTR = 120 мин.', formula:'K = 40 / (40 + 120) = 0,25',
    question:'Что нужно исправить до подстановки в формулу?',
    options:['Перевести 120 минут в 2 часа','Заменить деление умножением','Округлить 0,25 до 0,3'], correct:0,
    explanation:'В знаменателе складывают величины в одинаковых единицах. 120 / 60 = 2 ч; K = 40 / (40 + 2) ≈ 0,95238, или 95,24 %.',
    hint:'Посмотрите на единицы двух слагаемых в знаменателе.',
  },
  {
    id:'events', title:'Шесть сообщений, три отказа', label:'Учёт',
    context:'Наработка — 120 ч. Зафиксированы 3 независимых отказа; каждому соответствует 2 сообщения журнала.',
    formula:'MTBF = 120 / 6 = 20 ч', question:'Какой знаменатель нужен для MTBF в этом условии?',
    options:['6 сообщений: каждая строка — отдельный отказ','3 отказа: сообщения об одном отказе не удваивают его','120 часов: делим на длительность наблюдения'], correct:1,
    explanation:'Число строк журнала не заменяет число отказов. При заданных трёх независимых отказах MTBF = 120 / 3 = 40 ч. Исходные сообщения сохраняют как свидетельства.',
    hint:'Что именно считает знаменатель MTBF: события отказа или уведомления?',
  },
  {
    id:'rounding', title:'На экране 95 % — можно принять?', label:'Решение',
    context:'Расчётное значение K = 0,9496. Требование: готовность не ниже 95 %. Экран округляет до целого процента.',
    formula:'94,96 % → 95 % → «Требование выполнено»', question:'Какой вывод обоснован?',
    options:['Принять: на экране показано 95 %','Принять после дополнительного округления вверх','Не принимать: 94,96 % меньше 95 %'], correct:2,
    explanation:'С порогом сравнивают исходное значение до округления. 0,9496 < 0,95: требование не выполнено. Округление меняет отображение, но не результат проверки.',
    hint:'Сравните 0,9496 и 0,95 до округления.',
  },
] as const
export type LabState = { repairs:number[]; threshold:number; solved:boolean[]; attempts:number[] }
export const freshState = (): LabState => ({ repairs:[1,2,3], threshold:95, solved:[false,false,false], attempts:[0,0,0] })
export function readLabState(raw: string | null): LabState {
  try {
    const s=JSON.parse(raw || 'null')
    if (s && Array.isArray(s.repairs) && s.repairs.length===3 && s.repairs.every((n:unknown)=>typeof n==='number' && Number.isFinite(n) && n>=0.5 && n<=12)
      && typeof s.threshold==='number' && Number.isFinite(s.threshold) && s.threshold>=90 && s.threshold<=99.9
      && Array.isArray(s.solved) && s.solved.length===3 && s.solved.every((v:unknown)=>typeof v==='boolean')
      && Array.isArray(s.attempts) && s.attempts.length===3 && s.attempts.every((v:unknown)=>Number.isInteger(v) && Number(v)>=0 && Number(v)<100000)) return s
  } catch { /* A broken optional record must not prevent the workshop. */ }
  return freshState()
}
