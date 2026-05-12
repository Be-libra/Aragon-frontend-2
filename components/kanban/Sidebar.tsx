"use client";

import { useState } from "react";
import { useTheme, type ThemeKey } from "@/contexts/ThemeContext";

type SidebarProps = {
  boards: Array<{
    id: string;
    name: string;
  }>;
  activeBoardId: string | null;
  isOpen?: boolean;
  onClose?: () => void;
  onSelectBoard?: (boardId: string) => void;
  onCreateBoard?: () => void;
};

function BrandMark() {
  return (
    <div className="brand-mark" aria-hidden="true">
      <span />
      <span />
      <span />
    </div>
  );
}

function BoardIcon() {
  return <span className="board-link-icon" aria-hidden="true" />;
}

function ThemePicker() {
  const { theme, setTheme, themes } = useTheme();
  const [isOpen, setIsOpen] = useState(false);

  const darkThemes = themes.filter((t) => t.group === "dark");
  const lightThemes = themes.filter((t) => t.group === "light");
  const current = themes.find((t) => t.key === theme);

  function handleSelect(key: ThemeKey) {
    setTheme(key);
    setIsOpen(false);
  }

  return (
    <div className="theme-picker">
      {isOpen && (
        <>
          <div className="theme-picker-backdrop" onClick={() => setIsOpen(false)} />
          <div className="theme-picker-panel" role="dialog" aria-label="Choose theme">
            <p className="theme-picker-group-label">Dark</p>
            <div className="theme-picker-swatches">
              {darkThemes.map((t) => (
                <button
                  key={t.key}
                  type="button"
                  className={`theme-swatch${t.key === theme ? " is-active" : ""}`}
                  style={
                    {
                      "--swatch-bg": t.bg,
                      "--swatch-accent": t.accent
                    } as React.CSSProperties
                  }
                  onClick={() => handleSelect(t.key)}
                  aria-label={t.label}
                  aria-pressed={t.key === theme}
                >
                  <span className="theme-swatch-circle" />
                  <span className="theme-swatch-label">{t.label}</span>
                </button>
              ))}
            </div>
            <p className="theme-picker-group-label">Light</p>
            <div className="theme-picker-swatches">
              {lightThemes.map((t) => (
                <button
                  key={t.key}
                  type="button"
                  className={`theme-swatch${t.key === theme ? " is-active" : ""}`}
                  style={
                    {
                      "--swatch-bg": t.bg,
                      "--swatch-accent": t.accent
                    } as React.CSSProperties
                  }
                  onClick={() => handleSelect(t.key)}
                  aria-label={t.label}
                  aria-pressed={t.key === theme}
                >
                  <span className="theme-swatch-circle" />
                  <span className="theme-swatch-label">{t.label}</span>
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      <button
        type="button"
        className="theme-picker-trigger"
        onClick={() => setIsOpen((o) => !o)}
        aria-expanded={isOpen}
        aria-haspopup="dialog"
      >
        <span className="theme-swatch-dot" style={{ background: current?.accent }} />
        <span>{current?.label ?? "Theme"}</span>
        <span className="theme-picker-chevron" aria-hidden="true">
          {isOpen ? "▴" : "▾"}
        </span>
      </button>
    </div>
  );
}

export function Sidebar({
  boards,
  activeBoardId,
  isOpen = true,
  onClose,
  onSelectBoard,
  onCreateBoard
}: SidebarProps) {
  function handleBoardSelect(boardId: string) {
    onSelectBoard?.(boardId);
    onClose?.();
  }

  return (
    <>
      <div
        className={`sidebar-backdrop${isOpen ? " is-visible" : ""}`}
        onClick={onClose}
        aria-hidden="true"
      />

      <aside className={`sidebar${isOpen ? " is-open" : ""}`}>
        <div className="brand">
          <BrandMark />
          <span className="brand-text">kanban</span>
          <button
            type="button"
            className="sidebar-close"
            onClick={onClose}
            aria-label="Close sidebar"
          >
            ✕
          </button>
        </div>

        <div className="sidebar-section">
          <p className="sidebar-label">All Boards ({boards.length})</p>
          <nav className="board-nav" aria-label="Boards">
            {boards.map((board) => (
              <button
                key={board.id}
                type="button"
                className={`board-link${board.id === activeBoardId ? " is-active" : ""}`}
                onClick={() => handleBoardSelect(board.id)}
              >
                <BoardIcon />
                <span>{board.name}</span>
              </button>
            ))}
            <button
              type="button"
              className="board-link board-link-create"
              onClick={onCreateBoard}
            >
              <BoardIcon />
              <span>+ Create New Board</span>
            </button>
          </nav>
        </div>

        <ThemePicker />
      </aside>
    </>
  );
}
