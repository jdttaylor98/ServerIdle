// Research nodes — spent with Research Points (RP) for in-run permanent buffs.
// Lost on prestige (Phase 6). Coexists with the cross-run Skill Tree.

export interface ResearchNode {
  id: string;
  name: string;
  description: string;
  cost: number; // RP
  prereqs: string[];
}

export const RESEARCH_NODES: ResearchNode[] = [
  {
    id: 'distributed_computing',
    name: 'Distributed Computing',
    description: 'Research Points gain ×2',
    cost: 10,
    prereqs: [],
  },
  {
    id: 'predictive_scaling',
    name: 'Predictive Scaling',
    description: 'All server and cluster output ×1.10',
    cost: 25,
    prereqs: [],
  },
  {
    id: 'smart_caching',
    name: 'Smart Caching',
    description: 'PROVISION tap credits ×2',
    cost: 75,
    prereqs: ['distributed_computing'],
  },
  {
    id: 'liquid_nitrogen',
    name: 'Liquid Nitrogen Cooling',
    description: 'Cooling capacity ×1.5',
    cost: 200,
    prereqs: ['predictive_scaling'],
  },
  {
    id: 'power_optimization',
    name: 'Power Optimization',
    description: 'Server power draw −20%',
    cost: 500,
    prereqs: ['liquid_nitrogen'],
  },
  {
    id: 'cuda_drivers',
    name: 'CUDA Drivers',
    description: 'Reveals the GPU tier (Phase 6 preview — no effect yet)',
    cost: 1500,
    prereqs: ['power_optimization', 'smart_caching'],
  },
];

export function isResearchAvailable(
  node: ResearchNode,
  purchased: Record<string, boolean>
): boolean {
  return node.prereqs.every((id) => purchased[id]);
}

// ─── Effect helpers ───

export function getResearchOutputMultiplier(
  research: Record<string, boolean>
): number {
  return research['predictive_scaling'] ? 1.10 : 1;
}

export function getResearchClickMultiplier(
  research: Record<string, boolean>
): number {
  return research['smart_caching'] ? 2 : 1;
}

export function getResearchRpMultiplier(
  research: Record<string, boolean>
): number {
  return research['distributed_computing'] ? 2 : 1;
}

export function getResearchCoolingMultiplier(
  research: Record<string, boolean>
): number {
  return research['liquid_nitrogen'] ? 1.5 : 1;
}

export function getResearchPowerDrawMultiplier(
  research: Record<string, boolean>
): number {
  return research['power_optimization'] ? 0.8 : 1;
}

export function isResearchNavVisible(
  researchLabOwned: boolean,
  researchPoints: number
): boolean {
  return researchLabOwned || researchPoints > 0;
}
