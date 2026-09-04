import type { CSSProperties } from 'react'
import type { SlideVisual } from '../types'

type Props = {
  visual: SlideVisual
}

export function SlideInfographic({ visual }: Props) {
  if (visual.type === 'bar') {
    return (
      <figure className="slide-visual bar-visual" aria-label={visual.title}>
        <figcaption>{visual.title}</figcaption>
        <div className="bar-list">
          {visual.items.map((item) => (
            <div className="bar-row" key={item.label}>
              <span>{item.label}</span>
              <div className="bar-track" aria-hidden="true">
                <i style={{ '--bar-width': `${Math.min(100, (item.value / item.max) * 100)}%` } as CSSProperties} />
              </div>
              <strong>{item.displayValue}</strong>
            </div>
          ))}
        </div>
        {visual.caption && <p>{visual.caption}</p>}
      </figure>
    )
  }

  if (visual.type === 'table') {
    return (
      <figure className="slide-visual table-visual" aria-label={visual.title}>
        <figcaption>{visual.title}</figcaption>
        <table>
          <thead><tr>{visual.columns.map((column) => <th key={column}>{column}</th>)}</tr></thead>
          <tbody>
            {visual.rows.map((row, rowIndex) => (
              <tr key={rowIndex}>{row.map((cell, cellIndex) => <td key={`${rowIndex}-${cellIndex}`}>{cell}</td>)}</tr>
            ))}
          </tbody>
        </table>
        {visual.caption && <p>{visual.caption}</p>}
      </figure>
    )
  }

  if (visual.type === 'conceptMap') {
    return (
      <figure className="slide-visual concept-map" aria-label={visual.title}>
        <figcaption>{visual.title}</figcaption>
        <div className="concept-map-layout">
          <div className="concept-center">{visual.center}</div>
          <div className="concept-branches">
            {visual.branches.map((branch, index) => (
              <div className="concept-branch" key={`${branch.label}-${index}`}>
                <span>{branch.label}</span>
                <strong>{branch.text}</strong>
              </div>
            ))}
          </div>
        </div>
        {visual.caption && <p>{visual.caption}</p>}
      </figure>
    )
  }

  if (visual.type === 'process') {
    return (
      <figure className="slide-visual process-visual" aria-label={visual.title}>
        <figcaption>{visual.title}</figcaption>
        <ol className="process-flow">
          {visual.steps.map((step, index) => (
            <li key={`${step.label}-${index}`}>
              <span>{String(index + 1).padStart(2, '0')}</span>
              <div><small>{step.label}</small><strong>{step.text}</strong></div>
            </li>
          ))}
        </ol>
        {visual.caption && <p>{visual.caption}</p>}
      </figure>
    )
  }

  if (visual.type === 'contrast') {
    return (
      <figure className="slide-visual contrast-visual" aria-label={visual.title}>
        <figcaption>{visual.title}</figcaption>
        <div className="contrast-layout">
          <div className="contrast-choice preferred-choice">
            <span>{visual.preferred.label}</span>
            <strong>{visual.preferred.text}</strong>
          </div>
          <div className="contrast-choice avoid-choice">
            <span>{visual.avoid.label}</span>
            <strong>{visual.avoid.text}</strong>
          </div>
        </div>
        <div className="contrast-criterion">
          <span>{visual.criterion.label}</span>
          <strong>{visual.criterion.text}</strong>
        </div>
        {visual.caption && <p>{visual.caption}</p>}
      </figure>
    )
  }

  return (
    <figure className="slide-visual topic-path" aria-label={visual.title}>
      <figcaption>{visual.title}</figcaption>
      <ol>
        {visual.items.map((item, index) => (
          <li key={`${item.label}-${index}`}>
            <span>{String(index + 1).padStart(2, '0')}</span>
            <div><strong>{item.label}</strong>{item.text && <p>{item.text}</p>}</div>
          </li>
        ))}
      </ol>
      {visual.caption && <p>{visual.caption}</p>}
    </figure>
  )
}
