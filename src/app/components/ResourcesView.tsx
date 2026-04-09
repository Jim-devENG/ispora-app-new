import { useState, useEffect } from 'react';
import { FileText, Link as LinkIcon, File, Download, Trash2, Calendar, ExternalLink } from 'lucide-react';
import { api } from '../lib/api';
import type { Resource } from '../types';

interface ResourcesViewProps {
  mentorshipId: string;
  isMentor: boolean;
}

export default function ResourcesView({ mentorshipId, isMentor }: ResourcesViewProps) {
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadResources();
  }, [mentorshipId]);

  const loadResources = async () => {
    try {
      setLoading(true);
      const response = await api.resource.getAll(mentorshipId);
      setResources(response.resources || []);
    } catch (error) {
      console.error('Failed to load resources:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (resourceId: string) => {
    if (!confirm('Are you sure you want to delete this resource?')) {
      return;
    }

    try {
      await api.resource.delete(resourceId);
      setResources(resources.filter(r => r.id !== resourceId));
    } catch (error) {
      console.error('Failed to delete resource:', error);
      alert('Failed to delete resource. Please try again.');
    }
  };

  const getResourceIcon = (type: string) => {
    switch (type) {
      case 'file':
        return <File className="w-5 h-5" />;
      case 'link':
        return <LinkIcon className="w-5 h-5" />;
      case 'note':
        return <FileText className="w-5 h-5" />;
      default:
        return <File className="w-5 h-5" />;
    }
  };

  const getResourceColor = (type: string) => {
    switch (type) {
      case 'file':
        return 'bg-blue-100 text-blue-600';
      case 'link':
        return 'bg-green-100 text-green-600';
      case 'note':
        return 'bg-purple-100 text-purple-600';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffInDays === 0) return 'Today';
    if (diffInDays === 1) return 'Yesterday';
    if (diffInDays < 7) return `${diffInDays} days ago`;
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--ispora-brand)]"></div>
      </div>
    );
  }

  if (resources.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 rounded-full bg-[var(--ispora-bg)] flex items-center justify-center mx-auto mb-4">
          <FileText className="w-8 h-8 text-[var(--ispora-text3)]" />
        </div>
        <h3 className="text-base font-semibold text-[var(--ispora-text)] mb-2">
          No resources yet
        </h3>
        <p className="text-sm text-[var(--ispora-text3)]">
          {isMentor
            ? 'Share documents, links, or notes with your mentee'
            : 'Resources shared by your mentor will appear here'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {resources.map((resource) => (
        <div
          key={resource.id}
          className="bg-white border border-[var(--ispora-border)] rounded-xl p-4 hover:shadow-md transition-all group"
        >
          <div className="flex items-start gap-4">
            {/* Icon */}
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${getResourceColor(resource.type)}`}>
              {getResourceIcon(resource.type)}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-base text-[var(--ispora-text)] mb-1 truncate">
                {resource.title}
              </h4>
              
              {resource.description && (
                <p className="text-sm text-[var(--ispora-text3)] mb-2 line-clamp-2">
                  {resource.description}
                </p>
              )}

              {/* Resource-specific info */}
              {resource.type === 'file' && (
                <div className="flex items-center gap-4 text-xs text-[var(--ispora-text3)] mb-3">
                  <span>{resource.fileName}</span>
                  {resource.fileSize && <span>{formatFileSize(resource.fileSize)}</span>}
                </div>
              )}

              {resource.type === 'link' && resource.linkUrl && (
                <div className="mb-3">
                  <a
                    href={resource.linkUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-[var(--ispora-brand)] hover:underline flex items-center gap-1 break-all"
                  >
                    {resource.linkUrl}
                    <ExternalLink className="w-3 h-3 flex-shrink-0" />
                  </a>
                </div>
              )}

              {resource.type === 'note' && resource.content && (
                <div className="bg-[var(--ispora-bg)] border border-[var(--ispora-border)] rounded-lg p-3 mb-3">
                  <p className="text-sm text-[var(--ispora-text)] whitespace-pre-wrap line-clamp-4">
                    {resource.content}
                  </p>
                </div>
              )}

              {/* Meta info */}
              <div className="flex items-center gap-4 text-xs text-[var(--ispora-text3)]">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {formatDate(resource.createdAt)}
                </span>
                {resource.mentor && (
                  <span>
                    Shared by {resource.mentor.firstName} {resource.mentor.lastName}
                  </span>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 flex-shrink-0">
              {resource.type === 'file' && resource.fileUrl && (
                <a
                  href={resource.fileUrl}
                  download
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 rounded-lg flex items-center justify-center hover:bg-[var(--ispora-bg)] text-[var(--ispora-text2)] hover:text-[var(--ispora-brand)] transition-all"
                  title="Download"
                >
                  <Download className="w-4 h-4" />
                </a>
              )}

              {resource.type === 'link' && resource.linkUrl && (
                <a
                  href={resource.linkUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 rounded-lg flex items-center justify-center hover:bg-[var(--ispora-bg)] text-[var(--ispora-text2)] hover:text-[var(--ispora-brand)] transition-all"
                  title="Open link"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              )}

              {isMentor && (
                <button
                  onClick={() => handleDelete(resource.id)}
                  className="w-9 h-9 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-red-50 text-[var(--ispora-text2)] hover:text-red-600 transition-all"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
