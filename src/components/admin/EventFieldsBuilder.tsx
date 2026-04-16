"use client";

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Plus, Trash2 } from "lucide-react";
import type { FieldType } from "@/types/database";

export interface EventFieldDraft {
  id:            string; // local key for dnd — not the DB id on new fields
  field_label:   string;
  field_type:    FieldType;
  field_options: { options: string[] } | null;
  required:      boolean;
  display_order: number;
}

interface Props {
  fields:                  EventFieldDraft[];
  onChange:                (fields: EventFieldDraft[]) => void;
  responseCountByFieldId?: Record<string, number>;
}

const FIELD_TYPE_LABELS: Record<FieldType, string> = {
  short_text:  "Short Text",
  long_text:   "Long Text",
  dropdown:    "Dropdown",
  checkbox:    "Checkbox",
  multi_select:"Multi-select",
  file_upload: "File Upload",
};

function newField(): EventFieldDraft {
  return {
    id:            crypto.randomUUID(),
    field_label:   "",
    field_type:    "short_text",
    field_options: null,
    required:      false,
    display_order: 0,
  };
}

// ── Sortable row ──────────────────────────────────────────────────────────────

interface RowProps {
  field:       EventFieldDraft;
  index:       number;
  onUpdate:    (updated: EventFieldDraft) => void;
  onDelete:    () => void;
  hasResponses: boolean;
}

function SortableFieldRow({ field, index: _index, onUpdate, onDelete, hasResponses }: RowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: field.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const needsOptions =
    field.field_type === "dropdown" || field.field_type === "multi_select";

  const optionsValue = field.field_options?.options.join(", ") ?? "";

  function handleTypeChange(newType: FieldType) {
    onUpdate({
      ...field,
      field_type:    newType,
      field_options: newType === "dropdown" || newType === "multi_select"
        ? (field.field_options ?? { options: [] })
        : null,
    });
  }

  function handleOptionsChange(raw: string) {
    onUpdate({
      ...field,
      field_options: { options: raw.split(",").map((s) => s.trim()).filter(Boolean) },
    });
  }

  function handleDeleteClick() {
    if (hasResponses) {
      const confirmed = window.confirm(
        `This field has existing responses. Deleting it will remove those responses permanently. Continue?`
      );
      if (!confirmed) return;
    }
    onDelete();
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-sn-gray-dark/60 rounded-lg border border-white/10 p-3 space-y-2"
    >
      <div className="flex items-center gap-2">
        {/* Drag handle */}
        <button
          type="button"
          {...attributes}
          {...listeners}
          className="text-white/30 hover:text-white/60 cursor-grab active:cursor-grabbing flex-shrink-0"
          aria-label="Drag to reorder"
        >
          <GripVertical size={16} />
        </button>

        {/* Label input */}
        <input
          type="text"
          value={field.field_label}
          onChange={(e) => onUpdate({ ...field, field_label: e.target.value })}
          placeholder="Field label"
          className="flex-1 min-w-0 rounded bg-sn-black border border-white/10 text-white text-sm px-2 py-1.5 focus:outline-none focus:border-sn-gold/50 placeholder:text-white/25"
        />

        {/* Type select */}
        <select
          value={field.field_type}
          onChange={(e) => handleTypeChange(e.target.value as FieldType)}
          className="rounded bg-sn-black border border-white/10 text-white text-xs px-2 py-1.5 focus:outline-none focus:border-sn-gold/50"
        >
          {(Object.entries(FIELD_TYPE_LABELS) as [FieldType, string][]).map(([val, label]) => (
            <option key={val} value={val}>{label}</option>
          ))}
        </select>

        {/* Required toggle */}
        <label className="flex items-center gap-1.5 cursor-pointer flex-shrink-0">
          <input
            type="checkbox"
            checked={field.required}
            onChange={(e) => onUpdate({ ...field, required: e.target.checked })}
            className="w-3.5 h-3.5 accent-sn-gold"
          />
          <span className="text-white/50 text-xs">Required</span>
        </label>

        {/* Delete */}
        <button
          type="button"
          onClick={handleDeleteClick}
          className="text-white/30 hover:text-red-400 transition-colors flex-shrink-0"
          aria-label="Delete field"
        >
          <Trash2 size={14} />
        </button>
      </div>

      {/* Options input for dropdown / multi-select */}
      {needsOptions && (
        <div className="pl-6">
          <input
            type="text"
            value={optionsValue}
            onChange={(e) => handleOptionsChange(e.target.value)}
            placeholder="Option 1, Option 2, Option 3 (comma-separated)"
            className="w-full rounded bg-sn-black border border-white/10 text-white/80 text-xs px-2 py-1.5 focus:outline-none focus:border-sn-gold/50 placeholder:text-white/25"
          />
        </div>
      )}
    </div>
  );
}

// ── Main builder ──────────────────────────────────────────────────────────────

export function EventFieldsBuilder({ fields, onChange, responseCountByFieldId = {} }: Props) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (over === null || active.id === over.id) return;

    const oldIndex = fields.findIndex((f) => f.id === active.id);
    const newIndex = fields.findIndex((f) => f.id === over.id);
    const reordered = arrayMove(fields, oldIndex, newIndex).map((f, i) => ({
      ...f,
      display_order: i,
    }));
    onChange(reordered);
  }

  function addField() {
    onChange([...fields, { ...newField(), display_order: fields.length }]);
  }

  function updateField(index: number, updated: EventFieldDraft) {
    const next = [...fields];
    next[index] = updated;
    onChange(next);
  }

  function deleteField(index: number) {
    onChange(fields.filter((_, i) => i !== index).map((f, i) => ({ ...f, display_order: i })));
  }

  return (
    <div className="space-y-3">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={fields.map((f) => f.id)} strategy={verticalListSortingStrategy}>
          {fields.map((field, i) => (
            <SortableFieldRow
              key={field.id}
              field={field}
              index={i}
              onUpdate={(updated) => updateField(i, updated)}
              onDelete={() => deleteField(i)}
              hasResponses={(responseCountByFieldId[field.id] ?? 0) > 0}
            />
          ))}
        </SortableContext>
      </DndContext>

      <button
        type="button"
        onClick={addField}
        className="flex items-center gap-1.5 text-sn-gold text-sm hover:text-sn-gold-light transition-colors"
      >
        <Plus size={14} />
        Add field
      </button>

      {fields.length === 0 && (
        <p className="text-white/30 text-xs">
          No custom fields. Click "Add field" to collect additional information during registration.
        </p>
      )}
    </div>
  );
}
