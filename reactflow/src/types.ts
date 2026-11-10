export interface CustomField { k: string; v: string }

export interface Clip {
  id: number;
  title: string;
  time: string;
  dur: string;
  who: 'A' | 'B';
  scene: string;
  line: string;
  camera: string;
  sound: string;
  mediaLink: string;
  color: string;
  custom: CustomField[];
  /** React Flow node position (extra field; absent = auto layout). */
  pos?: { x: number; y: number };
}

export interface Project {
  id: string;
  name: string;
  updatedAt: string;
  clips: Clip[];
}

export interface Func {
  id: number;
  name: string;
  tpl: string;
}

export const PLACEHOLDERS = '{scene} {line} {who} {dur} {camera} {sound} {time} {title}';

export function applyTpl(tpl: string, c: Clip): string {
  return String(tpl)
    .replaceAll('{scene}', c.scene || '')
    .replaceAll('{line}', c.line || '')
    .replaceAll('{who}', c.who || '')
    .replaceAll('{dur}', c.dur || '')
    .replaceAll('{camera}', c.camera || '')
    .replaceAll('{sound}', c.sound || '')
    .replaceAll('{time}', c.time || '')
    .replaceAll('{title}', c.title || '');
}

export async function copyText(t: string, onSelectFallback: () => void): Promise<boolean> {
  try { await navigator.clipboard.writeText(t); return true; } catch { /* fall through */ }
  try {
    const ta = document.createElement('textarea');
    ta.value = t; document.body.appendChild(ta); ta.select();
    document.execCommand('copy'); ta.remove(); return true;
  } catch { /* fall through */ }
  onSelectFallback();
  return false;
}
