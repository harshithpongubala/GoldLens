import React from 'react';
import { HeroCard } from '../components/HeroCard';
import { RelativePriceChart } from '../components/RelativePriceChart';
import { MarketInsightsCard } from '../components/MarketInsightsCard';
import { ComparisonTable } from '../components/ComparisonTable';
import {
  ComparisonMatrixItem,
  ComparisonSummary,
  SignalItem,
  DataStatus
} from '../types';

interface OverviewViewProps {
  status: DataStatus | null;
  matrix: ComparisonMatrixItem[];
  comparison: ComparisonSummary | null;
  signals: SignalItem[];
  targetSymbol: string;
  onTargetChange: (target: string) => void;
  benchmarkSymbol: string;
  onSelectContract: (symbol: string) => void;
  onExplore: () => void;
  onOpenMethodology: () => void;
}

export const OverviewView: React.FC<OverviewViewProps> = ({
  status,
  matrix,
  comparison,
  signals,
  targetSymbol,
  onTargetChange,
  benchmarkSymbol,
  onSelectContract,
  onExplore,
  onOpenMethodology
}) => {
  return (
    <div className="space-y-6">
      {/* Top Asymmetrical Grid (Matches Channel Analytics reference layout) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Large Feature Card (Left Column - 7 cols) */}
        <div className="lg:col-span-7">
          <HeroCard
            onExplore={onExplore}
            matrix={matrix}
            signals={signals}
            latestDate={status?.end_date || 'Oct 2026'}
          />
        </div>

        {/* Right Stack (Right Column - 5 cols: Chart on top, Insights on bottom) */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          <RelativePriceChart
            comparison={comparison}
            targetSymbol={targetSymbol}
            onTargetChange={onTargetChange}
            benchmarkSymbol={benchmarkSymbol}
          />
          <MarketInsightsCard
            comparison={comparison}
            matrix={matrix}
            targetSymbol={targetSymbol}
          />
        </div>
      </div>

      {/* Wide Rounded Comparison Table Below the Cards */}
      <ComparisonTable
        matrix={matrix}
        benchmarkSymbol={benchmarkSymbol}
        onSelectContract={onSelectContract}
        onOpenMethodology={onOpenMethodology}
      />
    </div>
  );
};
