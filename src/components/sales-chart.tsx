// src/components/sales-chart.tsx
"use client"

import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from "recharts"
import {
  ChartContainer,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
} from "@/components/ui/chart"
import { MonthlySalesData } from "@/types/crm"
import { format } from 'date-fns';

interface SalesChartProps {
  data: MonthlySalesData[];
}

// Format month label for X-axis (e.g., "Jan '24")
const formatMonth = (monthKey: string): string => {
    try {
        // Parse "yyyy-MM" string into a date object (set day to 1st)
        const [year, month] = monthKey.split('-');
        const date = new Date(parseInt(year), parseInt(month) - 1, 1);
        return format(date, "MMM yy"); // Format as "Jan 24"
    } catch (e) {
        return monthKey; // Fallback to original key if parsing fails
    }
};

// Format currency for Y-axis and Tooltip
const formatCurrencyAxis = (value: number): string => `€${(value / 1000).toFixed(0)}k`; // Format as €10k, €20k etc.

// Modified formatter to handle ValueType from Recharts
const formatCurrencyTooltip = (value: any): string => {
  // Check if value is a number or can be converted to one
  const numValue = typeof value === 'number' 
    ? value 
    : (typeof value === 'string' ? parseFloat(value) : 0);
  
  // Return formatted currency or fallback
  return !isNaN(numValue) 
    ? `€${numValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` 
    : `€0.00`;
};

const chartConfig = {
  totalValue: {
    label: "Total Sales Value",
    color: "hsl(var(--chart-1))", // Use primary color from theme
  },
} satisfies Record<string, { label: string; color: string }>;


export function SalesChart({ data }: SalesChartProps) {
  // Format data for the chart, adding the formatted month label
  const chartData = data.map(item => ({
      ...item,
      formattedMonth: formatMonth(item.month),
  }));

  return (
    <ChartContainer config={chartConfig} className="min-h-[300px] w-full">
      <ResponsiveContainer width="100%" height={350}>
        <BarChart data={chartData} margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="formattedMonth" // Use the formatted month label
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            // interval={0} // Show all labels if space allows
            // angle={-45} // Angle labels if needed
            // textAnchor="end"
            fontSize={12}
          />
          <YAxis
            tickFormatter={formatCurrencyAxis}
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            width={80} // Adjust width for currency labels
            fontSize={12}
          />
           <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent formatter={formatCurrencyTooltip} hideLabel />}
            />
           <ChartLegend content={<ChartLegendContent />} />
          <Bar dataKey="totalValue" fill="var(--color-totalValue)" radius={4} />
        </BarChart>
      </ResponsiveContainer>
    </ChartContainer>
  )
}