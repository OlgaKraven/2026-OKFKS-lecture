import type { TestAnswers, TestTask } from '../types'

export type TestResult = {
  status: 'unanswered' | 'correct' | 'incorrect'
  answerText: string
}

const normalizeAnswer = (value: string) => value.trim().replace(/\s+/g, ' ').toLocaleLowerCase('ru-RU')

export const evaluateTest = (test: TestTask, answer: TestAnswers[string] | undefined): TestResult => {
  if (answer === undefined || answer === '' || (Array.isArray(answer) && answer.every((item) => item === ''))) {
    return { status: 'unanswered', answerText: '' }
  }

  if (test.mode === 'word') {
    const answerText = typeof answer === 'string' ? answer.trim() : ''
    return { status: normalizeAnswer(answerText) === normalizeAnswer(test.correctAnswer) ? 'correct' : 'incorrect', answerText }
  }

  if (test.mode === 'matching') {
    const selected = Array.isArray(answer) && answer.every((item) => typeof item === 'string') ? answer : []
    const isCorrect = Boolean(test.pairs?.length === selected.length && test.pairs.every((pair, index) => selected[index] === pair.right))
    const answerText = test.pairs?.map((pair, index) => `${pair.left} — ${selected[index] || 'нет ответа'}`).join('; ') || ''
    return { status: isCorrect ? 'correct' : 'incorrect', answerText }
  }

  if (Array.isArray(answer) && answer.every((item) => typeof item === 'number') && test.correctIndexes) {
    const selected = [...answer].sort((a, b) => a - b)
    const correct = [...test.correctIndexes].sort((a, b) => a - b)
    const isCorrect = selected.length === correct.length && selected.every((value, index) => value === correct[index])
    return { status: isCorrect ? 'correct' : 'incorrect', answerText: selected.map((index) => test.options?.[index] || String(index + 1)).join('; ') }
  }

  return { status: 'incorrect', answerText: typeof answer === 'string' ? answer : '' }
}
