import { TaskCard } from "@/components/kanban/TaskCard";

type BoardColumnProps = {
  column: {
    id: string;
    name: string;
    color: string;
    taskCount: number;
    tasks: Array<{
      id: string;
      title: string;
      subtaskSummary: string;
    }>;
  };
};

export function BoardColumn({ column }: BoardColumnProps) {
  return (
    <section className="board-column" aria-labelledby={`column-${column.id}`}>
      <header className="column-header">
        <span className="column-dot" style={{ backgroundColor: column.color }} />
        <span id={`column-${column.id}`}>
          {column.name} ({column.taskCount})
        </span>
      </header>

      {column.tasks.length > 0 ? (
        <div className="column-tasks">
          {column.tasks.map((task) => (
            <TaskCard key={task.id} task={task} />
          ))}
        </div>
      ) : (
        <div className="column-empty">
          <p>No tasks here yet.</p>
        </div>
      )}
    </section>
  );
}
