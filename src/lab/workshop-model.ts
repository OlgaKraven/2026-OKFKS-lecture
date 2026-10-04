export type Flow = { source: boolean; port: boolean; program: boolean; profile: boolean }
export function evaluateFlow(flow: Flow, broadSource: boolean) {
  const expected = flow.source && flow.port && flow.program && flow.profile
  const actual = (broadSource || flow.source) && flow.port && flow.program && flow.profile
  return { expected, actual, matches: expected === actual }
}
export function evaluateBoundary(age: number, fixed: boolean) {
  if (![17,18,19].includes(age)) throw Error('Выберите 17, 18 или 19')
  const expected=age>=18, actual=fixed?age>=18:age>18
  return {expected,actual,matches:expected===actual}
}
export function readWorkshopProgress(raw: string | null, count: number): boolean[] {
  try {const value=JSON.parse(raw || 'null');return Array.from({length:count},(_,i)=>value?.version===1 && value?.solved?.[i]===true)}
  catch {return Array(count).fill(false)}
}
export function workshopReturn(base: string, lecture: string, fallback: string, origin: string | null) {
  const prefix=`${lecture}-s`, tail=origin?.slice(prefix.length) || ''
  const valid=origin?.startsWith(prefix) && /^\d{3}$/.test(tail) && Number(tail)>=1 && Number(tail)<=112
  return `${base}?${new URLSearchParams({lecture,slide:valid?origin!:`${lecture}-s${fallback}`})}`
}
