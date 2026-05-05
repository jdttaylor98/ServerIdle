// Research nodes — spent with Research Points (RP) for in-run permanent buffs.
// Lost on prestige. Coexists with the cross-run Skill Tree.

class ResearchNode {
  final String id;
  final String name;
  final String description;
  final int cost; // RP
  final List<String> prereqs;

  const ResearchNode({
    required this.id,
    required this.name,
    required this.description,
    required this.cost,
    required this.prereqs,
  });
}

const List<ResearchNode> researchNodes = [
  ResearchNode(
    id: 'distributed_computing',
    name: 'Distributed Computing',
    description: 'Research Points gain ×2',
    cost: 10,
    prereqs: [],
  ),
  ResearchNode(
    id: 'predictive_scaling',
    name: 'Predictive Scaling',
    description: 'All server and cluster output ×1.10',
    cost: 25,
    prereqs: [],
  ),
  ResearchNode(
    id: 'smart_caching',
    name: 'Smart Caching',
    description: 'PROVISION tap flops ×2',
    cost: 75,
    prereqs: ['distributed_computing'],
  ),
  ResearchNode(
    id: 'liquid_nitrogen',
    name: 'Liquid Nitrogen Cooling',
    description: 'Cooling capacity ×1.5',
    cost: 200,
    prereqs: ['predictive_scaling'],
  ),
  ResearchNode(
    id: 'power_optimization',
    name: 'Power Optimization',
    description: 'Server power draw −20%',
    cost: 500,
    prereqs: ['liquid_nitrogen'],
  ),
  ResearchNode(
    id: 'cuda_drivers',
    name: 'CUDA Drivers',
    description: 'Unlock the GPU screen — build GPU Nodes and AI Clusters',
    cost: 1500,
    prereqs: ['power_optimization', 'smart_caching'],
  ),
];

// ─── Availability check ───

bool isResearchAvailable(
  ResearchNode node,
  Map<String, bool> purchased,
) {
  return node.prereqs.every((id) => purchased[id] == true);
}

// ─── Effect helpers ───

double getResearchOutputMultiplier(Map<String, bool> research) {
  return research['predictive_scaling'] == true ? 1.10 : 1;
}

double getResearchClickMultiplier(Map<String, bool> research) {
  return research['smart_caching'] == true ? 2 : 1;
}

double getResearchRpMultiplier(Map<String, bool> research) {
  return research['distributed_computing'] == true ? 2 : 1;
}

double getResearchCoolingMultiplier(Map<String, bool> research) {
  return research['liquid_nitrogen'] == true ? 1.5 : 1;
}

double getResearchPowerDrawMultiplier(Map<String, bool> research) {
  return research['power_optimization'] == true ? 0.8 : 1;
}

bool isResearchNavVisible(bool researchLabOwned, double researchPoints) {
  return researchLabOwned || researchPoints > 0;
}
