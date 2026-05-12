type EmptyBoardStateProps = {
  onCreateBoard?: () => void;
};

export function EmptyBoardState({ onCreateBoard }: EmptyBoardStateProps) {
  return (
    <section className="empty-board-state">
      <div>
        <p className="eyebrow">No boards yet</p>
        <h2>Seed or create a board to start planning work.</h2>
        <p>
          Create your first board to start organizing work across columns, tasks, and subtasks.
        </p>
        <button type="button" className="primary-button" onClick={onCreateBoard}>
          + Create New Board
        </button>
      </div>
    </section>
  );
}
