import React from 'react';
import { Product, ProductCategory } from '../types.ts';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Cell,
  PieChart,
  Pie
} from 'recharts';
import { 
  Layers, 
  CircleDollarSign, 
  AlertTriangle, 
  RefreshCw, 
  Smartphone, 
  TrendingUp, 
  Calendar, 
  Activity,
  Award,
  ChevronRight
} from 'lucide-react';

interface AnalyticsDashboardProps {
  products: Product[];
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export default function AnalyticsDashboard({ products, activeTab, setActiveTab }: AnalyticsDashboardProps) {
  // Inventory Value and Count Summaries
  const totalQuantity = products.reduce((acc, p) => acc + p.quantity, 0);
  const totalInventoryValue = products.reduce((acc, p) => acc + p.quantity * p.unitPrice, 0);
  const outOfStock = products.filter(p => p.quantity <= 0);
  const lowStock = products.filter(p => p.quantity > 0 && p.quantity < 5);

  const warnSum = outOfStock.length + lowStock.length;

  // Formatting helper for currency values
  const formatMoney = (val: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(val);
  };

  // Recharts Chart Data Processing
  const phoneVal = products.filter(p => p.category === 'Phones').reduce((sum, p) => sum + p.quantity * p.unitPrice, 0);
  const watchVal = products.filter(p => p.category === 'Watches').reduce((sum, p) => sum + p.quantity * p.unitPrice, 0);
  const accVal = products.filter(p => p.category === 'Accessories').reduce((sum, p) => sum + p.quantity * p.unitPrice, 0);

  const phoneQty = products.filter(p => p.category === 'Phones').reduce((sum, p) => sum + p.quantity, 0);
  const watchQty = products.filter(p => p.category === 'Watches').reduce((sum, p) => sum + p.quantity, 0);
  const accQty = products.filter(p => p.category === 'Accessories').reduce((sum, p) => sum + p.quantity, 0);

  const chartData = [
    { name: 'Phones', Value: phoneVal, Quantity: phoneQty, color: '#0d9488' },
    { name: 'Watches', Value: watchVal, Quantity: watchQty, color: '#6366f1' },
    { name: 'Accessories', Value: accVal, Quantity: accQty, color: '#64748b' }
  ];

  // Let's get the 5 most recently updated models
  const recentUpdates = [...products]
    .sort((a, b) => {
      const aTime = a.updatedAt?.toMillis ? a.updatedAt.toMillis() : (a.updatedAt instanceof Date ? a.updatedAt.getTime() : 0);
      const bTime = b.updatedAt?.toMillis ? b.updatedAt.toMillis() : (b.updatedAt instanceof Date ? b.updatedAt.getTime() : 0);
      return bTime - aTime;
    })
    .slice(0, 4);

  return (
    <div className="space-y-6" id="dashboard-analytics-view">
      
      {/* Metrics Banner */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        
        {/* Total Stocked */}
        <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-2xl p-5 shadow-sm hover:shadow transition-shadow">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-1">Stocked Units</span>
              <h3 className="text-3xl font-bold text-slate-900 dark:text-slate-100 font-fallback">
                {totalQuantity.toLocaleString()}
              </h3>
            </div>
            <div className="p-2.5 bg-teal-50 dark:bg-teal-950/20 text-teal-600 dark:text-teal-400 rounded-xl">
              <Layers size={21} />
            </div>
          </div>
          <p className="text-xs text-slate-500 mt-4 border-t border-slate-100 dark:border-slate-800/80 pt-3 flex items-center justify-between">
            <span>Total distinct models</span>
            <span className="font-bold text-slate-700 dark:text-slate-300">{products.length} types</span>
          </p>
        </div>

        {/* Investment Value */}
        <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-2xl p-5 shadow-sm hover:shadow transition-shadow">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-1">Inventory Value</span>
              <h3 className="text-3xl font-bold text-slate-900 dark:text-slate-100 font-fallback">
                {formatMoney(totalInventoryValue)}
              </h3>
            </div>
            <div className="p-2.5 bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 rounded-xl">
              <CircleDollarSign size={21} />
            </div>
          </div>
          <p className="text-xs text-slate-500 mt-4 border-t border-slate-100 dark:border-slate-800/80 pt-3 flex items-center justify-between">
            <span>Avg price per item</span>
            <span className="font-bold text-slate-700 dark:text-slate-300">
              {products.length ? formatMoney(totalInventoryValue / (totalQuantity || 1)) : '$0.00'}
            </span>
          </p>
        </div>

        {/* Level Warnings */}
        <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-2xl p-5 shadow-sm hover:shadow transition-shadow">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-1">Restock Warnings</span>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="text-3xl font-bold text-rose-500">{outOfStock.length}</span>
                <span className="text-xs text-slate-450 dark:text-slate-500 font-semibold">OOS</span>
                <span className="text-slate-300 dark:text-slate-800">|</span>
                <span className="text-2xl font-bold text-amber-500">{lowStock.length}</span>
                <span className="text-xs text-slate-450 dark:text-slate-500 font-semibold">Low</span>
              </div>
            </div>
            <div className={`p-2.5 rounded-xl ${warnSum > 0 ? 'bg-amber-50 dark:bg-amber-950/20 text-amber-500' : 'bg-slate-5 border dark:bg-slate-800 text-slate-400'}`}>
              <AlertTriangle size={21} />
            </div>
          </div>
          <p className="text-xs text-slate-500 mt-4 border-t border-slate-100 dark:border-slate-800/80 pt-3 flex items-center justify-between">
            <span>Critical warnings total</span>
            <span className={`font-bold ${warnSum > 0 ? 'text-amber-500 animate-pulse' : 'text-slate-700 dark:text-slate-350'}`}>
              {warnSum} needs action
            </span>
          </p>
        </div>

        {/* Premium Brand Banner */}
        <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-2xl p-5 shadow-sm hover:shadow transition-shadow">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-1">Corporate Brand</span>
              <h3 className="text-3xl font-extrabold text-teal-600 dark:text-teal-400">TECNO</h3>
            </div>
            <div className="p-2.5 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-xl">
              <Award size={21} />
            </div>
          </div>
          <p className="text-xs text-slate-500 mt-4 border-t border-slate-100 dark:border-slate-800/80 pt-3 flex items-center justify-between">
            <span>Specialized retail hub</span>
            <span className="font-semibold text-slate-400">100% genuine</span>
          </p>
        </div>

      </div>

      {/* Charting & Activity Lists layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Portfolio Distribution chart */}
        <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-2xl p-5 shadow-sm lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <span className="text-sm font-bold text-slate-800 dark:text-slate-200">Catalog Category Breakdown</span>
              <p className="text-xs text-slate-400">Comparing total investment value in store</p>
            </div>
            <div className="flex gap-4 text-xs font-semibold">
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-teal-500"></span>Phones</span>
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-indigo-500"></span>Watches</span>
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-slate-450"></span>Accessories</span>
            </div>
          </div>

          <div className="h-64 mt-4 text-xs">
            {products.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-400 italic">
                Awaiting stock data to calculate charts...
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 5 }}>
                  <XAxis dataKey="name" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" tickFormatter={(v) => `$${v/1000}k`} />
                  <Tooltip 
                    formatter={(val: any) => [`$${parseFloat(val).toLocaleString()}`, 'Total Value']}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rbg(0 0 0 / 0.1)', background: '#1e293b', color: '#fff' }}
                  />
                  <Bar dataKey="Value" radius={[8, 8, 0, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Live Catalog Feed Updates */}
        <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4 border-b border-slate-50 dark:border-slate-800 pb-3">
            <div>
              <span className="text-sm font-bold text-slate-800 dark:text-slate-200">Active Monitor Feed</span>
              <p className="text-xs text-slate-400">Most recently modified</p>
            </div>
            <Activity size={16} className="text-slate-400" />
          </div>

          <div className="space-y-4 max-h-[230px] overflow-y-auto pr-1">
            {recentUpdates.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-4 text-center">No catalog events recorded yet</p>
            ) : (
              recentUpdates.map(p => {
                const isOutOfStock = p.quantity <= 0;
                const isLowStock = p.quantity > 0 && p.quantity < 5;

                return (
                  <div key={p.id} className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                    <div className="truncate pr-3">
                      <span className="text-xs font-bold text-slate-850 dark:text-slate-305 block truncate">{p.name}</span>
                      <span className="text-[10px] text-slate-400 font-medium">SKU: {p.sku} | Price: {formatMoney(p.unitPrice)}</span>
                    </div>

                    <div className="flex flex-col items-end shrink-0">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-bold ${
                        isOutOfStock 
                        ? 'bg-rose-50 text-rose-600' 
                        : isLowStock 
                        ? 'bg-amber-50 text-amber-650' 
                        : 'bg-teal-50 text-teal-700'
                      }`}>
                        Qty: {p.quantity}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-50 dark:border-slate-800/80">
            <button
              onClick={() => setActiveTab('inventory')}
              className="w-full flex items-center justify-center gap-1 px-4 py-2 border border-slate-100 dark:border-slate-800 hover:border-teal-400 hover:text-teal-400 text-xs font-bold text-slate-600 dark:text-slate-450 rounded-xl cursor-pointer transition-all"
              id="dash-go-inventory-btn"
            >
              <span>Manage active catalog</span>
              <ChevronRight size={13} />
            </button>
          </div>
        </div>

      </div>

    </div>
  );
}
