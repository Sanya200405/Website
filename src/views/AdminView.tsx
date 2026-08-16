import React, { useState } from 'react';
import {
  ShieldAlert,
  Users,
  HardDrive,
  Settings,
  Plus,
  Trash2,
  Key,
  Database,
  Download,
  RotateCcw,
  Zap,
  CheckCircle2,
  Clock,
  Archive,
  RefreshCw,
  Server,
  AlertTriangle,
  Layers,
  FolderArchive,
} from 'lucide-react';
import type { AppState } from '../services/store';
import type { TeamMember, MotorParameters, ExternalBackupRecord } from '../services/api';
import { ConfirmModal } from '../components/ConfirmModal';
import { TrashModal } from '../components/TrashModal';

interface AdminViewProps {
  state: AppState;
  onAdminCreateUser: (data: { name: string; email: string; password?: string; role?: 'admin' | 'member'; bio?: string }) => Promise<any>;
  onAdminUpdateUserRole: (id: string, role: 'admin' | 'member') => Promise<any>;
  onAdminUpdateUserStatus: (id: string, is_active: boolean) => Promise<any>;
  onAdminResetPassword: (id: string, new_pass: string) => Promise<any>;
  onAdminDeleteUser: (id: string) => Promise<any>;
  onAdminDeleteStorageFile: (filename: string) => Promise<any>;
  onUpdateProject: (data: any) => Promise<any>;
  onUpdateMotorParameters: (data: Partial<MotorParameters>) => Promise<any>;
  onAdminCreateBackup: (reason?: string) => Promise<any>;
  onAdminRestoreBackup: (filename: string) => Promise<any>;
  onAdminDeleteBackup: (filename: string) => Promise<any>;
  onAdminTriggerExternalBackup: () => Promise<any>;
  onAdminTestExternalDestination: () => Promise<{ success: boolean; destinationDisplay: string; message: string }>;
  onAdminRestoreCompleteArchive: (data: FormData | { filename: string }) => Promise<any>;
  onRestoreTrashItem: (entity_type: string, id: string) => Promise<any>;
  onPurgeTrashItem: (entity_type: string, id: string) => Promise<any>;
}

export const AdminView: React.FC<AdminViewProps> = ({
  state,
  onAdminCreateUser,
  onAdminUpdateUserRole,
  onAdminUpdateUserStatus,
  onAdminResetPassword,
  onAdminDeleteUser,
  onAdminDeleteStorageFile,
  onUpdateProject,
  onUpdateMotorParameters,
  onAdminCreateBackup,
  onAdminRestoreBackup,
  onAdminDeleteBackup,
  onAdminTriggerExternalBackup,
  onAdminTestExternalDestination,
  onAdminRestoreCompleteArchive,
  onRestoreTrashItem,
  onPurgeTrashItem,
}) => {
  const isDark = state.theme === 'dark';
  const {
    currentUser,
    adminUsers,
    adminStorage,
    adminBackups,
    externalBackupStatus,
    externalBackups,
    project,
    motorParameters,
    trashItems,
  } = state;

  const [activeTab, setActiveTab] = useState<'backups' | 'users' | 'motor' | 'project' | 'storage'>('backups');
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [showTrashModal, setShowTrashModal] = useState(false);
  const [isCreatingBackup, setIsCreatingBackup] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);

  // External Disaster Recovery States
  const [isTriggeringExternal, setIsTriggeringExternal] = useState(false);
  const [isTestingDestination, setIsTestingDestination] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  // Complete Archive Restore Modal state
  const [showRestoreArchiveModal, setShowRestoreArchiveModal] = useState(false);
  const [archiveFile, setArchiveFile] = useState<File | null>(null);
  const [selectedServerArchive, setSelectedServerArchive] = useState<string>('');
  const [restoreSourceType, setRestoreSourceType] = useState<'upload' | 'server'>('upload');
  const [isExecutingArchiveRestore, setIsExecutingArchiveRestore] = useState(false);
  const [archiveRestoreResult, setArchiveRestoreResult] = useState<{
    success: boolean;
    restoredUploadsCount: number;
    databaseSizeFormatted: string;
    message: string;
  } | null>(null);

  // User creation form
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserRole, setNewUserRole] = useState<'admin' | 'member'>('member');

  // Project details form
  const [projName, setProjName] = useState(project.name);
  const [projDesc, setProjDesc] = useState(project.description);
  const [projStatus, setProjStatus] = useState(project.status);
  const [projTargetDate, setProjTargetDate] = useState(project.target_date || '');
  const [isUpdatingProject, setIsUpdatingProject] = useState(false);

  // Motor Parameters form
  const [motorForm, setMotorForm] = useState<Partial<MotorParameters>>(motorParameters || {
    motor_model: 'BLDC Motor with Planetary Gearhead',
    rated_voltage_v: 24.0,
    rated_current_a: 10.0,
    peak_current_a: 25.0,
    pole_pairs: 4,
    kv_rating: 400.0,
    phase_resistance_ohm: 0.18,
    phase_inductance_uh: 120.0,
    max_rpm: 6000.0,
    rated_speed_rpm: 4500.0,
    continuous_torque_nm: 0.35,
    peak_torque_nm: 1.20,
    gear_ratio: 10.0,
    gearbox_type: 'Planetary 10:1',
    gearbox_efficiency: 0.85,
    inverter_topology: '3-Phase Half-Bridge (6x MOSFETs)',
    pwm_frequency_khz: 20.0,
    current_sensing_type: 'Low-Side Shunt (In-line)',
    encoder_type: 'Magnetic Rotary (AS5600 / AS5048)',
    encoder_cpr: 4096,
    thermal_limit_c: 85.0,
    notes: 'Low-backlash actuator specs',
  });
  const [isUpdatingMotor, setIsUpdatingMotor] = useState(false);
  const [motorSaveSuccess, setMotorSaveSuccess] = useState(false);

  // Confirmation modal state
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText: string;
    confirmVariant: 'danger' | 'warning' | 'primary';
    requireTypedConfirmation?: string;
    onConfirm: () => Promise<void>;
  }>({
    isOpen: false,
    title: '',
    message: '',
    confirmText: 'Confirm',
    confirmVariant: 'danger',
    onConfirm: async () => {},
  });

  // Security guard check
  if (currentUser?.role !== 'admin') {
    return (
      <div className={`p-12 text-center rounded-2xl border ${isDark ? 'bg-slate-900 border-rose-900/50 text-slate-300' : 'bg-rose-50 border-rose-200 text-rose-800'}`}>
        <ShieldAlert className="w-12 h-12 text-rose-500 mx-auto mb-3" />
        <h2 className="text-lg font-bold">Access Denied: Administrator Privileges Required</h2>
        <p className="text-sm mt-1 text-slate-400">
          This management console is restricted to system administrators. Please log in with an administrator account.
        </p>
      </div>
    );
  }

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName || !newUserEmail) return;
    try {
      await onAdminCreateUser({
        name: newUserName.trim(),
        email: newUserEmail.trim(),
        password: newUserPassword || 'project123',
        role: newUserRole,
      });
      setShowAddUserModal(false);
      setNewUserName('');
      setNewUserEmail('');
      setNewUserPassword('');
    } catch (err: any) {
      alert(err.message || 'Failed to create user');
    }
  };

  const handleResetPassword = (user: TeamMember) => {
    const newPass = prompt(`Enter new password for ${user.name} (min 4 characters):`);
    if (!newPass || newPass.length < 4) {
      if (newPass) alert('Password must be at least 4 characters.');
      return;
    }
    onAdminResetPassword(user.id, newPass)
      .then(() => alert(`Password updated successfully for ${user.name}`))
      .catch((err: any) => alert(err.message || 'Failed to reset password'));
  };

  const handleSaveProject = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdatingProject(true);
    try {
      await onUpdateProject({
        name: projName,
        description: projDesc,
        status: projStatus,
        target_date: projTargetDate,
      });
      alert('Project settings saved successfully');
    } catch (err: any) {
      alert(err.message || 'Failed to update project settings');
    } finally {
      setIsUpdatingProject(false);
    }
  };

  const handleSaveMotorParameters = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdatingMotor(true);
    setMotorSaveSuccess(false);
    try {
      await onUpdateMotorParameters(motorForm);
      setMotorSaveSuccess(true);
      setTimeout(() => setMotorSaveSuccess(false), 4000);
    } catch (err: any) {
      alert(err.message || 'Failed to update motor parameters');
    } finally {
      setIsUpdatingMotor(false);
    }
  };

  // Local Snapshot Handlers
  const handleTriggerBackup = async () => {
    setIsCreatingBackup(true);
    try {
      await onAdminCreateBackup('On-demand manual snapshot from Admin Console');
    } catch (err: any) {
      alert(err.message || 'Failed to create backup snapshot');
    } finally {
      setIsCreatingBackup(false);
    }
  };

  const handleRestoreSnapshot = (filename: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Restore Database from Snapshot?',
      message: `WARNING: Restoring from snapshot "${filename}" will replace current active database records. A pre-restore safety snapshot will be created automatically. Type "RESTORE" below to proceed.`,
      confirmText: 'Restore Database',
      confirmVariant: 'danger',
      requireTypedConfirmation: 'RESTORE',
      onConfirm: async () => {
        setIsRestoring(true);
        try {
          await onAdminRestoreBackup(filename);
          alert('Database snapshot restored successfully!');
        } catch (err: any) {
          alert(err.message || 'Failed to restore snapshot');
        } finally {
          setIsRestoring(false);
          setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        }
      },
    });
  };

  const handleDeleteSnapshot = (filename: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Delete Backup Snapshot?',
      message: `Permanently delete snapshot file "${filename}"? This action cannot be undone.`,
      confirmText: 'Delete Snapshot',
      confirmVariant: 'danger',
      onConfirm: async () => {
        try {
          await onAdminDeleteBackup(filename);
        } catch (err: any) {
          alert(err.message || 'Failed to delete snapshot');
        } finally {
          setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        }
      },
    });
  };

  // External Disaster Recovery Handlers
  const handleTriggerExternalBackup = async () => {
    setIsTriggeringExternal(true);
    setTestResult(null);
    try {
      await onAdminTriggerExternalBackup();
    } catch (err: any) {
      alert(err.message || 'Failed to generate external disaster recovery archive');
    } finally {
      setIsTriggeringExternal(false);
    }
  };

  const handleTestDestination = async () => {
    setIsTestingDestination(true);
    try {
      const res = await onAdminTestExternalDestination();
      setTestResult({ success: res.success, message: res.message });
    } catch (err: any) {
      setTestResult({ success: false, message: err.message || 'Failed to test destination' });
    } finally {
      setIsTestingDestination(false);
    }
  };

  const handleExecuteArchiveRestore = async () => {
    if (restoreSourceType === 'upload' && !archiveFile) {
      alert('Please select a .zip complete project archive to upload.');
      return;
    }
    if (restoreSourceType === 'server' && !selectedServerArchive) {
      alert('Please select an external archive from the list.');
      return;
    }

    setIsExecutingArchiveRestore(true);
    setArchiveRestoreResult(null);

    try {
      let res: any;
      if (restoreSourceType === 'upload' && archiveFile) {
        const formData = new FormData();
        formData.append('archive', archiveFile);
        res = await onAdminRestoreCompleteArchive(formData);
      } else {
        res = await onAdminRestoreCompleteArchive({ filename: selectedServerArchive });
      }

      setArchiveRestoreResult(res);
      setArchiveFile(null);
    } catch (err: any) {
      alert(err.message || 'Complete archive restoration failed');
    } finally {
      setIsExecutingArchiveRestore(false);
    }
  };

  const cardBgClass = isDark
    ? 'bg-slate-900/90 border-slate-800 text-slate-100'
    : 'bg-white border-slate-200 text-slate-900 shadow-sm';

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className={`p-6 md:p-7 rounded-2xl border ${cardBgClass}`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <ShieldAlert className="w-6 h-6 text-cyan-600 dark:text-cyan-400" />
              <h1 className={`text-2xl font-bold tracking-tight ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                Administrator Console & Resilience
              </h1>
            </div>
            <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              System administration, disaster recovery, external backup replication, user roles, and motor parameters.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowTrashModal(true)}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border transition-all ${
                isDark ? 'border-slate-800 bg-slate-950 text-slate-300 hover:bg-slate-800' : 'border-slate-300 bg-slate-50 text-slate-700 hover:bg-slate-100'
              }`}
            >
              <Trash2 className="w-4 h-4 text-rose-500" />
              <span>Trash Vault</span>
              {trashItems.length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-xs font-bold bg-rose-500/20 text-rose-400">
                  {trashItems.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setShowAddUserModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-cyan-600 hover:bg-cyan-500 text-white shadow-sm transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Add Team Member</span>
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className={`p-1.5 rounded-2xl border flex items-center gap-1.5 overflow-x-auto ${
        isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-100 border-slate-200'
      }`}>
        <button
          onClick={() => setActiveTab('backups')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
            activeTab === 'backups'
              ? isDark ? 'bg-slate-800 text-cyan-400 shadow-sm' : 'bg-white text-cyan-800 shadow-sm'
              : isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Database className="w-4 h-4" />
          <span>Backups & Resilience</span>
        </button>

        <button
          onClick={() => setActiveTab('motor')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
            activeTab === 'motor'
              ? isDark ? 'bg-slate-800 text-cyan-400 shadow-sm' : 'bg-white text-cyan-800 shadow-sm'
              : isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Zap className="w-4 h-4" />
          <span>Motor & Gearing Specs</span>
        </button>

        <button
          onClick={() => setActiveTab('users')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
            activeTab === 'users'
              ? isDark ? 'bg-slate-800 text-cyan-400 shadow-sm' : 'bg-white text-cyan-800 shadow-sm'
              : isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>User Accounts & Roles</span>
          {adminUsers.length > 0 && (
            <span className={`px-1.5 py-0.2 rounded-md text-[10px] ${
              isDark ? 'bg-slate-900 text-slate-300' : 'bg-slate-200 text-slate-700'
            }`}>
              {adminUsers.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('project')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
            activeTab === 'project'
              ? isDark ? 'bg-slate-800 text-cyan-400 shadow-sm' : 'bg-white text-cyan-800 shadow-sm'
              : isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Settings className="w-4 h-4" />
          <span>Project Lifecycle & Scope</span>
        </button>

        <button
          onClick={() => setActiveTab('storage')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
            activeTab === 'storage'
              ? isDark ? 'bg-slate-800 text-cyan-400 shadow-sm' : 'bg-white text-cyan-800 shadow-sm'
              : isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <HardDrive className="w-4 h-4" />
          <span>Storage Manager</span>
        </button>
      </div>

      {/* 1. Backups & Data Resilience Tab */}
      {activeTab === 'backups' && (
        <div className="space-y-6">
          {/* Top Hero / Off-Site Disaster Recovery Section */}
          <div className={`p-6 md:p-7 rounded-2xl border space-y-5 ${cardBgClass}`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800/80 dark:border-slate-800">
              <div className="space-y-1">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-500 border border-cyan-500/20">
                    <Server className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className={`text-lg font-bold ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                      Off-Site Disaster Recovery Engine
                    </h2>
                    <span className="text-xs font-mono text-cyan-600 dark:text-cyan-400">
                      Tier 2: Full Multi-Component Archiving (SQLite DB + JSON Export + Uploads Folder)
                    </span>
                  </div>
                </div>
                <p className={`text-xs max-w-3xl leading-relaxed mt-1 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                  Protects against complete server or drive failure by packaging the database, relational schemas, and all physical uploaded files into timestamped, verified disaster recovery bundles.
                </p>
              </div>

              <div className="flex items-center gap-2.5 flex-wrap flex-shrink-0">
                <button
                  onClick={handleTestDestination}
                  disabled={isTestingDestination}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all ${
                    isDark ? 'border-slate-700 bg-slate-950 text-slate-300 hover:bg-slate-800' : 'border-slate-300 bg-slate-50 text-slate-700 hover:bg-slate-100'
                  }`}
                  title="Validate write connectivity to configured external destination"
                >
                  <CheckCircle2 className={`w-3.5 h-3.5 ${isTestingDestination ? 'animate-spin text-cyan-500' : 'text-emerald-500'}`} />
                  <span>{isTestingDestination ? 'Testing...' : 'Test Destination'}</span>
                </button>

                <button
                  onClick={handleTriggerExternalBackup}
                  disabled={isTriggeringExternal}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 text-white shadow-sm transition-all disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isTriggeringExternal ? 'animate-spin' : ''}`} />
                  <span>{isTriggeringExternal ? 'Archiving...' : 'Trigger External Backup Now'}</span>
                </button>

                <button
                  onClick={() => {
                    setShowRestoreArchiveModal(true);
                    setArchiveRestoreResult(null);
                  }}
                  className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold border transition-all ${
                    isDark ? 'bg-purple-950/60 text-purple-300 border-purple-800 hover:bg-purple-900/60' : 'bg-purple-50 text-purple-800 border-purple-300 hover:bg-purple-100'
                  }`}
                >
                  <FolderArchive className="w-3.5 h-3.5" />
                  <span>Restore Complete Archive (.ZIP)</span>
                </button>
              </div>
            </div>

            {/* Test Result or Error Banners */}
            {testResult && (
              <div className={`p-3.5 rounded-xl border text-xs flex items-center gap-2.5 ${
                testResult.success
                  ? isDark ? 'bg-emerald-950/40 border-emerald-800 text-emerald-300' : 'bg-emerald-50 border-emerald-300 text-emerald-800'
                  : isDark ? 'bg-rose-950/40 border-rose-800 text-rose-300' : 'bg-rose-50 border-rose-300 text-rose-800'
              }`}>
                {testResult.success ? <CheckCircle2 className="w-4 h-4 flex-shrink-0" /> : <AlertTriangle className="w-4 h-4 flex-shrink-0" />}
                <span>{testResult.message}</span>
              </div>
            )}

            {externalBackupStatus?.lastBackupError && (
              <div className={`p-3.5 rounded-xl border text-xs flex items-center gap-2.5 ${
                isDark ? 'bg-rose-950/40 border-rose-800 text-rose-300' : 'bg-rose-50 border-rose-300 text-rose-800'
              }`}>
                <AlertTriangle className="w-4 h-4 flex-shrink-0 text-rose-500" />
                <div>
                  <strong>Disaster Recovery Warning:</strong> {externalBackupStatus.lastBackupError}
                </div>
              </div>
            )}

            {/* Status & Overview 3-Card Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className={`p-4 rounded-xl border ${isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className={`text-xs font-semibold ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Configured Destination</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    externalBackupStatus?.lastBackupStatus === 'failed'
                      ? 'bg-rose-100 text-rose-800 border border-rose-300'
                      : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                  }`}>
                    {externalBackupStatus?.lastBackupStatus === 'failed' ? 'ERROR' : 'ACTIVE'}
                  </span>
                </div>
                <p className="text-sm font-bold truncate" title={externalBackupStatus?.destinationDisplay}>
                  {externalBackupStatus?.destinationDisplay || 'Secondary Off-Site Storage'}
                </p>
                <p className={`text-[11px] mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  Type: {externalBackupStatus?.destinationType || 'Secondary Volume'}
                </p>
              </div>

              <div className={`p-4 rounded-xl border ${isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className={`text-xs font-semibold ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Last Off-Site Archive</span>
                  <Clock className="w-3.5 h-3.5 text-cyan-500" />
                </div>
                <p className="text-sm font-bold font-mono truncate">
                  {externalBackupStatus?.lastBackupTime
                    ? new Date(externalBackupStatus.lastBackupTime).toLocaleString()
                    : 'Pending Initial Run'}
                </p>
                <p className={`text-[11px] mt-1 font-mono truncate ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  {externalBackupStatus?.lastBackupFilename
                    ? `${externalBackupStatus.lastBackupFilename} (${externalBackupStatus.lastBackupSizeFormatted})`
                    : 'Scheduled automated execution'}
                </p>
              </div>

              <div className={`p-4 rounded-xl border ${isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className={`text-xs font-semibold ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Full Project Volume</span>
                  <Layers className="w-3.5 h-3.5 text-purple-500" />
                </div>
                <p className="text-sm font-bold font-mono">
                  DB: {externalBackupStatus?.dbSizeFormatted || '0 B'} | Files: {externalBackupStatus?.uploadsSizeFormatted || '0 B'}
                </p>
                <p className={`text-[11px] mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  {externalBackups.length} complete archive{externalBackups.length === 1 ? '' : 's'} retained (Max 30)
                </p>
              </div>
            </div>
          </div>

          {/* External Disaster Recovery Archives Table */}
          <div className={`overflow-hidden rounded-2xl border ${isDark ? 'border-slate-800 bg-slate-900' : 'border-slate-200 bg-white shadow-sm'}`}>
            <div className={`p-4 border-b flex items-center justify-between ${isDark ? 'border-slate-800 bg-slate-950/50' : 'border-slate-200 bg-slate-50'}`}>
              <div className="flex items-center gap-2">
                <Archive className="w-4 h-4 text-cyan-500" />
                <h3 className="text-sm font-bold uppercase tracking-wider">
                  Complete Disaster Recovery Archives ({externalBackups.length})
                </h3>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <a
                  href="/api/admin/export-complete-zip"
                  className="font-semibold text-cyan-600 dark:text-cyan-400 hover:underline flex items-center gap-1"
                  title="Download dynamic complete project archive as ZIP"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Live Bundle (.ZIP)</span>
                </a>
              </div>
            </div>

            <table className="w-full text-left text-sm">
              <thead className={`border-b ${isDark ? 'border-slate-800 bg-slate-950 text-slate-400' : 'border-slate-200 bg-slate-50 text-slate-700'}`}>
                <tr>
                  <th className="py-3.5 px-4 font-bold">Archive Package (.ZIP)</th>
                  <th className="py-3.5 px-4 font-bold">Created Timestamp</th>
                  <th className="py-3.5 px-4 font-bold">Archive Size</th>
                  <th className="py-3.5 px-4 font-bold">Target Destination</th>
                  <th className="py-3.5 px-4 font-bold">Status</th>
                  <th className="py-3.5 px-4 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${isDark ? 'divide-slate-800/50' : 'divide-slate-200'}`}>
                {externalBackups.length > 0 ? (
                  externalBackups.map((bk: ExternalBackupRecord) => (
                    <tr key={bk.id} className={`transition-colors ${isDark ? 'hover:bg-slate-800/50 text-slate-200' : 'hover:bg-slate-50 text-slate-800'}`}>
                      <td className="py-3.5 px-4 font-mono text-xs">
                        <div className="flex items-center gap-2">
                          <FolderArchive className="w-4 h-4 text-cyan-500 flex-shrink-0" />
                          <span className="font-bold">{bk.filename}</span>
                        </div>
                      </td>
                      <td className={`py-3.5 px-4 text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                        {new Date(bk.created_at).toLocaleString()}
                      </td>
                      <td className={`py-3.5 px-4 font-mono text-xs ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                        {bk.size_formatted}
                      </td>
                      <td className={`py-3.5 px-4 text-xs truncate max-w-[200px] ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                        {bk.destination_target}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2.5 py-0.5 rounded-md text-xs font-semibold capitalize border ${
                          bk.status === 'success'
                            ? isDark ? 'bg-emerald-950 text-emerald-300 border-emerald-800' : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                            : isDark ? 'bg-rose-950 text-rose-300 border-rose-800' : 'bg-rose-100 text-rose-800 border-rose-300'
                        }`}>
                          {bk.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <a
                            href={`/api/admin/external-backup/download/${encodeURIComponent(bk.filename)}`}
                            className={`p-2 rounded-xl transition-colors ${
                              isDark ? 'text-slate-400 hover:text-cyan-400 hover:bg-slate-800' : 'text-slate-600 hover:text-cyan-700 hover:bg-slate-100'
                            }`}
                            title="Download complete disaster recovery ZIP bundle"
                          >
                            <Download className="w-4 h-4" />
                          </a>

                          <button
                            onClick={() => {
                              setSelectedServerArchive(bk.filename);
                              setRestoreSourceType('server');
                              setShowRestoreArchiveModal(true);
                              setArchiveRestoreResult(null);
                            }}
                            className={`p-2 rounded-xl transition-colors ${
                              isDark ? 'text-slate-400 hover:text-purple-400 hover:bg-slate-800' : 'text-slate-600 hover:text-purple-700 hover:bg-slate-100'
                            }`}
                            title="Restore complete project (Database + Uploaded Files) from this archive"
                          >
                            <RotateCcw className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className={`py-8 text-center text-sm ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                      No external disaster recovery archives created yet. Click "Trigger External Backup Now" above to generate your first complete package.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Tier 1: Local SQLite Snapshots Table */}
          <div className={`overflow-hidden rounded-2xl border ${isDark ? 'border-slate-800 bg-slate-900' : 'border-slate-200 bg-white shadow-sm'}`}>
            <div className={`p-4 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${isDark ? 'border-slate-800 bg-slate-950/50' : 'border-slate-200 bg-slate-50'}`}>
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider">
                  Tier 1: Fast-Rollback Local Snapshots ({adminBackups.length})
                </h3>
                <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  Local SQLite native snapshots (Retains latest 14 snapshots)
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleTriggerBackup}
                  disabled={isCreatingBackup}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm transition-all"
                >
                  {isCreatingBackup ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                  <span>Snapshot DB Now</span>
                </button>
              </div>
            </div>

            <table className="w-full text-left text-sm">
              <thead className={`border-b ${isDark ? 'border-slate-800 bg-slate-950 text-slate-400' : 'border-slate-200 bg-slate-50 text-slate-700'}`}>
                <tr>
                  <th className="py-3.5 px-4 font-bold">Snapshot File</th>
                  <th className="py-3.5 px-4 font-bold">Created Timestamp</th>
                  <th className="py-3.5 px-4 font-bold">Size</th>
                  <th className="py-3.5 px-4 font-bold">Type</th>
                  <th className="py-3.5 px-4 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${isDark ? 'divide-slate-800/50' : 'divide-slate-200'}`}>
                {adminBackups.length > 0 ? (
                  adminBackups.map((bk) => (
                    <tr key={bk.filename} className={`transition-colors ${isDark ? 'hover:bg-slate-800/50 text-slate-200' : 'hover:bg-slate-50 text-slate-800'}`}>
                      <td className="py-3.5 px-4 font-mono text-xs">
                        <div className="flex items-center gap-2">
                          <span>{bk.filename}</span>
                          {bk.isLatest && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-100 text-cyan-800 border border-cyan-300">
                              LATEST
                            </span>
                          )}
                        </div>
                      </td>
                      <td className={`py-3.5 px-4 text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                        {new Date(bk.createdAt).toLocaleString()}
                      </td>
                      <td className={`py-3.5 px-4 font-mono text-xs ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                        {bk.sizeFormatted}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2.5 py-0.5 rounded-md text-xs font-semibold capitalize border ${
                          bk.type === 'automated'
                            ? isDark ? 'bg-sky-950 text-sky-300 border-sky-800' : 'bg-sky-100 text-sky-800 border-sky-300'
                            : isDark ? 'bg-emerald-950 text-emerald-300 border-emerald-800' : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                        }`}>
                          {bk.type}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <a
                            href={`/api/admin/backups/download/${encodeURIComponent(bk.filename)}`}
                            className={`p-2 rounded-xl transition-colors ${
                              isDark ? 'text-slate-400 hover:text-cyan-400 hover:bg-slate-800' : 'text-slate-600 hover:text-cyan-700 hover:bg-slate-100'
                            }`}
                            title="Download SQLite .db file"
                          >
                            <Download className="w-4 h-4" />
                          </a>

                          <button
                            onClick={() => handleRestoreSnapshot(bk.filename)}
                            disabled={isRestoring}
                            className={`p-2 rounded-xl transition-colors ${
                              isDark ? 'text-slate-400 hover:text-amber-400 hover:bg-slate-800' : 'text-slate-600 hover:text-amber-700 hover:bg-slate-100'
                            }`}
                            title="Restore database to this snapshot point"
                          >
                            <RotateCcw className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => handleDeleteSnapshot(bk.filename)}
                            className={`p-2 rounded-xl transition-colors ${
                              isDark ? 'text-slate-400 hover:text-rose-400 hover:bg-slate-800' : 'text-slate-600 hover:text-rose-600 hover:bg-slate-100'
                            }`}
                            title="Delete snapshot"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-sm text-slate-500">
                      No snapshots created yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 2. Motor & Gearing Parameters Tab */}
      {activeTab === 'motor' && (
        <div className={`p-6 md:p-7 rounded-2xl border ${cardBgClass}`}>
          <div className="flex items-center justify-between pb-4 border-b mb-4">
            <div>
              <h2 className="text-lg font-bold">Motor, Gearing & Inverter Specifications</h2>
              <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                Hardware configuration parameters stored permanently in the database and linked to dyno tests and reports.
              </p>
            </div>
            {motorSaveSuccess && (
              <span className="text-sm font-semibold text-emerald-600 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                <span>Saved successfully!</span>
              </span>
            )}
          </div>

          <form onSubmit={handleSaveMotorParameters} className="space-y-5 text-sm">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-1.5">
                <label className="font-semibold text-xs">Motor Model / Name</label>
                <input
                  type="text"
                  value={motorForm.motor_model || ''}
                  onChange={(e) => setMotorForm({ ...motorForm, motor_model: e.target.value })}
                  className={`w-full px-3.5 py-2 text-sm rounded-xl border focus:outline-none ${
                    isDark ? 'bg-slate-950 border-slate-800 text-slate-100' : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-xs">Rated Voltage (V)</label>
                <input
                  type="number"
                  step="any"
                  value={motorForm.rated_voltage_v ?? ''}
                  onChange={(e) => setMotorForm({ ...motorForm, rated_voltage_v: parseFloat(e.target.value) || undefined })}
                  className={`w-full px-3.5 py-2 text-sm rounded-xl border focus:outline-none ${
                    isDark ? 'bg-slate-950 border-slate-800 text-slate-100' : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-xs">Rated Current (A)</label>
                <input
                  type="number"
                  step="any"
                  value={motorForm.rated_current_a ?? ''}
                  onChange={(e) => setMotorForm({ ...motorForm, rated_current_a: parseFloat(e.target.value) || undefined })}
                  className={`w-full px-3.5 py-2 text-sm rounded-xl border focus:outline-none ${
                    isDark ? 'bg-slate-950 border-slate-800 text-slate-100' : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-xs">Peak Current (A)</label>
                <input
                  type="number"
                  step="any"
                  value={motorForm.peak_current_a ?? ''}
                  onChange={(e) => setMotorForm({ ...motorForm, peak_current_a: parseFloat(e.target.value) || undefined })}
                  className={`w-full px-3.5 py-2 text-sm rounded-xl border focus:outline-none ${
                    isDark ? 'bg-slate-950 border-slate-800 text-slate-100' : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-xs">Kv Rating (RPM/V)</label>
                <input
                  type="number"
                  step="any"
                  value={motorForm.kv_rating ?? ''}
                  onChange={(e) => setMotorForm({ ...motorForm, kv_rating: parseFloat(e.target.value) || undefined })}
                  className={`w-full px-3.5 py-2 text-sm rounded-xl border focus:outline-none ${
                    isDark ? 'bg-slate-950 border-slate-800 text-slate-100' : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-xs">Pole Pairs</label>
                <input
                  type="number"
                  value={motorForm.pole_pairs ?? ''}
                  onChange={(e) => setMotorForm({ ...motorForm, pole_pairs: parseInt(e.target.value, 10) || undefined })}
                  className={`w-full px-3.5 py-2 text-sm rounded-xl border focus:outline-none ${
                    isDark ? 'bg-slate-950 border-slate-800 text-slate-100' : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-xs">Phase Resistance (Ω)</label>
                <input
                  type="number"
                  step="any"
                  value={motorForm.phase_resistance_ohm ?? ''}
                  onChange={(e) => setMotorForm({ ...motorForm, phase_resistance_ohm: parseFloat(e.target.value) || undefined })}
                  className={`w-full px-3.5 py-2 text-sm rounded-xl border focus:outline-none ${
                    isDark ? 'bg-slate-950 border-slate-800 text-slate-100' : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-xs">Phase Inductance (µH)</label>
                <input
                  type="number"
                  step="any"
                  value={motorForm.phase_inductance_uh ?? ''}
                  onChange={(e) => setMotorForm({ ...motorForm, phase_inductance_uh: parseFloat(e.target.value) || undefined })}
                  className={`w-full px-3.5 py-2 text-sm rounded-xl border focus:outline-none ${
                    isDark ? 'bg-slate-950 border-slate-800 text-slate-100' : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-xs">Gear Ratio</label>
                <input
                  type="number"
                  step="any"
                  value={motorForm.gear_ratio ?? ''}
                  onChange={(e) => setMotorForm({ ...motorForm, gear_ratio: parseFloat(e.target.value) || undefined })}
                  className={`w-full px-3.5 py-2 text-sm rounded-xl border focus:outline-none ${
                    isDark ? 'bg-slate-950 border-slate-800 text-slate-100' : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-xs">Gearbox Type</label>
                <input
                  type="text"
                  value={motorForm.gearbox_type || ''}
                  onChange={(e) => setMotorForm({ ...motorForm, gearbox_type: e.target.value })}
                  className={`w-full px-3.5 py-2 text-sm rounded-xl border focus:outline-none ${
                    isDark ? 'bg-slate-950 border-slate-800 text-slate-100' : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-xs">PWM Frequency (kHz)</label>
                <input
                  type="number"
                  step="any"
                  value={motorForm.pwm_frequency_khz ?? ''}
                  onChange={(e) => setMotorForm({ ...motorForm, pwm_frequency_khz: parseFloat(e.target.value) || undefined })}
                  className={`w-full px-3.5 py-2 text-sm rounded-xl border focus:outline-none ${
                    isDark ? 'bg-slate-950 border-slate-800 text-slate-100' : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-xs">Inverter Topology</label>
                <input
                  type="text"
                  value={motorForm.inverter_topology || ''}
                  onChange={(e) => setMotorForm({ ...motorForm, inverter_topology: e.target.value })}
                  className={`w-full px-3.5 py-2 text-sm rounded-xl border focus:outline-none ${
                    isDark ? 'bg-slate-950 border-slate-800 text-slate-100' : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isUpdatingMotor}
              className="px-5 py-2.5 rounded-xl font-semibold bg-cyan-600 hover:bg-cyan-500 text-white shadow-sm transition-all"
            >
              {isUpdatingMotor ? 'Saving...' : 'Save Motor Specifications'}
            </button>
          </form>
        </div>
      )}

      {/* 3. User Accounts & Roles Tab */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-sm">
            <p className={isDark ? 'text-slate-400' : 'text-slate-600'}>
              Manage team members, roles, and administrative permissions.
            </p>
            <span className={`font-bold font-mono ${isDark ? 'text-cyan-400' : 'text-cyan-700'}`}>
              Total Users: {adminUsers.length}
            </span>
          </div>

          <div className={`overflow-hidden rounded-2xl border ${isDark ? 'border-slate-800 bg-slate-900' : 'border-slate-200 bg-white shadow-sm'}`}>
            <table className="w-full text-left text-sm">
              <thead className={`border-b ${isDark ? 'border-slate-800 bg-slate-950 text-slate-400' : 'border-slate-200 bg-slate-50 text-slate-700'}`}>
                <tr>
                  <th className="py-3.5 px-4 font-bold">Team Member</th>
                  <th className="py-3.5 px-4 font-bold">Email</th>
                  <th className="py-3.5 px-4 font-bold">Role</th>
                  <th className="py-3.5 px-4 font-bold">Status</th>
                  <th className="py-3.5 px-4 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${isDark ? 'divide-slate-800/50' : 'divide-slate-200'}`}>
                {(adminUsers.length > 0 ? adminUsers : state.team).map((user) => (
                  <tr key={user.id} className={`transition-colors ${isDark ? 'hover:bg-slate-800/50 text-slate-200' : 'hover:bg-slate-50 text-slate-800'}`}>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-cyan-100 dark:bg-slate-800 text-cyan-800 dark:text-cyan-400 font-bold flex items-center justify-center text-sm">
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                        <span className={`font-semibold ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                          {user.name}
                        </span>
                      </div>
                    </td>
                    <td className={`py-3.5 px-4 font-medium ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                      {user.email}
                    </td>
                    <td className="py-3.5 px-4">
                      <select
                        value={user.role}
                        onChange={(e) => onAdminUpdateUserRole(user.id, e.target.value as any)}
                        disabled={user.id === currentUser?.id}
                        className={`px-3 py-1 text-xs rounded-lg border focus:outline-none font-semibold ${
                          user.role === 'admin'
                            ? isDark ? 'bg-rose-950/80 text-rose-300 border-rose-800' : 'bg-rose-100 text-rose-800 border-rose-300'
                            : isDark ? 'bg-slate-950 border-slate-800 text-slate-300' : 'bg-slate-100 border-slate-300 text-slate-700'
                        }`}
                      >
                        <option value="member">Member</option>
                        <option value="admin">Administrator</option>
                      </select>
                    </td>
                    <td className="py-3.5 px-4">
                      <button
                        onClick={() => onAdminUpdateUserStatus(user.id, user.is_active === 0)}
                        disabled={user.id === currentUser?.id}
                        className={`px-3 py-1 rounded-lg text-xs font-bold border transition-colors ${
                          user.is_active !== 0
                            ? isDark ? 'bg-emerald-950/80 text-emerald-300 border-emerald-800 hover:bg-rose-950/60' : 'bg-emerald-100 text-emerald-800 border-emerald-300 hover:bg-rose-100'
                            : isDark ? 'bg-rose-950/80 text-rose-300 border-rose-800 hover:bg-emerald-950/60' : 'bg-rose-100 text-rose-800 border-rose-300 hover:bg-emerald-100'
                        }`}
                      >
                        {user.is_active !== 0 ? 'Active' : 'Disabled'}
                      </button>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleResetPassword(user)}
                          className={`p-2 rounded-xl transition-colors ${
                            isDark ? 'text-slate-400 hover:text-cyan-400 hover:bg-slate-800' : 'text-slate-600 hover:text-cyan-700 hover:bg-slate-100'
                          }`}
                          title="Reset Password"
                        >
                          <Key className="w-4 h-4" />
                        </button>
                        {user.id !== currentUser?.id && (
                          <button
                            onClick={() => {
                              setConfirmModal({
                                isOpen: true,
                                title: 'Remove User Account',
                                message: `Permanently delete ${user.name}'s account? This user will no longer be able to log in.`,
                                confirmText: 'Delete Account',
                                confirmVariant: 'danger',
                                onConfirm: async () => {
                                  await onAdminDeleteUser(user.id);
                                  setConfirmModal((prev) => ({ ...prev, isOpen: false }));
                                },
                              });
                            }}
                            className={`p-2 rounded-xl transition-colors ${
                              isDark ? 'text-slate-400 hover:text-rose-400 hover:bg-slate-800' : 'text-slate-600 hover:text-rose-600 hover:bg-slate-100'
                            }`}
                            title="Delete Account"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. Project Settings Tab */}
      {activeTab === 'project' && (
        <div className={`p-6 md:p-7 rounded-2xl border ${cardBgClass}`}>
          <form onSubmit={handleSaveProject} className="space-y-4 max-w-xl text-sm">
            <div className="space-y-1.5">
              <label className={`font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Project Name</label>
              <input
                type="text"
                required
                value={projName}
                onChange={(e) => setProjName(e.target.value)}
                className={`w-full px-3.5 py-2.5 rounded-xl border focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-colors ${
                  isDark ? 'bg-slate-950 border-slate-800 text-slate-100' : 'bg-slate-50 border-slate-300 text-slate-900'
                }`}
              />
            </div>

            <div className="space-y-1.5">
              <label className={`font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Project Scope & Description</label>
              <textarea
                rows={3}
                value={projDesc}
                onChange={(e) => setProjDesc(e.target.value)}
                className={`w-full px-3.5 py-2.5 rounded-xl border focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-colors leading-relaxed ${
                  isDark ? 'bg-slate-950 border-slate-800 text-slate-100' : 'bg-slate-50 border-slate-300 text-slate-900'
                }`}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className={`font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Lifecycle State</label>
                <select
                  value={projStatus}
                  onChange={(e) => setProjStatus(e.target.value as any)}
                  className={`w-full px-3.5 py-2.5 rounded-xl border focus:outline-none ${
                    isDark ? 'bg-slate-950 border-slate-800 text-slate-100' : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                >
                  <option value="Planning">Planning</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Testing">Testing</option>
                  <option value="Completed">Completed</option>
                  <option value="On Hold">On Hold</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className={`font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Target Delivery Date</label>
                <input
                  type="date"
                  value={projTargetDate}
                  onChange={(e) => setProjTargetDate(e.target.value)}
                  className={`w-full px-3.5 py-2.5 rounded-xl border focus:outline-none ${
                    isDark ? 'bg-slate-950 border-slate-800 text-slate-100' : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isUpdatingProject}
              className="px-5 py-2.5 rounded-xl font-semibold bg-cyan-600 hover:bg-cyan-500 text-white shadow-sm transition-all"
            >
              {isUpdatingProject ? 'Saving...' : 'Save Settings'}
            </button>
          </form>
        </div>
      )}

      {/* 5. File & Storage Manager Tab */}
      {activeTab === 'storage' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-sm">
            <p className={isDark ? 'text-slate-400' : 'text-slate-600'}>
              Direct server storage management for uploaded PDFs, CSV datasets, and datasheets.
            </p>
            {adminStorage && (
              <span className={`font-bold font-mono ${isDark ? 'text-cyan-400' : 'text-cyan-700'}`}>
                Total Files: {adminStorage.totalFiles} ({adminStorage.totalSize})
              </span>
            )}
          </div>

          <div className={`overflow-hidden rounded-2xl border ${isDark ? 'border-slate-800 bg-slate-900' : 'border-slate-200 bg-white shadow-sm'}`}>
            <table className="w-full text-left text-sm">
              <thead className={`border-b ${isDark ? 'border-slate-800 bg-slate-950 text-slate-400' : 'border-slate-200 bg-slate-50 text-slate-700'}`}>
                <tr>
                  <th className="py-3.5 px-4 font-bold">Stored File</th>
                  <th className="py-3.5 px-4 font-bold">Size</th>
                  <th className="py-3.5 px-4 font-bold">Uploaded</th>
                  <th className="py-3.5 px-4 font-bold text-right">Action</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${isDark ? 'divide-slate-800/50' : 'divide-slate-200'}`}>
                {adminStorage?.files && adminStorage.files.length > 0 ? (
                  adminStorage.files.map((file) => (
                    <tr key={file.name} className={`transition-colors ${isDark ? 'hover:bg-slate-800/50 text-slate-200' : 'hover:bg-slate-50 text-slate-800'}`}>
                      <td className="py-3.5 px-4 font-mono text-xs">
                        {file.name}
                      </td>
                      <td className={`py-3.5 px-4 text-xs font-mono ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                        {file.size}
                      </td>
                      <td className={`py-3.5 px-4 text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                        {new Date(file.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => {
                            setConfirmModal({
                              isOpen: true,
                              title: 'Delete Storage File',
                              message: `Permanently delete ${file.name} from server uploads folder? Any attached document links may be broken.`,
                              confirmText: 'Delete File',
                              confirmVariant: 'danger',
                              onConfirm: async () => {
                                await onAdminDeleteStorageFile(file.name);
                                setConfirmModal((prev) => ({ ...prev, isOpen: false }));
                              },
                            });
                          }}
                          className={`p-2 rounded-xl transition-colors ${
                            isDark ? 'text-slate-400 hover:text-rose-400 hover:bg-slate-800' : 'text-slate-600 hover:text-rose-600 hover:bg-slate-100'
                          }`}
                          title="Delete File"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className={`py-8 text-center text-sm ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                      No uploaded files in storage.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Complete Project Archive Restoration Modal */}
      {showRestoreArchiveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className={`w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border p-6 space-y-5 shadow-2xl ${
            isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800/80 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <FolderArchive className="w-5 h-5 text-purple-500" />
                <h2 className="text-base font-bold">Restore Complete Project Archive</h2>
              </div>
              <button
                onClick={() => setShowRestoreArchiveModal(false)}
                className="p-1 rounded text-slate-400 hover:text-slate-200"
              >
                ✕
              </button>
            </div>

            <div className={`p-4 rounded-xl border text-xs space-y-2 ${
              isDark ? 'bg-purple-950/30 border-purple-800/80 text-purple-300' : 'bg-purple-50 border-purple-200 text-purple-800'
            }`}>
              <div className="flex items-center gap-2 font-bold">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                <span>Full Multi-Layer Restoration Scope</span>
              </div>
              <p className="leading-relaxed">
                Restoring a complete archive will replace <strong>both</strong> the SQLite database records AND restore all physical files in the server's <code>uploads/</code> directory. A pre-restore safety snapshot will be created automatically before execution.
              </p>
            </div>

            {archiveRestoreResult ? (
              <div className={`p-4 rounded-xl border text-xs space-y-2 ${
                isDark ? 'bg-emerald-950/40 border-emerald-800 text-emerald-300' : 'bg-emerald-50 border-emerald-200 text-emerald-800'
              }`}>
                <div className="flex items-center gap-2 font-bold text-sm">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  <span>Restoration Completed Successfully!</span>
                </div>
                <p>{archiveRestoreResult.message}</p>
                <div className="pt-2 font-mono text-[11px] space-y-1">
                  <div>• Database Size: <strong>{archiveRestoreResult.databaseSizeFormatted}</strong></div>
                  <div>• Uploaded Files Restored: <strong>{archiveRestoreResult.restoredUploadsCount}</strong></div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Source Selection Tabs */}
                <div className={`p-1 rounded-xl border flex items-center gap-1 ${
                  isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-100 border-slate-300'
                }`}>
                  <button
                    type="button"
                    onClick={() => setRestoreSourceType('upload')}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      restoreSourceType === 'upload'
                        ? isDark ? 'bg-slate-800 text-cyan-400 shadow-sm' : 'bg-white text-cyan-800 shadow-sm'
                        : isDark ? 'text-slate-400' : 'text-slate-600'
                    }`}
                  >
                    Upload Local ZIP File
                  </button>

                  <button
                    type="button"
                    onClick={() => setRestoreSourceType('server')}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      restoreSourceType === 'server'
                        ? isDark ? 'bg-slate-800 text-cyan-400 shadow-sm' : 'bg-white text-cyan-800 shadow-sm'
                        : isDark ? 'text-slate-400' : 'text-slate-600'
                    }`}
                  >
                    Choose Off-Site Archive ({externalBackups.length})
                  </button>
                </div>

                {restoreSourceType === 'upload' ? (
                  <div className="space-y-2">
                    <label className={`block text-xs font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                      Select Complete Project Bundle (.ZIP)
                    </label>
                    <input
                      type="file"
                      accept=".zip,application/zip"
                      onChange={(e) => setArchiveFile(e.target.files?.[0] || null)}
                      className={`w-full px-3.5 py-3 text-xs rounded-xl border cursor-pointer ${
                        isDark ? 'bg-slate-950 border-slate-800 text-slate-200' : 'bg-slate-50 border-slate-300 text-slate-800'
                      }`}
                    />
                    {archiveFile && (
                      <p className="text-xs font-mono text-cyan-500 truncate">
                        Selected: {archiveFile.name} ({(archiveFile.size / (1024 * 1024)).toFixed(2)} MB)
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2">
                    <label className={`block text-xs font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                      Select Off-Site Archive on Server
                    </label>
                    <select
                      value={selectedServerArchive}
                      onChange={(e) => setSelectedServerArchive(e.target.value)}
                      className={`w-full px-3.5 py-2.5 text-xs rounded-xl border font-mono ${
                        isDark ? 'bg-slate-950 border-slate-800 text-slate-200' : 'bg-slate-50 border-slate-300 text-slate-800'
                      }`}
                    >
                      <option value="">Choose archive...</option>
                      {externalBackups.map((bk) => (
                        <option key={bk.id} value={bk.filename}>
                          {bk.filename} ({bk.size_formatted}) - {new Date(bk.created_at).toLocaleDateString()}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            )}

            <div className={`flex items-center justify-end gap-2.5 pt-3 border-t ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
              <button
                type="button"
                onClick={() => setShowRestoreArchiveModal(false)}
                className={`px-4 py-2 text-xs font-semibold rounded-xl transition-colors ${
                  isDark ? 'text-slate-400 hover:bg-slate-800' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {archiveRestoreResult ? 'Done' : 'Cancel'}
              </button>

              {!archiveRestoreResult && (
                <button
                  type="button"
                  onClick={() => {
                    const targetName = restoreSourceType === 'upload' ? archiveFile?.name : selectedServerArchive;
                    setConfirmModal({
                      isOpen: true,
                      title: 'Confirm Full Disaster Recovery Restore?',
                      message: `WARNING: This will replace the active database and restore all uploaded files from "${targetName}". Type "RESTORE" to proceed.`,
                      confirmText: 'Execute Full Restore',
                      confirmVariant: 'danger',
                      requireTypedConfirmation: 'RESTORE',
                      onConfirm: async () => {
                        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
                        await handleExecuteArchiveRestore();
                      },
                    });
                  }}
                  disabled={isExecutingArchiveRestore || (restoreSourceType === 'upload' ? !archiveFile : !selectedServerArchive)}
                  className="px-5 py-2 text-xs font-semibold rounded-xl bg-purple-600 hover:bg-purple-500 text-white shadow-sm transition-all disabled:opacity-50"
                >
                  {isExecutingArchiveRestore ? 'Restoring Archive...' : 'Execute Full Restore'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add User Modal */}
      {showAddUserModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className={`w-full max-w-md rounded-2xl border p-6 space-y-4 ${
            isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-300 text-slate-900 shadow-2xl'
          }`}>
            <h2 className="text-lg font-bold">Create Project Account</h2>
            <form onSubmit={handleCreateUser} className="space-y-3.5 text-sm">
              <div className="space-y-1">
                <label className={`font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sanya Sharma"
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  className={`w-full px-3.5 py-2.5 rounded-xl border focus:outline-none ${
                    isDark ? 'bg-slate-950 border-slate-800 text-slate-100' : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                />
              </div>

              <div className="space-y-1">
                <label className={`font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Email Address *</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. sanya@example.com"
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  className={`w-full px-3.5 py-2.5 rounded-xl border focus:outline-none ${
                    isDark ? 'bg-slate-950 border-slate-800 text-slate-100' : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                />
              </div>

              <div className="space-y-1">
                <label className={`font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Initial Password (Default: project123)</label>
                <input
                  type="password"
                  placeholder="Leave empty for default 'project123'"
                  value={newUserPassword}
                  onChange={(e) => setNewUserPassword(e.target.value)}
                  className={`w-full px-3.5 py-2.5 rounded-xl border focus:outline-none ${
                    isDark ? 'bg-slate-950 border-slate-800 text-slate-100' : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                />
              </div>

              <div className="space-y-1">
                <label className={`font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Role</label>
                <select
                  value={newUserRole}
                  onChange={(e) => setNewUserRole(e.target.value as any)}
                  className={`w-full px-3.5 py-2.5 rounded-xl border focus:outline-none ${
                    isDark ? 'bg-slate-950 border-slate-800 text-slate-100' : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                >
                  <option value="member">Member</option>
                  <option value="admin">Administrator</option>
                </select>
              </div>

              <div className={`flex items-center justify-end gap-2 pt-3 border-t ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
                <button
                  type="button"
                  onClick={() => setShowAddUserModal(false)}
                  className={`px-4 py-2 rounded-xl transition-colors ${
                    isDark ? 'text-slate-400 hover:bg-slate-800' : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold shadow-sm"
                >
                  Create Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Trash Modal */}
      <TrashModal
        isOpen={showTrashModal}
        onClose={() => setShowTrashModal(false)}
        trashItems={trashItems}
        currentUser={currentUser}
        onRestore={onRestoreTrashItem}
        onPurge={onPurgeTrashItem}
        theme={state.theme}
      />

      {/* Generic Confirmation Modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmText={confirmModal.confirmText}
        confirmVariant={confirmModal.confirmVariant}
        requireTypedConfirmation={confirmModal.requireTypedConfirmation}
        theme={state.theme}
      />
    </div>
  );
};
