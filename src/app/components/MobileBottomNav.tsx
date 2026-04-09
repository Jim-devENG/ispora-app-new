import React from 'react';
import { LayoutDashboard, Users, MessageSquare, User, Settings as SettingsIcon, Search, Briefcase, MoreHorizontal, Calendar, X, TrendingUp, Award } from 'lucide-react';

interface MobileBottomNavProps {
  currentPage: string;
  onPageChange: (page: string) => void;
  userRole: 'diaspora' | 'student' | null;
}

export default function MobileBottomNav({ currentPage, onPageChange, userRole }: MobileBottomNavProps) {
  const [showMoreMenu, setShowMoreMenu] = React.useState(false);

  // Mentors have 4 main tabs + More menu
  const mentorNavItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Home' },
    { id: 'browse-students', icon: Search, label: 'Youth' },
    { id: 'messages', icon: MessageSquare, label: 'Messages' },
    { id: 'impact', icon: Award, label: 'Impact' },
  ];

  const mentorMoreItems = [
    { id: 'opportunities', icon: Briefcase, label: 'Opportunities' },
    { id: 'community', icon: Users, label: 'Community' },
  ];

  // Students have 4 main tabs + More menu
  const studentNavItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Home' },
    { id: 'browse-mentors', icon: Search, label: 'Mentors' },
    { id: 'messages', icon: MessageSquare, label: 'Messages' },
    { id: 'my-progress', icon: TrendingUp, label: 'Progress' },
  ];

  const studentMoreItems = [
    { id: 'opportunities', icon: Briefcase, label: 'Opportunities' },
    { id: 'community', icon: Users, label: 'Community' },
  ];

  const navItems = userRole === 'diaspora' ? mentorNavItems : studentNavItems;
  const moreItems = userRole === 'diaspora' ? mentorMoreItems : studentMoreItems;
  const showMoreButton = true; // Both roles now have More menu
  const isMoreActive = moreItems.some(item => item.id === currentPage);

  const handleMoreItemClick = (pageId: string) => {
    onPageChange(pageId);
    setShowMoreMenu(false);
  };

  return (
    <>
      {/* Backdrop */}
      {showMoreMenu && (
        <div
          className="md:hidden fixed inset-0 bg-black/20 z-40"
          onClick={() => setShowMoreMenu(false)}
        />
      )}

      {/* More Menu Popup */}
      {showMoreMenu && (
        <div className="md:hidden fixed bottom-[72px] left-4 right-4 bg-white border-[1.5px] border-[var(--ispora-border)] rounded-2xl shadow-[0_8px_24px_rgba(0,0,0,0.12)] z-50 overflow-hidden">
          <div className="p-3">
            <div className="flex items-center justify-between mb-2 pb-2 border-b border-[var(--ispora-border)]">
              <h3 className="font-syne text-sm font-bold text-[var(--ispora-text)]">More Options</h3>
              <button
                onClick={() => setShowMoreMenu(false)}
                className="w-6 h-6 flex items-center justify-center text-[var(--ispora-text3)] hover:text-[var(--ispora-text)] transition-colors"
              >
                <X className="w-4 h-4" strokeWidth={2} />
              </button>
            </div>
            <div className="space-y-1">
              {moreItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentPage === item.id;
                
                return (
                  <button
                    key={item.id}
                    onClick={() => handleMoreItemClick(item.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
                      isActive
                        ? 'text-[var(--ispora-brand)] bg-[var(--ispora-brand-light)]'
                        : 'text-[var(--ispora-text2)] hover:text-[var(--ispora-text)] hover:bg-[var(--ispora-bg)]'
                    }`}
                  >
                    <Icon className="w-5 h-5" strokeWidth={2} />
                    <span className="text-sm font-medium">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t-[1.5px] border-[var(--ispora-border)] z-50 safe-area-inset-bottom">
        <div className="flex items-center justify-around px-2 py-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => onPageChange(item.id)}
                className={`flex flex-col items-center justify-center min-w-[56px] px-2 py-1.5 rounded-xl transition-all ${
                  isActive
                    ? 'text-[var(--ispora-brand)] bg-[var(--ispora-brand-light)]'
                    : 'text-[var(--ispora-text3)] hover:text-[var(--ispora-text)]'
                }`}
              >
                <Icon className="w-5 h-5 mb-0.5" strokeWidth={2} />
                <span className="text-[10px] font-medium">{item.label}</span>
              </button>
            );
          })}
          
          {/* More Button */}
          {showMoreButton && (
            <button
              onClick={() => setShowMoreMenu(!showMoreMenu)}
              className={`flex flex-col items-center justify-center min-w-[56px] px-2 py-1.5 rounded-xl transition-all ${
                isMoreActive || showMoreMenu
                  ? 'text-[var(--ispora-brand)] bg-[var(--ispora-brand-light)]'
                  : 'text-[var(--ispora-text3)] hover:text-[var(--ispora-text)]'
              }`}
            >
              <MoreHorizontal className="w-5 h-5 mb-0.5" strokeWidth={2} />
              <span className="text-[10px] font-medium">More</span>
            </button>
          )}
        </div>
      </div>
    </>
  );
}