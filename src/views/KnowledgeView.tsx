import React, { useState } from 'react';
import {
  BookOpen,
  GraduationCap,
  FileCode2,
  FolderGit2,
  Plus,
  Search,
  ExternalLink,
  Download,
  FileText,
  Trash2,
  Edit2,
  Tag,
  Clock,
  Users,
  UserCheck,
  Calendar,
  Info,
} from 'lucide-react';
import type { AppState } from '../services/store';
import type { ResearchPaper, LearningResource, EngineeringNote, DocumentItem } from '../services/api';
import { ConfirmModal } from '../components/ConfirmModal';
import { AssignmentBreakdownModal } from '../components/AssignmentBreakdownModal';

interface KnowledgeViewProps {
  state: AppState;
  onOpenNewPaper: () => void;
  onEditPaper: (paper: ResearchPaper) => void;
  onDeletePaper: (id: string) => void;
  onOpenNewResource: () => void;
  onEditResource: (resource: LearningResource) => void;
  onDeleteResource: (id: string) => void;
  onOpenNewNote: () => void;
  onEditNote: (note: EngineeringNote) => void;
  onDeleteNote: (id: string) => void;
  onOpenUploadDoc: () => void;
  onDeleteDoc: (id: string) => void;
  onUpdateReadingStatus?: (itemType: 'research_paper' | 'learning_resource' | 'document', itemId: string, status: string) => Promise<any>;
}

export const KnowledgeView: React.FC<KnowledgeViewProps> = ({
  state,
  onOpenNewPaper,
  onEditPaper,
  onDeletePaper,
  onOpenNewResource,
  onEditResource,
  onDeleteResource,
  onOpenNewNote,
  onEditNote,
  onDeleteNote,
  onOpenUploadDoc,
  onDeleteDoc,
  onUpdateReadingStatus,
}) => {
  const isDark = state.theme === 'dark';
  const { researchPapers, learningResources, engineeringNotes, documents, team, currentUser } = state;

  const [activeTab, setActiveTab] = useState<'papers' | 'resources' | 'notes' | 'documents'>('papers');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [onlyAssignedToMe, setOnlyAssignedToMe] = useState<boolean>(false);

  // Breakdown modal state
  const [breakdownItem, setBreakdownItem] = useState<{
    title: string;
    itemType: 'research_paper' | 'learning_resource' | 'document';
    assignments?: any[];
    isAllMembers?: boolean;
  } | null>(null);

  // Confirmation modal state
  const [confirmState, setConfirmState] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  const isAssignedToUser = (item: {
    is_all_members?: boolean;
    assigned_member_ids?: string[];
    assignments?: any[];
  }) => {
    if (!currentUser) return false;
    return Boolean(
      item.is_all_members ||
      item.assigned_member_ids?.includes(currentUser.id) ||
      item.assignments?.some((a) => a.member_id === currentUser.id)
    );
  };

  const filteredPapers = researchPapers.filter((p) => {
    const matchesSearch =
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.authors && p.authors.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (p.topic && p.topic.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (p.tags && p.tags.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus = statusFilter === 'all' || p.reading_status === statusFilter;
    const matchesAssigned = !onlyAssignedToMe || isAssignedToUser(p);
    return matchesSearch && matchesStatus && matchesAssigned;
  });

  const filteredResources = learningResources.filter((r) => {
    const matchesSearch =
      r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.topic && r.topic.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (r.tags && r.tags.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesType = typeFilter === 'all' || r.resource_type === typeFilter;
    const matchesAssigned = !onlyAssignedToMe || isAssignedToUser(r);
    return matchesSearch && matchesType && matchesAssigned;
  });

  const filteredNotes = engineeringNotes.filter((n) => {
    return (
      n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (n.content && n.content.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (n.tags && n.tags.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  });

  const filteredDocs = documents.filter((d) => {
    const matchesSearch =
      d.file_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (d.description && d.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (d.type && d.type.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesAssigned = !onlyAssignedToMe || isAssignedToUser(d);
    return matchesSearch && matchesAssigned;
  });

  const getReadingStatusBadge = (status: ResearchPaper['reading_status']) => {
    switch (status) {
      case 'Completed':
        return isDark ? 'bg-emerald-950/80 text-emerald-300 border-emerald-800/80 font-semibold' : 'bg-emerald-100 text-emerald-800 border-emerald-300 font-semibold';
      case 'Reading':
        return isDark ? 'bg-cyan-950/80 text-cyan-300 border-cyan-800/80 font-semibold' : 'bg-cyan-100 text-cyan-800 border-cyan-300 font-semibold';
      case 'Unread':
      default:
        return isDark ? 'bg-slate-900 text-slate-400 border-slate-800 font-semibold' : 'bg-slate-100 text-slate-700 border-slate-300 font-semibold';
    }
  };

  const cardBgClass = isDark
    ? 'bg-slate-900/90 border-slate-800 text-slate-100'
    : 'bg-white border-slate-200 text-slate-900 shadow-sm';

  const confirmDeletePaper = (paper: ResearchPaper) => {
    setConfirmState({
      isOpen: true,
      title: 'Move Paper to Trash Vault?',
      message: `Are you sure you want to move "${paper.title}" to the Trash Vault? It will be removed from active view but can be restored anytime.`,
      onConfirm: () => {
        onDeletePaper(paper.id);
        setConfirmState((prev) => ({ ...prev, isOpen: false }));
      },
    });
  };

  const confirmDeleteResource = (resource: LearningResource) => {
    setConfirmState({
      isOpen: true,
      title: 'Move Resource to Trash Vault?',
      message: `Are you sure you want to move "${resource.title}" to the Trash Vault?`,
      onConfirm: () => {
        onDeleteResource(resource.id);
        setConfirmState((prev) => ({ ...prev, isOpen: false }));
      },
    });
  };

  const confirmDeleteNote = (note: EngineeringNote) => {
    setConfirmState({
      isOpen: true,
      title: 'Move Note to Trash Vault?',
      message: `Are you sure you want to move note "${note.title}" to the Trash Vault?`,
      onConfirm: () => {
        onDeleteNote(note.id);
        setConfirmState((prev) => ({ ...prev, isOpen: false }));
      },
    });
  };

  const confirmDeleteDoc = (doc: DocumentItem) => {
    setConfirmState({
      isOpen: true,
      title: 'Move Document to Trash Vault?',
      message: `Are you sure you want to move "${doc.file_name}" to the Trash Vault?`,
      onConfirm: () => {
        onDeleteDoc(doc.id);
        setConfirmState((prev) => ({ ...prev, isOpen: false }));
      },
    });
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className={`p-6 md:p-7 rounded-2xl border transition-all ${cardBgClass}`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5 mb-1">
              <BookOpen className="w-6 h-6 text-cyan-600 dark:text-cyan-400" />
              <h1 className={`text-2xl font-bold tracking-tight ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                Knowledge & Documentation Hub
              </h1>
            </div>
            <p className={`text-sm max-w-xl font-normal leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
              Academic research papers, learning references, engineering notebook, and uploaded datasheets.
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            {activeTab === 'papers' && (
              <button
                onClick={onOpenNewPaper}
                className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white shadow-sm transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>Add Research Paper</span>
              </button>
            )}
            {activeTab === 'resources' && (
              <button
                onClick={onOpenNewResource}
                className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white shadow-sm transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>Add Learning Resource</span>
              </button>
            )}
            {activeTab === 'notes' && (
              <button
                onClick={onOpenNewNote}
                className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white shadow-sm transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>Create Engineering Note</span>
              </button>
            )}
            {activeTab === 'documents' && (
              <button
                onClick={onOpenUploadDoc}
                className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white shadow-sm transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>Upload Document</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className={`flex items-center gap-2 border-b pb-2.5 overflow-x-auto ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
        <button
          onClick={() => { setActiveTab('papers'); setSearchQuery(''); }}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all whitespace-nowrap ${
            activeTab === 'papers'
              ? 'bg-cyan-600 text-white shadow-sm'
              : isDark ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-900' : 'text-slate-700 hover:text-slate-950 hover:bg-slate-100'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Research Papers</span>
          <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${
            activeTab === 'papers' ? 'bg-cyan-700/80 text-white' : isDark ? 'bg-slate-800 text-slate-300' : 'bg-slate-200 text-slate-700'
          }`}>
            {researchPapers.length}
          </span>
        </button>

        <button
          onClick={() => { setActiveTab('resources'); setSearchQuery(''); }}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all whitespace-nowrap ${
            activeTab === 'resources'
              ? 'bg-cyan-600 text-white shadow-sm'
              : isDark ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-900' : 'text-slate-700 hover:text-slate-950 hover:bg-slate-100'
          }`}
        >
          <GraduationCap className="w-4 h-4" />
          <span>Learning Resources</span>
          <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${
            activeTab === 'resources' ? 'bg-cyan-700/80 text-white' : isDark ? 'bg-slate-800 text-slate-300' : 'bg-slate-200 text-slate-700'
          }`}>
            {learningResources.length}
          </span>
        </button>

        <button
          onClick={() => { setActiveTab('notes'); setSearchQuery(''); }}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all whitespace-nowrap ${
            activeTab === 'notes'
              ? 'bg-cyan-600 text-white shadow-sm'
              : isDark ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-900' : 'text-slate-700 hover:text-slate-950 hover:bg-slate-100'
          }`}
        >
          <FileCode2 className="w-4 h-4" />
          <span>Engineering Notes</span>
          <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${
            activeTab === 'notes' ? 'bg-cyan-700/80 text-white' : isDark ? 'bg-slate-800 text-slate-300' : 'bg-slate-200 text-slate-700'
          }`}>
            {engineeringNotes.length}
          </span>
        </button>

        <button
          onClick={() => { setActiveTab('documents'); setSearchQuery(''); }}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all whitespace-nowrap ${
            activeTab === 'documents'
              ? 'bg-cyan-600 text-white shadow-sm'
              : isDark ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-900' : 'text-slate-700 hover:text-slate-950 hover:bg-slate-100'
          }`}
        >
          <FolderGit2 className="w-4 h-4" />
          <span>Project Attachments</span>
          <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${
            activeTab === 'documents' ? 'bg-cyan-700/80 text-white' : isDark ? 'bg-slate-800 text-slate-300' : 'bg-slate-200 text-slate-700'
          }`}>
            {documents.length}
          </span>
        </button>
      </div>

      {/* Filter / Search Bar */}
      <div className={`p-4 md:p-5 rounded-2xl border flex flex-col sm:flex-row items-center justify-between gap-3.5 ${cardBgClass}`}>
        <div className="relative flex-1 w-full max-w-md">
          <Search className={`w-4 h-4 absolute left-3.5 top-3 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
          <input
            type="text"
            placeholder={`Search ${activeTab}...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`w-full pl-10 pr-3.5 py-2 text-sm rounded-xl border focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-colors ${
              isDark ? 'bg-slate-950 border-slate-800 text-slate-100 placeholder-slate-500' : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400'
            }`}
          />
        </div>

        <div className="flex items-center gap-2.5 flex-wrap self-end sm:self-auto">
          {/* Quick "Assigned to Me" Filter */}
          <button
            type="button"
            onClick={() => setOnlyAssignedToMe((prev) => !prev)}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition-all ${
              onlyAssignedToMe
                ? 'bg-cyan-600 text-white border-cyan-500 shadow-sm'
                : isDark
                ? 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                : 'bg-slate-50 border-slate-300 text-slate-700 hover:bg-slate-100'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>Assigned to Me</span>
          </button>

          {activeTab === 'papers' && (
            <div className="flex items-center gap-2">
              <label className={`text-xs font-semibold ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Status:</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className={`px-3.5 py-2 text-sm rounded-xl border focus:outline-none ${
                  isDark ? 'bg-slate-950 border-slate-800 text-slate-200' : 'bg-slate-50 border-slate-300 text-slate-800'
                }`}
              >
                <option value="all">All Status</option>
                <option value="Unread">Unread</option>
                <option value="Reading">Reading</option>
                <option value="Completed">Completed</option>
              </select>
            </div>
          )}

          {activeTab === 'resources' && (
            <div className="flex items-center gap-2">
              <label className={`text-xs font-semibold ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Type:</label>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className={`px-3.5 py-2 text-sm rounded-xl border focus:outline-none ${
                  isDark ? 'bg-slate-950 border-slate-800 text-slate-200' : 'bg-slate-50 border-slate-300 text-slate-800'
                }`}
              >
                <option value="all">All Types</option>
                <option value="Video">Video</option>
                <option value="Lecture Notes">Lecture Notes</option>
                <option value="Course">Course</option>
                <option value="Article">Article</option>
                <option value="Book">Book</option>
                <option value="Tutorial">Tutorial</option>
                <option value="Other">Other</option>
              </select>
            </div>
          )}
        </div>
      </div>

      {/* 1. Research Papers View */}
      {activeTab === 'papers' && (
        <div className="space-y-4">
          {filteredPapers.length === 0 ? (
            <div className={`p-12 md:p-16 text-center rounded-2xl border border-dashed ${isDark ? 'border-slate-800 bg-slate-900/30' : 'border-slate-300 bg-slate-50'}`}>
              <BookOpen className={`w-10 h-10 mx-auto mb-3 ${isDark ? 'text-slate-600' : 'text-slate-400'}`} />
              <h3 className={`text-base font-bold ${isDark ? 'text-slate-300' : 'text-slate-800'}`}>
                {researchPapers.length === 0 ? 'No research papers added yet' : 'No matching research papers'}
              </h3>
              <p className={`text-sm max-w-sm mx-auto mt-1 leading-relaxed ${isDark ? 'text-slate-500' : 'text-slate-600'}`}>
                {researchPapers.length === 0
                  ? 'Add academic papers, thesis references, and technical publications relevant to the FOC drive architecture.'
                  : 'Try adjusting your search query or filters.'}
              </p>
              {researchPapers.length === 0 && (
                <button
                  onClick={onOpenNewPaper}
                  className="mt-4 inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white shadow-sm transition-all"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Research Paper</span>
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredPapers.map((paper) => {
                const isAll = Boolean(paper.is_all_members);
                const hasMultiAssignees = isAll || (paper.assignments && paper.assignments.length > 0) || (paper.assigned_member_ids && paper.assigned_member_ids.length > 0);
                const myAssignment = currentUser ? paper.assignments?.find((a) => a.member_id === currentUser.id) : null;
                const myPersonalStatus = myAssignment?.status || paper.reading_status;
                const isUserAssigned = isAssignedToUser(paper);

                return (
                  <div
                    key={paper.id}
                    className={`p-6 md:p-7 rounded-2xl border transition-all flex flex-col justify-between ${cardBgClass}`}
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1.5 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`px-2.5 py-0.5 rounded-md text-xs font-semibold border ${getReadingStatusBadge(paper.reading_status)}`}>
                              {paper.reading_status}
                            </span>
                            {paper.year && (
                              <span className={`text-xs font-semibold ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                                ({paper.year})
                              </span>
                            )}
                            {paper.topic && (
                              <span className={`text-xs px-2.5 py-0.5 rounded-md font-medium ${isDark ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-800 border border-slate-200'}`}>
                                {paper.topic}
                              </span>
                            )}
                            {/* Multi-member assignment pill */}
                            {hasMultiAssignees && (
                              <button
                                type="button"
                                onClick={() => setBreakdownItem({
                                  title: paper.title,
                                  itemType: 'research_paper',
                                  assignments: paper.assignments,
                                  isAllMembers: isAll,
                                })}
                                className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-semibold border transition-all ${
                                  isDark
                                    ? 'bg-cyan-950/50 border-cyan-500/40 text-cyan-300 hover:bg-cyan-900/50'
                                    : 'bg-cyan-50 border-cyan-300 text-cyan-800 hover:bg-cyan-100'
                                }`}
                                title="Click to view member progress breakdown"
                              >
                                <Users className="w-3 h-3 text-cyan-500" />
                                <span>{isAll ? 'All Members' : `${paper.assignments?.length || paper.assigned_member_ids?.length || 0} Members`}</span>
                                <span className="font-mono text-[10px] font-bold">
                                  ({paper.completed_assignments_count || 0}/{paper.total_assignments_count || (isAll ? team.length : (paper.assignments?.length || 1))})
                                </span>
                              </button>
                            )}
                          </div>
                          <h3 className={`text-base font-bold leading-snug mt-1 ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                            {paper.title}
                          </h3>
                          {paper.authors && (
                            <p className={`text-xs font-medium ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                              {paper.authors}
                            </p>
                          )}
                          {paper.journal_conference && (
                            <p className={`text-xs italic ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                              {paper.journal_conference}
                            </p>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => onEditPaper(paper)}
                            className={`p-2 rounded-xl text-xs transition-colors ${
                              isDark ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                            }`}
                            title="Edit Paper"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => confirmDeletePaper(paper)}
                            className={`p-2 rounded-xl text-xs transition-colors ${
                              isDark ? 'text-slate-400 hover:text-rose-400 hover:bg-slate-800' : 'text-slate-500 hover:text-rose-600 hover:bg-slate-100'
                            }`}
                            title="Move to Trash"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Due date & Instructions bar */}
                      {(paper.due_date || paper.instructions) && (
                        <div className={`p-2.5 rounded-xl border text-xs flex flex-wrap items-center gap-3 ${
                          isDark ? 'bg-slate-950/60 border-slate-800/80 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'
                        }`}>
                          {paper.due_date && (
                            <span className="flex items-center gap-1 font-semibold text-amber-500">
                              <Calendar className="w-3.5 h-3.5" />
                              <span>Due: {paper.due_date}</span>
                            </span>
                          )}
                          {paper.instructions && (
                            <span className="flex items-center gap-1">
                              <Info className="w-3.5 h-3.5 text-cyan-500" />
                              <span>{paper.instructions}</span>
                            </span>
                          )}
                        </div>
                      )}

                      {paper.summary && (
                        <div className={`p-3.5 rounded-xl text-xs leading-relaxed ${isDark ? 'bg-slate-950 text-slate-300' : 'bg-slate-50 text-slate-700'}`}>
                          {paper.summary}
                        </div>
                      )}

                      {paper.tags && (
                        <div className="flex flex-wrap gap-1.5">
                          {paper.tags.split(',').map((tag, idx) => (
                            <span
                              key={idx}
                              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs ${
                                isDark ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-700 border border-slate-200'
                              }`}
                            >
                              <Tag className="w-3 h-3" />
                              {tag.trim()}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="space-y-2.5 pt-3.5 mt-3.5 border-t">
                      {/* Individual reading status picker */}
                      {isUserAssigned && (
                        <div className="flex items-center justify-between text-xs">
                          <span className={`font-semibold flex items-center gap-1 ${isDark ? 'text-cyan-400' : 'text-cyan-700'}`}>
                            <UserCheck className="w-3.5 h-3.5" />
                            <span>My Reading Status:</span>
                          </span>
                          <select
                            value={myPersonalStatus}
                            onChange={(e) => {
                              if (onUpdateReadingStatus) {
                                onUpdateReadingStatus('research_paper', paper.id, e.target.value);
                              }
                            }}
                            className={`px-2 py-0.5 rounded-lg text-xs font-semibold border focus:outline-none ${getReadingStatusBadge(myPersonalStatus as any)}`}
                          >
                            <option value="Unread" className={isDark ? 'bg-slate-900 text-slate-100' : 'bg-white text-slate-900'}>Unread</option>
                            <option value="Reading" className={isDark ? 'bg-slate-900 text-slate-100' : 'bg-white text-slate-900'}>Reading</option>
                            <option value="Completed" className={isDark ? 'bg-slate-900 text-slate-100' : 'bg-white text-slate-900'}>Completed</option>
                          </select>
                        </div>
                      )}

                      <div className={`flex items-center justify-between text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                        <div className="flex items-center gap-2">
                          {paper.doi && (
                            <span className="font-mono text-xs text-cyan-600 dark:text-cyan-400 font-semibold">
                              DOI: {paper.doi}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2.5">
                          {paper.url && (
                            <a
                              href={paper.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-cyan-600 hover:text-cyan-500 font-semibold"
                            >
                              <span>Open Link</span>
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          )}
                          {paper.pdf_url && (
                            <a
                              href={paper.pdf_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              download={paper.pdf_name || 'paper.pdf'}
                              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-cyan-600 text-white hover:bg-cyan-500 font-semibold shadow-sm"
                            >
                              <Download className="w-3.5 h-3.5" />
                              <span>PDF</span>
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 2. Learning Resources View */}
      {activeTab === 'resources' && (
        <div className="space-y-4">
          {filteredResources.length === 0 ? (
            <div className={`p-12 md:p-16 text-center rounded-2xl border border-dashed ${isDark ? 'border-slate-800 bg-slate-900/30' : 'border-slate-300 bg-slate-50'}`}>
              <GraduationCap className={`w-10 h-10 mx-auto mb-3 ${isDark ? 'text-slate-600' : 'text-slate-400'}`} />
              <h3 className={`text-base font-bold ${isDark ? 'text-slate-300' : 'text-slate-800'}`}>
                {learningResources.length === 0 ? 'No learning resources added yet' : 'No matching learning resources'}
              </h3>
              <p className={`text-sm max-w-sm mx-auto mt-1 leading-relaxed ${isDark ? 'text-slate-500' : 'text-slate-600'}`}>
                {learningResources.length === 0
                  ? 'Add lecture videos, online courses, tutorials, and articles relevant to BLDC controls and planetary gearing.'
                  : 'Try adjusting your search query or filters.'}
              </p>
              {learningResources.length === 0 && (
                <button
                  onClick={onOpenNewResource}
                  className="mt-4 inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white shadow-sm transition-all"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Learning Resource</span>
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredResources.map((res) => {
                const isAll = Boolean(res.is_all_members);
                const hasMultiAssignees = isAll || (res.assignments && res.assignments.length > 0) || (res.assigned_member_ids && res.assigned_member_ids.length > 0);
                const myAssignment = currentUser ? res.assignments?.find((a) => a.member_id === currentUser.id) : null;
                const isUserAssigned = isAssignedToUser(res);

                return (
                  <div
                    key={res.id}
                    className={`p-5 md:p-6 rounded-2xl border flex flex-col justify-between transition-all ${cardBgClass}`}
                  >
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <span className={`px-2.5 py-0.5 rounded-md text-xs font-semibold ${
                          isDark ? 'bg-cyan-950/80 text-cyan-300 border border-cyan-800/80' : 'bg-cyan-100 text-cyan-800 border border-cyan-300'
                        }`}>
                          {res.resource_type}
                        </span>

                        {hasMultiAssignees && (
                          <button
                            type="button"
                            onClick={() => setBreakdownItem({
                              title: res.title,
                              itemType: 'learning_resource',
                              assignments: res.assignments,
                              isAllMembers: isAll,
                            })}
                            className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-semibold border transition-all ${
                              isDark
                                ? 'bg-cyan-950/50 border-cyan-500/40 text-cyan-300 hover:bg-cyan-900/50'
                                : 'bg-cyan-50 border-cyan-300 text-cyan-800 hover:bg-cyan-100'
                            }`}
                            title="Click to view member progress breakdown"
                          >
                            <Users className="w-3 h-3 text-cyan-500" />
                            <span>{isAll ? 'All' : `${res.assignments?.length || res.assigned_member_ids?.length || 0}`}</span>
                            <span className="font-mono text-[10px] font-bold">
                              ({res.completed_assignments_count || 0}/{res.total_assignments_count || (isAll ? team.length : (res.assignments?.length || 1))})
                            </span>
                          </button>
                        )}

                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => onEditResource(res)}
                            className={`p-1.5 rounded-lg text-xs transition-colors ${
                              isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-500 hover:text-slate-900'
                            }`}
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => confirmDeleteResource(res)}
                            className={`p-1.5 rounded-lg text-xs transition-colors ${
                              isDark ? 'text-slate-400 hover:text-rose-400' : 'text-slate-500 hover:text-rose-600'
                            }`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <h3 className={`text-sm font-bold leading-snug ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                        {res.title}
                      </h3>

                      {res.topic && (
                        <p className={`text-xs font-semibold text-cyan-600 dark:text-cyan-400`}>
                          Topic: {res.topic}
                        </p>
                      )}

                      {/* Due date & Instructions */}
                      {(res.due_date || res.instructions) && (
                        <div className={`p-2 rounded-xl border text-xs flex flex-col gap-1 ${
                          isDark ? 'bg-slate-950/60 border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'
                        }`}>
                          {res.due_date && (
                            <span className="flex items-center gap-1 font-semibold text-amber-500">
                              <Calendar className="w-3 h-3" />
                              <span>Due: {res.due_date}</span>
                            </span>
                          )}
                          {res.instructions && (
                            <span className="flex items-center gap-1">
                              <Info className="w-3 h-3 text-cyan-500" />
                              <span>{res.instructions}</span>
                            </span>
                          )}
                        </div>
                      )}

                      {res.description && (
                        <p className={`text-xs line-clamp-3 leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                          {res.description}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2 pt-3 mt-3 border-t">
                      {isUserAssigned && (
                        <div className="flex items-center justify-between text-xs">
                          <span className={`font-semibold flex items-center gap-1 ${isDark ? 'text-cyan-400' : 'text-cyan-700'}`}>
                            <UserCheck className="w-3 h-3" />
                            <span>My Status:</span>
                          </span>
                          <select
                            value={myAssignment?.status || 'Unread'}
                            onChange={(e) => {
                              if (onUpdateReadingStatus) {
                                onUpdateReadingStatus('learning_resource', res.id, e.target.value);
                              }
                            }}
                            className={`px-2 py-0.5 rounded-lg text-xs font-semibold border focus:outline-none ${getReadingStatusBadge((myAssignment?.status || 'Unread') as any)}`}
                          >
                            <option value="Unread" className={isDark ? 'bg-slate-900 text-slate-100' : 'bg-white text-slate-900'}>Unread</option>
                            <option value="Reading" className={isDark ? 'bg-slate-900 text-slate-100' : 'bg-white text-slate-900'}>In Progress</option>
                            <option value="Completed" className={isDark ? 'bg-slate-900 text-slate-100' : 'bg-white text-slate-900'}>Completed</option>
                          </select>
                        </div>
                      )}

                      <div className={`flex items-center justify-between text-xs ${isDark ? 'border-slate-800 text-slate-400' : 'border-slate-100 text-slate-600'}`}>
                        <span>{res.added_by_name || 'Team'}</span>
                        <a
                          href={res.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-cyan-600 dark:text-cyan-400 hover:underline font-semibold"
                        >
                          <span>Visit Resource</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 3. Engineering Notes View */}
      {activeTab === 'notes' && (
        <div className="space-y-4">
          {filteredNotes.length === 0 ? (
            <div className={`p-12 md:p-16 text-center rounded-2xl border border-dashed ${isDark ? 'border-slate-800 bg-slate-900/30' : 'border-slate-300 bg-slate-50'}`}>
              <FileCode2 className={`w-10 h-10 mx-auto mb-3 ${isDark ? 'text-slate-600' : 'text-slate-400'}`} />
              <h3 className={`text-base font-bold ${isDark ? 'text-slate-300' : 'text-slate-800'}`}>
                No engineering notes created yet
              </h3>
              <p className={`text-sm max-w-sm mx-auto mt-1 leading-relaxed ${isDark ? 'text-slate-500' : 'text-slate-600'}`}>
                Keep design rationales, mathematical formulas, pinout configurations, and test setup observations.
              </p>
              <button
                onClick={onOpenNewNote}
                className="mt-4 inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white shadow-sm transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>Create Engineering Note</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredNotes.map((note) => (
                <div
                  key={note.id}
                  className={`p-6 md:p-7 rounded-2xl border flex flex-col justify-between transition-all ${cardBgClass}`}
                >
                  <div className="space-y-2.5">
                    <div className="flex items-start justify-between gap-3">
                      <h3 className={`text-base font-bold ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                        {note.title}
                      </h3>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => onEditNote(note)}
                          className={`p-2 rounded-xl text-xs transition-colors ${
                            isDark ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                          }`}
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => confirmDeleteNote(note)}
                          className={`p-2 rounded-xl text-xs transition-colors ${
                            isDark ? 'text-slate-400 hover:text-rose-400 hover:bg-slate-800' : 'text-slate-500 hover:text-rose-600 hover:bg-slate-100'
                          }`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className={`text-xs whitespace-pre-wrap font-mono leading-relaxed p-3.5 rounded-xl ${
                      isDark ? 'bg-slate-950 text-slate-200' : 'bg-slate-50 text-slate-800 border border-slate-200'
                    }`}>
                      {note.content.length > 350 ? note.content.substring(0, 350) + '...' : note.content}
                    </div>
                  </div>

                  <div className={`flex items-center justify-between pt-3.5 mt-3.5 border-t text-xs ${isDark ? 'border-slate-800 text-slate-400' : 'border-slate-100 text-slate-600'}`}>
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      {new Date(note.updated_at).toLocaleDateString()}
                    </span>
                    <span>By: {note.author_name || 'Team Member'}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 4. Project Attachments & Documents View */}
      {activeTab === 'documents' && (
        <div className="space-y-4">
          {filteredDocs.length === 0 ? (
            <div className={`p-12 md:p-16 text-center rounded-2xl border border-dashed ${isDark ? 'border-slate-800 bg-slate-900/30' : 'border-slate-300 bg-slate-50'}`}>
              <FolderGit2 className={`w-10 h-10 mx-auto mb-3 ${isDark ? 'text-slate-600' : 'text-slate-400'}`} />
              <h3 className={`text-base font-bold ${isDark ? 'text-slate-300' : 'text-slate-800'}`}>
                {documents.length === 0 ? 'No project documents uploaded yet' : 'No matching documents'}
              </h3>
              <p className={`text-sm max-w-sm mx-auto mt-1 leading-relaxed ${isDark ? 'text-slate-500' : 'text-slate-600'}`}>
                {documents.length === 0
                  ? 'Upload datasheets, schematics, PCB Gerbers, CAD models, and technical specifications.'
                  : 'Try adjusting your search query or filters.'}
              </p>
              {documents.length === 0 && (
                <button
                  onClick={onOpenUploadDoc}
                  className="mt-4 inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white shadow-sm transition-all"
                >
                  <Plus className="w-4 h-4" />
                  <span>Upload Document</span>
                </button>
              )}
            </div>
          ) : (
            <div className={`overflow-hidden rounded-2xl border ${isDark ? 'border-slate-800 bg-slate-900' : 'border-slate-200 bg-white shadow-sm'}`}>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className={`border-b ${isDark ? 'border-slate-800 bg-slate-950 text-slate-400' : 'border-slate-200 bg-slate-50 text-slate-700'}`}>
                    <tr>
                      <th className="py-3.5 px-4 font-bold">File Name</th>
                      <th className="py-3.5 px-4 font-bold">Type</th>
                      <th className="py-3.5 px-4 font-bold">Assignments</th>
                      <th className="py-3.5 px-4 font-bold">Size</th>
                      <th className="py-3.5 px-4 font-bold">Uploaded By</th>
                      <th className="py-3.5 px-4 font-bold">Date</th>
                      <th className="py-3.5 px-4 font-bold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${isDark ? 'divide-slate-800/50' : 'divide-slate-200'}`}>
                    {filteredDocs.map((doc) => {
                      const isAll = Boolean(doc.is_all_members);
                      const hasMultiAssignees = isAll || (doc.assignments && doc.assignments.length > 0) || (doc.assigned_member_ids && doc.assigned_member_ids.length > 0);
                      const myAssignment = currentUser ? doc.assignments?.find((a) => a.member_id === currentUser.id) : null;
                      const isUserAssigned = isAssignedToUser(doc);

                      return (
                        <tr key={doc.id} className={`transition-colors ${isDark ? 'hover:bg-slate-800/50 text-slate-200' : 'hover:bg-slate-50 text-slate-800'}`}>
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-3">
                              <FileText className="w-5 h-5 text-cyan-600 dark:text-cyan-400 flex-shrink-0" />
                              <div>
                                <p className={`font-semibold ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                                  {doc.file_name}
                                </p>
                                {doc.description && (
                                  <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                    {doc.description}
                                  </p>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="py-3.5 px-4">
                            <span className={`px-2.5 py-0.5 rounded-md text-xs font-semibold ${isDark ? 'bg-slate-800 text-slate-300 border border-slate-700' : 'bg-slate-100 text-slate-700 border border-slate-300'}`}>
                              {doc.type}
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            {hasMultiAssignees ? (
                              <button
                                type="button"
                                onClick={() => setBreakdownItem({
                                  title: doc.file_name,
                                  itemType: 'document',
                                  assignments: doc.assignments,
                                  isAllMembers: isAll,
                                })}
                                className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-semibold border transition-all ${
                                  isDark
                                    ? 'bg-cyan-950/50 border-cyan-500/40 text-cyan-300 hover:bg-cyan-900/50'
                                    : 'bg-cyan-50 border-cyan-300 text-cyan-800 hover:bg-cyan-100'
                                }`}
                                title="Click to view review progress breakdown"
                              >
                                <Users className="w-3 h-3 text-cyan-500" />
                                <span>{isAll ? 'All' : `${doc.assignments?.length || doc.assigned_member_ids?.length || 0}`}</span>
                                <span className="font-mono text-[10px] font-bold">
                                  ({doc.completed_assignments_count || 0}/{doc.total_assignments_count || (isAll ? team.length : (doc.assignments?.length || 1))})
                                </span>
                              </button>
                            ) : (
                              <span className={`text-xs italic ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>General</span>
                            )}
                          </td>
                          <td className={`py-3.5 px-4 text-xs font-mono ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                            {doc.file_size || 'N/A'}
                          </td>
                          <td className={`py-3.5 px-4 font-medium ${isDark ? 'text-slate-300' : 'text-slate-800'}`}>
                            {doc.uploaded_by_name || 'Team Member'}
                          </td>
                          <td className={`py-3.5 px-4 text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                            {new Date(doc.created_at).toLocaleDateString()}
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {isUserAssigned && (
                                <select
                                  value={myAssignment?.status || 'Unread'}
                                  onChange={(e) => {
                                    if (onUpdateReadingStatus) {
                                      onUpdateReadingStatus('document', doc.id, e.target.value);
                                    }
                                  }}
                                  className={`px-2 py-0.5 rounded-lg text-xs font-semibold border focus:outline-none ${getReadingStatusBadge((myAssignment?.status || 'Unread') as any)}`}
                                >
                                  <option value="Unread" className={isDark ? 'bg-slate-900 text-slate-100' : 'bg-white text-slate-900'}>Unread</option>
                                  <option value="Reading" className={isDark ? 'bg-slate-900 text-slate-100' : 'bg-white text-slate-900'}>Reviewing</option>
                                  <option value="Completed" className={isDark ? 'bg-slate-900 text-slate-100' : 'bg-white text-slate-900'}>Reviewed</option>
                                </select>
                              )}
                              <a
                                href={doc.file_url}
                                download={doc.file_name}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={`p-2 rounded-xl transition-colors ${
                                  isDark ? 'text-slate-400 hover:text-cyan-400 hover:bg-slate-800' : 'text-slate-600 hover:text-cyan-700 hover:bg-slate-100'
                                }`}
                                title="Download File"
                              >
                                <Download className="w-4 h-4" />
                              </a>
                              <button
                                onClick={() => confirmDeleteDoc(doc)}
                                className={`p-2 rounded-xl transition-colors ${
                                  isDark ? 'text-slate-400 hover:text-rose-400 hover:bg-slate-800' : 'text-slate-600 hover:text-rose-600 hover:bg-slate-100'
                                }`}
                                title="Move to Trash"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Assignment Breakdown Modal */}
      {breakdownItem && (
        <AssignmentBreakdownModal
          isOpen={Boolean(breakdownItem)}
          onClose={() => setBreakdownItem(null)}
          title={breakdownItem.title}
          itemType="reading"
          assignments={breakdownItem.assignments}
          isAllMembers={Boolean(breakdownItem.isAllMembers)}
          team={team}
          theme={state.theme}
        />
      )}

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={confirmState.isOpen}
        onClose={() => setConfirmState((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={confirmState.onConfirm}
        title={confirmState.title}
        message={confirmState.message}
        confirmText="Move to Trash"
        confirmVariant="danger"
        theme={state.theme}
      />
    </div>
  );
};
