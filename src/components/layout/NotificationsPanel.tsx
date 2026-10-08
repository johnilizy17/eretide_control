import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Bell,
  CheckCheck,
  Trash2,
  ExternalLink,
  PlayCircle,
  Link2,
  Eye,
  Plus,
  X,
  Send,
  Loader2,
  RefreshCw,
  BellRing,
} from 'lucide-react';
import { notificationsApi, type NotificationItem, type NotificationType } from '../../api';

const TYPE_ICONS: Record<NotificationType, typeof Eye> = {
  View: Eye,
  Link: Link2,
  Video: PlayCircle,
};

const STATUS_ICONS: Record<NotificationType, string> = {
  View: 'bg-sky-50 text-sky-600',
  Link: 'bg-emerald-50 text-emerald-600',
  Video: 'bg-rose-50 text-rose-600',
};

const EMPTY_COMPOSE = { title: '', message: '', link: '', type: 'View' as NotificationType };

const timeAgo = (value: string): string => {
  const seconds = Math.floor((Date.now() - new Date(value).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hr ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} day${days > 1 ? 's' : ''} ago`;
  return new Date(value).toLocaleDateString('en-NG', { dateStyle: 'medium' });
};

export const NotificationsPanel = () => {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [composeOpen, setComposeOpen] = useState(false);
  const [compose, setCompose] = useState(EMPTY_COMPOSE);
  const [sending, setSending] = useState(false);
  const [composeMsg, setComposeMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await notificationsApi.getAll();
      setItems(data.items ?? []);
      setUnread(data.unread ?? 0);
    } catch {
      setError('Unable to load notifications');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        setOpen(false);
        setComposeOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const togglePanel = () => {
    setOpen((prev) => {
      const next = !prev;
      if (next) load();
      return next;
    });
  };

  const markAllRead = async () => {
    try {
      await notificationsApi.markAllRead();
      setItems((prev) => prev.map((item) => ({ ...item, read: true })));
      setUnread(0);
    } catch {
      // ignore
    }
  };

  const markRead = async (id: string) => {
    setItems((prev) => prev.map((item) => (item._id === id ? { ...item, read: true } : item)));
    setUnread((prev) => Math.max(0, prev - 1));
    try {
      await notificationsApi.markRead(id);
    } catch {
      // ignore
    }
  };

  const remove = async (id: string) => {
    try {
      await notificationsApi.del(id);
      const removed = items.find((item) => item._id === id);
      setItems((prev) => prev.filter((item) => item._id !== id));
      if (removed && !removed.read) setUnread((prev) => Math.max(0, prev - 1));
    } catch {
      // ignore
    }
  };

  const openItem = (item: NotificationItem) => {
    if (item.link) {
      window.open(item.link, '_blank', 'noopener,noreferrer');
    }
    if (!item.read) markRead(item._id);
  };

  const sendNotification = async () => {
    setComposeMsg(null);
    if (compose.title.trim().length < 2 || compose.message.trim().length < 2) {
      setComposeMsg({ ok: false, text: 'Title and message are required' });
      return;
    }
    setSending(true);
    try {
      await notificationsApi.send({
        title: compose.title.trim(),
        message: compose.message.trim(),
        type: compose.type,
        link: compose.link.trim(),
      });
      setCompose(EMPTY_COMPOSE);
      setComposeOpen(false);
      await load();
      setComposeMsg({ ok: true, text: 'Notification sent' });
    } catch (err: any) {
      setComposeMsg({ ok: false, text: err?.response?.data?.message ?? 'Failed to send notification' });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="relative" ref={panelRef}>
      {/* Bell */}
      <button
        onClick={togglePanel}
        className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5 text-gray-700" />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-4 h-4 px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            {unread > 99 ? '99+' : unread}
          </span>
        )}
      </button>

      {/* Panel */}
      <div
        className={`absolute right-0 top-full mt-2 w-[calc(100vw-2rem)] max-w-sm bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden transition-all duration-200 origin-top-right ${
          open ? 'opacity-100 scale-100 pointer-events-auto' : 'opacity-0 scale-95 pointer-events-none'
        }`}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BellRing className="w-5 h-5 text-emerald-600" />
            <h3 className="font-bold text-gray-900">Notifications</h3>
            {unread > 0 && (
              <span className="text-xs font-semibold bg-red-50 text-red-600 px-2 py-0.5 rounded-full">
                {unread} unread
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={markAllRead}
              disabled={unread === 0}
              title="Mark all as read"
              className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-emerald-600 transition-colors disabled:opacity-40"
            >
              <CheckCheck className="w-4 h-4" />
            </button>
            <button
              onClick={load}
              title="Refresh"
              className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-gray-900 transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={() => setComposeOpen(!composeOpen)}
              title="Send notification"
              className={`p-1.5 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors ${
                composeOpen ? 'text-emerald-600 bg-emerald-50' : 'hover:text-emerald-600'
              }`}
            >
              {composeOpen ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Compose */}
        {composeOpen && (
          <div className="px-5 py-4 border-b border-gray-200 bg-gray-50 space-y-3">
            <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Send Notification</p>
            <input
              type="text"
              placeholder="Title *"
              value={compose.title}
              onChange={(e) => setCompose((prev) => ({ ...prev, title: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition-all"
            />
            <textarea
              placeholder="Message *"
              rows={2}
              value={compose.message}
              onChange={(e) => setCompose((prev) => ({ ...prev, message: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition-all resize-none"
            />
            <input
              type="url"
              placeholder="Link (optional)"
              value={compose.link}
              onChange={(e) => setCompose((prev) => ({ ...prev, link: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition-all"
            />
            <select
              value={compose.type}
              onChange={(e) => setCompose((prev) => ({ ...prev, type: e.target.value as NotificationType }))}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition-all bg-white"
            >
              <option value="View">View</option>
              <option value="Link">Link</option>
              <option value="Video">Video</option>
            </select>
            {composeMsg && (
              <p className={`text-xs ${composeMsg.ok ? 'text-emerald-600' : 'text-rose-600'}`}>{composeMsg.text}</p>
            )}
            <button
              onClick={sendNotification}
              disabled={sending}
              className="w-full px-3 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              {sending ? 'Sending…' : 'Send'}
            </button>
          </div>
        )}

        {/* List */}
        <div className="max-h-80 overflow-y-auto">
          {loading && items.length === 0 && (
            <div className="p-10 text-center text-gray-500 text-sm">
              <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" />
              Loading notifications…
            </div>
          )}

          {!loading && error && (
            <div className="p-10 text-center text-rose-600 text-sm">{error}</div>
          )}

          {!loading && !error && items.length === 0 && (
            <div className="p-10 text-center">
              <Bell className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-500">No notifications yet</p>
            </div>
          )}

          {!loading &&
            items.map((item) => {
              const TypeIcon = TYPE_ICONS[item.type] ?? Eye;
              return (
                <button
                  key={item._id}
                  onClick={() => openItem(item)}
                  className={`w-full px-5 py-4 text-left flex items-start gap-3 transition-colors hover:bg-gray-50 border-b border-gray-100 last:border-0 ${
                    item.read === false ? 'bg-emerald-50/40' : ''
                  }`}
                >
                  <span className={`p-2 rounded-xl flex-shrink-0 ${STATUS_ICONS[item.type] ?? 'bg-sky-50 text-sky-600'}`}>
                    <TypeIcon className="w-4 h-4" />
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-gray-900 text-sm truncate">{item.title}</span>
                      <span className="text-[11px] text-gray-400 flex-shrink-0">{timeAgo(item.createdAt)}</span>
                    </span>
                    <span className="block text-xs text-gray-600 mt-0.5 line-clamp-2">{item.message}</span>
                    <span className="flex items-center gap-3 mt-1.5">
                      {item.link && (
                        <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 font-medium">
                          <ExternalLink className="w-3 h-3" />
                          Open
                        </span>
                      )}
                      {item.read === false && (
                        <span className="inline-flex items-center w-1.5 h-1.5 rounded-full bg-red-500" />
                      )}
                    </span>
                  </span>
                  <span
                    role="button"
                    tabIndex={0}
                    onClick={(event) => {
                      event.stopPropagation();
                      remove(item._id);
                    }}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.stopPropagation();
                        remove(item._id);
                      }
                    }}
                    className="p-1.5 hover:bg-rose-50 text-gray-400 hover:text-rose-600 rounded-lg transition-colors flex-shrink-0"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </span>
                </button>
              );
            })}
        </div>

        {/* Footer */}
        {!loading && items.length > 0 && (
          <div className="px-5 py-3 border-t border-gray-200 flex items-center justify-between">
            <span className="text-xs text-gray-500">{items.length} notification{items.length > 1 ? 's' : ''}</span>
            <button onClick={markAllRead} disabled={unread === 0} className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 disabled:opacity-40">
              Mark all as read
            </button>
          </div>
        )}
      </div>
    </div>
  );
};