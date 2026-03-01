//
//  index.tsx
//
//  The MIT License
//  Copyright (c) 2021 - 2026 O2ter Limited. All rights reserved.
//
//  Permission is hereby granted, free of charge, to any person obtaining a copy
//  of this software and associated documentation files (the "Software"), to deal
//  in the Software without restriction, including without limitation the rights
//  to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
//  copies of the Software, and to permit persons to whom the Software is
//  furnished to do so, subject to the following conditions:
//
//  The above copyright notice and this permission notice shall be included in
//  all copies or substantial portions of the Software.
//
//  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
//  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
//  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
//  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
//  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
//  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
//  THE SOFTWARE.
//

import _ from 'lodash';
import { _useCallbacks, useEffect, useMemo, useState } from 'frosty';
import { useDocument } from 'frosty/web';
import { TSchema, useProtoSchema } from '../../proto';
import { useTheme } from '../../components/theme';

// ─── Layout constants ────────────────────────────────────────────────────────

const CLASS_WIDTH = 240;
const HEADER_HEIGHT = 34;
const FIELD_HEIGHT = 22;
const PADDING_V = 8;
const H_GAP = 60;
const V_GAP = 40;
const CANVAS_PADDING = 40;

// ─── Types ───────────────────────────────────────────────────────────────────

type FieldInfo = {
  name: string;
  typeStr: string;
  relationType?: 'pointer' | 'relation';
  target?: string;
};

type NodePos = { x: number; y: number };

// ─── Helpers ─────────────────────────────────────────────────────────────────

const getFieldTypeStr = (ftype: TSchema['fields'][string]): string => {
  if (_.isString(ftype)) return ftype;
  switch (ftype.type) {
    case 'pointer': return `→ ${ftype.target}`;
    case 'relation': return `[${ftype.target}]`;
    case 'vector': return `vector(${ftype.dimension})`;
    case 'shape': return 'shape{…}';
    default: return ftype.type;
  }
};

const getFieldInfo = (name: string, ftype: TSchema['fields'][string]): FieldInfo => {
  const isObj = !_.isString(ftype);
  return {
    name,
    typeStr: getFieldTypeStr(ftype),
    relationType: isObj && (ftype.type === 'pointer' || ftype.type === 'relation') ? ftype.type : undefined,
    target: isObj && (ftype.type === 'pointer' || ftype.type === 'relation') ? ftype.target : undefined,
  };
};

const nodeHeight = (fieldCount: number) =>
  HEADER_HEIGHT + 1 + PADDING_V + fieldCount * FIELD_HEIGHT + PADDING_V;

/** Find where a ray from (cx,cy) towards (tx,ty) exits a rectangle of size w×h centred at (cx,cy). */
const boxEdgePoint = (cx: number, cy: number, w: number, h: number, tx: number, ty: number) => {
  const dx = tx - cx, dy = ty - cy;
  if (dx === 0 && dy === 0) return { x: cx, y: cy };
  const hw = w / 2, hh = h / 2;
  const t = Math.abs(dx) * hh >= Math.abs(dy) * hw ? hw / Math.abs(dx) : hh / Math.abs(dy);
  return { x: cx + dx * t, y: cy + dy * t };
};

// ─── Component ───────────────────────────────────────────────────────────────

export const DiagramPage = () => {
  const theme = useTheme();
  const schema = useProtoSchema();
  const doc = useDocument();

  const [showSystem, setShowSystem] = useState(false);

  // Filter classes based on showSystem toggle
  const classNames = useMemo(
    () => _.keys(schema).filter(n => showSystem || !n.startsWith('_')).sort(),
    [schema, showSystem],
  );

  // Pre-compute heights
  const heights = useMemo(
    () => _.fromPairs(classNames.map(n => [n, nodeHeight(_.keys(schema[n]?.fields ?? {}).length)])),
    [classNames, schema],
  );

  // Initial grid layout — columns stacked with per-class heights
  const COLS = Math.max(1, Math.ceil(Math.sqrt(classNames.length)));

  const initialPositions = useMemo<Record<string, NodePos>>(() => {
    const result: Record<string, NodePos> = {};
    const cols: string[][] = Array.from({ length: COLS }, () => []);
    classNames.forEach((name, i) => cols[i % COLS].push(name));
    cols.forEach((col, ci) => {
      let y = CANVAS_PADDING;
      for (const name of col) {
        result[name] = { x: CANVAS_PADDING + ci * (CLASS_WIDTH + H_GAP), y };
        y += heights[name] + V_GAP;
      }
    });
    return result;
  }, [classNames, COLS, heights]);

  // User-dragged overrides
  const [userPositions, setUserPositions] = useState<Record<string, NodePos>>({});

  const positions = useMemo(
    () => ({ ...initialPositions, ...userPositions }),
    [initialPositions, userPositions],
  );

  // Build node objects
  const nodes = useMemo(() =>
    classNames.map(name => {
      const fields = Object.entries(schema[name]?.fields ?? {}).map(([k, v]) => getFieldInfo(k, v));
      const pos = positions[name] ?? { x: 0, y: 0 };
      return { name, fields, ...pos, width: CLASS_WIDTH, height: heights[name] ?? nodeHeight(fields.length) };
    }),
    [classNames, heights, positions, schema],
  );

  const nodeMap = useMemo(() => _.keyBy(nodes, 'name'), [nodes]);

  // Relationships between classes in the diagram, with perpendicular offset index for parallel edges
  const relationships = useMemo(() => {
    const rels: Array<{ from: string; to: string; fieldName: string; type: 'pointer' | 'relation'; offsetIndex: number; offsetTotal: number }> = [];
    // Count how many edges share each undirected pair so we can fan them out
    const pairCount: Record<string, number> = {};
    const pairNext: Record<string, number> = {};
    for (const name of classNames) {
      for (const [, ftype] of Object.entries(schema[name]?.fields ?? {})) {
        if (!_.isString(ftype) && (ftype.type === 'pointer' || ftype.type === 'relation') && ftype.target && nodeMap[ftype.target] && name !== ftype.target) {
          const key = [name, ftype.target].sort().join('\0');
          pairCount[key] = (pairCount[key] ?? 0) + 1;
        }
      }
    }
    for (const name of classNames) {
      for (const [fname, ftype] of Object.entries(schema[name]?.fields ?? {})) {
        if (!_.isString(ftype) && (ftype.type === 'pointer' || ftype.type === 'relation') && ftype.target && nodeMap[ftype.target] && name !== ftype.target) {
          const key = [name, ftype.target].sort().join('\0');
          const total = pairCount[key] ?? 1;
          const idx = pairNext[key] ?? 0;
          pairNext[key] = idx + 1;
          rels.push({ from: name, to: ftype.target, fieldName: fname, type: ftype.type, offsetIndex: idx, offsetTotal: total });
        }
      }
    }
    return rels;
  }, [classNames, nodeMap, schema]);

  // ─── Drag ──────────────────────────────────────────────────────────────────

  const [dragging, setDragging] = useState<{ name: string; startX: number; startY: number; mx: number; my: number } | null>(null);

  const { handleMouseMove, handleMouseUp } = _useCallbacks({
    handleMouseMove: (e: MouseEvent) => {
      if (!dragging) return;
      setUserPositions(prev => ({
        ...prev,
        [dragging.name]: {
          x: Math.max(0, dragging.startX + e.clientX - dragging.mx),
          y: Math.max(0, dragging.startY + e.clientY - dragging.my),
        },
      }));
    },
    handleMouseUp: () => setDragging(null),
  });

  useEffect(() => {
    doc.addEventListener('mousemove', handleMouseMove);
    doc.addEventListener('mouseup', handleMouseUp);
    return () => {
      doc.removeEventListener('mousemove', handleMouseMove);
      doc.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  // ─── SVG canvas size ───────────────────────────────────────────────────────

  const canvasW = (_.max(nodes.map(n => n.x + n.width)) ?? 400) + CANVAS_PADDING;
  const canvasH = (_.max(nodes.map(n => n.y + n.height)) ?? 300) + CANVAS_PADDING;

  // ─── Render ────────────────────────────────────────────────────────────────

  if (classNames.length === 0) {
    return (
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: theme.colorContrast('#ffffff'),
        opacity: 0.5,
        fontSize: theme.fontSize.md,
      }}>
        No classes defined yet.
      </div>
    );
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%' }}>

      {/* Legend */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: theme.spacing.lg,
        padding: `${theme.spacing.sm}px ${theme.spacing.lg}px`,
        borderBottom: `1px solid ${theme.colors['primary-200']}`,
        fontSize: theme.fontSize.xs,
        color: theme.colorContrast('#ffffff'),
        background: 'white',
        flexShrink: 0,
      }}>
        <strong style={{ color: theme.colors.primary }}>Legend:</strong>
        <span style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.xs }}>
          <svg width={36} height={12} style={{ display: 'block' }}>
            <defs>
              <marker id="leg-solid" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                <polygon points="0 0, 6 3, 0 6" fill={theme.colors.primary} />
              </marker>
            </defs>
            <line x1={0} y1={6} x2={28} y2={6} stroke={theme.colors.primary} strokeWidth="1.5" markerEnd="url(#leg-solid)" />
          </svg>
          Pointer
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.xs }}>
          <svg width={36} height={12} style={{ display: 'block' }}>
            <defs>
              <marker id="leg-dashed" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                <polygon points="0 0, 6 3, 0 6" fill={theme.colors.tint} />
              </marker>
            </defs>
            <line x1={0} y1={6} x2={28} y2={6} stroke={theme.colors.tint} strokeWidth="1.5" strokeDasharray="5,3" markerEnd="url(#leg-dashed)" />
          </svg>
          Relation
        </span>
        <span style={{ marginLeft: 'auto', opacity: 0.6 }}>Drag to rearrange · {classNames.length} class{classNames.length !== 1 ? 'es' : ''}</span>

        {/* System classes toggle */}
        <label style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.xs, cursor: 'pointer', userSelect: 'none' }}>
          <div
            onClick={() => { setShowSystem(v => !v); setUserPositions({}); }}
            style={{
              position: 'relative',
              width: 32,
              height: 18,
              borderRadius: 9,
              background: showSystem ? theme.colors.primary : '#c0c0c0',
              transition: 'background 0.2s ease',
              cursor: 'pointer',
              flexShrink: 0,
            }}
          >
            <div style={{
              position: 'absolute',
              top: 2,
              left: showSystem ? 16 : 2,
              width: 14,
              height: 14,
              borderRadius: '50%',
              background: 'white',
              transition: 'left 0.2s ease',
              boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
            }} />
          </div>
          System classes
        </label>

        <button
          onClick={() => setUserPositions({})}
          style={{
            fontSize: theme.fontSize.xs,
            padding: `${theme.spacing.xs}px ${theme.spacing.sm}px`,
            border: `1px solid ${theme.colors['primary-300']}`,
            borderRadius: theme.borderRadius.sm,
            background: 'white',
            color: theme.colors.primary,
            cursor: 'pointer',
            '&:hover': { background: theme.colors['primary-100'] },
          } as any}
        >
          Reset layout
        </button>
      </div>

      {/* SVG canvas */}
      <div style={{ flex: 1, overflow: 'auto', background: theme.colors['primary-100'] }}>
        <svg
          width={canvasW}
          height={canvasH}
          style={{ display: 'block', userSelect: 'none', cursor: dragging ? 'grabbing' : 'default' }}
        >
          <defs>
            <marker id="arr-pointer" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
              <polygon points="0 0, 8 3, 0 6" fill={theme.colors.primary} />
            </marker>
            <marker id="arr-relation" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
              <polygon points="0 0, 8 3, 0 6" fill={theme.colors.tint} />
            </marker>
          </defs>

          {/* ── Arrows (rendered behind nodes) ── */}
          {relationships.map((rel, i) => {
            const fn = nodeMap[rel.from], tn = nodeMap[rel.to];
            if (!fn || !tn) return null;
            const isPointer = rel.type === 'pointer';
            const color = isPointer ? theme.colors.primary : theme.colors.tint;
            const fcx = fn.x + fn.width / 2, fcy = fn.y + fn.height / 2;
            const tcx = tn.x + tn.width / 2, tcy = tn.y + tn.height / 2;
            // Perpendicular offset to fan out parallel edges
            const SPREAD = 28;
            const offset = rel.offsetTotal > 1
              ? (rel.offsetIndex - (rel.offsetTotal - 1) / 2) * SPREAD
              : 0;
            const dx = tcx - fcx, dy = tcy - fcy;
            const len = Math.sqrt(dx * dx + dy * dy) || 1;
            const px = -dy / len, py = dx / len; // unit perpendicular
            // Control point for quadratic bezier
            const cpx = (fcx + tcx) / 2 + px * offset;
            const cpy = (fcy + tcy) / 2 + py * offset;
            // Use the control-point-aware edge intersection
            const start = boxEdgePoint(fcx, fcy, fn.width, fn.height, cpx, cpy);
            const end = boxEdgePoint(tcx, tcy, tn.width, tn.height, cpx, cpy);
            // Label position: point on bezier at t=0.5
            const lx = 0.25 * start.x + 0.5 * cpx + 0.25 * end.x;
            const ly = 0.25 * start.y + 0.5 * cpy + 0.25 * end.y;
            const d = `M ${start.x} ${start.y} Q ${cpx} ${cpy} ${end.x} ${end.y}`;
            return (
              <g key={i}>
                <path
                  d={d}
                  fill="none"
                  stroke={color} strokeWidth="1.5"
                  strokeDasharray={isPointer ? undefined : '6,3'}
                  markerEnd={`url(#arr-${isPointer ? 'pointer' : 'relation'})`}
                  opacity="0.75"
                />
                {/* Field name label on the curve */}
                <rect
                  x={lx - (rel.fieldName.length * 3.2)} y={ly - 9}
                  width={rel.fieldName.length * 6.4} height={13}
                  rx="2" fill="white" opacity="0.85"
                />
                <text
                  x={lx} y={ly}
                  textAnchor="middle" fontSize="10" fill={color}
                  style={{ pointerEvents: 'none' }}
                >
                  {rel.fieldName}
                </text>
              </g>
            );
          })}

          {/* ── Class nodes ── */}
          {nodes.map(node => {
            const isSystem = node.name.startsWith('_');
            const headerFill = isSystem ? theme.colors['primary-100'] : theme.colors['primary-200'];
            const cardStroke = isSystem ? theme.colors['primary-200'] : theme.colors['primary-300'];
            const nameFillNode = isSystem ? theme.colors['primary-400'] : theme.colors.primary;
            return (
            <g
              key={node.name}
              transform={`translate(${node.x},${node.y})`}
              onMouseDown={(e: any) => {
                e.preventDefault();
                const pos = positions[node.name] ?? { x: 0, y: 0 };
                setDragging({ name: node.name, startX: pos.x, startY: pos.y, mx: e.clientX, my: e.clientY });
              }}
              style={{ cursor: dragging?.name === node.name ? 'grabbing' : 'grab' }}
            >
              {/* Drop shadow */}
              <rect x={3} y={3} width={node.width} height={node.height} rx={theme.borderRadius.md} fill="rgba(0,0,0,0.09)" />

              {/* Card */}
                <rect width={node.width} height={node.height} rx={`${theme.borderRadius.md}`} fill="white" stroke={cardStroke} strokeWidth="1.5" />

              {/* Header fill */}
                <rect width={node.width} height={HEADER_HEIGHT} rx={`${theme.borderRadius.md}`} fill={headerFill} />
              {/* Square off bottom corners of header strip */}
                <rect y={HEADER_HEIGHT - theme.borderRadius.md} width={node.width} height={theme.borderRadius.md} fill={headerFill} />

              {/* Class name */}
              <text
                x={node.width / 2} y={HEADER_HEIGHT / 2 + 5}
                textAnchor="middle"
                fontSize={`${theme.fontSize.sm}`} fontWeight={`${theme.fontWeight.semibold}`}
                  fill={nameFillNode}
                  fontStyle={isSystem ? 'italic' : undefined}
                style={{ pointerEvents: 'none' }}
              >
                {node.name}
              </text>

              {/* Header/body divider */}
              <line x1={0} y1={HEADER_HEIGHT} x2={node.width} y2={HEADER_HEIGHT} stroke={theme.colors['primary-300']} strokeWidth="1" />

              {/* Fields */}
              {node.fields.map((field, fi) => {
                const fy = HEADER_HEIGHT + PADDING_V + fi * FIELD_HEIGHT;
                const isRel = !!field.relationType;
                const nameFill = isRel ? theme.colors.primary : theme.colorContrast('#ffffff');
                const typeFill = isRel ? theme.colors.primary : theme.colors['primary-400'];
                return (
                  <g key={field.name}>
                    {/* Row separator */}
                    {fi > 0 && (
                      <line x1={0} y1={fy} x2={node.width} y2={fy} stroke={theme.colors['primary-100']} strokeWidth="0.5" />
                    )}
                    {/* Field name */}
                    <text
                      x={10} y={fy + FIELD_HEIGHT * 0.66}
                      fontSize="11"
                      fill={nameFill}
                      fontWeight={`${isRel ? theme.fontWeight.medium : theme.fontWeight.normal}`}
                      style={{ pointerEvents: 'none' }}
                    >
                      {field.name}
                    </text>
                    {/* Field type */}
                    <text
                      x={node.width - 10} y={fy + FIELD_HEIGHT * 0.66}
                      textAnchor="end"
                      fontSize="10" fontFamily="monospace"
                      fill={typeFill}
                      style={{ pointerEvents: 'none' }}
                    >
                      {field.typeStr}
                    </text>
                  </g>
                );
              })}
            </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
};
