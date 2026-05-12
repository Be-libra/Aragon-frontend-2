type TopbarProps = {
  boardName: string;
  canCreateTask?: boolean;
  isBoardMenuOpen?: boolean;
  onAddTask?: () => void;
  onToggleSidebar?: () => void;
  onToggleBoardMenu?: () => void;
  onEditBoard?: () => void;
  onDeleteBoard?: () => void;
};

function HamburgerIcon() {
  return (
    <svg width="16" height="13" viewBox="0 0 16 13" fill="none" aria-hidden="true">
      <rect width="16" height="2" rx="1" fill="currentColor" />
      <rect y="5.5" width="16" height="2" rx="1" fill="currentColor" />
      <rect y="11" width="16" height="2" rx="1" fill="currentColor" />
    </svg>
  );
}

function MoreActionsIcon() {
  return (
    <>
      <span />
      <span />
      <span />
    </>
  );
}

export function Topbar({
  boardName,
  canCreateTask = true,
  isBoardMenuOpen = false,
  onAddTask,
  onToggleSidebar,
  onToggleBoardMenu,
  onEditBoard,
  onDeleteBoard
}: TopbarProps) {
  return (
    <header className="topbar">
      <button
        type="button"
        className="sidebar-toggle"
        onClick={onToggleSidebar}
        aria-label="Open sidebar"
      >
        <HamburgerIcon />
      </button>

      <div className="topbar-copy">
        <p className="eyebrow">Current Board</p>
        <h1>{boardName}</h1>
      </div>

      <div className="topbar-actions">
        <button
          type="button"
          className="primary-button"
          onClick={onAddTask}
          disabled={!canCreateTask}
        >
          + Add New Task
        </button>
        <div className="board-menu-wrap">
          <button
            type="button"
            className="icon-button"
            aria-label="Board actions"
            onClick={onToggleBoardMenu}
          >
            <MoreActionsIcon />
          </button>

          {isBoardMenuOpen ? (
            <div className="board-menu" role="menu" aria-label="Board actions">
              <button type="button" role="menuitem" onClick={onEditBoard}>
                Edit Board
              </button>
              <button
                type="button"
                role="menuitem"
                className="is-danger"
                onClick={onDeleteBoard}
              >
                Delete Board
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}
