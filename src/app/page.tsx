
import { Suspense } from 'react';
import { getDashboardMetricsAction } from './dashboard/actions';
import { StatCard, StatCardSkeleton } from './dashboard/components/stat-card';
import { StoriesByLevelChart, StoriesByLevelChartSkeleton } from './dashboard/components/stories-by-level-chart';
import { Book, Library, StickyNote } from 'lucide-react';

async function DashboardMetrics() {
  const metrics = await getDashboardMetricsAction();

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <StatCard
          title="Total Stories"
          value={metrics.storyCount}
          icon={<Book className="h-4 w-4 text-muted-foreground" />}
          description="Total number of stories saved in the database."
        />
        <StatCard
          title="Expanded Words"
          value={metrics.wordCount}
          icon={<Library className="h-4 w-4 text-muted-foreground" />}
          description="Total unique words expanded and saved."
        />
        <StatCard
          title="Total Notes"
          value={metrics.noteCount}
          icon={<StickyNote className="h-4 w-4 text-muted-foreground" />}
          description="Total number of notes created in the system."
        />
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <StoriesByLevelChart data={metrics.storiesByLevel} />
      </div>
    </>
  );
}

function DashboardMetricsSkeleton() {
    return (
        <>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <StatCardSkeleton />
                <StatCardSkeleton />
                <StatCardSkeleton />
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <StoriesByLevelChartSkeleton />
            </div>
      </>
    )
}

export default function DashboardPage() {
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h1 className="text-3xl font-bold tracking-tight font-headline text-primary">Dashboard</h1>
      </div>
      <Suspense fallback={<DashboardMetricsSkeleton />}>
        <DashboardMetrics />
      </Suspense>
    </div>
  );
}
