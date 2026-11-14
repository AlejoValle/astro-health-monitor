import type { OutcomeNode, QuestionNode, TreeNode } from '../data/symptomTree'

export type Answer = 'yes' | 'no'

/** Walks a tree from `start` following `answers`; returns every node visited, last one being the current node. */
export function walk(nodes: Record<string, TreeNode>, start: string, answers: Answer[]): string[] {
  const path = [start]
  for (const answer of answers) {
    const node = nodes[path[path.length - 1]]
    if (!node || node.kind !== 'question') break
    path.push(node[answer])
  }
  return path
}

export interface TreeProblem {
  nodeId: string
  problem: string
}

/** Structural check: every link resolves, no loops, every path ends in an outcome, nothing is orphaned. */
export function validateTree(
  nodes: Record<string, TreeNode>,
  starts: string[],
  knownSource: (id: string) => boolean,
): TreeProblem[] {
  const problems: TreeProblem[] = []
  const reached = new Set<string>()

  const visit = (id: string, trail: string[]) => {
    const node = nodes[id]
    if (!node) return problems.push({ nodeId: id, problem: `missing node, linked from ${trail.at(-1) ?? 'start'}` })
    if (trail.includes(id)) return problems.push({ nodeId: id, problem: 'loop' })
    reached.add(id)
    if (node.kind === 'question') {
      visit(node.yes, [...trail, id])
      visit(node.no, [...trail, id])
    }
  }
  starts.forEach((start) => visit(start, []))

  for (const [id, node] of Object.entries(nodes)) {
    if (!reached.has(id)) problems.push({ nodeId: id, problem: 'unreachable' })
    if (node.kind !== 'outcome') continue
    if (node.steps.length === 0) problems.push({ nodeId: id, problem: 'no steps' })
    if (node.sourceIds.length === 0) problems.push({ nodeId: id, problem: 'no source' })
    for (const sourceId of node.sourceIds)
      if (!knownSource(sourceId)) problems.push({ nodeId: id, problem: `unknown source ${sourceId}` })
  }
  return problems
}

export const isOutcome = (node: TreeNode): node is OutcomeNode => node.kind === 'outcome'
export const isQuestion = (node: TreeNode): node is QuestionNode => node.kind === 'question'
