import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../lib/api';
import {
  Target,
  BookOpen,
  Plus,
  Calendar,
  AlertCircle,
  Check,
  Edit2,
  X,
  Search,
  FileText,
  Link as LinkIcon,
  Video,
  File,
  Download,
  ExternalLink,
  Loader2,
  Award
} from 'lucide-react';
import { ImpactDashboard } from './ImpactDashboard';

type MainTab = 'goals' | 'journey' | 'resources';
type GoalCategory = 'all' | 'active' | 'done' | 'career' | 'technical' | 'applications' | 'personal';
type ResourceType = 'pdf' | 'link' | 'video' | 'doc' | 'sheet' | 'note' | '';
type ResourceCategory = 'career' | 'technical' | 'applications' | 'interview' | '';

interface Goal {
  id: string;
  title: string;
  category: string;
  completed: boolean;
  priority: 'high' | 'medium' | 'low';
  dueDate: string | null;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

interface Resource {
  id: string;
  title: string;
  type: 'link' | 'note' | 'file';
  description?: string;
  linkUrl?: string;
  content?: string;
  fileUrl?: string;
  fileName?: string;
  mentorName?: string;
  createdAt: string;
}

export default function MyProgress() {
  const { user } = useAuth();
  
  // State
  const [activeMainTab, setActiveMainTab] = useState<MainTab>('goals');
  const [activeGoalFilter, setActiveGoalFilter] = useState<GoalCategory>('all');
  const [showAddGoalModal, setShowAddGoalModal] = useState(false);
  const [showEditGoalModal, setShowEditGoalModal] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [resourceSearch, setResourceSearch] = useState('');
  const [resourceTypeFilter, setResourceTypeFilter] = useState<ResourceType>('');
  const [resourceCategoryFilter, setResourceCategoryFilter] = useState<ResourceCategory>('');
  
  // Data state
  const [goals, setGoals] = useState<Goal[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [loadingGoals, setLoadingGoals] = useState(true);
  const [loadingResources, setLoadingResources] = useState(true);
  const [savingGoal, setSavingGoal] = useState(false);
  const [deletingGoal, setDeletingGoal] = useState(false);

  // Form state for adding/editing goals
  const [goalForm, setGoalForm] = useState({
    title: '',
    category: 'career',
    priority: 'medium',
    dueDate: '',
    notes: ''
  });

  // Load goals
  useEffect(() => {
    loadGoals();
  }, []);

  // Load resources when tab changes
  useEffect(() => {
    if (activeMainTab === 'resources' && resources.length === 0) {
      loadResources();
    }
  }, [activeMainTab]);

  const loadGoals = async () => {
    try {
      setLoadingGoals(true);
      const data = await api.goal.getAll();
      setGoals(data || []);
    } catch (error: any) {
      console.error('Failed to load goals:', error);
    } finally {
      setLoadingGoals(false);
    }
  };

  const loadResources = async () => {
    try {
      setLoadingResources(true);
      const data = await api.studentResource.getAll();
      setResources(data || []);
    } catch (error: any) {
      console.error('Failed to load resources:', error);
    } finally {
      setLoadingResources(false);
    }
  };

  const handleAddGoal = async () => {
    if (!goalForm.title || !goalForm.category) {
      alert('Please fill in title and category');
      return;
    }

    try {
      setSavingGoal(true);
      const newGoal = await api.goal.create({
        title: goalForm.title,
        category: goalForm.category,
        priority: goalForm.priority as 'high' | 'medium' | 'low',
        dueDate: goalForm.dueDate || undefined,
        notes: goalForm.notes
      });

      setGoals([newGoal, ...goals]);
      setShowAddGoalModal(false);
      setGoalForm({
        title: '',
        category: 'career',
        priority: 'medium',
        dueDate: '',
        notes: ''
      });
    } catch (error: any) {
      console.error('Failed to create goal:', error);
      alert('Failed to create goal. Please try again.');
    } finally {
      setSavingGoal(false);
    }
  };

  const handleUpdateGoal = async () => {
    if (!editingGoal) return;

    try {
      setSavingGoal(true);
      const updatedGoal = await api.goal.update(editingGoal.id, {
        title: goalForm.title,
        category: goalForm.category,
        priority: goalForm.priority as 'high' | 'medium' | 'low',
        dueDate: goalForm.dueDate || undefined,
        notes: goalForm.notes,
        completed: editingGoal.completed
      });

      setGoals(goals.map(g => g.id === updatedGoal.id ? updatedGoal : g));
      setShowEditGoalModal(false);
      setEditingGoal(null);
    } catch (error: any) {
      console.error('Failed to update goal:', error);
      alert('Failed to update goal. Please try again.');
    } finally {
      setSavingGoal(false);
    }
  };

  const handleDeleteGoal = async (goalId: string) => {
    if (!confirm('Are you sure you want to delete this goal?')) return;

    try {
      setDeletingGoal(true);
      await api.goal.delete(goalId);
      setGoals(goals.filter(g => g.id !== goalId));
      setShowEditGoalModal(false);
      setEditingGoal(null);
    } catch (error: any) {
      console.error('Failed to delete goal:', error);
      alert('Failed to delete goal. Please try again.');
    } finally {
      setDeletingGoal(false);
    }
  };

  const toggleGoalDone = async (goal: Goal) => {
    try {
      const updatedGoal = await api.goal.update(goal.id, {
        completed: !goal.completed
      });
      setGoals(goals.map(g => g.id === updatedGoal.id ? updatedGoal : g));
    } catch (error: any) {
      console.error('Failed to toggle goal:', error);
    }
  };

  // Computed values
  const totalGoals = goals.length;
  const completedGoals = goals.filter(g => g.completed).length;
  const progressPercentage = totalGoals > 0 ? Math.round((completedGoals / totalGoals) * 100) : 0;

  const filteredGoals = goals.filter(goal => {
    if (activeGoalFilter === 'all') return true;
    if (activeGoalFilter === 'active') return !goal.completed;
    if (activeGoalFilter === 'done') return goal.completed;
    return goal.category === activeGoalFilter;
  });

  const filteredResources = resources.filter(resource => {
    const matchesSearch = resource.title.toLowerCase().includes(resourceSearch.toLowerCase()) ||
                         (resource.description?.toLowerCase() || '').includes(resourceSearch.toLowerCase());
    const matchesType = !resourceTypeFilter || resource.type === resourceTypeFilter;
    // For now, skip category filter for resources as backend doesn't have it
    return matchesSearch && matchesType;
  });

  const getCategoryClass = (cat: string) => {
    const classes: Record<string, string> = {
      career: 'bg-[var(--ispora-warn-light)] text-[#92400e]',
      technical: 'bg-[var(--ispora-brand-light)] text-[var(--ispora-brand)]',
      applications: 'bg-[var(--ispora-success-light)] text-[var(--ispora-success)]',
      personal: 'bg-[#f1f5f9] text-[#475569]'
    };
    return classes[cat] || 'bg-[#f1f5f9] text-[#475569]';
  };

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      high: 'text-[var(--ispora-danger)]',
      medium: 'text-[var(--ispora-warn)]',
      low: 'text-[var(--ispora-text3)]'
    };
    return colors[priority] || 'text-[var(--ispora-text3)]';
  };

  const getResourceIcon = (type: string) => {
    const icons: Record<string, { icon: any, bg: string, color: string }> = {
      file: { icon: FileText, bg: '#fee2e2', color: 'var(--ispora-danger)' },
      link: { icon: LinkIcon, bg: 'var(--ispora-brand-light)', color: 'var(--ispora-brand)' },
      note: { icon: File, bg: 'var(--ispora-success-light)', color: 'var(--ispora-success)' }
    };
    return icons[type] || icons.note;
  };

  const formatRelativeDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) return 'Today';
    if (diffInDays === 1) return 'Yesterday';
    if (diffInDays < 7) return `${diffInDays} days ago`;
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatDueDate = (dateString: string | null) => {
    if (!dateString) return 'No due date';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Hero Section */}
      <div className="bg-[var(--ispora-brand)] px-4 sm:px-8 py-4 sm:py-7 flex-shrink-0">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex-1">
            <div className="font-syne text-base sm:text-lg font-bold text-white mb-1.5 flex items-center gap-2">
              Your goals, your journey ✦
            </div>
            <div className="text-xs text-white/70">
              Goals, resources and achievements — all in one place
            </div>
          </div>
          <div className="flex gap-2.5">
            <div className="bg-white/[0.13] border border-white/20 rounded-xl px-3.5 py-2 text-center min-w-[62px]">
              <div className="font-dm-sans text-lg font-bold text-white leading-none">{totalGoals}</div>
              <div className="text-[10px] text-white/65 mt-0.5">Total Goals</div>
            </div>
            <div className="bg-white/[0.13] border border-white/20 rounded-xl px-3.5 py-2 text-center min-w-[62px]">
              <div className="font-dm-sans text-lg font-bold text-white leading-none">{completedGoals}</div>
              <div className="text-[10px] text-white/65 mt-0.5">Completed</div>
            </div>
            <div className="bg-white/[0.13] border border-white/20 rounded-xl px-3.5 py-2 text-center min-w-[62px]">
              <div className="font-dm-sans text-lg font-bold text-white leading-none">{progressPercentage}%</div>
              <div className="text-[10px] text-white/65 mt-0.5">Progress</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Tabs */}
      <div className="bg-white border-b-[1.5px] border-[var(--ispora-border)] px-4 sm:px-8 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center overflow-x-auto scrollbar-hide -mx-4 sm:mx-0 px-4 sm:px-0">
          <button
            className={`flex items-center gap-1.75 px-5 py-3.5 text-[13px] font-semibold border-b-[2.5px] transition-all whitespace-nowrap ${
              activeMainTab === 'goals'
                ? 'text-[var(--ispora-brand)] border-[var(--ispora-brand)]'
                : 'text-[var(--ispora-text3)] border-transparent hover:text-[var(--ispora-brand)]'
            }`}
            onClick={() => setActiveMainTab('goals')}
          >
            <Target className="w-3.5 h-3.5" strokeWidth={2} />
            My Goals
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
              activeMainTab === 'goals'
                ? 'bg-[var(--ispora-brand-light)] text-[var(--ispora-brand)]'
                : 'bg-[var(--ispora-bg)] text-[var(--ispora-text3)]'
            }`}>
              {totalGoals}
            </span>
          </button>
          <button
            className={`flex items-center gap-1.75 px-5 py-3.5 text-[13px] font-semibold border-b-[2.5px] transition-all whitespace-nowrap ${
              activeMainTab === 'journey'
                ? 'text-[var(--ispora-brand)] border-[var(--ispora-brand)]'
                : 'text-[var(--ispora-text3)] border-transparent hover:text-[var(--ispora-brand)]'
            }`}
            onClick={() => setActiveMainTab('journey')}
          >
            <Award className="w-3.5 h-3.5" strokeWidth={2} />
            Journey
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
              activeMainTab === 'journey'
                ? 'bg-[var(--ispora-brand-light)] text-[var(--ispora-brand)]'
                : 'bg-[var(--ispora-bg)] text-[var(--ispora-text3)]'
            }`}>
              {totalGoals}
            </span>
          </button>
          <button
            className={`flex items-center gap-1.75 px-5 py-3.5 text-[13px] font-semibold border-b-[2.5px] transition-all whitespace-nowrap ${
              activeMainTab === 'resources'
                ? 'text-[var(--ispora-brand)] border-[var(--ispora-brand)]'
                : 'text-[var(--ispora-text3)] border-transparent hover:text-[var(--ispora-brand)]'
            }`}
            onClick={() => setActiveMainTab('resources')}
          >
            <BookOpen className="w-3.5 h-3.5" strokeWidth={2} />
            Resources
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
              activeMainTab === 'resources'
                ? 'bg-[var(--ispora-brand-light)] text-[var(--ispora-brand)]'
                : 'bg-[var(--ispora-bg)] text-[var(--ispora-text3)]'
            }`}>
              {resources.length}
            </span>
          </button>
        </div>
        {activeMainTab === 'goals' && (
          <button
            className="hidden sm:flex items-center gap-1.5 px-4.5 py-1.75 rounded-[10px] text-[13px] font-semibold bg-[var(--ispora-brand)] text-white hover:bg-[#0118c4] hover:shadow-lg hover:-translate-y-0.5 transition-all"
            onClick={() => {
              setGoalForm({
                title: '',
                category: 'career',
                priority: 'medium',
                dueDate: '',
                notes: ''
              });
              setShowAddGoalModal(true);
            }}
          >
            <Plus className="w-3 h-3" strokeWidth={2.5} />
            Add Goal
          </button>
        )}
      </div>

      {/* Goals Panel */}
      {activeMainTab === 'goals' && (
        <div className="flex-1 overflow-y-auto lg:overflow-hidden flex flex-col lg:flex-row gap-4.5 p-4 sm:p-6 min-h-0">
          {/* Goals Main */}
          <div className="flex-1 min-w-0 flex flex-col lg:overflow-hidden">
            {/* Mobile Add Goal Button */}
            <button
              className="sm:hidden flex items-center justify-center gap-1.5 px-4.5 py-2.5 mb-3 rounded-[10px] text-[13px] font-semibold bg-[var(--ispora-brand)] text-white hover:bg-[#0118c4] transition-all w-full"
              onClick={() => {
                setGoalForm({
                  title: '',
                  category: 'career',
                  priority: 'medium',
                  dueDate: '',
                  notes: ''
                });
                setShowAddGoalModal(true);
              }}
            >
              <Plus className="w-3 h-3" strokeWidth={2.5} />
              Add Goal
            </button>

            {/* Filter Row: Status Tabs + Category Dropdown */}
            <div className="flex items-center gap-2.5 mb-3.5 flex-wrap">
              <div className="flex gap-1 border-[1.5px] border-[var(--ispora-border)] rounded-xl bg-white p-1 flex-wrap">
                {[
                  { key: 'all', label: 'All Goals', count: goals.length },
                  { key: 'active', label: 'In Progress', count: goals.filter(g => !g.completed).length },
                  { key: 'done', label: 'Completed', count: goals.filter(g => g.completed).length }
                ].map(tab => (
                  <button
                    key={tab.key}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap ${
                      activeGoalFilter === tab.key
                        ? 'bg-[var(--ispora-brand)] text-white'
                        : 'text-[var(--ispora-text3)] hover:text-[var(--ispora-brand)] hover:bg-[var(--ispora-brand-light)]'
                    }`}
                    onClick={() => setActiveGoalFilter(tab.key as GoalCategory)}
                  >
                    {tab.label}
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ml-1 ${
                      activeGoalFilter === tab.key
                        ? 'bg-white/20 text-white'
                        : 'bg-[var(--ispora-bg)] text-[var(--ispora-text3)]'
                    }`}>
                      {tab.count}
                    </span>
                  </button>
                ))}
              </div>
              <select
                className="bg-white border-[1.5px] border-[var(--ispora-border)] rounded-lg px-3 py-2 text-xs font-medium text-[var(--ispora-text2)] outline-none focus:border-[var(--ispora-brand)] cursor-pointer"
                value={activeGoalFilter === 'all' || activeGoalFilter === 'active' || activeGoalFilter === 'done' ? '' : activeGoalFilter}
                onChange={(e) => {
                  if (e.target.value) {
                    setActiveGoalFilter(e.target.value as GoalCategory);
                  }
                }}
              >
                <option value="">All Categories</option>
                <option value="career">Career ({goals.filter(g => g.category === 'career').length})</option>
                <option value="technical">Technical ({goals.filter(g => g.category === 'technical').length})</option>
                <option value="applications">Applications ({goals.filter(g => g.category === 'applications').length})</option>
              </select>
            </div>

            {/* Goals List */}
            <div 
              className="lg:flex-1 lg:overflow-y-auto"
              style={({
                scrollbarWidth: 'none',
                msOverflowStyle: 'none',
                WebkitOverflowScrolling: 'touch'
              } as React.CSSProperties)}
            >
              {loadingGoals ? (
                <div className="text-center py-10">
                  <Loader2 className="w-8 h-8 text-[var(--ispora-brand)] animate-spin mx-auto mb-2" />
                  <p className="text-sm text-[var(--ispora-text3)]">Loading goals...</p>
                </div>
              ) : filteredGoals.length === 0 ? (
                <div className="text-center py-10 px-5 text-[var(--ispora-text3)]">
                  <div className="w-11 h-11 bg-[var(--ispora-brand-light)] rounded-full flex items-center justify-center mx-auto mb-3">
                    <Target className="w-5 h-5 text-[var(--ispora-brand)]" strokeWidth={1.8} />
                  </div>
                  <div className="font-syne text-[15px] font-bold text-[var(--ispora-text)] mb-1.5">
                    No goals here
                  </div>
                  <button
                    className="mt-2 px-3 py-1.5 text-xs font-semibold bg-[var(--ispora-brand)] text-white rounded-lg hover:bg-[#0118c4] transition-all"
                    onClick={() => {
                      setGoalForm({
                        title: '',
                        category: 'career',
                        priority: 'medium',
                        dueDate: '',
                        notes: ''
                      });
                      setShowAddGoalModal(true);
                    }}
                  >
                    Add a Goal
                  </button>
                </div>
              ) : (
                filteredGoals.map(goal => (
                  <div
                    key={goal.id}
                    className="flex items-start gap-3 p-3.25 bg-white border-[1.5px] border-[var(--ispora-border)] rounded-xl mb-2.25 transition-all hover:border-[var(--ispora-brand)] hover:shadow-[var(--ispora-shadow-sm)] cursor-pointer"
                    onClick={() => {
                      setEditingGoal(goal);
                      setGoalForm({
                        title: goal.title,
                        category: goal.category,
                        priority: goal.priority,
                        dueDate: goal.dueDate || '',
                        notes: goal.notes
                      });
                      setShowEditGoalModal(true);
                    }}
                  >
                    {/* Checkbox */}
                    <div
                      className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 cursor-pointer transition-all mt-0.5 ${
                        goal.completed
                          ? 'bg-[var(--ispora-brand)] border-[var(--ispora-brand)]'
                          : 'border-[var(--ispora-border)] hover:border-[var(--ispora-brand)]'
                      }`}
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleGoalDone(goal);
                      }}
                    >
                      {goal.completed && (
                        <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />
                      )}
                    </div>

                    {/* Goal Body */}
                    <div className="flex-1 min-w-0">
                      <div className={`font-semibold text-[13px] leading-snug ${
                        goal.completed ? 'text-[var(--ispora-text3)] line-through' : 'text-[var(--ispora-text)]'
                      }`}>
                        {goal.title}
                      </div>
                      <div className="flex gap-2.5 mt-1.25 flex-wrap">
                        <div className="flex items-center gap-1 text-[11px] text-[var(--ispora-text3)]">
                          <Calendar className="w-2.75 h-2.75" strokeWidth={2} />
                          {formatDueDate(goal.dueDate)}
                        </div>
                        <div className={`flex items-center gap-1 text-[11px] ${getPriorityColor(goal.priority)}`}>
                          <AlertCircle className="w-2.75 h-2.75" strokeWidth={2} />
                          {goal.priority ? goal.priority.charAt(0).toUpperCase() + goal.priority.slice(1) : 'Normal'} priority
                        </div>
                      </div>
                      {goal.notes && (
                        <div className="text-[11px] text-[var(--ispora-text3)] mt-1.25 leading-relaxed">
                          {goal.notes}
                        </div>
                      )}
                    </div>

                    {/* Goal Right */}
                    <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                      <span className={`text-[10px] px-2 py-0.75 rounded-full font-medium ${getCategoryClass(goal.category)}`}>
                        {goal.category ? goal.category.charAt(0).toUpperCase() + goal.category.slice(1) : 'Other'}
                      </span>
                      <button
                        className="flex items-center gap-1 px-2.25 py-1 text-[11px] font-medium text-[var(--ispora-text2)] bg-[var(--ispora-bg)] border-[1.5px] border-[var(--ispora-border)] rounded-lg hover:border-[var(--ispora-brand)] hover:text-[var(--ispora-brand)] hover:bg-[var(--ispora-brand-light)] transition-all"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingGoal(goal);
                          setGoalForm({
                            title: goal.title,
                            category: goal.category,
                            priority: goal.priority,
                            dueDate: goal.dueDate || '',
                            notes: goal.notes
                          });
                          setShowEditGoalModal(true);
                        }}
                      >
                        <Edit2 className="w-2.5 h-2.5" strokeWidth={2.5} />
                        Edit
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Goals Sidebar */}
          <div className="w-full lg:w-72.5 lg:flex-shrink-0 lg:overflow-y-auto scrollbar-hide">
            <div className="flex flex-col gap-4 pb-4">
            {/* Overall Progress Card */}
            <div className="bg-white border-[1.5px] border-[var(--ispora-border)] rounded-2xl overflow-hidden">
              <div className="px-4.5 py-3.5 flex items-center justify-between border-b-[1.5px] border-[var(--ispora-border)]">
                <div className="font-syne text-[13px] font-bold text-[var(--ispora-text)]">
                  Overall Progress
                </div>
              </div>
              <div className="px-4.5 py-3.5">
                <div className="text-center mb-3.5">
                  <svg width="80" height="80" viewBox="0 0 80 80">
                    <circle cx="40" cy="40" r="32" fill="none" stroke="var(--ispora-border)" strokeWidth="8" />
                    <circle
                      cx="40"
                      cy="40"
                      r="32"
                      fill="none"
                      stroke="var(--ispora-brand)"
                      strokeWidth="8"
                      strokeLinecap="round"
                      strokeDasharray="201.06"
                      strokeDashoffset={201.06 - (201.06 * progressPercentage / 100)}
                      transform="rotate(-90 40 40)"
                    />
                    <text x="40" y="45" textAnchor="middle" fontFamily="DM Sans,sans-serif" fontSize="16" fontWeight="700" fill="var(--ispora-brand)">
                      {progressPercentage}%
                    </text>
                  </svg>
                </div>
                <div className="space-y-2.25">
                  {['career', 'technical', 'applications'].map(cat => {
                    const catGoals = goals.filter(g => g.category === cat);
                    const catPct = catGoals.length > 0 ? Math.round((catGoals.filter(g => g.completed).length / catGoals.length) * 100) : 0;
                    return (
                      <div key={cat}>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-[var(--ispora-text2)]">
                            {cat ? cat.charAt(0).toUpperCase() + cat.slice(1) : 'Other'}
                          </span>
                          <span className="font-semibold text-[var(--ispora-brand)]">{catPct}%</span>
                        </div>
                        <div className="h-1.5 bg-[var(--ispora-border)] rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[var(--ispora-brand)] rounded-full transition-all duration-500"
                            style={{ width: `${catPct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Achievements Card */}
            <div className="bg-white border-[1.5px] border-[var(--ispora-border)] rounded-2xl overflow-hidden flex-shrink-0">
              <div className="px-4.5 py-3 flex items-center justify-between border-b-[1.5px] border-[var(--ispora-border)]">
                <div className="font-syne text-[13px] font-bold text-[var(--ispora-text)]">
                  Achievements
                </div>
                <div className="text-[10px] font-semibold text-[var(--ispora-brand)] bg-[var(--ispora-brand-light)] px-2 py-0.5 rounded-full">
                  {completedGoals > 0 && totalGoals >= 5 ? '2' : completedGoals > 0 || totalGoals >= 5 ? '1' : '0'}/3
                </div>
              </div>
              <div className="px-4 py-2.5 space-y-0">
                {/* First Goal Completed */}
                <div className={`flex items-center gap-2.5 py-2 border-b border-[var(--ispora-border)] transition-opacity ${completedGoals > 0 ? 'opacity-100' : 'opacity-40'}`}>
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-sm flex-shrink-0 ${completedGoals > 0 ? 'bg-[#fef9c3]' : 'bg-[var(--ispora-bg)]'}`}>
                    🏆
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-xs text-[var(--ispora-text)] leading-tight">First Goal Completed</div>
                    <div className="text-[10px] text-[var(--ispora-text3)] mt-0.5 leading-tight">
                      {completedGoals > 0 ? 'Keep up the great work!' : 'Complete your first goal'}
                    </div>
                  </div>
                </div>

                {/* Goal Setter */}
                <div className={`flex items-center gap-2.5 py-2 border-b border-[var(--ispora-border)] transition-opacity ${totalGoals >= 5 ? 'opacity-100' : 'opacity-40'}`}>
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-sm flex-shrink-0 ${totalGoals >= 5 ? 'bg-[var(--ispora-brand-light)]' : 'bg-[var(--ispora-bg)]'}`}>
                    ⚡
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-xs text-[var(--ispora-text)] leading-tight">Goal Setter</div>
                    <div className="text-[10px] text-[var(--ispora-text3)] mt-0.5 leading-tight">
                      {totalGoals >= 5 ? '5+ goals created' : `Create ${5 - totalGoals} more goals`}
                    </div>
                  </div>
                </div>

                {/* All Goals Complete */}
                <div className={`flex items-center gap-2.5 py-2 transition-opacity ${completedGoals >= totalGoals && totalGoals > 0 ? 'opacity-100' : 'opacity-40'}`}>
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-sm flex-shrink-0 ${completedGoals >= totalGoals && totalGoals > 0 ? 'bg-[#dcfce7]' : 'bg-[var(--ispora-bg)]'}`}>
                    🎯
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-xs text-[var(--ispora-text)] leading-tight">All Goals Complete</div>
                    <div className="text-[10px] text-[var(--ispora-text3)] mt-0.5 leading-tight">
                      {completedGoals >= totalGoals && totalGoals > 0 
                        ? 'Amazing! All goals done! 🎉' 
                        : totalGoals > 0 
                          ? `Complete ${totalGoals - completedGoals} more goals` 
                          : 'Create goals to unlock'}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Tip Card */}
            <div className="bg-[var(--ispora-brand-light)] border-[1.5px] border-[var(--ispora-brand)] rounded-2xl p-3.5">
              <div className="font-bold text-xs text-[var(--ispora-brand)] mb-1.25">
                💡 Pro Tip
              </div>
              <div className="text-xs text-[var(--ispora-text2)] leading-relaxed">
                "Break each goal into one small action you can do today. Consistency over time is what gets you there."
              </div>
            </div>
            </div>
          </div>
        </div>
      )}

      {/* Journey Panel */}
      {activeMainTab === 'journey' && (
        <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-4 sm:py-6 min-h-0">
          <ImpactDashboard userRole="student" />
        </div>
      )}

      {/* Resources Panel */}
      {activeMainTab === 'resources' && (
        <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-4 sm:py-6 min-h-0">
          {/* Search and Filters */}
          <div className="flex gap-2.5 mb-4.5 flex-wrap items-center">
            <div className="relative flex-1 max-w-[280px]">
              <Search className="absolute left-2.25 top-1/2 -translate-y-1/2 w-3.25 h-3.25 text-[var(--ispora-text3)]" strokeWidth={2} />
              <input
                type="text"
                className="w-full bg-white border-[1.5px] border-[var(--ispora-border)] rounded-lg pl-8 pr-3 py-2 text-xs text-[var(--ispora-text)] outline-none focus:border-[var(--ispora-brand)] transition-all"
                placeholder="Search resources..."
                value={resourceSearch}
                onChange={(e) => setResourceSearch(e.target.value)}
              />
            </div>
            <select
              className="bg-white border-[1.5px] border-[var(--ispora-border)] rounded-lg px-2.5 py-2 text-xs text-[var(--ispora-text2)] outline-none focus:border-[var(--ispora-brand)] cursor-pointer"
              value={resourceTypeFilter}
              onChange={(e) => setResourceTypeFilter(e.target.value as ResourceType)}
            >
              <option value="">All Types</option>
              <option value="file">File</option>
              <option value="link">Link</option>
              <option value="note">Note</option>
            </select>
            <div className="ml-auto text-xs text-[var(--ispora-text3)]">
              <strong>{filteredResources.length}</strong> resources
            </div>
          </div>

          {/* Resources Grid */}
          {loadingResources ? (
            <div className="text-center py-10">
              <Loader2 className="w-8 h-8 text-[var(--ispora-brand)] animate-spin mx-auto mb-2" />
              <p className="text-sm text-[var(--ispora-text3)]">Loading resources...</p>
            </div>
          ) : filteredResources.length === 0 ? (
            <div className="text-center py-10">
              <div className="w-11 h-11 bg-[var(--ispora-brand-light)] rounded-full flex items-center justify-center mx-auto mb-3">
                <BookOpen className="w-5 h-5 text-[var(--ispora-brand)]" strokeWidth={1.8} />
              </div>
              <div className="font-syne text-[15px] font-bold text-[var(--ispora-text)] mb-1.5">
                No resources yet
              </div>
              <p className="text-xs text-[var(--ispora-text3)]">
                Your mentors will share resources with you here
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-3">
              {filteredResources.map(resource => {
                const iconData = getResourceIcon(resource.type);
                const Icon = iconData.icon;
                return (
                  <div
                    key={resource.id}
                    className="bg-white border-[1.5px] border-[var(--ispora-border)] rounded-xl overflow-hidden transition-all hover:border-[var(--ispora-brand)] hover:shadow-[var(--ispora-shadow)] hover:-translate-y-0.5 cursor-pointer"
                  >
                    <div className="p-3.5 pb-3 flex items-start gap-2.75">
                      <div
                        className="w-9.5 h-9.5 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: iconData.bg }}
                      >
                        <Icon className="w-4 h-4" style={{ stroke: iconData.color }} strokeWidth={2} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-[13px] text-[var(--ispora-text)] mb-0.5 leading-snug">
                          {resource.title}
                        </div>
                        <div className="text-[11px] text-[var(--ispora-text3)] mb-0.75">
                          From {resource.mentorName || 'Mentor'}
                        </div>
                        {resource.description && (
                          <div className="text-[11px] text-[var(--ispora-text2)] leading-relaxed line-clamp-2">
                            {resource.description}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="px-3.5 py-2.5 bg-[var(--ispora-bg)] border-t border-[var(--ispora-border)] flex items-center justify-between">
                      <span className="text-[10px] text-[var(--ispora-text3)]">
                        {formatRelativeDate(resource.createdAt)}
                      </span>
                      {resource.type === 'link' && resource.linkUrl && (
                        <a
                          href={resource.linkUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-[11px] font-medium text-[var(--ispora-brand)] hover:underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <ExternalLink className="w-2.5 h-2.5" strokeWidth={2.5} />
                          Open
                        </a>
                      )}
                      {resource.type === 'file' && resource.fileUrl && (
                        <a
                          href={resource.fileUrl}
                          download
                          className="flex items-center gap-1 text-[11px] font-medium text-[var(--ispora-brand)] hover:underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Download className="w-2.5 h-2.5" strokeWidth={2.5} />
                          Download
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Add Goal Modal */}
      {showAddGoalModal && (
        <div
          className="fixed inset-0 bg-[rgba(7,9,74,0.5)] backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setShowAddGoalModal(false)}
        >
          <div
            className="bg-white rounded-2xl w-full max-w-md shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-6 py-4 border-b border-[var(--ispora-border)] flex items-center justify-between">
              <h3 className="font-syne text-base font-bold text-[var(--ispora-text)]">Add New Goal</h3>
              <button
                onClick={() => setShowAddGoalModal(false)}
                className="w-6 h-6 rounded-lg hover:bg-[var(--ispora-bg)] flex items-center justify-center transition-colors"
              >
                <X className="w-3.5 h-3.5 text-[var(--ispora-text2)]" strokeWidth={2.5} />
              </button>
            </div>

            {/* Form */}
            <div className="px-6 py-4 space-y-3.5">
              <div>
                <label className="block text-sm font-semibold text-[var(--ispora-text)] mb-1.5">
                  Goal Title <span className="text-[var(--ispora-danger)]">*</span>
                </label>
                <input
                  type="text"
                  value={goalForm.title}
                  onChange={(e) => setGoalForm({ ...goalForm, title: e.target.value })}
                  placeholder="e.g., Complete 3 LeetCode problems per week"
                  className="w-full px-3.5 py-2.5 bg-white border-[1.5px] border-[var(--ispora-border)] rounded-lg text-sm text-[var(--ispora-text)] placeholder:text-[var(--ispora-text3)] outline-none focus:border-[var(--ispora-brand)] transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-[var(--ispora-text)] mb-1.5">
                    Category <span className="text-[var(--ispora-danger)]">*</span>
                  </label>
                  <select
                    value={goalForm.category}
                    onChange={(e) => setGoalForm({ ...goalForm, category: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-white border-[1.5px] border-[var(--ispora-border)] rounded-lg text-sm text-[var(--ispora-text)] outline-none focus:border-[var(--ispora-brand)] transition-all"
                  >
                    <option value="career">Career</option>
                    <option value="technical">Technical</option>
                    <option value="applications">Applications</option>
                    <option value="personal">Personal</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-[var(--ispora-text)] mb-1.5">
                    Priority
                  </label>
                  <select
                    value={goalForm.priority}
                    onChange={(e) => setGoalForm({ ...goalForm, priority: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-white border-[1.5px] border-[var(--ispora-border)] rounded-lg text-sm text-[var(--ispora-text)] outline-none focus:border-[var(--ispora-brand)] transition-all"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-[var(--ispora-text)] mb-1.5">
                  Due Date
                </label>
                <input
                  type="date"
                  value={goalForm.dueDate}
                  onChange={(e) => setGoalForm({ ...goalForm, dueDate: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-white border-[1.5px] border-[var(--ispora-border)] rounded-lg text-sm text-[var(--ispora-text)] outline-none focus:border-[var(--ispora-brand)] transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-[var(--ispora-text)] mb-1.5">
                  Notes
                </label>
                <textarea
                  value={goalForm.notes}
                  onChange={(e) => setGoalForm({ ...goalForm, notes: e.target.value })}
                  placeholder="Add any additional details..."
                  rows={3}
                  className="w-full px-3.5 py-2.5 bg-white border-[1.5px] border-[var(--ispora-border)] rounded-lg text-sm text-[var(--ispora-text)] placeholder:text-[var(--ispora-text3)] outline-none focus:border-[var(--ispora-brand)] transition-all resize-none"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-[var(--ispora-border)] flex items-center justify-end gap-2.5">
              <button
                onClick={() => setShowAddGoalModal(false)}
                className="px-4 py-2 text-sm font-semibold text-[var(--ispora-text2)] hover:bg-[var(--ispora-bg)] rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddGoal}
                disabled={savingGoal}
                className="px-4 py-2 text-sm font-semibold bg-[var(--ispora-brand)] text-white rounded-lg hover:bg-[#0118c4] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {savingGoal && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                {savingGoal ? 'Adding...' : 'Add Goal'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Goal Modal */}
      {showEditGoalModal && editingGoal && (
        <div
          className="fixed inset-0 bg-[rgba(7,9,74,0.5)] backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => {
            setShowEditGoalModal(false);
            setEditingGoal(null);
          }}
        >
          <div
            className="bg-white rounded-2xl w-full max-w-md shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-6 py-4 border-b border-[var(--ispora-border)] flex items-center justify-between">
              <h3 className="font-syne text-base font-bold text-[var(--ispora-text)]">Edit Goal</h3>
              <button
                onClick={() => {
                  setShowEditGoalModal(false);
                  setEditingGoal(null);
                }}
                className="w-6 h-6 rounded-lg hover:bg-[var(--ispora-bg)] flex items-center justify-center transition-colors"
              >
                <X className="w-3.5 h-3.5 text-[var(--ispora-text2)]" strokeWidth={2.5} />
              </button>
            </div>

            {/* Form */}
            <div className="px-6 py-4 space-y-3.5">
              <div>
                <label className="block text-sm font-semibold text-[var(--ispora-text)] mb-1.5">
                  Goal Title <span className="text-[var(--ispora-danger)]">*</span>
                </label>
                <input
                  type="text"
                  value={goalForm.title}
                  onChange={(e) => setGoalForm({ ...goalForm, title: e.target.value })}
                  placeholder="e.g., Complete 3 LeetCode problems per week"
                  className="w-full px-3.5 py-2.5 bg-white border-[1.5px] border-[var(--ispora-border)] rounded-lg text-sm text-[var(--ispora-text)] placeholder:text-[var(--ispora-text3)] outline-none focus:border-[var(--ispora-brand)] transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-[var(--ispora-text)] mb-1.5">
                    Category <span className="text-[var(--ispora-danger)]">*</span>
                  </label>
                  <select
                    value={goalForm.category}
                    onChange={(e) => setGoalForm({ ...goalForm, category: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-white border-[1.5px] border-[var(--ispora-border)] rounded-lg text-sm text-[var(--ispora-text)] outline-none focus:border-[var(--ispora-brand)] transition-all"
                  >
                    <option value="career">Career</option>
                    <option value="technical">Technical</option>
                    <option value="applications">Applications</option>
                    <option value="personal">Personal</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-[var(--ispora-text)] mb-1.5">
                    Priority
                  </label>
                  <select
                    value={goalForm.priority}
                    onChange={(e) => setGoalForm({ ...goalForm, priority: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-white border-[1.5px] border-[var(--ispora-border)] rounded-lg text-sm text-[var(--ispora-text)] outline-none focus:border-[var(--ispora-brand)] transition-all"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-[var(--ispora-text)] mb-1.5">
                  Due Date
                </label>
                <input
                  type="date"
                  value={goalForm.dueDate}
                  onChange={(e) => setGoalForm({ ...goalForm, dueDate: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-white border-[1.5px] border-[var(--ispora-border)] rounded-lg text-sm text-[var(--ispora-text)] outline-none focus:border-[var(--ispora-brand)] transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-[var(--ispora-text)] mb-1.5">
                  Notes
                </label>
                <textarea
                  value={goalForm.notes}
                  onChange={(e) => setGoalForm({ ...goalForm, notes: e.target.value })}
                  placeholder="Add any additional details..."
                  rows={3}
                  className="w-full px-3.5 py-2.5 bg-white border-[1.5px] border-[var(--ispora-border)] rounded-lg text-sm text-[var(--ispora-text)] placeholder:text-[var(--ispora-text3)] outline-none focus:border-[var(--ispora-brand)] transition-all resize-none"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-[var(--ispora-border)] flex items-center justify-between">
              <button
                onClick={() => handleDeleteGoal(editingGoal.id)}
                disabled={deletingGoal}
                className="px-4 py-2 text-sm font-semibold text-[var(--ispora-danger)] hover:bg-[var(--ispora-danger-light)] rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {deletingGoal && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                {deletingGoal ? 'Deleting...' : 'Delete'}
              </button>
              <div className="flex items-center gap-2.5">
                <button
                  onClick={() => {
                    setShowEditGoalModal(false);
                    setEditingGoal(null);
                  }}
                  className="px-4 py-2 text-sm font-semibold text-[var(--ispora-text2)] hover:bg-[var(--ispora-bg)] rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdateGoal}
                  disabled={savingGoal}
                  className="px-4 py-2 text-sm font-semibold bg-[var(--ispora-brand)] text-white rounded-lg hover:bg-[#0118c4] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {savingGoal && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  {savingGoal ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}