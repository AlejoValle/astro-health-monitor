import { describe, expect, it } from 'vitest'
import { sourceById } from '../data/sources'
import { AREAS, NODES, type TreeNode } from '../data/symptomTree'
import { validateTree, walk } from './triage'

const outcome = (title: string, sourceIds = ['s']): TreeNode => ({
  kind: 'outcome',
  status: 'ok',
  title,
  meaning: '',
  steps: ['x'],
  escalate: false,
  sourceIds,
})

const tiny: Record<string, TreeNode> = {
  q1: { kind: 'question', text: '?', yes: 'a', no: 'q2' },
  q2: { kind: 'question', text: '?', yes: 'b', no: 'a' },
  a: outcome('A'),
  b: outcome('B'),
}

describe('walk', () => {
  it('starts at the first question', () => {
    expect(walk(tiny, 'q1', [])).toEqual(['q1'])
  })

  it('follows the answers to an outcome', () => {
    expect(walk(tiny, 'q1', ['no', 'yes'])).toEqual(['q1', 'q2', 'b'])
  })

  it('stops at an outcome even if more answers are given', () => {
    expect(walk(tiny, 'q1', ['yes', 'no', 'no'])).toEqual(['q1', 'a'])
  })
})

describe('validateTree', () => {
  const known = (id: string) => id === 's'

  it('accepts a well-formed tree', () => {
    expect(validateTree(tiny, ['q1'], known)).toEqual([])
  })

  it('reports missing nodes, loops, orphans and unknown sources', () => {
    const broken: Record<string, TreeNode> = {
      q1: { kind: 'question', text: '?', yes: 'gone', no: 'q1' },
      orphan: outcome('O', ['nope']),
    }
    const problems = validateTree(broken, ['q1'], known).map((p) => `${p.nodeId}: ${p.problem}`)
    expect(problems).toEqual([
      'gone: missing node, linked from q1',
      'q1: loop',
      'orphan: unreachable',
      'orphan: unknown source nope',
    ])
  })
})

describe('symptom tree data', () => {
  it('is structurally valid and every outcome cites a known source', () => {
    const problems = validateTree(
      NODES,
      AREAS.map((a) => a.start),
      (id) => sourceById(id) !== undefined,
    )
    expect(problems).toEqual([])
  })

  it('escalates every alert outcome', () => {
    const silent = Object.entries(NODES).filter(([, n]) => n.kind === 'outcome' && n.status === 'alert' && !n.escalate)
    expect(silent).toEqual([])
  })

  it('sends the classic heart attack signs to the emergency outcome', () => {
    expect(walk(NODES, 'chest-pressure', ['yes']).at(-1)).toBe('out-heart')
    expect(walk(NODES, 'chest-pressure', ['no', 'yes']).at(-1)).toBe('out-heart')
    expect(walk(NODES, 'chest-pressure', ['no', 'no', 'yes']).at(-1)).toBe('out-heart')
  })

  it('sends a fever lasting over 48 hours to the serious infection outcome', () => {
    expect(walk(NODES, 'body-fever', ['yes', 'no', 'yes']).at(-1)).toBe('out-serious-infection')
  })
})
