export const MOCK_HYPOTHESIS = "A paper-based electrochemical biosensor functionalized with anti-CRP antibodies will detect C-reactive protein in whole blood at concentrations below 0.5 mg/L within 10 minutes, matching laboratory ELISA sensitivity without requiring sample preprocessing.";

export interface ParsedStructure {
  intervention: string;
  outcome: string;
  mechanism: string;
  control: string;
}

export const MOCK_PARSED: ParsedStructure = {
  intervention: "Paper-based electrochemical biosensor with anti-CRP antibody functionalization",
  outcome: "Detection of CRP below 0.5 mg/L within 10 minutes",
  mechanism: "Antibody-antigen binding generates measurable electrochemical signal without preprocessing",
  control: "Standard laboratory ELISA assay on same blood samples",
};

export type NoveltyState = "novel" | "similar" | "match";

export interface Reference {
  title: string;
  authors: string;
  year: number;
  doi: string;
}

export interface LiteratureData {
  novelty: NoveltyState;
  references: Reference[];
}

export const MOCK_LITERATURE: LiteratureData = {
  novelty: "similar",
  references: [
    { title: "Electrochemical immunosensors for C-reactive protein detection", authors: "Chen et al.", year: 2022, doi: "10.1016/j.bios.2022.114301" },
    { title: "Paper-based lateral flow assays for CRP in point-of-care settings", authors: "Karpik et al.", year: 2021, doi: "10.1039/d1lc00234a" },
    { title: "Antibody-functionalized biosensors for inflammatory biomarker detection", authors: "Sharma & Liu", year: 2023, doi: "10.1021/acs.analchem.3c01452" },
  ],
};

export interface ProtocolStep {
  number: number;
  title: string;
  description: string;
  source: string | null;
}

export const MOCK_STEPS: ProtocolStep[] = [
  { number: 1, title: "Electrode preparation", description: "Cut Whatman Grade 1 filter paper into 2×3 cm strips. Apply carbon ink electrode using screen printing method. Cure at 80°C for 20 minutes.", source: "protocols.io: dx.doi.org/10.17504/protocols.io.bvt8n6rw" },
  { number: 2, title: "Antibody functionalization", description: "Incubate electrode surface with 10 μg/mL anti-CRP monoclonal antibody (Abcam ab109452) in PBS pH 7.4 at 4°C overnight.", source: null },
  { number: 3, title: "Blocking", description: "Block non-specific binding with 1% BSA in PBS for 1 hour at room temperature. Wash 3× with PBST.", source: "protocols.io: dx.doi.org/10.17504/protocols.io.bvt8n6rw" },
  { number: 4, title: "Sample application", description: "Apply 20 μL whole blood sample directly to sensor surface. Allow 10-minute incubation at room temperature without preprocessing.", source: null },
  { number: 5, title: "Electrochemical measurement", description: "Connect to potentiostat. Run differential pulse voltammetry from -0.5V to +0.5V. Record peak current at -0.2V vs Ag/AgCl reference.", source: null },
  { number: 6, title: "Data analysis", description: "Plot calibration curve of current vs CRP concentration (0.1–10 mg/L). Determine LOD using 3σ/slope method.", source: null },
];

export interface Material {
  item: string;
  catalog: string;
  supplier: string;
  status: "verified" | "verify";
}

export const MOCK_MATERIALS: Material[] = [
  { item: "Anti-CRP monoclonal antibody", catalog: "ab109452", supplier: "Abcam", status: "verified" },
  { item: "Whatman Grade 1 filter paper", catalog: "1001-090", supplier: "Cytiva", status: "verified" },
  { item: "Carbon screen-printing ink", catalog: "CI-2051", supplier: "Engineered Conductive Materials", status: "verify" },
  { item: "Bovine serum albumin (BSA)", catalog: "A2153-50G", supplier: "Sigma-Aldrich", status: "verified" },
  { item: "Phosphate buffered saline pH 7.4", catalog: "10010023", supplier: "Thermo Fisher", status: "verified" },
  { item: "Potentiostat (portable)", catalog: "STAT-e", supplier: "Zimmer & Peacock", status: "verify" },
  { item: "Ag/AgCl reference electrode ink", catalog: "5872", supplier: "Henkel", status: "verify" },
];

export interface BudgetLineItem {
  item: string;
  qty: number;
  unit: number;
  total: number;
  verified: boolean;
}

export interface BudgetData {
  total: number;
  reagents: number;
  equipment: number;
  consumables: number;
  lineItems: BudgetLineItem[];
}

export const MOCK_BUDGET: BudgetData = {
  total: 4820,
  reagents: 1240,
  equipment: 3200,
  consumables: 380,
  lineItems: [
    { item: "Anti-CRP monoclonal antibody", qty: 1, unit: 100, total: 100, verified: true },
    { item: "Whatman filter paper (500 sheets)", qty: 1, unit: 45, total: 45, verified: true },
    { item: "Carbon ink (100g)", qty: 1, unit: 380, total: 380, verified: false },
    { item: "BSA (50g)", qty: 1, unit: 62, total: 62, verified: true },
    { item: "PBS tablets (100 tabs)", qty: 2, unit: 28, total: 56, verified: true },
    { item: "Potentiostat rental (4 weeks)", qty: 4, unit: 200, total: 800, verified: false },
    { item: "Screen printing equipment", qty: 1, unit: 2400, total: 2400, verified: false },
    { item: "Miscellaneous consumables", qty: 1, unit: 977, total: 977, verified: false },
  ],
};

export interface TimelineTask {
  name: string;
  start: number;
  duration: number;
  critical: boolean;
}

export interface TimelineData {
  minWeeks: number;
  criticalCount: number;
  tasks: TimelineTask[];
}

export const MOCK_TIMELINE: TimelineData = {
  minWeeks: 7,
  criticalCount: 4,
  tasks: [
    { name: "Electrode fabrication", start: 0, duration: 1, critical: true },
    { name: "Antibody functionalization", start: 1, duration: 1, critical: true },
    { name: "Blocking + washing", start: 2, duration: 0.5, critical: true },
    { name: "Calibration curve", start: 2.5, duration: 1.5, critical: false },
    { name: "Sample collection (n=30)", start: 2, duration: 2, critical: false },
    { name: "Measurement trials", start: 4, duration: 2, critical: true },
    { name: "Data analysis + LOD calc", start: 6, duration: 1, critical: false },
  ],
};

export interface ValidationData {
  endpoint: string;
  stat_test: string;
  sample_size: string;
  negative_criteria: string;
}

export const MOCK_VALIDATION: ValidationData = {
  endpoint: "Peak current (μA) at -0.2V vs Ag/AgCl measured by differential pulse voltammetry correlating with CRP concentration in blood",
  stat_test: "Linear regression for calibration curve (R²); paired t-test comparing sensor LOD vs ELISA LOD (α=0.05, two-tailed)",
  sample_size: "n=30 blood samples across 3 CRP concentration ranges (low: <0.5 mg/L, medium: 0.5–3 mg/L, high: >3 mg/L). Power analysis: 80% power at α=0.05 requires minimum n=24. Using n=30 for 20% buffer.",
  negative_criteria: "If sensor LOD exceeds 0.5 mg/L, or if coefficient of variation across replicates exceeds 15%, or if R² of calibration curve falls below 0.95 — the biosensor does not meet the stated performance threshold and the hypothesis is not supported.",
};

export interface Conflict {
  resolved: boolean;
  text: string;
}

export const MOCK_CONFLICTS: Conflict[] = [
  { resolved: true, text: "Timeline assumed 2-day antibody delivery. Abcam ab109452 ships in 5–7 business days. Week 1 buffer added." },
  { resolved: true, text: "Budget did not include Ag/AgCl reference ink. Added Henkel 5872 at $97 to materials and budget." },
  { resolved: false, text: "Carbon ink CI-2051 requires screen printing equipment not listed in materials. Add ECM screen printer ($2,400 purchase or $200/day rental) or identify a core facility." },
];

export interface PlanData {
  hypothesis: string;
  parsed: ParsedStructure;
  literature: LiteratureData;
  steps: ProtocolStep[];
  materials: Material[];
  budget: BudgetData;
  timeline: TimelineData;
  validation: ValidationData;
  conflicts: Conflict[];
}

export const buildMockPlan = (hypothesis: string): PlanData => ({
  hypothesis,
  parsed: MOCK_PARSED,
  literature: MOCK_LITERATURE,
  steps: MOCK_STEPS,
  materials: MOCK_MATERIALS,
  budget: MOCK_BUDGET,
  timeline: MOCK_TIMELINE,
  validation: MOCK_VALIDATION,
  conflicts: MOCK_CONFLICTS,
});