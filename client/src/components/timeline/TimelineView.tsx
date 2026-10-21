import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Plus, Tag, Trash2, Clock, AlertCircle } from 'lucide-react';
import type { TimelineTaskEntity, TaskPhase, EventEntity } from '@celebrateos/shared';
import { Button } from '../ui/Button.js';
import { Badge } from '../ui/Badge.js';
import { Spinner } from '../ui/Spinner.js';
import { CreateTaskModal } from './CreateTaskModal.js';
import { api, ApiError } from '../../services/api.js';
import { useToast } from '../ui/ToastContext.js';
import './TimelineView.css';

export interface TimelineViewProps {
  eventId?: string;
  event?: EventEntity;
}

const phaseConfig: Record<TaskPhase, { title: string; color: string }> = {
  pre_event: { title: 'Pre-Event Planning', color: 'var(--accent-purple)' },
  day_of: { title: 'Day-Of Execution', color: 'var(--accent-gold)' },
  post_event: { title: 'Post-Event Wrap-Up', color: 'var(--accent-emerald)' },
};

export const TimelineView: React.FC<TimelineViewProps> = ({ eventId, event }) => {
  const actualEventId = eventId || event?.id || '';
  const { showToast } = useToast();
  const [tasks, setTasks] = useState<TimelineTaskEntity[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [mutatingTaskId, setMutatingTaskId] = useState<string | null>(null);

  const fetchTasks = useCallback(async () => {
    if (!actualEventId) return;
    setIsLoading(true);
    setError(null);
    try {
      const result = await api.tasks.list(actualEventId);
      setTasks(result.tasks);
    } catch (err: unknown) {
      const msg = err instanceof ApiError ? err.message : 'Failed to load timeline tasks';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, [actualEventId]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const handleToggleComplete = async (task: TimelineTaskEntity) => {
    setMutatingTaskId(task.id);
    const newStatus = task.status === 'completed' ? 'pending' : 'completed';
    try {
      const result = await api.tasks.update(actualEventId, task.id, { status: newStatus });
      setTasks((prev) => prev.map((t) => (t.id === task.id ? result.task : t)));
      showToast(
        newStatus === 'completed' ? `Completed: "${task.title}"` : `Reopened: "${task.title}"`,
        'success'
      );
    } catch (err: unknown) {
      const msg = err instanceof ApiError ? err.message : 'Failed to update task status';
      showToast(msg, 'error');
    } finally {
      setMutatingTaskId(null);
    }
  };

  const handleDeleteTask = async (taskId: string, title: string) => {
    setMutatingTaskId(taskId);
    try {
      await api.tasks.delete(actualEventId, taskId);
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
      showToast(`Deleted task: "${title}"`, 'info');
    } catch (err: unknown) {
      const msg = err instanceof ApiError ? err.message : 'Failed to delete task';
      showToast(msg, 'error');
    } finally {
      setMutatingTaskId(null);
    }
  };

  const groupedTasks = useMemo(() => {
    const map: Record<TaskPhase, TimelineTaskEntity[]> = {
      pre_event: [],
      day_of: [],
      post_event: [],
    };
    tasks.forEach((task) => {
      if (map[task.phase]) {
        map[task.phase].push(task);
      } else {
        map.pre_event.push(task);
      }
    });
    return map;
  }, [tasks]);

  const completedCount = useMemo(() => tasks.filter((t) => t.status === 'completed').length, [tasks]);

  if (isLoading) {
    return (
      <div style={{ padding: 'var(--space-12)', textAlign: 'center' }} role="status">
        <Spinner size="lg" label="Loading timeline milestones..." color="#f59e0b" />
        <p style={{ marginTop: 'var(--space-3)', color: 'var(--text-secondary)' }}>
          Retrieving actionable event schedule...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div
        role="alert"
        style={{
          padding: 'var(--space-8)',
          textAlign: 'center',
          backgroundColor: 'var(--accent-rose-soft)',
          borderRadius: 'var(--radius-lg)',
          color: 'var(--accent-rose)',
        }}
      >
        <AlertCircle size={32} style={{ marginBottom: 'var(--space-2)' }} aria-hidden="true" />
        <h3 style={{ margin: 0, color: 'inherit' }}>Failed to Load Tasks</h3>
        <p style={{ margin: 'var(--space-2) 0', color: 'inherit', opacity: 0.9 }}>{error}</p>
        <Button variant="secondary" size="sm" onClick={fetchTasks}>
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="celebrate-timeline-view">
      {/* Timeline Controls & Progress Bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 'var(--space-4)',
          padding: 'var(--space-4)',
          backgroundColor: 'var(--bg-surface)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-subtle)',
        }}
      >
        <div>
          <h3 style={{ margin: 0, fontSize: 'var(--font-size-lg)' }}>Actionable Timeline</h3>
          <p style={{ margin: 'var(--space-1) 0 0 0', fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)' }}>
            {completedCount} of {tasks.length} tasks completed ({tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0}%)
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          leftIcon={<Plus size={16} />}
          onClick={() => setIsAddModalOpen(true)}
          id="add-timeline-task-btn"
        >
          Add Milestone Task
        </Button>
      </div>

      {/* Task List Grouped By Phase */}
      {(['pre_event', 'day_of', 'post_event'] as TaskPhase[]).map((phase) => {
        const phaseTasks = groupedTasks[phase];
        const config = phaseConfig[phase];

        return (
          <section key={phase} className="celebrate-phase-section" aria-labelledby={`phase-heading-${phase}`}>
            <div className="celebrate-phase-header">
              <h4 id={`phase-heading-${phase}`} className="celebrate-phase-title">
                <span style={{ color: config.color }}>●</span>
                <span>{config.title}</span>
              </h4>
              <Badge variant="neutral" size="sm">
                {phaseTasks.filter((t) => t.status === 'completed').length} / {phaseTasks.length} Completed
              </Badge>
            </div>

            {phaseTasks.length === 0 ? (
              <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-muted)', fontStyle: 'italic', margin: 'var(--space-2) 0' }}>
                No tasks assigned to this phase yet.
              </p>
            ) : (
              <div className="celebrate-task-list">
                {phaseTasks.map((task) => (
                  <div
                    key={task.id}
                    className={`celebrate-task-item ${task.status === 'completed' ? 'celebrate-task-item--completed' : ''}`}
                  >
                    <input
                      type="checkbox"
                      id={`task-check-${task.id}`}
                      checked={task.status === 'completed'}
                      onChange={() => handleToggleComplete(task)}
                      disabled={mutatingTaskId === task.id}
                      className="celebrate-task-checkbox"
                      aria-label={`Mark "${task.title}" as ${task.status === 'completed' ? 'incomplete' : 'complete'}`}
                    />

                    <div className="celebrate-task-content">
                      <label htmlFor={`task-check-${task.id}`} className="celebrate-task-title" style={{ cursor: 'pointer' }}>
                        {task.title}
                      </label>

                      {task.description && (
                        <p className="celebrate-task-desc">{task.description}</p>
                      )}

                      <div className="celebrate-task-meta">
                        <Badge
                          variant={
                            task.priority === 'high'
                              ? 'rose'
                              : task.priority === 'medium'
                              ? 'gold'
                              : 'blue'
                          }
                          size="sm"
                        >
                          {task.priority.toUpperCase()} Priority
                        </Badge>

                        {task.dueDate && (
                          <span className="celebrate-task-meta-item">
                            <Clock size={12} aria-hidden="true" />
                            <span>
                              Due: {new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </span>
                          </span>
                        )}

                        {task.category && (
                          <span className="celebrate-task-meta-item">
                            <Tag size={12} aria-hidden="true" />
                            <span>{task.category}</span>
                          </span>
                        )}
                      </div>
                    </div>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteTask(task.id, task.title)}
                      disabled={mutatingTaskId === task.id}
                      aria-label={`Delete task ${task.title}`}
                      style={{ color: 'var(--text-muted)' }}
                    >
                      <Trash2 size={16} aria-hidden="true" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </section>
        );
      })}

      {/* Add Task Modal */}
      <CreateTaskModal
        isOpen={isAddModalOpen}
        eventId={actualEventId}
        onClose={() => setIsAddModalOpen(false)}
        onTaskCreated={(newTask) => {
          setTasks((prev) => [...prev, newTask]);
          showToast(`Task "${newTask.title}" persisted to timeline.`, 'success');
        }}
      />
    </div>
  );
};
