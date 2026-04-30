/*Copyright 2026 Google LLC

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

      http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

export const calculateGrowthMetrics = (searchVolumes: number[]) => {
  const latest = searchVolumes[searchVolumes.length - 1] || 0;
  const prevMonth = searchVolumes[searchVolumes.length - 2] || 0;
  const prevYear = searchVolumes[searchVolumes.length - 13] || 0;

  const yoy = prevYear !== 0 ? (latest - prevYear) / prevYear : 0;
  const mom = prevMonth !== 0 ? (latest - prevMonth) / prevMonth : 0;

  const totalSum = searchVolumes.reduce((a, b) => a + b, 0);
  const avg = searchVolumes.length > 0 ? totalSum / searchVolumes.length : 0;
  const latest_vs_avg = avg !== 0 ? (latest - avg) / avg : 0;

  const historyWithoutLatest = searchVolumes.slice(0, -1);
  const max =
    historyWithoutLatest.length > 0 ? Math.max(...historyWithoutLatest) : 0;
  const latest_vs_max = max !== 0 ? (latest - max) / max : 0;

  const last3Months = searchVolumes.slice(-3);
  const prevMonths = searchVolumes.slice(-24, -3);
  const avgLast3 =
    last3Months.length > 0
      ? last3Months.reduce((a, b) => a + b, 0) / last3Months.length
      : 0;
  const avgPrev =
    prevMonths.length > 0
      ? prevMonths.reduce((a, b) => a + b, 0) / prevMonths.length
      : 0;
  const three_months_vs_avg =
    avgPrev !== 0 ? (avgLast3 - avgPrev) / avgPrev : 0;

  return {
    yoy,
    mom,
    latest_vs_avg,
    latest_vs_max,
    three_months_vs_avg,
  };
};

export const calculateKeywordGrowth = (
  ideas: Record<string, number[]>,
  growthMetric = 'three_months_vs_avg',
): [string, number][] => {
  return Object.entries(ideas).map(([idea, searchVolume]) => {
    const history = searchVolume as number[];
    const metrics = calculateGrowthMetrics(history);
    const metricValue = metrics[growthMetric as keyof typeof metrics];
    return [idea, metricValue !== undefined ? metricValue : 0];
  });
};
