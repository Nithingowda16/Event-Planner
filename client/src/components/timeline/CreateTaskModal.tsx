import React, { useState } from 'react';
import type { TaskPhase, TaskPriority, CreateTaskInput, TimelineTaskEntity } from '@celebrateos/shared';
import { Modal } from '../ui/Modal.js';
import { Input } from '../ui/Input.js';
import { Select } from '../ui/Select.js';
import { Button } from '../ui/Button.js';
import { api, ApiError } from '../../services/api.js';

export interface CreateTaskModalProps {
  isOpen: boolean;
  eventId: string;
  onClose: () => void;
  onTaskCreated: (task: TimelineTaskEntity) => void;
}

export const CreateTaskModal: React.FC<CreateTaskModalProps> = ({
  isOpen,
  eventId,
  onClose,
  onTaskCreated,
}) => {
  const [phase, setPhase] = useState<TaskPhase>('pre_event');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [category, setCategory] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);

    if (!title.trim() || title.trim().length < 2) {
      setServerError('Task title must be at least 2 characters.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: CreateTaskInput = {
        phase,
        title: title.trim(),
        description: description.trim() || undefined,
        dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
        priority,
        category: category.trim() || undefined,
      };

      const result = await api.tasks.create(eventId, payload);
      onTaskCreated(result.task);
      onClose();
      // Reset
      setTitle('');
      setDescription('');
      setDueDate('');
      setCategory('');
    } catch (err: unknown) {
      const msg = err instanceof ApiError ? err.message : 'Failed to create task on server';
      setServerError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const phaseOptions = [
    { value: 'pre_event', label: 'Pre-Event Planning' },
    { value: 'day_of', label: 'Day-Of Execution' },
    { value: 'post_event', label: 'Post-Event Wrap-Up' },
  ];

  const priorityOptions = [
    { value: 'high', label: 'High Priority' },
    { value: 'medium', label: 'Medium Priority' },
    { value: 'low', label: 'Low Priority' },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add Timeline Task"
      description="Create an actionable milestone or checklist item for your celebration timeline."
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            variant="primary"
            type="submit"
            form="create-task-form"
            isLoading={isSubmitting}
            loadingText="Adding..."
            id="submit-create-task-btn"
          >
            Add Task
          </Button>
        </>
      }
    >
      <form id="create-task-form" onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        {serverError && (
          <div
            role="alert"
            style={{
              padding: 'var(--space-3)',
              backgroundColor: 'var(--accent-rose-soft)',
              border: '1px solid rgba(251, 113, 133, 0.4)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--accent-rose)',
              fontSize: 'var(--font-size-sm)',
            }}
          >
            {serverError}
          </div>
        )}

        <Input
          id="task-title-input"
          label="Task Title"
          placeholder="e.g. Confirm floral arrangements and centerpiece drop-off"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          disabled={isSubmitting}
        />

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-4)' }}>
          <Select
            id="task-phase-select"
            label="Timeline Phase"
            value={phase}
            onChange={(e) => setPhase(e.target.value as TaskPhase)}
            options={phaseOptions}
            required
            disabled={isSubmitting}
          />

          <Select
            id="task-priority-select"
            label="Priority Level"
            value={priority}
            onChange={(e) => setPriority(e.target.value as TaskPriority)}
            options={priorityOptions}
            required
            disabled={isSubmitting}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-4)' }}>
          <Input
            id="task-duedate-input"
            label="Target Due Date (Optional)"
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            disabled={isSubmitting}
          />

          <Input
            id="task-category-input"
            label="Category (Optional)"
            placeholder="e.g. Flowers & Decor"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            disabled={isSubmitting}
          />
        </div>

        <Input
          id="task-desc-input"
          label="Task Description or Instructions (Optional)"
          placeholder="Additional context or checklist items"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          disabled={isSubmitting}
        />
      </form>
    </Modal>
  );
};
