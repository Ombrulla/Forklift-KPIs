"use client";

import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { 
  Activity, 
  Battery, 
  Clock, 
  AlertTriangle,
  Zap,
  Gauge,
  Droplet,
  Power,
  RotateCcw,
  Truck,
  Wind,
  Settings,
  TrendingDown,
  Navigation,
  BarChart3,
  ShieldAlert
} from "lucide-react";
import KPICard from "../components/KPICard";
import DashboardCharts from "../components/DashboardCharts";
import LineChartIdle from "../components/LineChartIdle";
import BarChartMisuse from "../components/BarChartMisuse";
import PieChartUsage from "../components/PieChartUsage";
import AnomalyTable from "../components/AnomalyTable";
import KPIDropdown, { KPIItem } from "../components/KPIDropdown";

const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const API_BASE = baseUrl.endsWith("/api") ? baseUrl : `${baseUrl.replace(/\/$/, "")}/api`;

const KPI_LIST: KPIItem[] = [
  { id: "kpi-runtime", name: "Runtime Hours", isActive: true },
  { id: "kpi-idle", name: "Idle Hours", isActive: true },
  { id: "kpi-soc", name: "Battery SoC Decline", isActive: true },
  { id: "kpi-hydraulic", name: "Hydraulic Usage", isActive: true },
  { id: "kpi-traction", name: "Traction Usage", isActive: true },
  { id: "kpi-handbrake", name: "Handbrake Misuse KPI", isActive: true },
  { id: "kpi-hydraulic-load", name: "Hydraulic Load Factor", isActive: true },
  { id: "kpi-steering-activity", name: "Steering Activity Index", isActive: true },
  { id: "kpi-rolling-idle", name: "Rolling Idle Ratio (7d)", isActive: true },
  { id: "kpi-norm-battery", name: "Norm. Battery Discharge", isActive: true },
  { id: "kpi-norm-handbrake", name: "Norm. Handbrake Misuse", isActive: true },
  { id: "kpi-duty-cycle-vol", name: "Duty-Cycle Volatility", isActive: true },
  
  // Pending
  { id: "kpi-hydraulic-pressure", name: "Hydraulic Pressure Variance", isActive: false },
  { id: "kpi-load-rpm", name: "Load vs RPM Correlation", isActive: false },
  { id: "kpi-oil-pressure", name: "Oil Pressure Stability", isActive: false },
  { id: "kpi-fuel-efficiency", name: "Fuel Efficiency Trend", isActive: false },
  { id: "kpi-turbo-boost", name: "Turbo Boost Efficiency", isActive: false },
  { id: "kpi-vibration", name: "Vibration Trend", isActive: false },
];

export default function Home() {
  const [fleetStatus, setFleetStatus] = useState<any[]>([]);
  const [dailyKpis, setDailyKpis] = useState<any[]>([]);
  const [aiResults, setAiResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [highlightedKpi, setHighlightedKpi] = useState<string | null>(null);

  const kpiRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [fleetRes, kpiRes, aiRes] = await Promise.all([
          axios.get(`${API_BASE}/fleet/status`),
          axios.get(`${API_BASE}/kpis/daily?limit=30`),
          axios.get(`${API_BASE}/ml/ai_results?limit=30`),
        ]);
        
        setFleetStatus(fleetRes.data.data);
        setDailyKpis(kpiRes.data.data.reverse()); // Reverse for chronological charts
        setAiResults(aiRes.data.data);
      } catch (err) {
        console.error("Failed to fetch data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const scrollToKPI = (id: string) => {
    const el = kpiRefs.current[id];
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setHighlightedKpi(id);
      setTimeout(() => setHighlightedKpi(null), 3000);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="h-16 w-16 animate-spin rounded-full border-t-4 border-blue-500 border-opacity-50"></div>
      </div>
    );
  }

  // Aggregate stats from the fleet
  const totalEngineHours = fleetStatus.reduce((acc, curr) => acc + (curr.total_engine_hours || 0), 0);
  const totalTractionHours = fleetStatus.reduce((acc, curr) => acc + (curr.total_traction_hours || 0), 0);
  const totalAnomalies = aiResults.filter(r => r.is_anomaly).length;
  const avgSoc = fleetStatus.reduce((acc, curr) => acc + (curr.latest_battery_soc || 0), 0) / (fleetStatus.length || 1);
  const avgIdle = dailyKpis.length > 0 ? (dailyKpis.reduce((acc, curr) => acc + (curr.idle_ratio || 0), 0) / dailyKpis.length * 100).toFixed(1) : 0;
  const handbrakeMisuse = dailyKpis.reduce((acc, curr) => acc + (curr.handbrake_misuse_sum || 0), 0);
  const hydraulicHours = dailyKpis.reduce((acc, curr) => acc + (curr.hydraulic_usage_sum || 0), 0);

  // Advanced derived metrics
  const avgHydraulicLoadFactor = dailyKpis.length > 0 ? (dailyKpis.reduce((acc, curr) => acc + (curr.hydraulic_load_factor || 0), 0) / dailyKpis.length).toFixed(2) : 0;
  const avgSteeringIndex = dailyKpis.length > 0 ? (dailyKpis.reduce((acc, curr) => acc + (curr.steering_activity_index || 0), 0) / dailyKpis.length).toFixed(2) : 0;
  const avgRollingIdle = dailyKpis.length > 0 ? (dailyKpis.reduce((acc, curr) => acc + (curr.rolling_idle_ratio_7d || 0), 0) / dailyKpis.length * 100).toFixed(1) : 0;
  const avgNormBatteryDischarge = dailyKpis.length > 0 ? (dailyKpis.reduce((acc, curr) => acc + (curr.normalized_battery_discharge || 0), 0) / dailyKpis.length).toFixed(2) : 0;
  const avgNormHandbrakeMisuse = dailyKpis.length > 0 ? (dailyKpis.reduce((acc, curr) => acc + (curr.normalized_handbrake_misuse || 0), 0) / dailyKpis.length).toFixed(2) : 0;
  const avgDutyCycleVol = dailyKpis.length > 0 ? (dailyKpis.reduce((acc, curr) => acc + (curr.duty_cycle_volatility_7d || 0), 0) / dailyKpis.length).toFixed(2) : 0;


  const getHighlightClass = (id: string) => highlightedKpi === id ? 'animate-highlight' : '';

  return (
    <main className="min-h-screen bg-slate-50 p-8 text-slate-900 font-sans">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <KPIDropdown kpis={KPI_LIST} onSelectKPI={scrollToKPI} />
            <div>
              <h1 className="text-4xl font-bold tracking-tight text-slate-900">Fleet Intelligence Center</h1>
              <p className="mt-2 text-slate-500">Real-time telemetry and AI-driven predictive insights</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-sm text-emerald-600 border border-emerald-200">
              <span className="relative flex h-3 w-3">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-500"></span>
              </span>
              System Live
            </span>
          </div>
        </header>

        {/* Core System Stats (Not explicitly in the 12 KPI list but useful) */}
        <div className="mb-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-2">
          <div className="rounded-2xl transition-colors">
            <KPICard title="Active Anomalies" value={totalAnomalies} icon={<AlertTriangle className="h-6 w-6 text-rose-500" />} description="Total number of active machine learning anomaly inferences across the fleet." />
          </div>
          <div className="rounded-2xl transition-colors">
            <KPICard title="Active Vehicles" value={fleetStatus.length} icon={<Truck className="h-6 w-6 text-indigo-500" />} description="Total number of vehicles currently streaming telemetry." />
          </div>
        </div>

        {/* Active KPIs Grid */}
        <h2 className="mb-4 text-2xl font-bold text-slate-800 mt-12">Core Utilization KPIs</h2>
        <div className="mb-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <div ref={el => { kpiRefs.current["kpi-runtime"] = el }} className={`rounded-2xl transition-colors ${getHighlightClass("kpi-runtime")}`}>
            <KPICard title="Runtime Hours" value={`${totalEngineHours.toFixed(1)} hrs`} icon={<Clock className="h-6 w-6 text-blue-500" />} description="Track fleet-wide runtime; forecast service intervals based on OEM hour thresholds." />
          </div>
          <div ref={el => { kpiRefs.current["kpi-soc"] = el }} className={`rounded-2xl transition-colors ${getHighlightClass("kpi-soc")}`}>
            <KPICard title="Battery SoC Decline" value={`${avgSoc.toFixed(1)}%`} icon={<Battery className="h-6 w-6 text-emerald-500" />} description="Predict battery replacement timing; avoid mid-shift downtime from unexpected depletion." />
          </div>
          <div ref={el => { kpiRefs.current["kpi-hydraulic"] = el }} className={`rounded-2xl transition-colors ${getHighlightClass("kpi-hydraulic")}`}>
            <KPICard title="Hydraulic Usage" value={`${hydraulicHours.toFixed(1)} hrs`} icon={<Power className="h-6 w-6 text-purple-500" />} description="Predict hydraulic oil service intervals; detect potential leaks from abnormal usage patterns." />
          </div>
          <div ref={el => { kpiRefs.current["kpi-idle"] = el }} className={`rounded-2xl transition-colors ${getHighlightClass("kpi-idle")}`}>
            <KPICard title="Idle Hours (Ratio)" value={`${avgIdle}%`} icon={<RotateCcw className="h-6 w-6 text-orange-500" />} description="Reduce wasted engine/energy hours; identify operators needing efficiency training." />
          </div>
          <div ref={el => { kpiRefs.current["kpi-traction"] = el }} className={`rounded-2xl transition-colors ${getHighlightClass("kpi-traction")}`}>
            <KPICard title="Traction Usage" value={`${totalTractionHours.toFixed(1)} hrs`} icon={<Activity className="h-6 w-6 text-indigo-500" />} description="Predict gearbox/drivetrain wear; optimize vehicle usage allocation across the fleet." />
          </div>
          <div ref={el => { kpiRefs.current["kpi-handbrake"] = el }} className={`rounded-2xl transition-colors ${getHighlightClass("kpi-handbrake")}`}>
            <KPICard title="Handbrake Misuse KPI" value={handbrakeMisuse} icon={<AlertTriangle className="h-6 w-6 text-rose-500" />} description="Detect operator misuse patterns; prevent premature brake wear and safety incidents." />
          </div>
        </div>

        {/* Advanced Derived KPIs Grid */}
        <h2 className="mb-4 text-2xl font-bold text-slate-800 mt-12">Advanced Derived Metrics</h2>
        <div className="mb-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <div ref={el => { kpiRefs.current["kpi-hydraulic-load"] = el }} className={`rounded-2xl transition-colors ${getHighlightClass("kpi-hydraulic-load")}`}>
            <KPICard title="Hydraulic Load Factor" value={avgHydraulicLoadFactor} icon={<Power className="h-6 w-6 text-cyan-500" />} description="Distinguishes pick/place-heavy work from pure transport runs; informs workload-mix analysis." />
          </div>
          <div ref={el => { kpiRefs.current["kpi-steering-activity"] = el }} className={`rounded-2xl transition-colors ${getHighlightClass("kpi-steering-activity")}`}>
            <KPICard title="Steering Activity Index" value={avgSteeringIndex} icon={<Navigation className="h-6 w-6 text-teal-500" />} description="Proxy for maneuvering intensity; distinguishes tight-aisle/dense-rack work from long straight-line hauls." />
          </div>
          <div ref={el => { kpiRefs.current["kpi-rolling-idle"] = el }} className={`rounded-2xl transition-colors ${getHighlightClass("kpi-rolling-idle")}`}>
            <KPICard title="Rolling Idle Ratio (7d)" value={`${avgRollingIdle}%`} icon={<RotateCcw className="h-6 w-6 text-amber-500" />} description="A rising trend across weeks is an early operator-behavior or engine-health signal." />
          </div>
          <div ref={el => { kpiRefs.current["kpi-norm-battery"] = el }} className={`rounded-2xl transition-colors ${getHighlightClass("kpi-norm-battery")}`}>
            <KPICard title="Norm. Battery Discharge" value={avgNormBatteryDischarge} icon={<TrendingDown className="h-6 w-6 text-emerald-600" />} description="Fair comparison of battery health across vehicles/shifts of different lengths." />
          </div>
          <div ref={el => { kpiRefs.current["kpi-norm-handbrake"] = el }} className={`rounded-2xl transition-colors ${getHighlightClass("kpi-norm-handbrake")}`}>
            <KPICard title="Norm. Handbrake Misuse" value={avgNormHandbrakeMisuse} icon={<ShieldAlert className="h-6 w-6 text-rose-600" />} description="Fair operator/vehicle safety comparison -- raw counts favor low-utilization vehicles unfairly." />
          </div>
          <div ref={el => { kpiRefs.current["kpi-duty-cycle-vol"] = el }} className={`rounded-2xl transition-colors ${getHighlightClass("kpi-duty-cycle-vol")}`}>
            <KPICard title="Duty-Cycle Volatility" value={avgDutyCycleVol} icon={<BarChart3 className="h-6 w-6 text-fuchsia-500" />} description="High variance flags irregular/unpredictable scheduling; low variance indicates steady-state usage." />
          </div>
        </div>

        {/* Pending KPIs Grid */}
        <h2 className="mb-4 text-2xl font-bold text-slate-800 mt-12">Pending Data KPIs</h2>
        <div className="mb-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { id: "kpi-hydraulic-pressure", title: "Hydraulic Pressure Variance", icon: <Gauge className="h-6 w-6 text-slate-400" /> },
            { id: "kpi-load-rpm", title: "Load vs RPM Correlation", icon: <Settings className="h-6 w-6 text-slate-400" /> },
            { id: "kpi-oil-pressure", title: "Oil Pressure Stability", icon: <Droplet className="h-6 w-6 text-slate-400" /> },
            { id: "kpi-fuel-efficiency", title: "Fuel Efficiency Trend", icon: <Zap className="h-6 w-6 text-slate-400" /> },
            { id: "kpi-turbo-boost", title: "Turbo Boost Efficiency", icon: <Wind className="h-6 w-6 text-slate-400" /> },
            { id: "kpi-vibration", title: "Vibration Trend", icon: <Activity className="h-6 w-6 text-slate-400" /> },
          ].map(kpi => (
             <div key={kpi.id} ref={el => { kpiRefs.current[kpi.id] = el }} className={`group relative overflow-hidden rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 transition-all ${getHighlightClass(kpi.id)}`}>
              <div className="flex items-center justify-between mb-4 opacity-50">
                <h3 className="text-sm font-medium text-slate-500">{kpi.title}</h3>
                <div className="p-2 bg-slate-100 rounded-lg border border-slate-200">
                  {kpi.icon}
                </div>
              </div>
              <div className="flex items-baseline gap-2 opacity-50">
                <p className="text-xl font-bold text-slate-400 tracking-tight">Awaiting Telemetry</p>
              </div>
            </div>
          ))}
        </div>

        {/* Charts & Details */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3 mt-12">
          <div className="lg:col-span-2 space-y-8">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-xl font-semibold text-slate-800">Utilization & Runtime Trends</h2>
              <DashboardCharts data={dailyKpis} />
            </div>
            
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="mb-4 text-xl font-semibold text-slate-800">Usage Breakdown</h2>
                <PieChartUsage data={dailyKpis} />
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="mb-4 text-xl font-semibold text-slate-800">Handbrake Misuse (Daily)</h2>
                <BarChartMisuse data={dailyKpis} />
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-xl font-semibold text-slate-800">Rolling Idle Ratio Trend</h2>
              <LineChartIdle data={dailyKpis} />
            </div>
            
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-xl font-semibold text-slate-800">AI Anomaly Detection Log</h2>
              <AnomalyTable data={aiResults} />
            </div>
          </div>
          
          {/* Side panel */}
          <div className="space-y-8">
             <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-xl font-semibold text-slate-800">Fleet Segmentation (AI)</h2>
              <p className="text-sm text-slate-500 mb-4">Vehicles categorized by usage patterns (K-Means).</p>
              
              <div className="space-y-4">
                {['High Intensity', 'Steady State', 'Underutilized'].map((cluster, idx) => (
                  <div key={idx} className="flex items-center justify-between rounded-xl bg-slate-50 p-4 border border-slate-100">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${idx === 0 ? 'bg-orange-100 text-orange-600' : idx === 1 ? 'bg-blue-100 text-blue-600' : 'bg-slate-200 text-slate-600'}`}>
                        <Zap className="h-5 w-5" />
                      </div>
                      <span className="font-medium text-slate-700">{cluster}</span>
                    </div>
                    <span className="text-xl font-bold text-slate-900">
                      {aiResults.filter(r => r.usage_cluster === idx).length}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
