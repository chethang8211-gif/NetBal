import React from 'react';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
} from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';
import { formatINR } from '../utils/formatters';
import { PieChart, BarChart3, Wallet } from 'lucide-react';

// Register Chart.js modules
ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title
);

const CATEGORY_COLORS = [
  '#f87171', '#fb923c', '#fbbf24', '#a3e635', '#34d399',
  '#22d3ee', '#818cf8', '#c084fc', '#f472b6', '#cbd5e1'
];

const ACCOUNT_COLORS = [
  '#8b5cf6', // Slice
  '#3b82f6', // SBI
  '#f43f5e', // Kotak
  '#10b981', '#f59e0b', '#06b6d4',
];

export function FinanceCharts({
  transactions = [],
  accounts = [],
  accountBalances = {},
  monthlyTrends,
}) {
  // 1. Monthly Spending by Category
  const now = new Date();
  const currentMonthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  const categoryTotals = {};
  let totalMonthlySpent = 0;

  transactions.forEach((tx) => {
    if (tx.type === 'Spent' && tx.date?.startsWith(currentMonthPrefix)) {
      const cat = tx.category || 'Other';
      const amt = Number(tx.amount) || 0;
      categoryTotals[cat] = (categoryTotals[cat] || 0) + amt;
      totalMonthlySpent += amt;
    }
  });

  const catLabels = Object.keys(categoryTotals);
  const catData = Object.values(categoryTotals);

  const spendingChartData = {
    labels: catLabels.length ? catLabels : ['No Expenses Yet'],
    datasets: [
      {
        data: catData.length ? catData : [1],
        backgroundColor: catLabels.length
          ? catLabels.map((_, i) => CATEGORY_COLORS[i % CATEGORY_COLORS.length])
          : ['#334155'],
        borderWidth: 2,
        borderColor: '#0f172a',
      },
    ],
  };

  // 2. Account Balance Distribution
  const accountLabels = accounts.map((a) => a.name);
  const accountData = accounts.map((a) => Math.max(0, accountBalances[a.id] ?? 0));
  const totalAccountBalance = accountData.reduce((sum, val) => sum + val, 0);

  const balanceChartData = {
    labels: accountLabels,
    datasets: [
      {
        data: totalAccountBalance > 0 ? accountData : accounts.map(() => 1),
        backgroundColor: accounts.map((_, i) => ACCOUNT_COLORS[i % ACCOUNT_COLORS.length]),
        borderWidth: 2,
        borderColor: '#0f172a',
      },
    ],
  };

  // 3. Monthly Received / Spent / Invested Trends (Bar Chart)
  const trendsChartData = {
    labels: monthlyTrends.labels,
    datasets: [
      {
        label: 'Received',
        data: monthlyTrends.receivedData,
        backgroundColor: '#10b981',
        borderRadius: 4,
      },
      {
        label: 'Spent',
        data: monthlyTrends.spentData,
        backgroundColor: '#f43f5e',
        borderRadius: 4,
      },
      {
        label: 'Invested',
        data: monthlyTrends.investedData,
        backgroundColor: '#a855f7',
        borderRadius: 4,
      },
    ],
  };

  const chartOptionsDoughnut = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: '#94a3b8',
          font: { size: 11, family: 'system-ui' },
          boxWidth: 12,
          padding: 12,
        },
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const label = context.label || '';
            const val = context.raw || 0;
            return ` ${label}: ${formatINR(val)}`;
          },
        },
      },
    },
    cutout: '70%',
  };

  const trendsChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: '#94a3b8',
          font: { size: 11 },
          boxWidth: 12,
        },
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            return ` ${context.dataset.label}: ${formatINR(context.raw)}`;
          },
        },
      },
    },
    scales: {
      x: {
        grid: { color: 'rgba(51, 65, 85, 0.3)' },
        ticks: { color: '#94a3b8', font: { size: 10 } },
      },
      y: {
        grid: { color: 'rgba(51, 65, 85, 0.3)' },
        ticks: {
          color: '#94a3b8',
          font: { size: 10 },
          callback: (val) => `₹${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`,
        },
      },
    },
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
      {/* 1. Spending by Category */}
      <div className="rounded-xl bg-slate-900 border border-slate-800 p-5 flex flex-col">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-bold text-white flex items-center gap-2">
            <PieChart size={16} className="text-rose-400" />
            Monthly Spending by Category
          </h4>
          <span className="text-xs text-slate-400 font-medium">{formatINR(totalMonthlySpent)}</span>
        </div>

        <div className="relative h-60 w-full flex items-center justify-center">
          <Doughnut data={spendingChartData} options={chartOptionsDoughnut} />
          {catLabels.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center text-xs text-slate-500 font-medium">
              No expenses this month
            </div>
          )}
        </div>
      </div>

      {/* 2. Balance Distribution */}
      <div className="rounded-xl bg-slate-900 border border-slate-800 p-5 flex flex-col">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-bold text-white flex items-center gap-2">
            <Wallet size={16} className="text-emerald-400" />
            Balance Distribution
          </h4>
          <span className="text-xs text-slate-400 font-medium">Across Accounts</span>
        </div>

        <div className="relative h-60 w-full flex items-center justify-center">
          <Doughnut data={balanceChartData} options={chartOptionsDoughnut} />
        </div>
      </div>

      {/* 3. Monthly Trends */}
      <div className="rounded-xl bg-slate-900 border border-slate-800 p-5 flex flex-col">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-bold text-white flex items-center gap-2">
            <BarChart3 size={16} className="text-sky-400" />
            Monthly Cashflow Trends
          </h4>
          <span className="text-xs text-slate-400 font-medium">Last 6 Months</span>
        </div>

        <div className="relative h-60 w-full">
          <Bar data={trendsChartData} options={trendsChartOptions} />
        </div>
      </div>
    </div>
  );
}
