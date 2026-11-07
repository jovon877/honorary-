export interface CriterionResult {
  criterionId: string;
  passed: boolean;
  safetyGate: boolean;
  weight: number;
}

export interface AttemptRecord {
  attemptId: string;
  scenarioId: string;
  seed: number;
  criteria: readonly CriterionResult[];
}

export interface AttemptScore {
  pointsEarned: number;
  pointsPossible: number;
  percent: number;
  passed: boolean;
}

export function scoreAttempt(attempt: AttemptRecord, passingPercent = 80): AttemptScore {
  const ordered = [...attempt.criteria].sort((a, b) => a.criterionId.localeCompare(b.criterionId));
  const pointsPossible = ordered.reduce((sum, item) => sum + item.weight, 0);
  const pointsEarned = ordered.reduce((sum, item) => sum + (item.passed ? item.weight : 0), 0);
  const safetyPassed = ordered.filter((item) => item.safetyGate).every((item) => item.passed);
  const percent =
    pointsPossible === 0 ? 0 : Math.round((pointsEarned / pointsPossible) * 10_000) / 100;
  return {
    pointsEarned,
    pointsPossible,
    percent,
    passed: safetyPassed && percent >= passingPercent,
  };
}
