type TaskCardProps = {
  task: {
    id: string;
    title: string;
    subtaskSummary: string;
  };
  onClick?: () => void;
};

export function TaskCard({ task, onClick }: TaskCardProps) {
  return (
    <button type="button" className="task-card" onClick={onClick} aria-labelledby={`task-${task.id}`}>
      <h3 id={`task-${task.id}`}>{task.title}</h3>
      <p>{task.subtaskSummary}</p>
    </button>
  );
}
