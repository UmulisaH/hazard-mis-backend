export interface TrainingRecord {
  id: string;
  title: string;
  description: string;
  reported_at: string;
  department_name: string;
  institution_name: string;
  hazard_category: string;
  severity_level: string;
  recurrence_count: number;
  is_weekend: number;
  actual_outcome: number;
}

export interface ModelPatterns {
  categoryRisk: Record<string, { rate: number; count: number }>;
  severityRisk: Record<string, { rate: number; count: number }>;
  recurrenceRisk: Record<string, { rate: number; count: number }>;
}

export interface ModelData {
  version: string;
  trainedAt: string;
  totalRecords: number;
  patterns: ModelPatterns;
  categoryMap: Record<string, number>;
  severityWeights: Record<string, number>;
}

export interface PredictionResult {
  priority: 'High' | 'Medium' | 'Low';
  confidence: number;
}
