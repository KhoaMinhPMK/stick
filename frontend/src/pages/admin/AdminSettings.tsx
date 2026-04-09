import React, { useState, useEffect } from 'react';
import { AdminLayout } from './AdminLayout';
import { getConfigs, updateConfig } from '../../services/api/admin.api';
import type { AppConfigDTO } from '../../types/dto/admin.dto';

// Known config keys with human-readable descriptions
const CONFIG_META: Record<string, { label: string; description: string; type: 'text' | 'number' | 'boolean' | 'textarea' }> = {
  maintenance_mode: { label: 'Maintenance Mode', description: 'Block all user API requests (returns 503). Admin panel remains accessible.', type: 'boolean' },
  min_journal_chars: { label: 'Min Journal Length', description: 'Minimum characters required for a journal entry (0 = no limit)', type: 'number' },
};

export const AdminSettingsPage: React.FC = () => {
  const [configs, setConfigs] = useState<AppConfigDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [saving, setSaving] = useState(false);
  const [successKey, setSuccessKey] = useState<string | null>(null);

  // New config form
  const [showAdd, setShowAdd] = useState(false);
  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState('');

  const loadConfigs = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await getConfigs();
      setConfigs(res.items);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load configs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConfigs();
  }, []);

  const handleEdit = (cfg: AppConfigDTO) => {
    setEditingKey(cfg.key);
    setEditValue(cfg.value);
    setSuccessKey(null);
  };

  const handleCancel = () => {
    setEditingKey(null);
    setEditValue('');
  };

  const handleSave = async (key: string) => {
    setSaving(true);
    try {
      const res = await updateConfig(key, editValue);
      setConfigs((prev) => prev.map((c) => (c.key === key ? res.config : c)));
      setEditingKey(null);
      setEditValue('');
      setSuccessKey(key);
      setTimeout(() => setSuccessKey(null), 2000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleAddConfig = async () => {
    const trimmedKey = newKey.trim();
    const trimmedValue = newValue.trim();
    if (!trimmedKey || !trimmedValue) return;
    setSaving(true);
    try {
      const res = await updateConfig(trimmedKey, trimmedValue);
      setConfigs((prev) => {
        const exists = prev.findIndex((c) => c.key === trimmedKey);
        if (exists >= 0) {
          const copy = [...prev];
          copy[exists] = res.config;
          return copy;
        }
        return [...prev, res.config];
      });
      setNewKey('');
      setNewValue('');
      setShowAdd(false);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create config');
    } finally {
      setSaving(false);
    }
  };

  const getMeta = (key: string) => CONFIG_META[key] || { label: key, description: '', type: 'text' as const };

  return (
    <AdminLayout activePath="settings">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="font-headline font-bold text-lg">Settings</h2>
          <p className="text-xs text-outline mt-0.5">{configs.length} config keys</p>
        </div>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="flex items-center gap-1.5 px-4 py-2 bg-primary text-on-primary-container font-headline font-bold text-xs rounded-xl hover:opacity-90 transition-opacity"
        >
          <span className="material-symbols-outlined text-[16px]">add</span>
          Add Key
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 p-3 bg-error-container text-on-error-container text-sm rounded-lg">{error}</div>
      )}

      {/* Add New Config */}
      {showAdd && (
        <div className="mb-4 border-2 border-primary rounded-2xl p-4 bg-primary-container/10">
          <h3 className="font-headline font-bold text-sm mb-3">Add New Config Key</h3>
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              placeholder="key_name"
              value={newKey}
              onChange={(e) => setNewKey(e.target.value)}
              className="flex-1 px-3 py-2 border-2 border-outline-variant rounded-xl text-sm bg-surface focus:border-primary focus:outline-none transition-colors"
            />
            <input
              type="text"
              placeholder="value"
              value={newValue}
              onChange={(e) => setNewValue(e.target.value)}
              className="flex-1 px-3 py-2 border-2 border-outline-variant rounded-xl text-sm bg-surface focus:border-primary focus:outline-none transition-colors"
            />
            <div className="flex gap-2">
              <button
                onClick={handleAddConfig}
                disabled={saving || !newKey.trim()}
                className="px-4 py-2 bg-primary text-on-primary-container font-headline font-bold text-xs rounded-xl hover:opacity-90 disabled:opacity-50 transition-opacity"
              >
                {saving ? 'Saving…' : 'Save'}
              </button>
              <button
                onClick={() => { setShowAdd(false); setNewKey(''); setNewValue(''); }}
                className="px-3 py-2 text-xs font-headline text-on-surface-variant hover:text-on-surface transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Config List */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="border-2 border-outline-variant rounded-2xl p-4 animate-pulse">
              <div className="h-4 w-32 bg-surface-container-highest rounded mb-2" />
              <div className="h-8 w-full bg-surface-container-highest rounded" />
            </div>
          ))}
        </div>
      ) : configs.length === 0 ? (
        <div className="border-2 border-outline-variant rounded-2xl p-12 text-center">
          <span className="material-symbols-outlined text-3xl text-outline mb-2 block">settings</span>
          <p className="text-sm text-outline">No config keys yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {configs.map((cfg) => {
            const meta = getMeta(cfg.key);
            const isEditing = editingKey === cfg.key;
            const isSuccess = successKey === cfg.key;

            return (
              <div
                key={cfg.key}
                className={`border-2 rounded-2xl p-4 transition-colors ${
                  isSuccess
                    ? 'border-tertiary bg-tertiary-container/20'
                    : isEditing
                    ? 'border-primary bg-primary-container/10'
                    : 'border-black bg-surface-container-lowest'
                }`}
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div>
                    <h4 className="text-sm font-bold font-headline">{meta.label}</h4>
                    {meta.description && (
                      <p className="text-[11px] text-outline mt-0.5">{meta.description}</p>
                    )}
                    <p className="text-[10px] text-outline mt-0.5 font-mono">Key: {cfg.key}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {isSuccess && (
                      <span className="text-[11px] text-tertiary font-headline font-bold">Saved ✓</span>
                    )}
                    <span className="text-[10px] text-outline whitespace-nowrap">
                      {formatRelative(cfg.updatedAt)}
                    </span>
                  </div>
                </div>

                {isEditing ? (
                  <div className="space-y-2">
                    {meta.type === 'textarea' ? (
                      <textarea
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        rows={5}
                        className="w-full px-3 py-2 border-2 border-outline-variant rounded-xl text-sm bg-surface focus:border-primary focus:outline-none transition-colors font-mono"
                      />
                    ) : meta.type === 'boolean' ? (
                      <select
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        className="px-3 py-2 border-2 border-outline-variant rounded-xl text-sm bg-surface focus:border-primary focus:outline-none transition-colors"
                      >
                        <option value="true">Enabled</option>
                        <option value="false">Disabled</option>
                      </select>
                    ) : (
                      <input
                        type={meta.type === 'number' ? 'number' : 'text'}
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        className="w-full px-3 py-2 border-2 border-outline-variant rounded-xl text-sm bg-surface focus:border-primary focus:outline-none transition-colors font-mono"
                      />
                    )}
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleSave(cfg.key)}
                        disabled={saving}
                        className="px-4 py-1.5 bg-primary text-on-primary-container font-headline font-bold text-xs rounded-xl hover:opacity-90 disabled:opacity-50 transition-opacity"
                      >
                        {saving ? 'Saving…' : 'Save'}
                      </button>
                      <button
                        onClick={handleCancel}
                        className="px-3 py-1.5 text-xs font-headline text-on-surface-variant hover:text-on-surface transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    className="group flex items-start justify-between cursor-pointer hover:bg-surface-container-highest/50 -mx-2 px-2 py-1.5 rounded-lg transition-colors"
                    onClick={() => handleEdit(cfg)}
                  >
                    <p className={`text-sm font-mono break-all ${cfg.value.length > 100 ? 'line-clamp-3' : ''}`}>
                      {meta.type === 'boolean' ? (cfg.value === 'true' ? '✅ Enabled' : '❌ Disabled') : cfg.value}
                    </p>
                    <span className="material-symbols-outlined text-[16px] text-outline opacity-0 group-hover:opacity-100 transition-opacity ml-2 mt-0.5 shrink-0">
                      edit
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </AdminLayout>
  );
};

// ─── Helpers ─────────────────────────

function formatRelative(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
