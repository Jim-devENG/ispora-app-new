import React from 'react';

export function DashboardSkeleton() {
  return (
    <div className="animate-pulse p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="h-8 bg-gray-200 rounded w-64"></div>
        <div className="h-10 bg-gray-200 rounded w-32"></div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white p-6 rounded-lg border border-gray-200">
            <div className="h-4 bg-gray-200 rounded w-24 mb-4"></div>
            <div className="h-8 bg-gray-200 rounded w-16"></div>
          </div>
        ))}
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg border border-gray-200 space-y-4">
          <div className="h-6 bg-gray-200 rounded w-48"></div>
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center space-x-4">
              <div className="h-12 w-12 bg-gray-200 rounded-full"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200 space-y-4">
          <div className="h-6 bg-gray-200 rounded w-48"></div>
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-2">
              <div className="h-4 bg-gray-200 rounded w-full"></div>
              <div className="h-3 bg-gray-200 rounded w-3/4"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function ListSkeleton({ items = 5 }: { items?: number }) {
  return (
    <div className="space-y-4 animate-pulse">
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center space-x-4">
            <div className="h-12 w-12 bg-gray-200 rounded-full flex-shrink-0"></div>
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200 animate-pulse">
      <div className="space-y-4">
        <div className="h-6 bg-gray-200 rounded w-2/3"></div>
        <div className="h-4 bg-gray-200 rounded w-full"></div>
        <div className="h-4 bg-gray-200 rounded w-5/6"></div>
        <div className="h-4 bg-gray-200 rounded w-4/6"></div>
        <div className="flex justify-between mt-6">
          <div className="h-10 bg-gray-200 rounded w-24"></div>
          <div className="h-10 bg-gray-200 rounded w-24"></div>
        </div>
      </div>
    </div>
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden animate-pulse">
      {/* Table Header */}
      <div className="border-b border-gray-200 bg-gray-50 p-4">
        <div className="grid grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-4 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>

      {/* Table Rows */}
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="border-b border-gray-200 p-4 last:border-b-0">
          <div className="grid grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((j) => (
              <div key={j} className="h-4 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
