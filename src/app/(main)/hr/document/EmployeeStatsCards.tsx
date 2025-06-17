"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Users, UserCheck, Clock, TrendingUp } from "lucide-react";
import { EmployeeStats } from "@/models/hr";

interface EmployeeStatsCardsProps {
  stats: EmployeeStats;
  isLoading: boolean;
}

export function EmployeeStatsCards({ stats, isLoading }: EmployeeStatsCardsProps) {
  const statCards = [
    {
      title: "Total Employees",
      value: stats.totalEmployees,
      icon: Users,
      color: "blue",
      bgColor: "bg-blue-50",
      iconColor: "text-blue-600",
      textColor: "text-blue-900",
    },
    {
      title: "Active Employees",
      value: stats.activeEmployees,
      icon: UserCheck,
      color: "green",
      bgColor: "bg-green-50",
      iconColor: "text-green-600",
      textColor: "text-green-900",
    },
    {
      title: "Present Today",
      value: stats.presentToday,
      icon: Clock,
      color: "purple",
      bgColor: "bg-purple-50",
      iconColor: "text-purple-600",
      textColor: "text-purple-900",
    },
    {
      title: "Avg. Weekly Hours",
      value: `${stats.averageWorkingHours.toFixed(1)}h`,
      icon: TrendingUp,
      color: "orange",
      bgColor: "bg-orange-50",
      iconColor: "text-orange-600",
      textColor: "text-orange-900",
    },
  ];

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, index) => (
          <Card key={index} className="animate-pulse">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-24"></div>
                  <div className="h-8 bg-gray-200 rounded w-16"></div>
                </div>
                <div className="h-12 w-12 bg-gray-200 rounded-full"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {statCards.map((card) => (
        <Card
          key={card.title}
          className="transition-all duration-200 hover:shadow-lg hover:scale-105 cursor-pointer"
        >
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-600">
                  {card.title}
                </p>
                <p className={`text-2xl font-bold ${card.textColor}`}>
                  {card.value}
                </p>
              </div>
              
              <div className={`${card.bgColor} p-3 rounded-full`}>
                <card.icon className={`h-6 w-6 ${card.iconColor}`} />
              </div>
            </div>
            
            {/* Progress indicator for present today */}
            {card.title === "Present Today" && stats.activeEmployees > 0 && (
              <div className="mt-4">
                <div className="flex justify-between text-xs text-gray-600 mb-1">
                  <span>Attendance Rate</span>
                  <span>{Math.round((stats.presentToday / stats.activeEmployees) * 100)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                    style={{
                      width: `${(stats.presentToday / stats.activeEmployees) * 100}%`,
                    }}
                  ></div>
                </div>
              </div>
            )}
            
            {/* Comparison indicator for other cards */}
            {card.title !== "Present Today" && (
              <div className="mt-4 flex items-center text-xs text-gray-600">
                <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
                <span>Active this month</span>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}