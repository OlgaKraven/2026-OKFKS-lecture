export type TeacherProfile = {
  fullName: string
  position: string
  organizationUnit: string
}

export type CourseConfig = {
  id: 'okfks'
  semesters: number[]
  discipline: string
  semesterThemes: Record<number, string>
  materialsUrl: string
  repository: string
  pagesUrl: string
  basePath: string
  learningPlatform: string
  totals: {
    lectureHours: number
    laboratoryHours: number
    selfStudyHours: number
    totalHours: number
    finalAssessment: string
  }
}

export type SemesterWorkload = {
  semester: number
  lectureHours: number
  laboratoryHours: number
  selfStudyHours: number
  totalHours: number
}

export type LaboratoryWork = {
  number: number
  topicId: string
  title: string
  hours: number
  points: number
}

export type TopicQuestion = {
  title: string
  focus: string
  rule: string
  example: string
  decision: string
  pitfall: string
  check: string
}

export type LectureTopic = {
  id: string
  courseId: CourseConfig['id']
  semester: number
  lectureHours: number
  laboratoryHours: number
  competencies: string[]
  labNumbers: number[]
  sourceTitle: string
  sourceContent: string[]
  displayTitle: string
  sourceIds: string[]
  objective: string
  caseBrief: string
  diagnostic: string
  projectArtifact: string
  nextStep: string
  codeLabel: string
  codeSample: string
  questions: TopicQuestion[]
}

export type SourceRecord = {
  id: string
  title: string
  type: 'rpd' | 'book' | 'documentation' | 'materials' | 'brand' | 'laboratory'
  purpose: string
  location: string
  localCopy?: string
  version: string
  checkedAt: string
  official: boolean
  publication: string
  usedIn: string[]
}

export type TestMode = 'single' | 'multiple' | 'boolean' | 'classification' | 'order' | 'calculation' | 'matching' | 'short'

export type TestTask = {
  id: string
  mode: TestMode
  prompt: string
  options?: string[]
  correctAnswer: string
  correctIndexes?: number[]
  explanation: string
  hint: string
  criteria: string
}

export type SlideKind =
  | 'title'
  | 'service'
  | 'intro'
  | 'divider'
  | 'concept'
  | 'example'
  | 'decision'
  | 'warning'
  | 'check'
  | 'practice'
  | 'test'
  | 'summary'
  | 'questions'

export type SlideVisual =
  | {
      type: 'bar'
      title: string
      items: { label: string; value: number; max: number; displayValue: string }[]
      caption?: string
    }
  | {
      type: 'table'
      title: string
      columns: string[]
      rows: string[][]
      caption?: string
    }
  | {
      type: 'topicPath'
      title: string
      items: { label: string; text: string }[]
      caption?: string
    }

export type StudyBlock = {
  label: string
  text: string
}

export type SlideLayout = 'standard' | 'notebook' | 'sequence' | 'case' | 'columns' | 'contrast' | 'recall'

export type Slide = {
  number: number
  kind: SlideKind
  title: string
  kicker: string
  body?: string
  bullets?: string[]
  code?: string
  codeLabel?: string
  links?: { label: string; url: string }[]
  qrCodes?: { label: string; url: string; assetPath: string }[]
  note?: string
  noteLabel?: string
  studyBlocks?: StudyBlock[]
  layout?: SlideLayout
  transition?: string
  visual?: SlideVisual
  sourceIds: string[]
  questionNumber?: number
  test?: TestTask
}

export type TestAnswers = Record<string, string | number[]>
