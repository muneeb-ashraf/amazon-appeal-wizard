'use client';

// ============================================================================
// DRAG AND DROP LIST COMPONENT
// Simple drag-and-drop reorderable list
// ============================================================================

import { useState } from 'react';

interface DragDropListProps<T> {
  items: T[];
  onReorder: (reordered: T[]) => void;
  renderItem: (item: T, index: number) => React.ReactNode;
  keyExtractor?: (item: T) => string;
}

export default function DragDropList<T extends { value?: string; id?: string }>({
  items,
  onReorder,
  renderItem,
  keyExtractor = (item) => item.value || item.id || String(Math.random()),
}: DragDropListProps<T>) {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragOverIndex(index);
  };

  const handleDragEnd = () => {
    if (draggedIndex === null || dragOverIndex === null || draggedIndex === dragOverIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    const reordered = [...items];
    const [removed] = reordered.splice(draggedIndex, 1);
    reordered.splice(dragOverIndex, 0, removed);

    onReorder(reordered);
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  return (
    <div className="space-y-2">
      {items.map((item, index) => (
        <div
          key={keyExtractor(item)}
          draggable
          onDragStart={() => handleDragStart(index)}
          onDragOver={(e) => handleDragOver(e, index)}
          onDragEnd={handleDragEnd}
          onDragLeave={handleDragLeave}
          className={`transition-all ${
            draggedIndex === index
              ? 'opacity-50'
              : dragOverIndex === index
              ? 'border-t-2 border-blue-500'
              : ''
          }`}
        >
          {renderItem(item, index)}
        </div>
      ))}
    </div>
  );
}
