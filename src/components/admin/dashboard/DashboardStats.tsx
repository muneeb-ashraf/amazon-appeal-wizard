'use client';

import { FileText, CheckCircle2, XCircle, Clock, TrendingUp, Zap } from 'lucide-react';

interface DashboardStatsProps {
  stats: {
    totalAppeals: number;
    completedAppeals: number;
    failedAppeals: number;
    pendingAppeals: number;
    successRate: number;
    avgGenerationTime?: number;
  };
}

export default function DashboardStats({ stats }: DashboardStatsProps) {
  const cards = [
    {
      label: 'Total Appeals',
      value: stats.totalAppeals,
      icon: FileText,
      color: 'blue',
      bgColor: 'bg-blue-50',
      iconColor: 'text-blue-600',
      borderColor: 'border-blue-200',
    },
    {
      label: 'Completed',
      value: stats.completedAppeals,
      icon: CheckCircle2,
      color: 'green',
      bgColor: 'bg-green-50',
      iconColor: 'text-green-600',
      borderColor: 'border-green-200',
    },
    {
      label: 'Failed',
      value: stats.failedAppeals,
      icon: XCircle,
      color: 'red',
      bgColor: 'bg-red-50',
      iconColor: 'text-red-600',
      borderColor: 'border-red-200',
    },
    {
      label: 'Pending',
      value: stats.pendingAppeals,
      icon: Clock,
      color: 'yellow',
      bgColor: 'bg-yellow-50',
      iconColor: 'text-yellow-600',
      borderColor: 'border-yellow-200',
    },
    {
      label: 'Success Rate',
      value: `${stats.successRate.toFixed(1)}%`,
      icon: TrendingUp,
      color: 'purple',
      bgColor: 'bg-purple-50',
      iconColor: 'text-purple-600',
      borderColor: 'border-purple-200',
    },
    ...(stats.avgGenerationTime
      ? [
          {
            label: 'Avg Generation Time',
            value: `${(stats.avgGenerationTime / 1000).toFixed(1)}s`,
            icon: Zap,
            color: 'indigo',
            bgColor: 'bg-indigo-50',
            iconColor: 'text-indigo-600',
            borderColor: 'border-indigo-200',
          },
        ]
      : []),
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {cards.map((card, index) => {
        const Icon = card.icon;
        return (
          <div
            key={index}
            className={`${card.bgColor} border ${card.borderColor} rounded-xl p-6 transition-transform hover:scale-105`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">{card.label}</p>
                <p className="text-3xl font-bold text-gray-900">{card.value}</p>
              </div>
              <div className={`${card.bgColor} p-3 rounded-lg`}>
                <Icon className={`w-8 h-8 ${card.iconColor}`} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
