/* ==========================================================================
   dietrichschmidt.com — Interactive Scope Filter & Audit Brief Builder
   Zero external dependencies · Cloudflare Pages static-ready
   ========================================================================== */

(() => {
  'use strict';

  // Update this address to your preferred consulting inbox before deploying.
  const CONTACT_EMAIL = 'info@dietrichschmidt.com';

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
  const formError = document.getElementById('form-error');
  const briefOutput = document.getElementById('brief-output');
  const briefPreview = document.getElementById('brief-preview');
  const mailtoBtn = document.getElementById('mailto-brief-btn');
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

    // Update cards
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

    // Update inquiry bar chips
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
  // 4. Structured Technical Inquiry Brief Generator
  // --------------------------------------------------------------------------
  function buildBriefText(data) {
    const selectedAuditLines =
      prioritizedItems.size > 0
        ? Array.from(prioritizedItems.entries())
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([id, title]) => `  - [${id}] ${title}`)
            .join('\n')
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

  if (inquiryForm) {
    inquiryForm.addEventListener('submit', (event) => {
      event.preventDefault();

      const formData = new FormData(inquiryForm);
      const name = String(formData.get('name') || '').trim();
      const email = String(formData.get('email') || '').trim();
      const organization = String(formData.get('organization') || '').trim();
      const windowChoice = String(formData.get('window') || '').trim();
      const notes = String(formData.get('notes') || '').trim();
      const stack = formData.getAll('stack').map(String);

      if (!name || !email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        if (formError) {
          formError.textContent =
            'Please enter your name and a valid work email address to generate your brief.';
          formError.classList.add('is-visible');
        }
        return;
      }

      if (formError) {
        formError.classList.remove('is-visible');
        formError.textContent = '';
      }

      const briefText = buildBriefText({
        name,
        email,
        organization,
        window: windowChoice,
        stack,
        notes,
      });

      if (briefPreview) {
        briefPreview.textContent = briefText;
      }

      const subject = `Q1 2027 Technical Audit Inquiry${organization ? ` — ${organization}` : ''}`;
      if (mailtoBtn) {
        mailtoBtn.href = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(
          subject
        )}&body=${encodeURIComponent(briefText)}`;
      }

      if (briefOutput) {
        briefOutput.classList.add('is-visible');
        briefOutput.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
      if (copyFeedback) {
        copyFeedback.textContent = '';
      }
    });

    inquiryForm.addEventListener('reset', () => {
      if (formError) {
        formError.classList.remove('is-visible');
      }
      if (briefOutput) {
        briefOutput.classList.remove('is-visible');
      }
      if (copyFeedback) {
        copyFeedback.textContent = '';
      }
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
        // Fallback for non-HTTPS local preview contexts
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
