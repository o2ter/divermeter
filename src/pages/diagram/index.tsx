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
  isShape?: boolean;
  shapeMembers?: FieldInfo[];
  relationType?: 'pointer' | 'relation';
  target?: string;
};

type VisRow = { field: FieldInfo; depth: number; path: string };

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
  const isShape = isObj && ftype.type === 'shape';
  return {
    name,
    typeStr: getFieldTypeStr(ftype),
    isShape: isShape || undefined,
    shapeMembers: isShape
      ? Object.entries((ftype as { type: 'shape'; shape: Record<string, any> }).shape)
        .map(([k, v]) => getFieldInfo(k, v))
      : undefined,
    relationType: isObj && (ftype.type === 'pointer' || ftype.type === 'relation') ? ftype.type : undefined,
    target: isObj && (ftype.type === 'pointer' || ftype.type === 'relation') ? ftype.target : undefined,
  };
};

type RelationEntry = { path: string; target: string; relType: 'pointer' | 'relation' };

/** Recursively collect pointer/relation entries from a field, including inside shape members. */
const collectRelations = (fname: string, ftype: TSchema['fields'][string]): RelationEntry[] => {
  if (_.isString(ftype)) return [];
  if (ftype.type === 'pointer' || ftype.type === 'relation') {
    return [{ path: fname, target: ftype.target, relType: ftype.type }];
  }
  if (ftype.type === 'shape') {
    return Object.entries(ftype.shape).flatMap(
      ([k, v]) => collectRelations(`${fname}.${k}`, v as TSchema['fields'][string]),
    );
  }
  return [];
};

const nodeHeight = (fieldCount: number) =>
  HEADER_HEIGHT + 1 + PADDING_V + fieldCount * FIELD_HEIGHT + PADDING_V;

const EMPTY_SET = new Set<string>();

/** Count total visible rows including expanded shape members. */
const countVisibleRows = (fields: FieldInfo[], expandedSet: Set<string>, prefix = ''): number => {
  let count = 0;
  for (const f of fields) {
    count++;
    const path = prefix ? `${prefix}.${f.name}` : f.name;
    if (f.isShape && f.shapeMembers && expandedSet.has(path)) {
      count += countVisibleRows(f.shapeMembers, expandedSet, path);
    }
  }
  return count;
};

/** Find where a ray from (cx,cy) towards (tx,ty) exits a rectangle of size w×h centred at (cx,cy). */
const boxEdgePoint = (cx: number, cy: number, w: number, h: number, tx: number, ty: number) => {
  const dx = tx - cx, dy = ty - cy;
  if (dx === 0 && dy === 0) return { x: cx, y: cy };
  const hw = w / 2, hh = h / 2;
  const t = Math.abs(dx) * hh >= Math.abs(dy) * hw ? hw / Math.abs(dx) : hh / Math.abs(dy);
  return { x: cx + dx * t, y: cy + dy * t };
};

/**
 * Returns the Y offset (relative to the top of the node) of the centre of the
 * row for `fieldPath` (e.g. "name" or "meta.sub") given the currently-expanded
 * shapes.  Falls back to the node header centre when nothing matches.
 */
const getFieldRowY = (fields: FieldInfo[], fieldPath: string, expandedSet: Set<string>): number => {
  const rows: string[] = [];
  const buildRows = (fs: FieldInfo[], prefix: string) => {
    for (const f of fs) {
      const path = prefix ? `${prefix}.${f.name}` : f.name;
      rows.push(path);
      if (f.isShape && f.shapeMembers && expandedSet.has(path)) {
        buildRows(f.shapeMembers, path);
      }
    }
  };
  buildRows(fields, '');
  // exact match
  const exact = rows.indexOf(fieldPath);
  if (exact >= 0) return HEADER_HEIGHT + PADDING_V + exact * FIELD_HEIGHT + FIELD_HEIGHT / 2;
  // collapsed ancestor: find the longest prefix row that is an ancestor of fieldPath
  let bestIdx = -1, bestLen = -1;
  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    if (fieldPath.startsWith(r + '.') && r.length > bestLen) { bestLen = r.length; bestIdx = i; }
  }
  if (bestIdx >= 0) return HEADER_HEIGHT + PADDING_V + bestIdx * FIELD_HEIGHT + FIELD_HEIGHT / 2;
  return HEADER_HEIGHT / 2;
};

// ─── Sub-components (auto-memoized by Frosty) ────────────────────────────────

type ClassNodeProps = {
  name: string;
  fields: FieldInfo[];
  width: number;
  height: number;
  x: number;
  y: number;
  isDragging: boolean;
  onMouseDown: (e: any) => void;
  onToggleShape: (className: string, fieldPath: string) => void;
  /** Pipe-separated sorted list of expanded shape field paths for this node. */
  expandedShapesStr: string;
  // theme colours passed as primitives so Frosty can skip re-render when unchanged
  colorPrimary: string;
  colorPrimary100: string;
  colorPrimary200: string;
  colorPrimary300: string;
  colorPrimary400: string;
  colorContrast: string;
  fontSizeSm: number;
  fontWeightSemibold: number;
  fontWeightMedium: number;
  fontWeightNormal: number;
  borderRadiusMd: number;
};

const ClassNode = ({
  name, fields, width, height, x, y, isDragging, onMouseDown,
  onToggleShape, expandedShapesStr,
  colorPrimary, colorPrimary100, colorPrimary200, colorPrimary300, colorPrimary400,
  colorContrast, fontSizeSm, fontWeightSemibold, fontWeightMedium, fontWeightNormal, borderRadiusMd,
}: ClassNodeProps) => {
  const expandedSet = expandedShapesStr ? new Set(expandedShapesStr.split('|')) : EMPTY_SET;
  const visibleRows: VisRow[] = [];
  const buildRows = (fs: FieldInfo[], depth: number, prefix: string) => {
    for (const f of fs) {
      const path = prefix ? `${prefix}.${f.name}` : f.name;
      visibleRows.push({ field: f, depth, path });
      if (f.isShape && f.shapeMembers && expandedSet.has(path)) {
        buildRows(f.shapeMembers, depth + 1, path);
      }
    }
  };
  buildRows(fields, 0, '');
  const isSystem = name.startsWith('_');
  const headerFill = isSystem ? colorPrimary100 : colorPrimary200;
  const cardStroke = isSystem ? colorPrimary200 : colorPrimary300;
  const nameFillNode = isSystem ? colorPrimary400 : colorPrimary;
  return (
    <g
      transform={`translate(${x},${y})`}
      onMouseDown={onMouseDown}
      style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
    >
      {/* Drop shadow */}
      <rect x={3} y={3} width={width} height={height} rx={borderRadiusMd} fill="rgba(0,0,0,0.09)" />
      {/* Card */}
      <rect width={width} height={height} rx={`${borderRadiusMd}`} fill="white" stroke={cardStroke} strokeWidth="1.5" />
      {/* Header fill */}
      <rect width={width} height={HEADER_HEIGHT} rx={`${borderRadiusMd}`} fill={headerFill} />
      {/* Square off bottom corners of header strip */}
      <rect y={HEADER_HEIGHT - borderRadiusMd} width={width} height={borderRadiusMd} fill={headerFill} />
      {/* Class name */}
      <text
        x={width / 2} y={HEADER_HEIGHT / 2 + 5}
        textAnchor="middle"
        fontSize={`${fontSizeSm}`} fontWeight={`${fontWeightSemibold}`}
        fill={nameFillNode}
        fontStyle={isSystem ? 'italic' : undefined}
        style={{ pointerEvents: 'none' }}
      >
        {name}
      </text>
      {/* Header/body divider */}
      <line x1={0} y1={HEADER_HEIGHT} x2={width} y2={HEADER_HEIGHT} stroke={colorPrimary300} strokeWidth="1" />
      {/* Fields */}
      {visibleRows.map(({ field, depth, path }, ri) => {
        const fy = HEADER_HEIGHT + PADDING_V + ri * FIELD_HEIGHT;
        const isRel = !!field.relationType;
        const isMember = depth > 0;
        const isExpanded = !!field.isShape && expandedSet.has(path);
        const indentX = 10 + depth * 14;
        const nameFill = isRel ? colorPrimary : (isMember ? colorPrimary400 : colorContrast);
        const typeFill = isRel ? colorPrimary : colorPrimary400;
        return (
          <g key={path}>
            {ri > 0 && (
              <line x1={0} y1={fy} x2={width} y2={fy} stroke={colorPrimary100} strokeWidth="0.5" />
            )}
            {/* Row background: tinted for shape rows and indented members */}
            {(field.isShape || isMember) && (
              <rect
                x={0} y={fy} width={width} height={FIELD_HEIGHT}
                fill={colorPrimary100}
                opacity={`${isMember ? 0.35 : 0.55}`}
              />
            )}
            {/* Clickable hit-area + chevron for shape fields */}
            {field.isShape && (
              <g
                onClick={(e: any) => { e.stopPropagation(); onToggleShape(name, path); }}
                onMouseDown={(e: any) => e.stopPropagation()}
                style={{ cursor: 'pointer' }}
              >
                <rect x={0} y={fy} width={width} height={FIELD_HEIGHT} fill="transparent" />
                {/* Chevron triangle */}
                <path
                  d={isExpanded
                    ? `M ${indentX} ${fy + 6} L ${indentX + 7} ${fy + 6} L ${indentX + 3.5} ${fy + 11} Z`
                    : `M ${indentX} ${fy + 5} L ${indentX} ${fy + 12} L ${indentX + 6} ${fy + 8.5} Z`
                  }
                  fill={colorPrimary}
                />
              </g>
            )}
            <text
              x={field.isShape ? indentX + 10 : indentX} y={fy + FIELD_HEIGHT * 0.66}
              fontSize="11" fill={nameFill}
              fontWeight={`${isRel ? fontWeightMedium : fontWeightNormal}`}
              fontStyle={isMember && !field.isShape ? 'italic' : undefined}
              style={{ pointerEvents: 'none' }}
            >
              {field.name}
            </text>
            <text
              x={width - 10} y={fy + FIELD_HEIGHT * 0.66}
              textAnchor="end" fontSize="10" fontFamily="monospace"
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
};

type ArrowItemProps = {
  fieldName: string;
  isPointer: boolean;
  offsetIndex: number;
  offsetTotal: number;
  fromX: number; fromY: number; fromW: number; fromH: number;
  /** Absolute Y of the source field row centre on the canvas. */
  fromFieldY: number;
  toX: number; toY: number; toW: number; toH: number;
  // Canonical pair centers (alphabetically stable A→B direction) for consistent perpendicular
  canonicalFromCX: number; canonicalFromCY: number;
  canonicalToCX: number; canonicalToCY: number;
  colorPrimary: string;
  colorTint: string;
};

const ArrowItem = ({
  fieldName, isPointer, offsetIndex, offsetTotal,
  fromX, fromW, fromFieldY, toX, toY, toW, toH,
  canonicalFromCX, canonicalFromCY, canonicalToCX, canonicalToCY,
  colorPrimary, colorTint,
}: ArrowItemProps) => {
  const color = isPointer ? colorPrimary : colorTint;
  const fcx = fromX + fromW / 2;
  const tcx = toX + toW / 2, tcy = toY + toH / 2;
  const SPREAD = 28;
  const offset = offsetTotal > 1 ? (offsetIndex - (offsetTotal - 1) / 2) * SPREAD : 0;
  // Always use the canonical (alphabetically stable) direction for the perpendicular so that
  // A→B and B→A get offsets on opposite sides rather than the same side.
  const cdx = canonicalToCX - canonicalFromCX, cdy = canonicalToCY - canonicalFromCY;
  const clen = Math.sqrt(cdx * cdx + cdy * cdy) || 1;
  const px = -cdy / clen, py = cdx / clen;
  // Start from the field row on the left or right edge of the source node
  const goRight = tcx >= fcx;
  const start = { x: goRight ? fromX + fromW : fromX, y: fromFieldY };
  // End at the box edge of the target node
  const end = boxEdgePoint(tcx, tcy, toW, toH, start.x, start.y);
  const cpx = (start.x + end.x) / 2 + px * offset;
  const cpy = (start.y + end.y) / 2 + py * offset;
  const lx = 0.25 * start.x + 0.5 * cpx + 0.25 * end.x;
  const ly = 0.25 * start.y + 0.5 * cpy + 0.25 * end.y;
  const d = `M ${start.x} ${start.y} Q ${cpx} ${cpy} ${end.x} ${end.y}`;
  return (
    <g>
      <path
        d={d} fill="none"
        stroke={color} strokeWidth="1.5"
        strokeDasharray={isPointer ? undefined : '6,3'}
        markerEnd={`url(#arr-${isPointer ? 'pointer' : 'relation'})`}
        opacity="0.75"
      />
      <rect
        x={lx - (fieldName.length * 3.2)} y={ly - 9}
        width={fieldName.length * 6.4} height={13}
        rx="2" fill="white" opacity="0.85"
      />
      <text
        x={lx} y={ly}
        textAnchor="middle" fontSize="10" fill={color}
        style={{ pointerEvents: 'none' }}
      >
        {fieldName}
      </text>
    </g>
  );
};

// ─── Main component ───────────────────────────────────────────────────────────

export const DiagramPage = () => {
  const theme = useTheme();
  const schema = useProtoSchema();
  const doc = useDocument();

  const [showSystem, setShowSystem] = useState(false);
  const [expandedShapes, setExpandedShapes] = useState<Record<string, Set<string>>>({});

  // Filter classes based on showSystem toggle
  const classNames = useMemo(
    () => _.keys(schema).filter(n => showSystem || !n.startsWith('_')).sort(),
    [schema, showSystem],
  );

  // nodeBaseData: schema-only fields — stable between drags and expand/collapse
  const nodeBaseData = useMemo(
    () => classNames.map(name => ({
      name,
      fields: Object.entries(schema[name]?.fields ?? {}).map(([k, v]) => getFieldInfo(k, v)),
      width: CLASS_WIDTH,
    })),
    [classNames, schema],
  );

  // Pre-compute heights (depends on which shape fields are expanded)
  const heights = useMemo(
    () => _.fromPairs(nodeBaseData.map(n => [
      n.name,
      nodeHeight(countVisibleRows(n.fields, expandedShapes[n.name] ?? EMPTY_SET)),
    ])),
    [nodeBaseData, expandedShapes],
  );

  // nodeData: base data + dynamic height
  const nodeData = useMemo(
    () => nodeBaseData.map(n => ({ ...n, height: heights[n.name] ?? nodeHeight(0) })),
    [nodeBaseData, heights],
  );

  // nodeNames: for relationship membership check (no positions needed)
  const nodeNames = useMemo(() => new Set(classNames), [classNames]);

  // Initial grid layout
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

  // Relationships — stable unless schema changes
  const relationships = useMemo(() => {
    const rels: Array<{ from: string; to: string; fieldName: string; type: 'pointer' | 'relation'; offsetIndex: number; offsetTotal: number; canonicalFromName: string }> = [];
    const pairCount: Record<string, number> = {};
    const pairNext: Record<string, number> = {};
    for (const name of classNames) {
      for (const [fname, ftype] of Object.entries(schema[name]?.fields ?? {})) {
        for (const { target } of collectRelations(fname, ftype)) {
          if (target && nodeNames.has(target) && name !== target) {
            const key = [name, target].sort().join('\0');
            pairCount[key] = (pairCount[key] ?? 0) + 1;
          }
        }
      }
    }
    for (const name of classNames) {
      for (const [fname, ftype] of Object.entries(schema[name]?.fields ?? {})) {
        for (const { path, target, relType } of collectRelations(fname, ftype)) {
          if (target && nodeNames.has(target) && name !== target) {
            const key = [name, target].sort().join('\0');
            const total = pairCount[key] ?? 1;
            const idx = pairNext[key] ?? 0;
            pairNext[key] = idx + 1;
            rels.push({ from: name, to: target, fieldName: path, type: relType, offsetIndex: idx, offsetTotal: total, canonicalFromName: [name, target].sort()[0] });
          }
        }
      }
    }
    return rels;
  }, [classNames, nodeNames, schema]);

  // ─── Drag ──────────────────────────────────────────────────────────────────

  const [dragging, setDragging] = useState<{ name: string; startX: number; startY: number; mx: number; my: number } | null>(null);

  const { handleMouseMove, handleMouseUp, handleToggleShape } = _useCallbacks({
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
    handleToggleShape: (className: string, fieldPath: string) => {
      setExpandedShapes(prev => {
        const current = prev[className] ?? EMPTY_SET;
        const next = new Set(current);
        if (next.has(fieldPath)) next.delete(fieldPath); else next.add(fieldPath);
        return { ...prev, [className]: next };
      });
    },
  });

  useEffect(() => {
    doc.addEventListener('mousemove', handleMouseMove);
    doc.addEventListener('mouseup', handleMouseUp);
    return () => {
      doc.removeEventListener('mousemove', handleMouseMove);
      doc.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  // ─── Canvas size ───────────────────────────────────────────────────────────

  const canvasW = (_.max(nodeData.map(n => (positions[n.name]?.x ?? 0) + n.width)) ?? 400) + CANVAS_PADDING;
  const canvasH = (_.max(nodeData.map(n => (positions[n.name]?.y ?? 0) + n.height)) ?? 300) + CANVAS_PADDING;

  // ─── Theme values flattened for sub-components ─────────────────────────────

  const colorPrimary = theme.colors.primary;
  const colorPrimary100 = theme.colors['primary-100'];
  const colorPrimary200 = theme.colors['primary-200'];
  const colorPrimary300 = theme.colors['primary-300'];
  const colorPrimary400 = theme.colors['primary-400'];
  const colorContrast = theme.colorContrast('#ffffff');
  const colorTint = theme.colors.tint;
  const fontSizeSm = theme.fontSize.sm;
  const fontWeightSemibold = theme.fontWeight.semibold;
  const fontWeightMedium = theme.fontWeight.medium;
  const fontWeightNormal = theme.fontWeight.normal;
  const borderRadiusMd = theme.borderRadius.md;

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

  // nodeDataMap: fast lookup for arrow rendering
  const nodeDataMap = _.keyBy(nodeData, 'name');

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%' }}>

      {/* Legend */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: theme.spacing.lg,
        padding: `${theme.spacing.sm}px ${theme.spacing.lg}px`,
        borderBottom: `1px solid ${colorPrimary200}`,
        fontSize: theme.fontSize.xs,
        color: colorContrast,
        background: 'white',
        flexShrink: 0,
      }}>
        <strong style={{ color: colorPrimary }}>Legend:</strong>
        <span style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.xs }}>
          <svg width={36} height={12} style={{ display: 'block' }}>
            <defs>
              <marker id="leg-solid" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                <polygon points="0 0, 6 3, 0 6" fill={colorPrimary} />
              </marker>
            </defs>
            <line x1={0} y1={6} x2={28} y2={6} stroke={colorPrimary} strokeWidth="1.5" markerEnd="url(#leg-solid)" />
          </svg>
          Pointer
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.xs }}>
          <svg width={36} height={12} style={{ display: 'block' }}>
            <defs>
              <marker id="leg-dashed" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                <polygon points="0 0, 6 3, 0 6" fill={colorTint} />
              </marker>
            </defs>
            <line x1={0} y1={6} x2={28} y2={6} stroke={colorTint} strokeWidth="1.5" strokeDasharray="5,3" markerEnd="url(#leg-dashed)" />
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
              background: showSystem ? colorPrimary : '#c0c0c0',
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
            border: `1px solid ${colorPrimary300}`,
            borderRadius: borderRadiusMd,
            background: 'white',
            color: colorPrimary,
            cursor: 'pointer',
            '&:hover': { background: colorPrimary100 },
          } as any}
        >
          Reset layout
        </button>
      </div>

      {/* SVG canvas */}
      <div style={{
        position: 'relative',
        flex: 1,
        background: colorPrimary100,
      }}>
        <div style={{
          position: 'absolute',
          inset: 0,
          overflow: 'auto',
        }}>
          <svg
            width={canvasW}
            height={canvasH}
            style={{ display: 'block', userSelect: 'none', cursor: dragging ? 'grabbing' : 'default' }}
          >
            <defs>
              <marker id="arr-pointer" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
                <polygon points="0 0, 8 3, 0 6" fill={colorPrimary} />
              </marker>
              <marker id="arr-relation" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
                <polygon points="0 0, 8 3, 0 6" fill={colorTint} />
              </marker>
            </defs>

            {/* ── Arrows (rendered behind nodes) ── */}
            {relationships.map((rel, i) => {
              const fn = nodeDataMap[rel.from], tn = nodeDataMap[rel.to];
              if (!fn || !tn) return null;
              const fp = positions[rel.from], tp = positions[rel.to];
              if (!fp || !tp) return null;
              // Compute the absolute Y of the source field row
              const expandedSet = expandedShapes[rel.from] ?? EMPTY_SET;
              const fromFieldY = fp.y + getFieldRowY(fn.fields, rel.fieldName, expandedSet);
              // Canonical pair direction (alphabetically stable) for consistent perpendicular offset
              const isCanonical = rel.canonicalFromName === rel.from;
              const cfp = isCanonical ? fp : tp, cfn = isCanonical ? fn : tn;
              const ctp = isCanonical ? tp : fp, ctn = isCanonical ? tn : fn;
              return (
                <ArrowItem
                  key={i}
                  fieldName={rel.fieldName}
                  isPointer={rel.type === 'pointer'}
                  offsetIndex={rel.offsetIndex}
                  offsetTotal={rel.offsetTotal}
                  fromX={fp.x} fromY={fp.y} fromW={fn.width} fromH={fn.height}
                  fromFieldY={fromFieldY}
                  toX={tp.x} toY={tp.y} toW={tn.width} toH={tn.height}
                  canonicalFromCX={cfp.x + cfn.width / 2} canonicalFromCY={cfp.y + cfn.height / 2}
                  canonicalToCX={ctp.x + ctn.width / 2} canonicalToCY={ctp.y + ctn.height / 2}
                  colorPrimary={colorPrimary}
                  colorTint={colorTint}
                />
              );
            })}

            {/* ── Class nodes ── */}
            {nodeData.map(node => {
              const pos = positions[node.name] ?? { x: 0, y: 0 };
              return (
                <ClassNode
                  key={node.name}
                  name={node.name}
                  fields={node.fields}
                  width={node.width}
                  height={node.height}
                  x={pos.x}
                  y={pos.y}
                  isDragging={dragging?.name === node.name}
                  onMouseDown={(e: any) => {
                    e.preventDefault();
                    setDragging({ name: node.name, startX: pos.x, startY: pos.y, mx: e.clientX, my: e.clientY });
                  }}
                  onToggleShape={handleToggleShape}
                  expandedShapesStr={[...(expandedShapes[node.name] ?? EMPTY_SET)].sort().join('|')}
                  colorPrimary={colorPrimary}
                  colorPrimary100={colorPrimary100}
                  colorPrimary200={colorPrimary200}
                  colorPrimary300={colorPrimary300}
                  colorPrimary400={colorPrimary400}
                  colorContrast={colorContrast}
                  fontSizeSm={fontSizeSm}
                  fontWeightSemibold={fontWeightSemibold}
                  fontWeightMedium={fontWeightMedium}
                  fontWeightNormal={fontWeightNormal}
                  borderRadiusMd={borderRadiusMd}
                />
              );
            })}
          </svg>
        </div>
      </div>
    </div>
  );
};
