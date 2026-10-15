import { useEffect, useState } from 'react'
import type { Pattern } from '../types'

const INK = '#1C1916'
const HONEY = '#C9842A'
const SAND = '#E4DCD0'
const HALF_MS = 1600

type Pt = { x: number; y: number }

type Key =
  | 'head'
  | 'shoulder'
  | 'elbow'
  | 'hand'
  | 'hip'
  | 'knee'
  | 'ankle'
  | 'toe'
  | 'shoulderB'
  | 'elbowB'
  | 'handB'
  | 'hipB'
  | 'kneeB'
  | 'ankleB'
  | 'toeB'

type Pose = {
  head: Pt
  shoulder: Pt
  hip: Pt
  elbow?: Pt
  hand?: Pt
  knee?: Pt
  ankle?: Pt
  toe?: Pt
  shoulderB?: Pt
  elbowB?: Pt
  handB?: Pt
  hipB?: Pt
  kneeB?: Pt
  ankleB?: Pt
  toeB?: Pt
}

type Chain = readonly Key[]

type Spec = {
  start: Pose
  effort: Pose
  back: readonly Chain[]
  front: readonly Chain[]
  accent: readonly Chain[]
  accentJoints: readonly Key[]
  bench?: { x: number; y: number; w: number; h: number }
  load?: boolean
  torsoHoney?: boolean
}

const OPTIONAL: readonly Key[] = [
  'elbow',
  'hand',
  'knee',
  'ankle',
  'toe',
  'shoulderB',
  'elbowB',
  'handB',
  'hipB',
  'kneeB',
  'ankleB',
  'toeB',
]

const JOINTS: readonly Key[] = [
  'shoulder',
  'elbow',
  'hip',
  'knee',
  'ankle',
  'shoulderB',
  'elbowB',
  'hipB',
  'kneeB',
  'ankleB',
]

function p(x: number, y: number): Pt {
  return { x, y }
}

function mix(a: Pt, b: Pt, t: number): Pt {
  return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t }
}

function mixPose(start: Pose, effort: Pose, t: number): Pose {
  const pose: Pose = {
    head: mix(start.head, effort.head, t),
    shoulder: mix(start.shoulder, effort.shoulder, t),
    hip: mix(start.hip, effort.hip, t),
  }
  for (const key of OPTIONAL) {
    const from = start[key]
    const to = effort[key]
    if (from && to) pose[key] = mix(from, to, t)
  }
  return pose
}

function mid(a: Pt, b: Pt): Pt {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }
}

function rim(from: Pt, toward: Pt, radius = 11): Pt {
  const dx = toward.x - from.x
  const dy = toward.y - from.y
  const len = Math.hypot(dx, dy) || 1
  return { x: from.x + (dx / len) * radius, y: from.y + (dy / len) * radius }
}

function chainOf(pose: Pose, keys: Chain): Pt[] | null {
  const pts: Pt[] = []
  for (const key of keys) {
    const point = pose[key]
    if (!point) return null
    pts.push(point)
  }
  return pts
}

function Limb({ pts, honey }: { pts: Pt[]; honey?: boolean }) {
  return (
    <polyline
      points={pts.map((pt) => `${pt.x},${pt.y}`).join(' ')}
      fill="none"
      stroke={honey ? HONEY : INK}
      strokeWidth={7}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  )
}

function Torso({ pose, honey }: { pose: Pose; honey: boolean }) {
  if (pose.shoulderB && pose.hipB) {
    const collar = mid(pose.shoulder, pose.shoulderB)
    const pelvis = mid(pose.hip, pose.hipB)
    return (
      <g>
        <Limb pts={[pose.shoulder, pose.shoulderB]} />
        <Limb pts={[pose.hip, pose.hipB]} />
        <Limb pts={[collar, pelvis]} />
        <Limb pts={[rim(pose.head, collar), collar]} />
      </g>
    )
  }
  return (
    <g>
      <Limb pts={[rim(pose.head, pose.shoulder), pose.shoulder]} />
      <Limb pts={[pose.shoulder, pose.hip]} honey={honey} />
    </g>
  )
}

function Weight({ at }: { at: Pt }) {
  return (
    <line
      x1={at.x - 8}
      y1={at.y}
      x2={at.x + 8}
      y2={at.y}
      stroke={INK}
      strokeWidth={5}
      strokeLinecap="round"
    />
  )
}

const FIGURES: Record<Pattern, Spec> = {
  squat: {
    start: {
      head: p(80, 30),
      shoulder: p(78, 48),
      elbow: p(102, 56),
      hand: p(124, 50),
      hip: p(80, 94),
      knee: p(82, 126),
      ankle: p(78, 158),
      toe: p(96, 166),
    },
    effort: {
      head: p(56, 66),
      shoulder: p(62, 84),
      elbow: p(88, 74),
      hand: p(114, 66),
      hip: p(76, 124),
      knee: p(104, 140),
      ankle: p(78, 158),
      toe: p(98, 166),
    },
    back: [],
    front: [
      ['knee', 'ankle', 'toe'],
      ['shoulder', 'elbow', 'hand'],
    ],
    accent: [['hip', 'knee']],
    accentJoints: ['knee'],
  },
  thrust: {
    start: {
      head: p(38, 110),
      shoulder: p(50, 124),
      elbow: p(30, 138),
      hand: p(16, 154),
      hip: p(84, 150),
      knee: p(110, 128),
      ankle: p(116, 158),
      toe: p(134, 166),
    },
    effort: {
      head: p(38, 110),
      shoulder: p(50, 124),
      elbow: p(30, 138),
      hand: p(16, 154),
      hip: p(92, 118),
      knee: p(124, 124),
      ankle: p(120, 156),
      toe: p(138, 166),
    },
    back: [],
    front: [
      ['knee', 'ankle', 'toe'],
      ['shoulder', 'elbow', 'hand'],
    ],
    accent: [['hip', 'knee']],
    accentJoints: ['knee'],
    bench: { x: 16, y: 118, w: 60, h: 50 },
  },
  hinge: {
    start: {
      head: p(82, 30),
      shoulder: p(80, 48),
      elbow: p(68, 74),
      hand: p(66, 98),
      hip: p(82, 94),
      knee: p(84, 126),
      ankle: p(80, 158),
      toe: p(98, 166),
    },
    effort: {
      head: p(38, 88),
      shoulder: p(56, 92),
      elbow: p(62, 114),
      hand: p(74, 134),
      hip: p(100, 98),
      knee: p(86, 126),
      ankle: p(78, 158),
      toe: p(96, 166),
    },
    back: [],
    front: [
      ['knee', 'ankle', 'toe'],
      ['shoulder', 'elbow', 'hand'],
    ],
    accent: [['hip', 'knee']],
    accentJoints: ['knee'],
  },
  lunge: {
    start: {
      head: p(86, 30),
      shoulder: p(84, 48),
      elbow: p(72, 74),
      hand: p(70, 98),
      hip: p(86, 94),
      knee: p(90, 126),
      ankle: p(88, 158),
      toe: p(106, 166),
      kneeB: p(78, 128),
      ankleB: p(76, 158),
      toeB: p(92, 166),
    },
    effort: {
      head: p(80, 56),
      shoulder: p(78, 74),
      elbow: p(66, 96),
      hand: p(64, 118),
      hip: p(80, 118),
      knee: p(110, 128),
      ankle: p(108, 158),
      toe: p(126, 166),
      kneeB: p(64, 146),
      ankleB: p(36, 152),
      toeB: p(22, 166),
    },
    back: [['hip', 'kneeB', 'ankleB', 'toeB']],
    front: [
      ['knee', 'ankle', 'toe'],
      ['shoulder', 'elbow', 'hand'],
    ],
    accent: [['hip', 'knee']],
    accentJoints: ['knee'],
    bench: { x: 12, y: 72, w: 42, h: 24 },
  },
  abduction: {
    start: {
      head: p(80, 28),
      shoulder: p(58, 48),
      shoulderB: p(102, 48),
      elbow: p(44, 74),
      hand: p(40, 98),
      elbowB: p(116, 74),
      handB: p(120, 98),
      hip: p(70, 96),
      hipB: p(90, 96),
      knee: p(66, 128),
      kneeB: p(94, 128),
      ankle: p(62, 158),
      ankleB: p(98, 158),
      toe: p(50, 166),
      toeB: p(110, 166),
    },
    effort: {
      head: p(74, 28),
      shoulder: p(52, 48),
      shoulderB: p(96, 48),
      elbow: p(38, 74),
      hand: p(34, 98),
      elbowB: p(110, 76),
      handB: p(114, 100),
      hip: p(66, 98),
      hipB: p(88, 98),
      knee: p(58, 128),
      kneeB: p(110, 126),
      ankle: p(54, 158),
      ankleB: p(124, 158),
      toe: p(42, 166),
      toeB: p(136, 166),
    },
    back: [['hip', 'knee', 'ankle', 'toe']],
    front: [
      ['shoulder', 'elbow', 'hand'],
      ['shoulderB', 'elbowB', 'handB'],
    ],
    accent: [['hipB', 'kneeB', 'ankleB', 'toeB']],
    accentJoints: ['hipB', 'kneeB', 'ankleB'],
  },
  curl: {
    start: {
      head: p(32, 146),
      shoulder: p(50, 152),
      elbow: p(34, 160),
      hand: p(18, 156),
      hip: p(92, 136),
      knee: p(122, 142),
      ankle: p(148, 160),
      toe: p(156, 150),
    },
    effort: {
      head: p(32, 146),
      shoulder: p(50, 152),
      elbow: p(34, 160),
      hand: p(18, 156),
      hip: p(88, 128),
      knee: p(118, 130),
      ankle: p(122, 158),
      toe: p(132, 148),
    },
    back: [],
    front: [
      ['knee', 'ankle', 'toe'],
      ['shoulder', 'elbow', 'hand'],
    ],
    accent: [['hip', 'knee']],
    accentJoints: ['knee'],
  },
  calf: {
    start: {
      head: p(80, 30),
      shoulder: p(78, 48),
      elbow: p(66, 72),
      hand: p(64, 96),
      hip: p(80, 94),
      knee: p(82, 126),
      ankle: p(78, 158),
      toe: p(96, 166),
    },
    effort: {
      head: p(80, 16),
      shoulder: p(78, 34),
      elbow: p(66, 58),
      hand: p(64, 82),
      hip: p(80, 80),
      knee: p(86, 112),
      ankle: p(94, 144),
      toe: p(98, 166),
    },
    back: [],
    front: [
      ['hip', 'knee'],
      ['ankle', 'toe'],
      ['shoulder', 'elbow', 'hand'],
    ],
    accent: [['knee', 'ankle']],
    accentJoints: ['knee', 'ankle'],
  },
  push: {
    start: {
      head: p(36, 146),
      shoulder: p(54, 154),
      elbow: p(76, 136),
      hand: p(62, 116),
      hip: p(98, 156),
      knee: p(122, 134),
      ankle: p(116, 162),
      toe: p(134, 166),
    },
    effort: {
      head: p(36, 146),
      shoulder: p(54, 154),
      elbow: p(56, 126),
      hand: p(50, 100),
      hip: p(98, 156),
      knee: p(122, 134),
      ankle: p(116, 162),
      toe: p(134, 166),
    },
    back: [],
    front: [['hip', 'knee', 'ankle', 'toe']],
    accent: [['shoulder', 'elbow', 'hand']],
    accentJoints: ['elbow'],
    load: true,
  },
  pull: {
    start: {
      head: p(40, 86),
      shoulder: p(58, 90),
      elbow: p(66, 114),
      hand: p(70, 138),
      hip: p(102, 96),
      knee: p(88, 126),
      ankle: p(78, 158),
      toe: p(96, 166),
    },
    effort: {
      head: p(40, 86),
      shoulder: p(58, 90),
      elbow: p(84, 98),
      hand: p(98, 114),
      hip: p(102, 96),
      knee: p(88, 126),
      ankle: p(78, 158),
      toe: p(96, 166),
    },
    back: [],
    front: [['hip', 'knee', 'ankle', 'toe']],
    accent: [['shoulder', 'elbow', 'hand']],
    accentJoints: ['elbow'],
    load: true,
  },
  press: {
    start: {
      head: p(80, 30),
      shoulder: p(78, 48),
      elbow: p(100, 66),
      hand: p(88, 44),
      hip: p(80, 94),
      knee: p(82, 126),
      ankle: p(78, 158),
      toe: p(96, 166),
    },
    effort: {
      head: p(80, 30),
      shoulder: p(78, 48),
      elbow: p(98, 32),
      hand: p(102, 8),
      hip: p(80, 94),
      knee: p(82, 126),
      ankle: p(78, 158),
      toe: p(96, 166),
    },
    back: [],
    front: [['hip', 'knee', 'ankle', 'toe']],
    accent: [['shoulder', 'elbow', 'hand']],
    accentJoints: ['elbow'],
    load: true,
  },
  carry: {
    start: {
      head: p(78, 28),
      shoulder: p(76, 46),
      elbow: p(64, 70),
      hand: p(62, 96),
      elbowB: p(90, 72),
      handB: p(92, 98),
      hip: p(78, 92),
      knee: p(84, 124),
      ankle: p(80, 156),
      toe: p(98, 166),
      kneeB: p(68, 126),
      ankleB: p(64, 158),
      toeB: p(80, 166),
    },
    effort: {
      head: p(86, 28),
      shoulder: p(84, 46),
      elbow: p(72, 70),
      hand: p(70, 96),
      elbowB: p(98, 72),
      handB: p(100, 98),
      hip: p(88, 92),
      knee: p(96, 124),
      ankle: p(92, 156),
      toe: p(110, 166),
      kneeB: p(74, 114),
      ankleB: p(70, 142),
      toeB: p(84, 154),
    },
    back: [['hip', 'kneeB', 'ankleB', 'toeB']],
    front: [['hip', 'knee', 'ankle', 'toe']],
    accent: [
      ['shoulder', 'elbowB', 'handB'],
      ['shoulder', 'elbow', 'hand'],
    ],
    accentJoints: ['elbow', 'elbowB'],
    load: true,
  },
  core: {
    start: {
      head: p(42, 140),
      shoulder: p(60, 150),
      elbow: p(44, 132),
      hand: p(26, 118),
      hip: p(104, 154),
      knee: p(132, 144),
      ankle: p(154, 130),
      toe: p(158, 120),
      kneeB: p(120, 136),
      ankleB: p(114, 162),
      toeB: p(130, 166),
    },
    effort: {
      head: p(42, 140),
      shoulder: p(60, 150),
      elbow: p(80, 130),
      hand: p(96, 118),
      hip: p(104, 154),
      knee: p(122, 126),
      ankle: p(108, 110),
      toe: p(98, 104),
      kneeB: p(120, 136),
      ankleB: p(114, 162),
      toeB: p(130, 166),
    },
    back: [['hip', 'kneeB', 'ankleB', 'toeB']],
    front: [
      ['hip', 'knee', 'ankle', 'toe'],
      ['shoulder', 'elbow', 'hand'],
    ],
    accent: [],
    accentJoints: ['shoulder', 'hip'],
    torsoHoney: true,
  },
  mobility: {
    start: {
      head: p(44, 132),
      shoulder: p(60, 148),
      elbow: p(46, 158),
      hand: p(32, 158),
      hip: p(104, 152),
      knee: p(122, 130),
      ankle: p(128, 162),
      toe: p(142, 166),
      kneeB: p(108, 134),
      ankleB: p(116, 162),
      toeB: p(130, 166),
    },
    effort: {
      head: p(44, 132),
      shoulder: p(60, 148),
      elbow: p(78, 132),
      hand: p(100, 122),
      hip: p(104, 152),
      knee: p(122, 130),
      ankle: p(112, 162),
      toe: p(128, 166),
      kneeB: p(96, 116),
      ankleB: p(124, 124),
      toeB: p(136, 118),
    },
    back: [['hip', 'knee', 'ankle', 'toe']],
    front: [['shoulder', 'elbow', 'hand']],
    accent: [['hip', 'kneeB', 'ankleB', 'toeB']],
    accentJoints: ['kneeB', 'ankleB'],
  },
}

function usePoseFrame(pattern: Pattern): number {
  const [t, setT] = useState(1)

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    let frame = 0

    const stop = () => cancelAnimationFrame(frame)

    const run = () => {
      stop()
      if (media.matches) {
        setT(1)
        return
      }
      const started = performance.now()
      const tick = (now: number) => {
        const phase = ((now - started) % (HALF_MS * 2)) / HALF_MS
        const linear = phase <= 1 ? phase : 2 - phase
        const eased = 0.5 - 0.5 * Math.cos(Math.PI * linear)
        setT(eased)
        frame = requestAnimationFrame(tick)
      }
      frame = requestAnimationFrame(tick)
    }

    run()
    media.addEventListener('change', run)
    return () => {
      stop()
      media.removeEventListener('change', run)
    }
  }, [pattern])

  return t
}

export function Figure({ pattern }: { pattern: Pattern }) {
  const t = usePoseFrame(pattern)
  const spec = FIGURES[pattern]
  const pose = mixPose(spec.start, spec.effort, t)

  const draw = (chains: readonly Chain[], honey: boolean, prefix: string) =>
    chains.map((keys, index) => {
      const pts = chainOf(pose, keys)
      if (!pts) return null
      return <Limb key={`${prefix}${index}`} pts={pts} honey={honey} />
    })

  return (
    <svg
      viewBox="0 0 160 180"
      width="160"
      height="180"
      className="figure"
      aria-hidden="true"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line
        x1={14}
        y1={168}
        x2={146}
        y2={168}
        stroke={SAND}
        strokeWidth={4}
        strokeLinecap="round"
      />
      {spec.bench ? (
        <rect
          x={spec.bench.x}
          y={spec.bench.y}
          width={spec.bench.w}
          height={spec.bench.h}
          rx={4}
          fill={SAND}
        />
      ) : null}
      {draw(spec.back, false, 'b')}
      <Torso pose={pose} honey={spec.torsoHoney === true} />
      {draw(spec.front, false, 'f')}
      {draw(spec.accent, true, 'a')}
      {spec.load && pose.hand ? <Weight at={pose.hand} /> : null}
      {spec.load && pose.handB ? <Weight at={pose.handB} /> : null}
      {JOINTS.map((key) => {
        const at = pose[key]
        if (!at) return null
        const honey = spec.accentJoints.includes(key)
        return <circle key={key} cx={at.x} cy={at.y} r={4.5} fill={honey ? HONEY : INK} />
      })}
      <circle cx={pose.head.x} cy={pose.head.y} r={11} fill="none" stroke={INK} strokeWidth={7} />
    </svg>
  )
}
