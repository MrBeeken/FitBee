import { useState } from 'react'
import { Figure } from '../components/Figure'
import { exercises } from '../data/exercises'
import { templatesFor } from '../data/program'
import { useStore } from '../state/Store'
import type { DayTemplate, Exercise, Muscle } from '../types'

const FILTERS = [
  ['all', 'All'],
  ['lower', 'Glutes & legs'],
  ['glutes', 'Glutes'],
  ['quads', 'Quads'],
  ['hamstrings', 'Hamstrings'],
  ['upper', 'Upper'],
  ['core', 'Core'],
  ['mobility', 'Mobility'],
] as const

type Filter = (typeof FILTERS)[number][0]

const FOCUS_ORDER: readonly Exercise['focus'][] = ['glute', 'leg', 'core', 'upper', 'mobility']

const LOWER_MUSCLES: readonly Muscle[] = ['glutes', 'quads', 'hamstrings', 'calves']

function matchesFilter(exercise: Exercise, filter: Filter): boolean {
  switch (filter) {
    case 'all':
      return true
    case 'lower':
      if (exercise.focus === 'mobility') return false
      return (
        exercise.focus === 'glute' ||
        exercise.focus === 'leg' ||
        exercise.muscles.some((muscle) => LOWER_MUSCLES.includes(muscle))
      )
    case 'glutes':
      return exercise.muscles.includes('glutes') && exercise.focus !== 'mobility'
    case 'quads':
      return exercise.muscles.includes('quads')
    case 'hamstrings':
      return exercise.muscles.includes('hamstrings')
    case 'upper':
      return exercise.focus === 'upper'
    case 'core':
      return exercise.focus === 'core'
    case 'mobility':
      return exercise.focus === 'mobility'
  }
}

function matchesQuery(exercise: Exercise, query: string): boolean {
  const needle = query.trim().toLowerCase()
  if (needle.length === 0) return true
  if (exercise.name.toLowerCase().includes(needle)) return true
  return exercise.muscles.some((muscle) => muscle.toLowerCase().includes(needle))
}

function compareMoves(a: Exercise, b: Exercise): number {
  const byFocus = FOCUS_ORDER.indexOf(a.focus) - FOCUS_ORDER.indexOf(b.focus)
  if (byFocus !== 0) return byFocus
  return a.name.localeCompare(b.name)
}

function scheduledOn(templates: readonly DayTemplate[], exerciseId: string): string[] {
  const names: string[] = []
  for (const template of templates) {
    const listed = template.blocks.some((block) => block.exerciseId === exerciseId)
    if (listed && !names.includes(template.name)) names.push(template.name)
  }
  return names
}

export function LibraryScreen({ onOpen }: { onOpen: (id: string) => void }) {
  const { data } = useStore()
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<Filter>('lower')
  const templates = templatesFor(Math.min(5, Math.max(2, data.profile.days.length || 4)))
  const moves = exercises
    .filter((exercise) => matchesFilter(exercise, filter) && matchesQuery(exercise, query))
    .sort(compareMoves)

  return (
    <div className="screen">
      <header className="screen-head">
        <p className="kicker">Moves</p>
        <h1>The library</h1>
        <p>Glutes and legs are listed first. Open any move for where it happens and how it should look.</p>
      </header>
      <input
        className="field"
        type="search"
        value={query}
        placeholder="Search moves"
        aria-label="Search moves"
        onChange={(event) => setQuery(event.target.value)}
      />
      <div className="chips" role="tablist">
        {FILTERS.map(([id, label]) => {
          const selected = filter === id
          return (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={selected}
              className={selected ? 'chip on' : 'chip'}
              onClick={() => setFilter(id)}
            >
              {label}
            </button>
          )
        })}
      </div>
      <div className="stack">
        {moves.length === 0 ? (
          <p className="quiet">Nothing matches that.</p>
        ) : (
          moves.map((exercise) => {
            const days = scheduledOn(templates, exercise.id)
            return (
              <button
                key={exercise.id}
                type="button"
                className="card exercise-row"
                onClick={() => onOpen(exercise.id)}
              >
                <Figure pattern={exercise.pattern} />
                <span>
                  <span className="name">{exercise.name}</span>
                  <span>{exercise.muscles.join(' · ')}</span>
                  {days.length > 0 ? <span className="quiet">On {days.join(', ')}</span> : null}
                </span>
              </button>
            )
          })
        )}
      </div>
    </div>
  )
}
