import React, { useState, useEffect } from 'react';
import { Sidebar, NavTab } from './components/Sidebar';
import { Header } from './components/Header';
import { OverviewView } from './views/OverviewView';
import { ContractComparisonView } from './views/ContractComparisonView';
import { HistoricalAnalysisView } from './views/HistoricalAnalysisView';
import { SignalMonitorView } from './views/SignalMonitorView';
import { MethodologyView } from './views/MethodologyView';
import { SettingsView } from './views/SettingsView';
import { ImportDataModal } from './components/ImportDataModal';
import {
  fetchStatus,
  fetchContracts,
  fetchComparisonMatrix,
  fetchComparison,
  fetchSignals
} from './services/api';
import {
  ContractSpec,
  ComparisonMatrixItem,
  ComparisonSummary,
  SignalItem,
  DataStatus
} from './types';
import { AlertCircle, RefreshCw } from 'lucide-react';

export const App: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<NavTab>('overview');
  const [benchmarkSymbol, setBenchmarkSymbol] = useState<string>('GOLDM');
  const [targetSymbol, setTargetSymbol] = useState<string>('GOLDPETAL');
  const [lookback, setLookback] = useState<number>(20);
  const [zThreshold, setZThreshold] = useState<number>(1.5);

  // Data states
  const [status, setStatus] = useState<DataStatus | null>(null);
  const [contracts, setContracts] = useState<ContractSpec[]>([]);
  const [matrix, setMatrix] = useState<ComparisonMatrixItem[]>([]);
  const [comparison, setComparison] = useState<ComparisonSummary | null>(null);
  const [signals, setSignals] = useState<SignalItem[]>([]);

  // UI state
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState<boolean>(false);

  const loadAllData = async (isRefresh: boolean = false) => {
    if (isRefresh) setIsRefreshing(true);
    else setIsLoading(true);
    setErrorMsg(null);

    try {
      const [statusRes, contractsRes, matrixRes, compRes, sigRes] = await Promise.all([
        fetchStatus(),
        fetchContracts(),
        fetchComparisonMatrix(benchmarkSymbol),
        fetchComparison(benchmarkSymbol, targetSymbol, lookback),
        fetchSignals(benchmarkSymbol, zThreshold, lookback)
      ]);

      setStatus(statusRes);
      setContracts(contractsRes.contracts);
      setMatrix(matrixRes.matrix);
      setComparison(compRes);
      setSignals(sigRes.signals);
    } catch (err: any) {
      console.error("Data load error:", err);
      setErrorMsg(err.message || 'Failed to connect to GoldLens analytical backend.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, [benchmarkSymbol, targetSymbol, lookback, zThreshold]);

  const handleSelectContractFromTable = (sym: string) => {
    setTargetSymbol(sym);
    setCurrentTab('comparison');
  };

  return (
    <div className="min-h-screen bg-[#191919] p-2 md:p-6 lg:p-8 flex items-center justify-center font-sans">
      {/* Centered Dashboard Shell matching Channel Analytics reference */}
      <div className="w-full max-w-[1440px] min-h-[92vh] glass-shell rounded-[28px] md:rounded-[36px] overflow-hidden flex flex-col md:flex-row relative">
        
        {/* Narrow Black Vertical Sidebar */}
        <Sidebar
          currentTab={currentTab}
          onSelectTab={setCurrentTab}
          unreadSignalsCount={signals.filter((s) => s.severity === 'HIGH_DEVIATION').length}
        />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 bg-[#191919]/60 overflow-y-auto max-h-[92vh]">
          {/* Header */}
          <Header
            status={status}
            benchmark={benchmarkSymbol}
            onBenchmarkChange={setBenchmarkSymbol}
            lookback={lookback}
            onLookbackChange={setLookback}
            onOpenImport={() => setIsImportModalOpen(true)}
            onRefresh={() => loadAllData(true)}
            isRefreshing={isRefreshing}
          />

          {/* View Container */}
          <main className="p-4 md:p-8 flex-1">
            {isLoading ? (
              <div className="h-[60vh] flex flex-col items-center justify-center gap-4">
                <div className="w-12 h-12 rounded-full border-2 border-[#D1B15F] border-t-transparent animate-spin" />
                <span className="text-zinc-400 text-sm font-medium">
                  Loading GoldLens Commodity Intelligence Engine...
                </span>
              </div>
            ) : errorMsg ? (
              <div className="p-8 rounded-[24px] glass-card border border-rose-500/30 text-center max-w-lg mx-auto my-12">
                <AlertCircle className="w-12 h-12 text-rose-400 mx-auto mb-3" />
                <h3 className="text-lg font-bold text-white mb-2 font-display">Connection Notice</h3>
                <p className="text-xs text-zinc-300 mb-6">{errorMsg}</p>
                <button
                  onClick={() => loadAllData()}
                  className="px-6 py-2.5 rounded-full bg-gradient-to-r from-[#D1B15F] to-[#B8933D] text-black font-semibold text-xs tracking-wide hover:brightness-110 active:scale-95 transition-all"
                >
                  Retry Connection
                </button>
              </div>
            ) : (
              <>
                {currentTab === 'overview' && (
                  <OverviewView
                    status={status}
                    matrix={matrix}
                    comparison={comparison}
                    signals={signals}
                    targetSymbol={targetSymbol}
                    onTargetChange={setTargetSymbol}
                    benchmarkSymbol={benchmarkSymbol}
                    onSelectContract={handleSelectContractFromTable}
                    onExplore={() => setCurrentTab('comparison')}
                    onOpenMethodology={() => setCurrentTab('methodology')}
                  />
                )}

                {currentTab === 'comparison' && (
                  <ContractComparisonView
                    contracts={contracts}
                    matrix={matrix}
                    benchmarkSymbol={benchmarkSymbol}
                    targetSymbol={targetSymbol}
                    onTargetChange={setTargetSymbol}
                    lookback={lookback}
                  />
                )}

                {currentTab === 'historical' && (
                  <HistoricalAnalysisView
                    comparison={comparison}
                    benchmarkSymbol={benchmarkSymbol}
                    targetSymbol={targetSymbol}
                    onTargetChange={setTargetSymbol}
                    lookback={lookback}
                  />
                )}

                {currentTab === 'signals' && (
                  <SignalMonitorView
                    signals={signals}
                    benchmarkSymbol={benchmarkSymbol}
                    zThreshold={zThreshold}
                    onThresholdChange={setZThreshold}
                    lookback={lookback}
                  />
                )}

                {currentTab === 'methodology' && (
                  <MethodologyView contracts={contracts} />
                )}

                {currentTab === 'settings' && (
                  <SettingsView
                    status={status}
                    onOpenImport={() => setIsImportModalOpen(true)}
                    onRefreshData={() => loadAllData(true)}
                    isRefreshing={isRefreshing}
                  />
                )}
              </>
            )}
          </main>
        </div>
      </div>

      {/* CSV Import Modal */}
      <ImportDataModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImportSuccess={() => loadAllData(true)}
      />
    </div>
  );
};
