import { useEffect } from 'react'
import type { CourseConfig, LectureTopic, Slide, TeacherProfile } from '../types'
import { SlideFrame } from './SlideFrame'

type Props = {
  course: CourseConfig
  items: { topic: LectureTopic; deck: Slide[] }[]
  profile: TeacherProfile
  variant: 'student' | 'teacher'
  autoPrint?: boolean
}
export function PrintDeck({ course, items, profile, variant, autoPrint = false }: Props) {
  useEffect(() => {
    let cancelled = false
    const ready = async () => {
      await document.fonts.ready
      await Promise.all(
        Array.from(document.images).map((image) =>
          image.complete
            ? Promise.resolve()
            : new Promise<void>((resolve) => {
                image.addEventListener('load', () => resolve(), { once: true })
                image.addEventListener('error', () => resolve(), { once: true })
              }),
        ),
      )
      if (!cancelled) {
        document.body.dataset.printReady = 'true'
        if (autoPrint) window.setTimeout(() => window.print(), 250)
      }
    }
    ready()
    return () => {
      cancelled = true
      delete document.body.dataset.printReady
    }
  }, [autoPrint])

  return (
    <main className="print-deck" data-topics={items.map((item) => item.topic.id).join(',')} data-variant={variant}>
      {items.flatMap(({ topic, deck }) => deck.map((slide) => (
        <section className="print-page" key={`${topic.id}-${slide.number}`}>
          <SlideFrame slide={slide} course={course} topic={topic} profile={profile} printVariant={variant} />
        </section>
      )))}
    </main>
  )
}
