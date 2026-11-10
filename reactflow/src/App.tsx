import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Background,
  Controls,
  MiniMap,
  ReactFlow,
  ReactFlowProvider,
  applyNodeChanges,
  type Edge,
  type NodeChange,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { ClipNode, type ClipNodeType } from './ClipNode';
import { DEMO_FN, demoProject, normalizeClip, normalizeProject, uid } from './data';
import { deleteProjectFromDb, loadState, saveState } from './storage';
import { applyTpl, copyText, PLACEHOLDERS, type Clip, type Func, type Project } from './types';
import './index.css';

const nodeTypes = { clip: ClipNode };

function nodeId(clipId: number) { return `clip-${clipId}`; }

function layoutPos(i: number) { return { x: 40 + (i % 3) * 340, y: 20 + Math.floor(i / 3) * 300 }; }

function AppInner() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [funcs, setFuncs] = useState<Func[]>(DEMO_FN);
  const [activeId, setActiveId] = useState<string>('');
  const [sel, setSel] = useState<number | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [storageMode, setStorageMode] = useState('');
  const [status, setStatus] = useState('正在加载…');
  const [out, setOut] = useState('点一张卡片上的功能按钮，或点“复制全部转换提示词”后这里会显示。');
  const [nodes, setNodes] = useState<ClipNodeType[]>([]);
  const [cfKey, setCfKey] = useState('');
  const [cfVal, setCfVal] = useState('');
  const [fnName, setFnName] = useState('');
  const [fnTpl, setFnTpl] = useState('');
  const [editingFn, setEditingFn] = useState<Func | null>(null);
  const [newProjName, setNewProjName] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const outRef = useRef<HTMLDivElement>(null);
  const saveTimer = useRef<number | undefined>(undefined);

  const active = useMemo(
    () => projects.find((p) => p.id === activeId) || projects[0],
    [projects, activeId],
  );
  const clips: Clip[] = active?.clips ?? [];
  const selClip = clips.find((c) => c.id === sel) ?? null;

  const persist = useCallback((ps: Project[], fs: Func[], aid: string) => {
    window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(() => { void saveState(ps, fs, aid); }, 300);
  }, []);

  // Load once
  useEffect(() => {
    void loadState().then((s) => {
      setProjects(s.projects);
      setFuncs(s.funcs);
      setActiveId(s.activeId);
      setStorageMode(s.storage);
      setStatus(`已加载 · ${s.storage}`);
      setLoaded(true);
    });
  }, []);

  // Persist on change (after load)
  useEffect(() => {
    if (!loaded || !projects.length) return;
    persist(projects, funcs, activeId || projects[0].id);
  }, [projects, funcs, activeId, loaded, persist]);

  const updateClips = useCallback((fn: (cs: Clip[]) => Clip[]) => {
    setProjects((prev) =>
      prev.map((p) => (p.id === (active?.id ?? '') ? { ...p, clips: fn(p.clips) } : p)),
    );
  }, [active?.id]);

  const editSel = useCallback((k: keyof Clip, v: string) => {
    if (sel == null) return;
    updateClips((cs) => cs.map((c) => (c.id === sel ? { ...c, [k]: v } : c)));
  }, [sel, updateClips]);

  const runFn = useCallback((fnId: number, index: number) => {
    const f = funcs.find((x) => x.id === fnId);
    if (!f) return;
    const text = applyTpl(f.tpl, clips[index]);
    setOut(text);
    void copyText(text, () => {
      const el = outRef.current;
      if (el) {
        const r = document.createRange(); r.selectNodeContents(el);
        const s = window.getSelection(); s?.removeAllRanges(); s?.addRange(r);
        alert('已选中转换结果，请按 Ctrl/Cmd+C 复制');
      }
    });
  }, [funcs, clips]);

  // Rebuild React Flow nodes/edges from clip order whenever clips/funcs/selection change.
  // Positions: keep clip.pos if present, else column layout; dragging updates clip.pos.
  useEffect(() => {
    if (!active) { setNodes([]); return; }
    setNodes(active.clips.map((c, i) => ({
      id: nodeId(c.id),
      type: 'clip',
      position: c.pos ?? layoutPos(i),
      data: {
        clip: c,
        index: i,
        selected: sel === c.id,
        funcs,
        onSelect: (id: number) => setSel(id),
        onRunFn: runFn,
      },
    })));
  }, [active, sel, funcs, runFn]);

  const edges: Edge[] = useMemo(() => {
    if (!active) return [];
    return active.clips.slice(1).map((c, i) => ({
      id: `e-${active.clips[i].id}-${c.id}`,
      source: nodeId(active.clips[i].id),
      target: nodeId(c.id),
      type: 'smoothstep',
    }));
  }, [active]);

  const onNodesChange = useCallback((changes: NodeChange<ClipNodeType>[]) => {
    setNodes((nds) => applyNodeChanges(changes, nds));
  }, []);

  const onNodeDragStop = useCallback((_e: unknown, node: ClipNodeType) => {
    const clipId = Number(node.id.replace('clip-', ''));
    updateClips((cs) => cs.map((c) => (c.id === clipId ? { ...c, pos: { x: node.position.x, y: node.position.y } } : c)));
  }, [updateClips]);

  const onNodeClick = useCallback((_e: unknown, node: ClipNodeType) => {
    setSel(Number(node.id.replace('clip-', '')));
  }, []);

  /* ---- clips ---- */
  function addClip() {
    if (!active) return;
    const id = Date.now();
    updateClips((cs) => [...cs, { id, title: '新卡片', time: '', dur: '2.0秒', who: 'A', scene: '', line: '', camera: '固定机位、近景', sound: '无', mediaLink: '', color: '#ffffff', custom: [] }]);
    setSel(id);
  }
  function moveClip(i: number, d: number) {
    updateClips((cs) => {
      const j = i + d;
      if (j < 0 || j >= cs.length) return cs;
      const next = [...cs]; const t = next[i]; next[i] = next[j]; next[j] = t;
      return next.map((c) => ({ ...c, pos: undefined }));
    });
  }
  function dupClip(i: number) {
    updateClips((cs) => {
      const c = JSON.parse(JSON.stringify(cs[i])) as Clip;
      c.id = Date.now(); c.title = c.title + '（副本）'; delete c.pos;
      const next = [...cs]; next.splice(i + 1, 0, c); return next;
    });
  }
  function delClip(i: number) {
    if (!window.confirm('删除这张卡片？')) return;
    updateClips((cs) => cs.filter((_, j) => j !== i));
    setSel(null);
  }
  function autoLayout() {
    updateClips((cs) => cs.map((c, i) => ({ ...c, pos: layoutPos(i) })));
  }

  /* ---- projects ---- */
  function switchProject(id: string) { setActiveId(id); setSel(null); }
  function createProject() {
    const name = (newProjName || '新项目').trim();
    const p: Project = { id: uid(), name, updatedAt: new Date().toISOString(), clips: [] };
    setProjects((prev) => [...prev, p]); setActiveId(p.id); setSel(null); setNewProjName('');
  }
  function renameProject() {
    if (!active) return;
    const name = window.prompt('项目改名：', active.name);
    if (!name) return;
    setProjects((prev) => prev.map((p) => (p.id === active.id ? { ...p, name: name.trim() } : p)));
  }
  function duplicateProject() {
    if (!active) return;
    const c = JSON.parse(JSON.stringify(active)) as Project;
    c.id = uid(); c.name = active.name + '（副本）'; c.updatedAt = new Date().toISOString();
    c.clips.forEach((x) => { x.id = Date.now() + Math.floor(Math.random() * 100000); delete x.pos; });
    setProjects((prev) => [...prev, c]); setActiveId(c.id); setSel(null);
  }
  async function deleteProject() {
    if (!active) return;
    if (projects.length <= 1) { alert('只剩一个项目，不能删除；可以先新建一个再删。'); return; }
    if (!window.confirm(`删除项目“${active.name}”？里面的卡片会一起删除，请先导出备份。`)) return;
    await deleteProjectFromDb(active.id);
    setProjects((prev) => prev.filter((p) => p.id !== active.id));
    setActiveId(projects[0].id); setSel(null);
  }

  /* ---- functions ---- */
  function addFunction() {
    if (!fnName.trim() || !fnTpl.trim()) { alert('功能名和模板都要填'); return; }
    setFuncs((prev) => [...prev, { id: Date.now(), name: fnName.trim(), tpl: fnTpl.trim() }]);
    setFnName(''); setFnTpl('');
  }
  function saveEditingFn() {
    if (!editingFn) return;
    setFuncs((prev) => prev.map((f) => (f.id === editingFn.id ? editingFn : f)));
    setEditingFn(null);
  }
  function delFn(id: number) {
    if (!window.confirm('删除这个功能？')) return;
    setFuncs((prev) => prev.filter((f) => f.id !== id));
  }

  /* ---- export / import / copy-all ---- */
  function download(name: string, text: string) {
    const blob = new Blob([text], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = name; a.click();
    window.setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }
  function exportCurrent() {
    if (!active) return;
    download(`project-${active.name}.json`, JSON.stringify({ format: 'video-canvas-project', version: 1, exportedAt: new Date().toISOString(), project: active, functions: funcs }, null, 2));
  }
  function exportAll() {
    download('video-canvas-all-projects.json', JSON.stringify({ format: 'video-canvas-all', version: 1, exportedAt: new Date().toISOString(), projects, functions: funcs }, null, 2));
  }
  function importJSON(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = () => {
      try {
        const d = JSON.parse(String(r.result)) as unknown;
        const o = d as { format?: string; projects?: unknown[]; project?: unknown; clips?: unknown[]; functions?: Func[]; funcs?: Func[] };
        let added: Project[] = [];
        if (o && o.format === 'video-canvas-all' && Array.isArray(o.projects)) {
          added = o.projects.map(normalizeProject);
          if (Array.isArray(o.functions) && o.functions.length) setFuncs(o.functions);
        } else if (o && o.project) {
          added = [normalizeProject(o.project)];
          if (Array.isArray(o.functions) && o.functions.length) setFuncs(o.functions);
        } else if (o && Array.isArray(o.clips)) {
          added = [normalizeProject(o)];
          if (Array.isArray(o.funcs)) setFuncs(o.funcs);
        } else if (Array.isArray(d)) {
          added = [{ id: uid(), name: '导入的项目', updatedAt: new Date().toISOString(), clips: (d as unknown[]).map(normalizeClip) }];
        } else { alert('文件格式不对：请导入本工作台导出的 JSON'); return; }
        setProjects((prev) => [...prev, ...added]);
        setActiveId(added[added.length - 1].id);
        setSel(null);
        alert('已导入');
      } catch { alert('文件格式不对'); }
    };
    r.readAsText(f);
    e.target.value = '';
  }
  function copyAllConverted() {
    const f = funcs[0];
    if (!f) { alert('先添加一个功能'); return; }
    const text = clips.map((c, i) => `第${i + 1}条\n${applyTpl(f.tpl, c)}`).join('\n\n---\n\n');
    setOut(text);
    void copyText(text, () => alert('复制失败，已显示在下方预览里，请手动选中复制'));
    alert('已复制全部（按第一个功能模板转换）');
  }
  function resetDemo() {
    if (!window.confirm('恢复面馆示例？会把当前项目替换成面馆示例，其他项目不受影响。')) return;
    const demo = demoProject();
    setProjects((prev) => prev.map((p) => (p.id === active?.id ? { ...p, name: '面馆示例', clips: demo.clips } : p)));
    setSel(null);
  }
  function clearAll() {
    if (!window.confirm('清空当前项目的全部卡片？')) return;
    updateClips(() => []);
    setSel(null);
  }

  if (!loaded) return <div className="loading">正在加载画布…</div>;

  return (
    <div className="app">
      <header>
        <h1>视频生成画布工作台</h1>
        <p>React Flow 无限画布 · GitHub Pages 免费版 · 不登录、不绑账号 · 数据存在本机浏览器</p>
        <span className="status">{status}</span>
      </header>
      <div className="warn"><b>重要：视频原片不要上传到这个工作台。</b>本工作台不上传、不保存任何视频文件——大文件（尤其超过 1G 的原片）请放在云盘 / 对象存储里，只把链接填进卡片的“素材链接”字段。GitHub 单个文件限 100MB、仓库约 1GB，也放不下大视频。画布里只存分镜、台词、提示词和链接。</div>
      <main>
        <section className="canvas-wrap">
          <div className="canvas-bar">
            <select value={active?.id ?? ''} onChange={(e) => switchProject(e.target.value)}>
              {projects.map((p) => <option key={p.id} value={p.id}>{p.name}（{p.clips.length} 条）</option>)}
            </select>
            <input value={newProjName} onChange={(e) => setNewProjName(e.target.value)} placeholder="新项目名字" />
            <button type="button" className="secondary" onClick={createProject}>+ 新建项目</button>
            <button type="button" className="secondary" onClick={renameProject}>改名</button>
            <button type="button" className="secondary" onClick={duplicateProject}>复制项目</button>
            <button type="button" className="ghost" onClick={() => void deleteProject()}>删除项目</button>
            <button type="button" className="secondary" onClick={addClip}>+ 添加卡片</button>
            <button type="button" className="secondary" onClick={autoLayout}>自动排版</button>
            <button type="button" className="secondary" onClick={copyAllConverted}>复制全部转换提示词</button>
          </div>
          <p className="hint">React Flow 画布：拖动卡片自由摆放，滚轮缩放、拖空白处平移；卡片按顺序用箭头连起来。点一张卡片，右边就能改它。</p>
          <div className="flow-box">
            <ReactFlow
              nodes={nodes}
              edges={edges}
              nodeTypes={nodeTypes}
              onNodesChange={onNodesChange}
              onNodeDragStop={onNodeDragStop}
              onNodeClick={onNodeClick}
              fitView
              fitViewOptions={{ padding: 0.2 }}
              proOptions={{ hideAttribution: true }}
            >
              <Background />
              <Controls />
              <MiniMap pannable zoomable />
            </ReactFlow>
          </div>
          <h2>转换结果预览</h2>
          <div className="out" ref={outRef}>{out}</div>
        </section>

        <aside className="panel">
          <h2>右边 · 可视化编辑</h2>
          <p className="note">不用写代码，点画布上的卡片，右边直接改；想加功能，在下面“添加功能”里填个名字和模板就行。</p>

          <h3>1. 选中卡片</h3>
          {selClip ? (
            <div>
              <label>标题</label>
              <input value={selClip.title} onChange={(e) => editSel('title', e.target.value)} />
              <div className="row">
                <div><label>人物</label>
                  <select value={selClip.who} onChange={(e) => editSel('who', e.target.value)}>
                    <option value="A">A</option><option value="B">B</option>
                  </select>
                </div>
                <div><label>时长</label><input value={selClip.dur} onChange={(e) => editSel('dur', e.target.value)} /></div>
              </div>
              <label>时间</label>
              <input value={selClip.time} onChange={(e) => editSel('time', e.target.value)} />
              <label>画面</label>
              <textarea value={selClip.scene} onChange={(e) => editSel('scene', e.target.value)} />
              <label>台词（一字不差）</label>
              <textarea value={selClip.line} onChange={(e) => editSel('line', e.target.value)} />
              <label>运镜</label>
              <input value={selClip.camera} onChange={(e) => editSel('camera', e.target.value)} />
              <label>音效</label>
              <input value={selClip.sound} onChange={(e) => editSel('sound', e.target.value)} />
              <label>素材链接（视频 / 参考图链接，只存链接，不上传文件）</label>
              <input value={selClip.mediaLink || ''} placeholder="粘贴云盘或对象存储链接" onChange={(e) => editSel('mediaLink', e.target.value)} />
              <div className="row-btns">
                <button type="button" className="small secondary" onClick={() => { const i = clips.findIndex((c) => c.id === sel); if (i >= 0) moveClip(i, -1); }}>↑ 上移</button>
                <button type="button" className="small secondary" onClick={() => { const i = clips.findIndex((c) => c.id === sel); if (i >= 0) moveClip(i, 1); }}>↓ 下移</button>
                <button type="button" className="small secondary" onClick={() => { const i = clips.findIndex((c) => c.id === sel); if (i >= 0) dupClip(i); }}>复制卡片</button>
                <button type="button" className="small secondary" onClick={() => { const i = clips.findIndex((c) => c.id === sel); if (i >= 0) delClip(i); }}>删除卡片</button>
              </div>
              {selClip.custom?.length ? selClip.custom.map((x, i) => (
                <div className="fn" key={i}><b>{x.k}：{x.v}</b>
                  <button type="button" className="small secondary" onClick={() => editSel('custom', selClip.custom.filter((_, j) => j !== i) as unknown as string)}>删</button>
                </div>
              )) : null}
            </div>
          ) : <p className="note">先点画布上任意一张卡片。</p>}

          <h3>2. 添加自定义字段</h3>
          <p className="note">比如给选中的卡片加“参考图：图1”“配音：儿童男声”等，字段会显示在卡片上，也会进导出结果。</p>
          <div className="row">
            <input value={cfKey} onChange={(e) => setCfKey(e.target.value)} placeholder="字段名，如 参考图" />
            <input value={cfVal} onChange={(e) => setCfVal(e.target.value)} placeholder="字段值，如 图1" />
          </div>
          <button type="button" className="secondary" style={{ marginTop: 8 }} onClick={() => {
            if (!selClip || !cfKey.trim()) { alert('先点一张卡片，并填字段名'); return; }
            editSel('custom', [...(selClip.custom || []), { k: cfKey.trim(), v: cfVal.trim() }] as unknown as string);
            setCfKey(''); setCfVal('');
          }}>加到选中卡片</button>

          <h3>3. 添加功能</h3>
          <p className="note">功能 = 一个可重复用的转换模板。占位符：{PLACEHOLDERS}。填好后它会出现在每张卡片上，点一下就按这个模板生成；“复制全部”用第一个功能模板。</p>
          <input value={fnName} onChange={(e) => setFnName(e.target.value)} placeholder="功能名，如 转 Seedance" />
          <textarea value={fnTpl} onChange={(e) => setFnTpl(e.target.value)} placeholder="模板，如：人物绑定：@{who}参考图。画面：{scene}。台词：{line}。" />
          <button type="button" onClick={addFunction} style={{ marginTop: 8 }}>+ 添加这个功能</button>
          <div>
            {funcs.map((f) => (
              <div className="fn" key={f.id}>
                <b>{f.name}</b>
                <button type="button" className="small secondary" onClick={() => setEditingFn({ ...f })}>改</button>
                <button type="button" className="small secondary" onClick={() => delFn(f.id)}>删</button>
              </div>
            ))}
          </div>
          {editingFn ? (
            <div className="edit-fn">
              <label>功能名</label>
              <input value={editingFn.name} onChange={(e) => setEditingFn({ ...editingFn, name: e.target.value })} />
              <label>模板</label>
              <textarea value={editingFn.tpl} onChange={(e) => setEditingFn({ ...editingFn, tpl: e.target.value })} />
              <button type="button" onClick={saveEditingFn}>保存这个功能</button>{' '}
              <button type="button" className="secondary" onClick={() => setEditingFn(null)}>取消</button>
            </div>
          ) : null}

          <h3>4. 外观</h3>
          <label>选中卡片颜色</label>
          <input type="color" value={selClip?.color || '#ffffff'} onChange={(e) => editSel('color', e.target.value)} />
          <p className="note">颜色只改选中卡片，方便在画布上区分 A / B / 动作镜头。</p>

          <h3>5. 数据与带走</h3>
          <p className="note">代码在 GitHub 仓库里，项目数据用下面导出成 JSON。账号、浏览器、电脑换了都没关系，重新打开页面再导入 JSON 就行。视频原片不在 JSON 里，只存链接，记得另外备份原片。</p>
          <div className="row-btns">
            <button type="button" className="secondary" onClick={exportCurrent}>导出当前项目 JSON</button>
            <button type="button" className="secondary" onClick={exportAll}>导出全部项目 JSON</button>
            <button type="button" className="secondary" onClick={() => fileRef.current?.click()}>导入 JSON</button>
            <input ref={fileRef} type="file" accept=".json,application/json" style={{ display: 'none' }} onChange={importJSON} />
          </div>
          <div className="row-btns">
            <button type="button" className="secondary" onClick={() => { void saveState(projects, funcs, activeId); alert('已保存到本机浏览器'); }}>立即保存到本机</button>
            <button type="button" className="secondary" onClick={resetDemo}>恢复面馆示例</button>
            <button type="button" className="ghost" onClick={clearAll}>清空当前项目卡片</button>
          </div>
          <p className="note">存储：{storageMode === 'IndexedDB' ? 'IndexedDB（本机浏览器，容量远大于 localStorage）。视频原片不存这里，只存链接。' : 'localStorage 备用模式。容量较小，请勤导出 JSON 备份。视频原片不存这里，只存链接。'}</p>
        </aside>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <ReactFlowProvider>
      <AppInner />
    </ReactFlowProvider>
  );
}
