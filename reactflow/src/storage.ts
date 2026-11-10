import { DEMO_FN, demoProject } from './data';
import type { Func, Project } from './types';

export const KEY = 'video-canvas-v2';
const DB_NAME = 'video-canvas-db';

export interface LoadedState {
  projects: Project[];
  funcs: Func[];
  activeId: string;
  storage: 'IndexedDB' | 'localStorage';
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!('indexedDB' in window)) { reject(new Error('no indexedDB')); return; }
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      const d = req.result;
      if (!d.objectStoreNames.contains('projects')) d.createObjectStore('projects', { keyPath: 'id' });
      if (!d.objectStoreNames.contains('meta')) d.createObjectStore('meta', { keyPath: 'key' });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error || new Error('indexedDB open failed'));
  });
}

function idbReq<T>(db: IDBDatabase, store: string, mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, mode);
    const r = fn(tx.objectStore(store));
    r.onsuccess = () => resolve(r.result);
    r.onerror = () => reject(r.error);
  });
}

export async function loadState(): Promise<LoadedState> {
  try {
    const db = await openDB();
    const ps = await idbReq<Project[]>(db, 'projects', 'readonly', (s) => s.getAll());
    const fnMeta = await idbReq<{ key: string; value: Func[] } | undefined>(db, 'meta', 'readonly', (s) => s.get('functions'));
    const actMeta = await idbReq<{ key: string; value: string } | undefined>(db, 'meta', 'readonly', (s) => s.get('activeProjectId'));
    if (ps && ps.length) {
      return { projects: ps, funcs: fnMeta?.value || JSON.parse(JSON.stringify(DEMO_FN)) as Func[], activeId: actMeta?.value || ps[0].id, storage: 'IndexedDB' };
    }
    const fresh = { projects: [demoProject()], funcs: JSON.parse(JSON.stringify(DEMO_FN)) as Func[], activeId: 'demo-noodle', storage: 'IndexedDB' as const };
    await saveState(fresh.projects, fresh.funcs, fresh.activeId);
    return fresh;
  } catch {
    try {
      const d = JSON.parse(localStorage.getItem(KEY) || 'null') as { projects?: Project[]; funcs?: Func[]; activeId?: string; clips?: unknown } | null;
      if (d?.projects?.length) {
        return { projects: d.projects, funcs: d.funcs || JSON.parse(JSON.stringify(DEMO_FN)) as Func[], activeId: d.activeId || d.projects[0].id, storage: 'localStorage' };
      }
      if (d && Array.isArray((d as { clips?: unknown[] }).clips)) {
        const p = demoProject();
        // legacy single-list format {clips, funcs}
        p.clips = (d as unknown as { clips: Project['clips'] }).clips;
        return { projects: [p], funcs: d.funcs || JSON.parse(JSON.stringify(DEMO_FN)) as Func[], activeId: p.id, storage: 'localStorage' };
      }
    } catch { /* fall through to fresh */ }
    return { projects: [demoProject()], funcs: JSON.parse(JSON.stringify(DEMO_FN)) as Func[], activeId: 'demo-noodle', storage: 'localStorage' };
  }
}

export async function saveState(projects: Project[], funcs: Func[], activeId: string): Promise<void> {
  const stamp = projects.map((p) => ({ ...p, updatedAt: new Date().toISOString() }));
  try {
    const db = await openDB();
    for (const p of stamp) await idbReq(db, 'projects', 'readwrite', (s) => s.put(p));
    await idbReq(db, 'meta', 'readwrite', (s) => s.put({ key: 'functions', value: funcs }));
    await idbReq(db, 'meta', 'readwrite', (s) => s.put({ key: 'activeProjectId', value: activeId }));
    return;
  } catch { /* fall through to localStorage */ }
  try { localStorage.setItem(KEY, JSON.stringify({ projects: stamp, funcs, activeId })); } catch { /* storage full/blocked: data still lives in memory + export */ }
}

export async function deleteProjectFromDb(id: string): Promise<void> {
  try {
    const db = await openDB();
    await idbReq(db, 'projects', 'readwrite', (s) => s.delete(id));
  } catch { /* localStorage mode: saveState overwrites anyway */ }
}
