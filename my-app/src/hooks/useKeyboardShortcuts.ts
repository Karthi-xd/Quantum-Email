import { useEffect, useCallback, useRef } from 'react';
import { useEmailStore } from '../store/emailStore';
import { toast } from '../store/toastStore';

export function useKeyboardShortcuts() {
  const {
    page,
    emails,
    activeCategory,
    selectedEmail,
    setSelectedEmail,
    setComposing,
    deleteEmail,
    setActiveCategory,
    setComposeData,
  } = useEmailStore();

  const pendingGRef = useRef(false);
  const gTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleReply = useCallback(() => {
    if (selectedEmail) {
      const originalBody = selectedEmail.body || selectedEmail.preview;
      setComposeData({
        to: selectedEmail.from,
        subject: selectedEmail.subject.startsWith('Re:')
          ? selectedEmail.subject
          : `Re: ${selectedEmail.subject}`,
        body: `\n\n--- Original Message ---\nFrom: ${selectedEmail.from}\nDate: ${selectedEmail.time}\n\n${originalBody}`,
      });
      setComposing(true);
    }
  }, [selectedEmail, setComposeData, setComposing]);

  const handleReplyAll = useCallback(() => {
    if (selectedEmail) {
      const originalBody = selectedEmail.body || selectedEmail.preview;
      setComposeData({
        to: selectedEmail.from,
        subject: selectedEmail.subject.startsWith('Re:')
          ? selectedEmail.subject
          : `Re: ${selectedEmail.subject}`,
        body: `\n\n--- Original Message ---\nFrom: ${selectedEmail.from}\nDate: ${selectedEmail.time}\n\n${originalBody}`,
      });
      setComposing(true);
      toast.info('Reply to all initiated');
    }
  }, [selectedEmail, setComposeData, setComposing]);

  const handleForward = useCallback(() => {
    if (selectedEmail) {
      const originalBody = selectedEmail.body || selectedEmail.preview;
      setComposeData({
        to: '',
        subject: selectedEmail.subject.startsWith('Fwd:')
          ? selectedEmail.subject
          : `Fwd: ${selectedEmail.subject}`,
        body: `\n\n--- Forwarded Message ---\nFrom: ${selectedEmail.from}\nDate: ${selectedEmail.time}\nSubject: ${selectedEmail.subject}\n\n${originalBody}`,
      });
      setComposing(true);
    }
  }, [selectedEmail, setComposeData, setComposing]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (page !== 'app') return;

      const target = e.target as HTMLElement;
      const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA';

      if (e.key === '?' && !isInput) {
        e.preventDefault();
        useEmailStore.getState().setShowShortcuts(true);
        return;
      }

      if (e.key === 'Escape') {
        useEmailStore.getState().setShowShortcuts(false);
        useEmailStore.getState().setShowCommandPalette(false);
        return;
      }

      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        useEmailStore.getState().setShowCommandPalette(!useEmailStore.getState().showCommandPalette);
        return;
      }

      if (isInput) return;

      const currentEmails = emails[activeCategory] || [];
      const currentIndex = selectedEmail
        ? currentEmails.findIndex((em) => em.id === selectedEmail.id)
        : -1;

      switch (e.key.toLowerCase()) {
        case 'j':
        case 'n':
          e.preventDefault();
          if (currentIndex < currentEmails.length - 1) {
            setSelectedEmail(currentEmails[currentIndex + 1]);
          }
          break;

        case 'k':
        case 'p':
          e.preventDefault();
          if (currentIndex > 0) {
            setSelectedEmail(currentEmails[currentIndex - 1]);
          } else if (currentIndex === -1 && currentEmails.length > 0) {
            setSelectedEmail(currentEmails[0]);
          }
          break;

        case 'enter':
          if (selectedEmail) {
            useEmailStore.getState().setShowEmailDetail(true);
          }
          break;

        case 'c':
          e.preventDefault();
          setComposing(true);
          break;

        case 'r':
          e.preventDefault();
          handleReply();
          break;

        case 'a':
          e.preventDefault();
          handleReplyAll();
          break;

        case 'f':
          e.preventDefault();
          handleForward();
          break;

        case 'd':
          e.preventDefault();
          if (selectedEmail) {
            deleteEmail(selectedEmail.id);
            toast.info('Email moved to quantum void', {
              label: 'Undo',
              onClick: () => {
                toast.success('Email restored');
              },
            });
          }
          break;

        case '/':
          e.preventDefault();
          {
            const searchInput = document.querySelector('.search input') as HTMLInputElement;
            searchInput?.focus();
          }
          break;
      }
    },
    [
      page,
      emails,
      activeCategory,
      selectedEmail,
      setSelectedEmail,
      setComposing,
      deleteEmail,
      handleReply,
      handleReplyAll,
      handleForward,
    ]
  );

  useEffect(() => {
    const handleGShortcuts = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA';
      if (isInput) return;

      if (!pendingGRef.current) {
        if (e.key.toLowerCase() === 'g') {
          pendingGRef.current = true;
          if (gTimeoutRef.current) clearTimeout(gTimeoutRef.current);
          gTimeoutRef.current = setTimeout(() => {
            pendingGRef.current = false;
          }, 500);
        }
        return;
      }

      pendingGRef.current = false;
      if (gTimeoutRef.current) clearTimeout(gTimeoutRef.current);

      switch (e.key.toLowerCase()) {
        case 'i':
          setActiveCategory('inbox');
          toast.info('Inbox');
          break;
        case 's':
          setActiveCategory('sent');
          toast.info('Sent');
          break;
        case 'a':
          setActiveCategory('all');
          toast.info('All mail');
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleGShortcuts);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleGShortcuts);
      if (gTimeoutRef.current) clearTimeout(gTimeoutRef.current);
    };
  }, [handleKeyDown, setActiveCategory]);
}
