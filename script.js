/* ==========================================================================
   dietrichschmidt.com — Interactive Scope Filter & Form Submission (/api/inquiry)
   Zero email addresses in client code · Zero external dependencies
   ========================================================================== */

(() => {
  'use strict';

  // Track page load time for lightweight anti-bot timing check
  const pageLoadedAt = Date.now();

  // State: Map of prioritized audit items (id -> title)
  const prioritizedItems = new Map();

  // DOM References
  const menuToggle = document.getElementById('menu-toggle');
  const primaryNav = document.getElementById('primary-nav');
  const filterButtons = document.querySelectorAll('.filter-tab');
  const auditCards = document.querySelectorAll('.audit-card');
  const shortlistCounter = document.getElementById('shortlist-counter');
  const focusChipsContainer = document.getElementById('selected-focus-chips');
  const clearFocusBtn = document.getElementById('clear-focus-btn');
  const inquiryForm = document.getElementById('audit-inquiry-form');
  const submitBtn = document.getElementById('submit-inquiry-btn');
  const formError = document.getElementById('form-error');
  const formSuccess = document.getElementById('form-success');
  const briefOutput = document.getElementById('brief-output');
  const briefNote = document.getElementById('brief-note');
  const briefPreview = document.getElementById('brief-preview');
  const copyBtn = document.getElementById('copy-brief-btn');
  const copyFeedback = document.getElementById('copy-feedback');

  // --------------------------------------------------------------------------
  // 1. Mobile Navigation Drawer
  // --------------------------------------------------------------------------
  if (menuToggle && primaryNav) {
    menuToggle.addEventListener('click', () => {
      const isOpen = primaryNav.classList.toggle('is-open');
      menuToggle.setAttribute('aria-expanded', String(isOpen));
      menuToggle.textContent = isOpen ? 'Close' : 'Menu';
    });

    primaryNav.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => {
        primaryNav.classList.remove('is-open');
        menuToggle.setAttribute('aria-expanded', 'false');
        menuToggle.textContent = 'Menu';
      });
    });
  }

  // --------------------------------------------------------------------------
  // 2. Domain Filter Tabs for 10-Point Audit
  // --------------------------------------------------------------------------
  filterButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const target = btn.dataset.filter || 'all';

      filterButtons.forEach((item) => {
        item.setAttribute('aria-pressed', String(item === btn));
      });

      auditCards.forEach((card) => {
        const matches = target === 'all' || card.dataset.pillar === target;
        card.classList.toggle('is-hidden', !matches);
      });
    });
  });

  // --------------------------------------------------------------------------
  // 3. Audit Priority Shortlist (Synced with Inquiry Panel)
  // --------------------------------------------------------------------------
  function syncShortlistUI() {
    const count = prioritizedItems.size;

    if (shortlistCounter) {
      shortlistCounter.textContent =
        count === 0
          ? '0 selected'
          : `${count} ${count === 1 ? 'area' : 'areas'} prioritized`;
    }

    if (clearFocusBtn) {
      clearFocusBtn.hidden = count === 0;
    }

    auditCards.forEach((card) => {
      const id = card.dataset.auditId;
      const isSelected = prioritizedItems.has(id);
      card.classList.toggle('is-selected', isSelected);

      const toggleBtn = card.querySelector('.prioritize-btn');
      if (toggleBtn) {
        toggleBtn.setAttribute('aria-pressed', String(isSelected));
        toggleBtn.textContent = isSelected ? '✓ Prioritized' : '+ Prioritize';
      }
    });

    if (!focusChipsContainer) return;
    focusChipsContainer.innerHTML = '';

    if (count === 0) {
      const emptyNote = document.createElement('p');
      emptyNote.className = 'focus-empty';
      emptyNote.innerHTML =
        'Full 10-point coverage selected by default. Use <strong>+ Prioritize</strong> on any audit card above to highlight specific pain points.';
      focusChipsContainer.appendChild(emptyNote);
      return;
    }

    const sorted = Array.from(prioritizedItems.entries()).sort(([a], [b]) =>
      a.localeCompare(b)
    );

    sorted.forEach(([id, title]) => {
      const chip = document.createElement('span');
      chip.className = 'focus-chip';

      const label = document.createElement('span');
      label.textContent = `${id} · ${title}`;

      const removeBtn = document.createElement('button');
      removeBtn.type = 'button';
      removeBtn.setAttribute('aria-label', `Remove ${title} from prioritized areas`);
      removeBtn.textContent = '×';
      removeBtn.addEventListener('click', () => {
        prioritizedItems.delete(id);
        syncShortlistUI();
      });

      chip.append(label, removeBtn);
      focusChipsContainer.appendChild(chip);
    });
  }

  auditCards.forEach((card) => {
    const toggleBtn = card.querySelector('.prioritize-btn');
    if (!toggleBtn) return;

    toggleBtn.addEventListener('click', () => {
      const id = card.dataset.auditId;
      const title = card.dataset.auditTitle;
      if (!id || !title) return;

      if (prioritizedItems.has(id)) {
        prioritizedItems.delete(id);
      } else {
        prioritizedItems.set(id, title);
      }
      syncShortlistUI();
    });
  });

  if (clearFocusBtn) {
    clearFocusBtn.addEventListener('click', () => {
      prioritizedItems.clear();
      syncShortlistUI();
    });
  }

  // --------------------------------------------------------------------------
  // 4. Native Form Submission (POST /api/inquiry — Zero Client Email Exposure)
  // --------------------------------------------------------------------------
  function getPrioritizedList() {
    return Array.from(prioritizedItems.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([id, title]) => `[${id}] ${title}`);
  }

  function buildBriefText(data) {
    const selectedAuditLines =
      data.prioritized.length > 0
        ? data.prioritized.map((item) => `  - ${item}`).join('\n')
        : '  - Full 10-Point Q1 2027 Technical Audit (Drupal · AWS · Content/AI)';

    const stackSummary =
      data.stack.length > 0 ? data.stack.join(', ') : 'Not specified';

    return [
      'Q1 2027 TECHNICAL AUDIT INQUIRY — dietrichschmidt.com',
      '======================================================',
      `From:         ${data.name} <${data.email}>`,
      `Organization: ${data.organization || 'Not specified'}`,
      `Window:       ${data.window}`,
      `Stack:        ${stackSummary}`,
      '',
      'Prioritized Audit Focus:',
      selectedAuditLines,
      '',
      'Project Context & Goals:',
      data.notes || '  (No additional notes provided — happy to cover on discovery call.)',
    ].join('\n');
  }

  function showError(message) {
    if (!formError) return;
    formError.textContent = message;
    formError.classList.add('is-visible');
  }

  function clearFeedback() {
    if (formError) {
      formError.classList.remove('is-visible');
      formError.textContent = '';
    }
    if (formSuccess) {
      formSuccess.classList.remove('is-visible');
    }
    if (briefOutput) {
      briefOutput.classList.remove('is-visible');
    }
    if (copyFeedback) {
      copyFeedback.textContent = '';
    }
  }

  if (inquiryForm) {
    inquiryForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      clearFeedback();

      const formData = new FormData(inquiryForm);
      const name = String(formData.get('name') || '').trim();
      const email = String(formData.get('email') || '').trim();
      const organization = String(formData.get('organization') || '').trim();
      const windowChoice = String(formData.get('window') || '').trim();
      const notes = String(formData.get('notes') || '').trim();
      const website = String(formData.get('website') || '').trim();
      const stack = formData.getAll('stack').map(String);
      const prioritized = getPrioritizedList();

      if (!name || !email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        showError('Please enter your name and a valid work email address.');
        return;
      }

      const payload = {
        name,
        email,
        organization,
        window: windowChoice,
        stack,
        prioritized,
        notes,
        website,
        elapsedMs: Date.now() - pageLoadedAt,
      };

      const briefText = buildBriefText(payload);

      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Sending Inquiry…';
      }

      try {
        const response = await fetch('/api/inquiry', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        const result = await response.json().catch(() => ({}));

        if (response.ok && result.ok) {
          if (formSuccess) {
            formSuccess.classList.add('is-visible');
            formSuccess.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          }
          inquiryForm.reset();
          return;
        }

        if (briefNote) {
          briefNote.textContent =
            'Direct form delivery is temporarily unavailable—copy your brief below and send it via LinkedIn:';
        }
        if (briefPreview) {
          briefPreview.textContent = briefText;
        }
        if (briefOutput) {
          briefOutput.classList.add('is-visible');
          briefOutput.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      } catch {
        if (briefNote) {
          briefNote.textContent =
            'Could not reach the submission endpoint—copy your brief below and send it via LinkedIn:';
        }
        if (briefPreview) {
          briefPreview.textContent = briefText;
        }
        if (briefOutput) {
          briefOutput.classList.add('is-visible');
          briefOutput.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = 'Send Audit Inquiry';
        }
      }
    });

    inquiryForm.addEventListener('reset', () => {
      if (formError) formError.classList.remove('is-visible');
      if (briefOutput) briefOutput.classList.remove('is-visible');
      if (copyFeedback) copyFeedback.textContent = '';
    });
  }

  if (copyBtn && briefPreview) {
    copyBtn.addEventListener('click', async () => {
      const text = briefPreview.textContent || '';
      if (!text) return;

      try {
        await navigator.clipboard.writeText(text);
        if (copyFeedback) copyFeedback.textContent = 'Copied to clipboard.';
      } catch {
        const area = document.createElement('textarea');
        area.value = text;
        area.style.position = 'fixed';
        area.style.opacity = '0';
        document.body.appendChild(area);
        area.select();
        document.execCommand('copy');
        document.body.removeChild(area);
        if (copyFeedback) copyFeedback.textContent = 'Copied to clipboard.';
      }
    });
  }

  // --------------------------------------------------------------------------
  // 5. Subtle Progressive Reveal on Scroll
  // --------------------------------------------------------------------------
  const revealNodes = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && revealNodes.length > 0) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.08, rootMargin: '0px 0px -24px 0px' }
    );

    revealNodes.forEach((node) => observer.observe(node));
  } else {
    revealNodes.forEach((node) => node.classList.add('is-visible'));
  }
})();
