
'use client';

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ChartContainer, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart';

interface StoriesByLevelChartProps {
  data: { level: string; count: number }[];
}

const chartConfig = {
  count: {
    label: "Stories",
    color: "hsl(var(--primary))",
  },
} satisfies ChartConfig;


export function StoriesByLevelChart({ data }: StoriesByLevelChartProps) {
  return (
    <Card className="lg:col-span-4">
      <CardHeader>
        <CardTitle>Stories by Level</CardTitle>
        <CardDescription>
          Distribution of saved stories across different learner levels.
        </CardDescription>
      </CardHeader>
      <CardContent className="pl-2">
        <ChartContainer config={chartConfig} className="min-h-[200px] w-full">
            <BarChart accessibilityLayer data={data}>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="level"
                tickLine={false}
                tickMargin={10}
                axisLine={false}
                tickFormatter={(value) => value.slice(0, 3)}
              />
              <YAxis />
              <Tooltip 
                  cursor={false}
                  content={<ChartTooltipContent indicator="dot" />}
              />
              <Bar dataKey="count" fill="var(--color-count)" radius={4} />
            </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

export function StoriesByLevelChartSkeleton() {
    return (
        <Card className="lg:col-span-4">
            <CardHeader>
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-full mt-2" />
            </CardHeader>
            <CardContent className="pl-2">
                <div className="w-full h-[350px] flex items-center justify-center">
                    <Skeleton className="w-full h-full" />
                </div>
            </CardContent>
        </Card>
    );
}

