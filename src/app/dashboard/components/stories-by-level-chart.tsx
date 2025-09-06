
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
import { ChartTooltipContent } from '@/components/ui/chart';

interface StoriesByLevelChartProps {
  data: { level: string; count: number }[];
}

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
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="level"
              stroke="#888888"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke="#888888"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              allowDecimals={false}
              tickFormatter={(value) => `${value}`}
            />
             <Tooltip 
                cursor={{fill: 'hsl(var(--muted))'}}
                content={<ChartTooltipContent />}
            />
            <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
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
