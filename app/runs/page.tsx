'use client';

import { useState, useEffect } from 'react';
import { Card } from '@nextui-org/react';
import { Spinner } from '@/components/common/Spinner';
import { TbReportAnalytics } from 'react-icons/tb';
import { format } from 'date-fns';
import Link from 'next/link';
import { Badge } from '@/components/common/Badge';

const ITEMS_PER_PAGE = 10;

type Run = {
  id: string;
  activity_id: string;
  type: string;
  sub_type: string;
  text: string;
  created_at: string;
};

export default function RunsPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [runs, setRuns] = useState<Run[]>([]);
  const [totalPages, setTotalPages] = useState(1);

  const fetchRuns = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch(`/api/memories?type=report&page=${currentPage}&limit=${ITEMS_PER_PAGE}`);
      if (!response.ok) {
        throw new Error('Failed to fetch runs');
      }
      const data = await response.json();
      setRuns(Array.isArray(data.data) ? data.data : []);
      setTotalPages(data.total ? Math.ceil(data.total / ITEMS_PER_PAGE) : 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch runs');
      setRuns([]);
      setTotalPages(1);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRuns();
  }, [currentPage]);

  if (isLoading) {
    return (
      <div className="flex h-[calc(100vh-10rem)] items-center justify-center">
        <Spinner size={24} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-[calc(100vh-10rem)] flex-col items-center justify-center text-red-500">
        <p>Failed to load runs</p>
        <p className="text-sm">{error}</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold font-zen">Runs History</h1>
        <p className="text-gray-500 font-zen">View all periodic risk checks</p>
      </div>

      {runs.length > 0 ? (
        <div className="grid gap-4">
          {runs.map((run) => (
            <Link key={run.id} href={`/run/${run.activity_id}`} className="no-underline">
              <Card className="bg-surface p-6 transition-all hover:scale-[1.01] font-zen">
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <TbReportAnalytics className="h-5 w-5 text-blue-500" />
                      <Badge variant="default" size="sm" className="bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300">
                        Periodic Risk Check
                      </Badge>
                    </div>
                    <span className="text-xs text-gray-400 font-zen">
                      {format(new Date(run.created_at), 'MMM d, yyyy HH:mm')}
                    </span>
                  </div>
                  <div className="h-px w-full bg-gray-200 dark:bg-gray-700" />
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500 font-zen">ID: {run.activity_id}</span>
                  </div>
                  <div className="line-clamp-2 text-sm text-gray-700 dark:text-gray-300 font-zen">
                    {run.text}
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <div className="flex h-[calc(100vh-20rem)] flex-col items-center justify-center text-gray-500">
          <p>No runs found.</p>
        </div>
      )}

      {totalPages > 1 && (
        <div className="mt-8 flex justify-center gap-2">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="rounded px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 disabled:opacity-50 dark:text-gray-300 dark:hover:bg-gray-700 font-zen"
          >
            Previous
          </button>
          <span className="px-4 py-2 text-sm text-gray-500 font-zen">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="rounded px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 disabled:opacity-50 dark:text-gray-300 dark:hover:bg-gray-700 font-zen"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
} 