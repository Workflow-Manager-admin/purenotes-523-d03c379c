import React, { useState, useEffect, useRef, useCallback } from "react";
import "./App.css";

/**
 * Single Page Notes App (SPA)
 * Features: Add, edit, delete, view, persist notes (localStorage), responsive layout, modern light theme.
 */

const COLORS = {
  accent: "#ffb300",
  primary: "#1976d2",
  secondary: "#424242",
};

// Theme-related logic (context for future extensibility)
const THEME_KEY = "notes_theme";

// PUBLIC_INTERFACE
function useTheme() {
  /** Hook to manage light/dark theme and persist choice in localStorage.
   * Returns: [theme, toggleTheme]
   * - theme: "light" | "dark"
   * - toggleTheme: function to switch between light/dark
   */
  const getInitialTheme = () => {
    const persisted = localStorage.getItem(THEME_KEY);
    if (persisted) return persisted;
    // Respect prefers-color-scheme
    if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
      return "dark";
    }
    return "light";
  };
  const [theme, setTheme] = useState(getInitialTheme);

  useEffect(() => {
    document.body.classList.toggle("dark-theme", theme === "dark");
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme(prev => {
      const next = prev === "light" ? "dark" : "light";
      localStorage.setItem(THEME_KEY, next);
      return next;
    });
  }, []);

  // Persist theme on change
  useEffect(() => {
    localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  return [theme, toggleTheme];
}

function generateID() {
  // Generates a unique string based on time and randomness.
  return (
    Date.now().toString(36) +
    Math.random().toString(36).substring(2, 10)
  );
}

// PUBLIC_INTERFACE
function App() {
  // Notes state: array of { id, title, body, created, updated }
  const [notes, setNotes] = useState([]);
  // Selected note id
  const [selected, setSelected] = useState(null);
  // Editor controlled state (title/body fields)
  const [editNote, setEditNote] = useState({ title: "", body: "" });
  // For creating new note: true if we are in new note mode
  const [isNew, setIsNew] = useState(false);

  // Load notes from localStorage at mount
  useEffect(() => {
    const stored = localStorage.getItem("notes");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setNotes(Array.isArray(parsed) ? parsed : []);
        if (parsed.length > 0) {
          setSelected(parsed[0].id);
          setEditNote({ title: parsed[0].title, body: parsed[0].body });
        }
      } catch {
        setNotes([]);
      }
    }
  }, []);

  // Save notes to localStorage whenever notes changes
  useEffect(() => {
    localStorage.setItem("notes", JSON.stringify(notes));
  }, [notes]);

  // When selected note changes, update the editor unless in new note mode
  useEffect(() => {
    if (selected && !isNew) {
      const note = notes.find((n) => n.id === selected);
      if (note) {
        setEditNote({ title: note.title, body: note.body });
      }
    }
  }, [selected, notes, isNew]);

  // Handler: Select a note from the list
  // PUBLIC_INTERFACE
  function handleSelect(id) {
    setSelected(id);
    setIsNew(false);
  }

  // Handler: Start creating a new note
  // PUBLIC_INTERFACE
  function handleNewNote() {
    setIsNew(true);
    setEditNote({ title: "", body: "" });
    setSelected(null);
  }

  // Handler: Delete currently selected note
  // PUBLIC_INTERFACE
  function handleDeleteNote(id) {
    if (!window.confirm("Delete this note?")) return;
    setNotes((prev) => prev.filter((n) => n.id !== id));
    // If this was the selected note, change selection
    if (id === selected) {
      setSelected(null);
      setEditNote({ title: "", body: "" });
      setIsNew(false);
      // Select the next note (if any)
      if (notes.length > 1) {
        const idx = notes.findIndex((n) => n.id === id);
        const nextIdx = idx === 0 ? 1 : idx - 1;
        const next = notes.filter((n) => n.id !== id)[nextIdx];
        if (next) {
          setSelected(next.id);
          setEditNote({ title: next.title, body: next.body });
        }
      }
    }
  }

  // Handler: Save note (add or update)
  // PUBLIC_INTERFACE
  function handleSaveNote(e) {
    e.preventDefault();
    const trimmedTitle = editNote.title.trim();
    const trimmedBody = editNote.body.trim();
    if (!trimmedTitle) {
      alert("Title cannot be empty.");
      return;
    }
    if (isNew) {
      // Add new note
      const note = {
        id: generateID(),
        title: trimmedTitle,
        body: trimmedBody,
        created: Date.now(),
        updated: Date.now(),
      };
      setNotes((prev) => [note, ...prev]);
      setSelected(note.id);
      setIsNew(false);
    } else if (selected) {
      // Update existing note
      setNotes((prev) =>
        prev.map((n) =>
          n.id === selected
            ? { ...n, title: trimmedTitle, body: trimmedBody, updated: Date.now() }
            : n
        )
      );
    }
  }

  // Handler: Cancel new note
  // PUBLIC_INTERFACE
  function handleCancelNew() {
    setIsNew(false);
    if (notes.length > 0) {
      setSelected(notes[0].id);
      setEditNote({ title: notes[0].title, body: notes[0].body });
    }
  }

  // Handler: on editor field change
  function handleChangeEditor(e) {
    const { name, value } = e.target;
    setEditNote((prev) => ({ ...prev, [name]: value }));
  }

  // Date formatting helper
  function fmt(ts) {
    const d = new Date(ts);
    return d.toLocaleDateString() + " " + d.toLocaleTimeString();
  }

  // --- UI COMPONENT RENDER ---

  // --- THEME HOOK ---
  const [theme, toggleTheme] = useTheme();

  return (
    <div className={`notes-app-wrapper${theme === "dark" ? " dark-theme" : ""}`}>
      <header className="notes-header">
        <span className="notes-app-title" style={{ color: COLORS.primary }}>
          📝 PureNotes
        </span>
        <div style={{ display: "flex", alignItems: "center", gap: 0 }}>
          <button
            className="theme-toggle-btn"
            aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            onClick={toggleTheme}
          >
            {/* Sun/Moon Icons: Pure SVG or Emoji, fallback to text */}
            {theme === "dark"
              ? <span aria-hidden="true" role="img">🌞</span>
              : <span aria-hidden="true" role="img">🌙</span>}
          </button>
          <button className="notes-add-btn" style={{ background: COLORS.accent, color: "#fff" }}
            onClick={handleNewNote}
            data-testid="add-note-btn"
          >
            + New Note
          </button>
        </div>
      </header>
      <main className="notes-main">
        <aside className="notes-sidebar">
          <h2 className="notes-list-title" style={{ color: COLORS.secondary }}>Your Notes</h2>
          <ul className="notes-list">
            {notes.length === 0 && (
              <li className="notes-list-empty">No notes yet.</li>
            )}
            {notes.map((n) => (
              <li
                key={n.id}
                className={`notes-list-item${n.id === selected && !isNew ? " selected" : ""}`}
                onClick={() => handleSelect(n.id)}
                tabIndex={0}
                onKeyDown={e => {
                  if (e.key === "Enter") handleSelect(n.id);
                }}
                aria-label={`Select note titled ${n.title}`}
                style={n.id === selected && !isNew ? {background: "#f5f7fa"} : {}}
              >
                <div className="notes-list-item-title">{n.title || <em>(No title)</em>}</div>
                <div className="notes-list-item-date">{fmt(n.updated)}</div>
                <button
                  className="notes-delete-btn"
                  title="Delete note"
                  style={{ background: "none", color: COLORS.secondary }}
                  onClick={e => {
                    e.stopPropagation();
                    handleDeleteNote(n.id);
                  }}
                  aria-label="Delete note"
                >
                  &times;
                </button>
              </li>
            ))}
          </ul>
        </aside>
        <section className="notes-editor-section">
          {isNew ? (
            <Editor
              title={editNote.title}
              body={editNote.body}
              onChange={handleChangeEditor}
              onSave={handleSaveNote}
              onCancel={handleCancelNew}
              isNew={true}
              accentColor={COLORS.accent}
            />
          ) : selected ? (
            <Editor
              title={editNote.title}
              body={editNote.body}
              onChange={handleChangeEditor}
              onSave={handleSaveNote}
              isNew={false}
              accentColor={COLORS.accent}
              created={notes.find(n => n.id === selected)?.created}
              updated={notes.find(n => n.id === selected)?.updated}
            />
          ) : (
            <div className="notes-empty">
              <span style={{ color: COLORS.secondary, opacity: 0.7 }}>
                Select a note or create a new one to get started!
              </span>
            </div>
          )}
        </section>
      </main>
      <footer className="notes-footer">
        <span>
          <a
            href="https://github.com/"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: COLORS.primary, textDecoration: "none" }}
          >
            PureNotes
          </a>
          {" "}— React Demo SPA. Notes are saved in your browser.
        </span>
      </footer>
    </div>
  );
}

// PUBLIC_INTERFACE
function Editor({ title, body, onChange, onSave, onCancel, isNew, accentColor, created, updated }) {
  const bodyRef = useRef();

  // Accessibility: focus textarea when new note is started
  useEffect(() => {
    if (isNew && bodyRef.current) {
      bodyRef.current.focus();
    }
  }, [isNew]);

  return (
    <form className="notes-editor" onSubmit={onSave} autoComplete="off">
      {isNew ? (
        <h2 style={{ color: accentColor, margin: 0 }}>New Note</h2>
      ) : (
        <h2 style={{ color: accentColor, margin: 0 }}>Edit Note</h2>
      )}
      <input
        type="text"
        name="title"
        placeholder="Title…"
        value={title}
        onChange={onChange}
        className="notes-editor-title"
        maxLength={128}
        required
        aria-label="Note title"
        style={{ borderColor: accentColor }}
      />
      <textarea
        name="body"
        placeholder="Write your note here…"
        value={body}
        onChange={onChange}
        className="notes-editor-body"
        rows={13}
        minLength={0}
        ref={bodyRef}
        aria-label="Note body"
        style={{ borderColor: accentColor }}
      />
      <div className="notes-editor-actions">
        <button
          type="submit"
          className="notes-save-btn"
          style={{
            background: accentColor,
            color: "#fff",
            fontWeight: 600,
          }}
        >
          Save
        </button>
        {isNew && (
          <button
            type="button"
            onClick={onCancel}
            className="notes-cancel-btn"
          >
            Cancel
          </button>
        )}
      </div>
      {!isNew && (created || updated) && (
        <div className="notes-meta">
          <span>Created: {created ? new Date(created).toLocaleString() : "--"}</span>
          <span>Last edited: {updated ? new Date(updated).toLocaleString() : "--"}</span>
        </div>
      )}
    </form>
  );
}

export default App;
