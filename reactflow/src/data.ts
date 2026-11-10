import type { Clip, Func, Project } from './types';

export const DEMO_CLIPS: Clip[] = [
  { id: 1, title: '第1条 · 倒持筷子挑面', time: '0:00–0:02', dur: '2.0秒', who: 'A', scene: '特写A坐在木桌前，右手倒持筷子从印字大碗中挑起拌面', line: '', camera: '固定机位、特写', sound: '无', mediaLink: '', color: '#ffffff', custom: [] },
  { id: 2, title: '第2条 · B 提醒', time: '0:02–0:03.6', dur: '1.6秒', who: 'B', scene: '近景B正面看向镜头，微笑善意提醒', line: '帅哥，你筷子拿反了', camera: '固定机位、近景', sound: '无', mediaLink: '', color: '#ffffff', custom: [{ k: '参考图', v: '图1（B）' }] },
  { id: 3, title: '第3条 · 我是故意的', time: '0:03.6–0:04.6', dur: '1.0秒', who: 'A', scene: '近景A嘟嘴直视镜头，双颊鼓起一脸不服', line: '我是故意的', camera: '固定机位、近景', sound: '无', mediaLink: '', color: '#ffffff', custom: [] },
  { id: 4, title: '第4条 · 防人之心不可无', time: '0:04.6–0:06', dur: '1.4秒', who: 'A', scene: '近景A表情转严肃，微微点头作老成状', line: '防人之心不可无', camera: '固定机位、近景', sound: '无', mediaLink: '', color: '#ffffff', custom: [] },
  { id: 5, title: '第5条 · 筷头别人经常用', time: '0:06–0:07.8', dur: '1.8秒', who: 'A', scene: '近景A皱眉龇牙解释，眼神带着嫌弃', line: '你看筷头别人经常用', camera: '固定机位、近景', sound: '无', mediaLink: '', color: '#ffffff', custom: [] },
  { id: 6, title: '第6条 · 我怕有传染病', time: '0:07.8–0:09.8', dur: '2.0秒', who: 'A', scene: '近景A恢复平静直视镜头，说完略显小得意', line: '我怕有传染病传染给我', camera: '固定机位、近景', sound: '无', mediaLink: '', color: '#ffffff', custom: [] },
];

export const DEMO_FN: Func[] = [
  { id: 1, name: '转 Seedance', tpl: '人物绑定：@{who}参考图。画面：{scene}。台词（只能由{who}说）：“{line}”。运镜：{camera}。音效：{sound}。画面内不烧录字幕。画面中仅保留单个对应人物。' },
  { id: 2, name: '转 Muse', tpl: '画面中只有{who}一个人。画面：{scene}。台词：“{line}”。运镜：{camera}。不要出现第二个人物正面，不烧录字幕。' },
];

export function demoProject(): Project {
  return { id: 'demo-noodle', name: '面馆示例', updatedAt: new Date().toISOString(), clips: JSON.parse(JSON.stringify(DEMO_CLIPS)) as Clip[] };
}

export function uid(): string {
  return 'p' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

export function normalizeClip(c: unknown, i: number): Clip {
  const o = (c ?? {}) as Partial<Clip>;
  return {
    id: typeof o.id === 'number' ? o.id : Date.now() + i,
    title: o.title || `卡片${i + 1}`,
    time: o.time || '',
    dur: o.dur || '',
    who: o.who === 'B' ? 'B' : 'A',
    scene: o.scene || '',
    line: o.line || '',
    camera: o.camera || '',
    sound: o.sound || '',
    mediaLink: o.mediaLink || '',
    color: o.color || '#ffffff',
    custom: Array.isArray(o.custom) ? o.custom : [],
    ...(o.pos ? { pos: o.pos } : {}),
  };
}

export function normalizeProject(p: unknown): Project {
  const o = (p ?? {}) as Partial<Project>;
  return {
    id: uid(),
    name: o.name || '导入的项目',
    updatedAt: new Date().toISOString(),
    clips: Array.isArray(o.clips) ? o.clips.map(normalizeClip) : [],
  };
}
