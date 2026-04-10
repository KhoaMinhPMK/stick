import React, { useState, useEffect } from 'react';
import { AdminLayout } from './AdminLayout';
import { getGameConfigs, updateGameConfig, type GameConfigItem } from '../../services/api/admin.api';

const CATEGORY_ICONS: Record<string, string> = {
  xp_caps: 'speed',
  xp_amounts: 'paid',
  rank_caps: 'military_tech',
  rank_amounts: 'leaderboard',
  rank_rules: 'rule',
  anti_cheat: 'shield',
  day_pass: 'card_giftcard',
  leaderboard: 'emoji_events',
  popup_psychology: 'psychology',
};

const CATEGORY_LABELS: Record<string, string> = {
  xp_caps: 'XP Daily Caps',
  xp_amounts: 'XP Amounts',
  rank_caps: 'Ranked Score Caps',
  rank_amounts: 'Ranked Score Amounts',
  rank_rules: 'Rank Rules',
  anti_cheat: 'Anti-Cheat',
  day_pass: 'Premium Day Pass',
  leaderboard: 'Leaderboard',
  popup_psychology: 'Popup Psychology',
};

export const AdminGameConfigPage: React.FC = () => {
  const [items, setItems] = useState<GameConfigItem[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editKey, setEditKey] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [saving, setSaving] = useState(false);
  const [successKey, setSuccessKey] = useState<string | null>(null);

  const loadConfigs = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await getGameConfigs();
      setItems(res.items);
      setCategories(res.categories);
      if (!activeCategory && res.categories.length > 0) {
        setActiveCategory(res.categories[0]);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load game config');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadConfigs(); }, []);

  const handleSave = async (key: string) => {
    setSaving(true);
    try {
      await updateGameConfig(key, editValue);
      setItems(prev => prev.map(i => i.key === key ? { ...i, value: editValue, updatedAt: new Date().toISOString() } : i));
      setEditKey(null);
      setSuccessKey(key);
      setTimeout(() => setSuccessKey(null), 2000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const filtered = items.filter(i => i.category === activeCategory);

  return (
    <AdminLayout activePath="game-config">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="font-headline font-bold text-lg">Game Config</h2>
          <p className="text-xs text-outline mt-0.5">
            {items.length} keys across {categories.length} categories — controls XP, ranks, anti-cheat, day-pass rules
          </p>
        </div>
        <button onClick={loadConfigs} className="flex items-center gap-1.5 px-3 py-2 text-xs font-headline font-bold text-on-surface-variant hover:text-on-surface hover:bg-surface-container-highest rounded-xl transition-colors">
          <span className="material-symbols-outlined text-[16px]">refresh</span>
          Reload
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-error-container text-on-error-container text-sm rounded-lg flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px]">error</span>
          {error}
          <button onClick={() => setError('')} className="ml-auto text-xs underline">Dismiss</button>
        </div>
      )}

      {/* Category Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-headline font-bold whitespace-nowrap transition-all ${
              activeCategory === cat
                ? 'bg-primary text-on-primary shadow-md'
                : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-highest'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">{CATEGORY_ICONS[cat] || 'tune'}</span>
            {CATEGORY_LABELS[cat] || cat}
          </button>
        ))}
      </div>

      {/* Config Items */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="border-2 border-outline-variant rounded-2xl p-4 animate-pulse">
              <div className="h-4 w-40 bg-surface-container-highest rounded mb-2" />
              <div className="h-8 w-full bg-surface-container-highest rounded" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="border-2 border-outline-variant rounded-2xl p-12 text-center">
          <span className="material-symbols-outlined text-3xl text-outline mb-2 block">tune</span>
          <p className="text-sm text-outline">No configs in this category</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(item => {
            const isEditing = editKey === item.key;
            const isSuccess = successKey === item.key;

            return (
              <div
                key={item.key}
                className={`border-2 rounded-2xl p-4 transition-colors ${
                  isSuccess ? 'border-tertiary bg-tertiary-container/20'
                  : isEditing ? 'border-primary bg-primary-container/10'
                  : 'border-black bg-surface-container-lowest'
                }`}
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-bold font-headline">{item.label || item.key}</h4>
                    {item.description && (
                      <p className="text-[11px] text-outline mt-0.5">{item.description}</p>
                    )}
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-[10px] text-outline font-mono">Key: {item.key}</span>
                      <span className="text-[10px] text-outline">Type: {item.type}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {isSuccess && (
                      <span className="text-[11px] text-tertiary font-headline font-bold">Saved ✓</span>
                    )}
                    {!isEditing && (
                      <button
                        onClick={() => { setEditKey(item.key); setEditValue(item.value); }}
                        className="p-1.5 hover:bg-surface-container-highest rounded-lg transition-colors"
                        title="Edit"
                      >
                        <span className="material-symbols-outlined text-[18px]">edit</span>
                      </button>
                    )}
                  </div>
                </div>

                {isEditing ? (
                  <div className="space-y-2 mt-3">
                    {item.type === 'boolean' ? (
                      <select
                        value={editValue}
                        onChange={e => setEditValue(e.target.value)}
                        className="px-3 py-2 border-2 border-outline-variant rounded-xl text-sm bg-surface focus:border-primary focus:outline-none transition-colors"
                      >
                        <option value="true">true</option>
                        <option value="false">false</option>
                      </select>
                    ) : item.type === 'json' ? (
                      <textarea
                        value={editValue}
                        onChange={e => setEditValue(e.target.value)}
                        rows={4}
                        className="w-full px-3 py-2 border-2 border-outline-variant rounded-xl text-sm bg-surface focus:border-primary focus:outline-none transition-colors font-mono"
                      />
                    ) : (
                      <input
                        type={item.type === 'number' ? 'number' : 'text'}
                        value={editValue}
                        onChange={e => setEditValue(e.target.value)}
                        className="w-full px-3 py-2 border-2 border-outline-variant rounded-xl text-sm bg-surface focus:border-primary focus:outline-none transition-colors font-mono"
                      />
                    )}
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleSave(item.key)}
                        disabled={saving}
                        className="px-4 py-1.5 bg-primary text-on-primary-container font-headline font-bold text-xs rounded-xl hover:opacity-90 disabled:opacity-50 transition-opacity"
                      >
                        {saving ? 'Saving…' : 'Save'}
                      </button>
                      <button
                        onClick={() => setEditKey(null)}
                        className="px-3 py-1.5 text-xs font-headline text-on-surface-variant hover:text-on-surface transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="mt-1 px-3 py-2 bg-surface-container rounded-xl">
                    <code className="text-sm font-mono text-on-surface break-all">{item.value}</code>
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
