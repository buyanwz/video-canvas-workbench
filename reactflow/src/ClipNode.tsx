import { Handle, Position, type Node, type NodeProps } from '@xyflow/react';
import type { Clip, Func } from './types';
import { applyTpl } from './types';

export type ClipNodeData = {
  clip: Clip;
  index: number;
  selected: boolean;
  funcs: Func[];
  onSelect: (id: number) => void;
  onRunFn: (fnId: number, index: number) => void;
};

export type ClipNodeType = Node<ClipNodeData, 'clip'>;

export function ClipNode({ data }: NodeProps<ClipNodeType>) {
  const { clip, index, selected, funcs, onSelect, onRunFn } = data;
  return (
    <div
      className={'clip-node' + (selected ? ' sel' : '')}
      style={{ background: clip.color || '#fff' }}
      onClick={() => onSelect(clip.id)}
    >
      <Handle type="target" position={Position.Top} />
      <div className="clip-order">第 {index + 1} 条</div>
      <h3>{clip.title}</h3>
      <div className="meta">{clip.who} · {clip.time} · 约{clip.dur}</div>
      <div className="scene">{clip.scene}</div>
      {clip.line ? <div className="line">“{clip.line}”</div> : <div className="note">无台词</div>}
      {clip.mediaLink ? (
        <div className="link">
          素材链接：<a href={clip.mediaLink} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>{clip.mediaLink}</a>
        </div>
      ) : null}
      {clip.custom?.length ? (
        <div className="custom">{clip.custom.map((x) => `${x.k}：${x.v}`).join('；')}</div>
      ) : null}
      <div className="node-fns">
        {funcs.map((f) => (
          <button
            key={f.id}
            type="button"
            className="small secondary"
            title={applyTpl(f.tpl, clip)}
            onClick={(e) => { e.stopPropagation(); onRunFn(f.id, index); }}
          >
            {f.name}
          </button>
        ))}
      </div>
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
}
