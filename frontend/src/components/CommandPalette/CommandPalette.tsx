import { useState, useEffect, useRef } from 'react';
import { useEmailStore } from '../../store/emailStore';
import './CommandPalette.css';

interface Command {
  id: string;
  label: string;
  icon: string;
  action: () => void;
  shortcut?: string;
  category: string;
}

export function CommandPalette() {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const {
    showCommandPalette,
    setShowCommandPalette,
    setComposing,
    setActiveCategory,
    setShowAccounts,
    logout,
  } = useEmailStore();

  const commands: Command[] = [
    {
      id: 'compose',
      label: 'Compose New Email',
      icon: '↑',
      action: () => {
        setComposing(true);
        setShowCommandPalette(false);
      },
      shortcut: 'c',
      category: 'Compose',
    },
    {
      id: 'inbox',
      label: 'Go to Inbox',
      icon: '↓',
      action: () => {
        setActiveCategory('inbox');
        setShowCommandPalette(false);
      },
      shortcut: 'g i',
      category: 'Navigate',
    },
    {
      id: 'sent',
      label: 'Go to Sent',
      icon: '↑',
      action: () => {
        setActiveCategory('sent');
        setShowCommandPalette(false);
      },
      shortcut: 'g s',
      category: 'Navigate',
    },
    {
      id: 'all',
      label: 'Go to All Mail',
      icon: '◈',
      action: () => {
        setActiveCategory('all');
        setShowCommandPalette(false);
      },
      shortcut: 'g a',
      category: 'Navigate',
    },
    {
      id: 'spam',
      label: 'Go to Spam',
      icon: '!',
      action: () => {
        setActiveCategory('spam');
        setShowCommandPalette(false);
      },
      category: 'Navigate',
    },
    {
      id: 'accounts',
      label: 'Manage Accounts',
      icon: '◉',
      action: () => {
        setShowAccounts(true);
        setShowCommandPalette(false);
      },
      category: 'Settings',
    },
    {
      id: 'shortcuts',
      label: 'Keyboard Shortcuts',
      icon: '⌘',
      action: () => {
        useEmailStore.getState().setShowShortcuts(true);
        setShowCommandPalette(false);
      },
      shortcut: '?',
      category: 'Help',
    },
    {
      id: 'logout',
      label: 'Sign Out',
      icon: '△',
      action: () => {
        logout();
        setShowCommandPalette(false);
      },
      category: 'Account',
    },
  ];

  const filteredCommands = query
    ? commands.filter(
        (cmd) =>
          cmd.label.toLowerCase().includes(query.toLowerCase()) ||
          cmd.category.toLowerCase().includes(query.toLowerCase())
      )
    : commands;

  useEffect(() => {
    if (showCommandPalette) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [showCommandPalette]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < filteredCommands.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev > 0 ? prev - 1 : filteredCommands.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (filteredCommands[selectedIndex]) {
          filteredCommands[selectedIndex].action();
        }
        break;
      case 'Escape':
        setShowCommandPalette(false);
        break;
    }
  };

  if (!showCommandPalette) return null;

  const groupedCommands = filteredCommands.reduce((acc, cmd) => {
    if (!acc[cmd.category]) acc[cmd.category] = [];
    acc[cmd.category].push(cmd);
    return acc;
  }, {} as Record<string, Command[]>);

  let flatIndex = 0;

  return (
    <div className="command-overlay" onClick={() => setShowCommandPalette(false)} role="dialog" aria-modal="true" aria-label="Command palette">
      <div className="command-palette glass" onClick={(e) => e.stopPropagation()}>
        <div className="command-input-wrapper">
          <span className="command-icon" aria-hidden="true">◈</span>
          <input
            ref={inputRef}
            type="text"
            className="command-input"
            placeholder="Search quantum commands..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            aria-label="Search commands"
            role="combobox"
            aria-expanded="true"
            aria-controls="command-list"
          />
          <kbd className="command-esc">ESC</kbd>
        </div>

        <div className="command-list" id="command-list" role="listbox" aria-label="Available commands">
          {filteredCommands.length === 0 ? (
            <div className="command-empty" role="status">No commands found</div>
          ) : (
            Object.entries(groupedCommands).map(([category, cmds]) => (
              <div key={category} className="command-group">
                <div className="command-category" role="presentation">{category}</div>
                {cmds.map((cmd) => {
                  const currentIndex = flatIndex++;
                  return (
                    <div
                      key={cmd.id}
                      className={`command-item ${currentIndex === selectedIndex ? 'selected' : ''}`}
                      onClick={() => cmd.action()}
                      onMouseEnter={() => setSelectedIndex(currentIndex)}
                      role="option"
                      aria-selected={currentIndex === selectedIndex}
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          cmd.action();
                        }
                      }}
                    >
                      <span className="command-item-icon" aria-hidden="true">{cmd.icon}</span>
                      <span className="command-item-label">{cmd.label}</span>
                      {cmd.shortcut && (
                        <kbd className="command-item-shortcut" aria-label={`Shortcut: ${cmd.shortcut}`}>{cmd.shortcut}</kbd>
                      )}
                    </div>
                  );
                })}
              </div>
            ))
          )}
        </div>

        <div className="command-footer" aria-hidden="true">
          <span>
            <kbd>↑↓</kbd> Navigate
          </span>
          <span>
            <kbd>↵</kbd> Select
          </span>
          <span>
            <kbd>ESC</kbd> Close
          </span>
        </div>
      </div>
    </div>
  );
}
