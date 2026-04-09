import React from 'react';
import { Badge } from '../types';
import { Card } from './ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';

interface BadgeDisplayProps {
  badges: Badge[];
  maxDisplay?: number;
  showAll?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function BadgeDisplay({ badges, maxDisplay = 6, showAll = false, size = 'md' }: BadgeDisplayProps) {
  const displayBadges = showAll ? badges : badges.slice(0, maxDisplay);
  const remainingCount = badges.length - maxDisplay;

  const sizeClasses = {
    sm: 'w-8 h-8 text-sm',
    md: 'w-12 h-12 text-xl',
    lg: 'w-16 h-16 text-2xl',
  };

  const tierColorMap: Record<string, string> = {
    bronze: 'border-orange-400 bg-orange-50',
    silver: 'border-gray-400 bg-gray-50',
    gold: 'border-yellow-400 bg-yellow-50',
    platinum: 'border-purple-400 bg-purple-50',
  };

  if (badges.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p className="text-sm">No badges earned yet. Keep going!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <TooltipProvider>
        <div className="flex flex-wrap gap-3">
          {displayBadges.map((badge) => (
            <Tooltip key={badge.id}>
              <TooltipTrigger asChild>
                <div
                  className={`
                    ${sizeClasses[size]} 
                    ${badge.tier ? tierColorMap[badge.tier] : 'border-gray-300 bg-gray-50'}
                    rounded-full border-2 flex items-center justify-center
                    cursor-pointer hover:scale-110 transition-transform
                    shadow-sm hover:shadow-md
                  `}
                >
                  <span className="select-none">{badge.icon}</span>
                </div>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <div className="space-y-1">
                  <p className="font-semibold">{badge.name}</p>
                  <p className="text-sm text-gray-600">{badge.description}</p>
                  {badge.categoryLabel && (
                    <p className="text-xs text-gray-500 mt-1">
                      {badge.categoryLabel}
                      {badge.tier && ` • ${badge.tier.charAt(0).toUpperCase() + badge.tier.slice(1)}`}
                    </p>
                  )}
                  {badge.earnedAt && (
                    <p className="text-xs text-gray-400 mt-1">
                      Earned: {new Date(badge.earnedAt).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </TooltipContent>
            </Tooltip>
          ))}
          
          {!showAll && remainingCount > 0 && (
            <div
              className={`
                ${sizeClasses[size]}
                rounded-full border-2 border-dashed border-gray-300 bg-gray-50
                flex items-center justify-center text-gray-500 text-xs font-medium
              `}
            >
              +{remainingCount}
            </div>
          )}
        </div>
      </TooltipProvider>
    </div>
  );
}

interface BadgeGridProps {
  badges: Badge[];
}

export function BadgeGrid({ badges }: BadgeGridProps) {
  const tierColorMap: Record<string, string> = {
    bronze: 'border-orange-400 bg-orange-50',
    silver: 'border-gray-400 bg-gray-50',
    gold: 'border-yellow-400 bg-yellow-50',
    platinum: 'border-purple-400 bg-purple-50',
  };

  // Group badges by category
  const badgesByCategory = badges.reduce((acc, badge) => {
    if (!acc[badge.category]) {
      acc[badge.category] = [];
    }
    acc[badge.category].push(badge);
    return acc;
  }, {} as Record<string, Badge[]>);

  const categoryLabels: Record<string, string> = {
    milestone: 'Milestones',
    impact: 'Impact',
    time: 'Tenure',
    special: 'Special Recognition',
    engagement: 'Engagement',
    progress: 'Progress',
    community: 'Community',
  };

  if (badges.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">🏆</div>
        <p className="text-gray-500">No badges earned yet</p>
        <p className="text-sm text-gray-400 mt-2">Complete sessions and achieve goals to earn badges!</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {Object.entries(badgesByCategory).map(([category, categoryBadges]) => (
        <div key={category}>
          <h3 className="text-lg font-semibold mb-4">{categoryLabels[category] || category}</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {categoryBadges.map((badge) => (
              <Card
                key={badge.id}
                className={`
                  p-4 text-center hover:shadow-lg transition-shadow cursor-pointer
                  ${badge.tier ? tierColorMap[badge.tier] : ''}
                  border-2
                `}
              >
                <div className="text-4xl mb-2">{badge.icon}</div>
                <p className="font-semibold text-sm mb-1">{badge.name}</p>
                <p className="text-xs text-gray-600 mb-2">{badge.description}</p>
                {badge.tier && (
                  <span className="inline-block px-2 py-1 text-xs rounded-full bg-white/50">
                    {badge.tier.charAt(0).toUpperCase() + badge.tier.slice(1)}
                  </span>
                )}
                {badge.earnedAt && (
                  <p className="text-xs text-gray-400 mt-2">
                    {new Date(badge.earnedAt).toLocaleDateString()}
                  </p>
                )}
              </Card>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
