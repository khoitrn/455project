export const ui = /* html */`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Contacts Book — CSCE 455</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-slate-50 min-h-screen font-sans">

  <!-- Header -->
  <header class="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between sticky top-0 z-10 shadow-sm">
    <div>
      <h1 class="text-2xl font-bold text-slate-800">📒 Contacts Book</h1>
      <p class="text-xs text-slate-400 mt-0.5">455project.khoitrn.com · CSCE 455</p>
    </div>
    <button onclick="openModal()" class="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
      + Add Contact
    </button>
  </header>

  <!-- Stats bar -->
  <div class="max-w-6xl mx-auto px-6 pt-6">
    <p id="count" class="text-sm text-slate-500 mb-4"></p>
  </div>

  <!-- Grid -->
  <main class="max-w-6xl mx-auto px-6 pb-16">
    <div id="grid" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"></div>
    <div id="empty" class="hidden text-center py-24 text-slate-400">
      <p class="text-4xl mb-3">👤</p>
      <p class="font-medium">No contacts yet</p>
      <p class="text-sm mt-1">Click "+ Add Contact" to get started</p>
    </div>
    <div id="loading" class="text-center py-24 text-slate-400">
      <p class="text-sm animate-pulse">Loading contacts…</p>
    </div>
  </main>

  <!-- Modal -->
  <div id="modal" class="fixed inset-0 bg-black/50 flex items-center justify-center hidden z-50 p-4">
    <div class="bg-white rounded-2xl shadow-2xl w-full max-w-md">
      <div class="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
        <h2 id="modal-title" class="text-lg font-semibold text-slate-800">Add Contact</h2>
        <button onclick="closeModal()" class="text-slate-400 hover:text-slate-600 text-xl leading-none">&times;</button>
      </div>
      <form id="contact-form" onsubmit="submitForm(event)" class="px-6 py-5 space-y-4">
        <input type="hidden" id="f-id" />
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1">Name <span class="text-red-400">*</span></label>
          <input id="f-name" type="text" required placeholder="Full name"
            class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent" />
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1">Email</label>
          <input id="f-email" type="email" placeholder="email@example.com"
            class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent" />
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1">Phone</label>
          <input id="f-phone" type="text" placeholder="555-0100"
            class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent" />
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1">Address</label>
          <input id="f-address" type="text" placeholder="123 Main St, City TX"
            class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent" />
        </div>
        <div id="form-error" class="hidden text-sm text-red-500 bg-red-50 rounded-lg px-3 py-2"></div>
        <div class="flex gap-3 pt-1">
          <button type="button" onclick="closeModal()"
            class="flex-1 border border-slate-200 text-slate-600 text-sm font-medium py-2 rounded-lg hover:bg-slate-50 transition-colors">
            Cancel
          </button>
          <button type="submit"
            class="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium py-2 rounded-lg transition-colors">
            Save
          </button>
        </div>
      </form>
    </div>
  </div>

  <script>
    const CONTACTS = {};

    const COLORS = [
      'bg-indigo-100 text-indigo-700',
      'bg-emerald-100 text-emerald-700',
      'bg-rose-100 text-rose-700',
      'bg-amber-100 text-amber-700',
      'bg-sky-100 text-sky-700',
      'bg-purple-100 text-purple-700',
    ];

    function colorFor(id) { return COLORS[id % COLORS.length]; }

    function initials(name) {
      return name.trim().split(/\s+/).map(w => w[0]?.toUpperCase() ?? '').slice(0, 2).join('');
    }

    function esc(s) {
      return String(s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
    }

    function renderCard(c) {
      const ini = initials(c.name);
      const color = colorFor(c.id);
      return \`
        <div class="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow p-5 flex flex-col gap-4">
          <div class="flex items-start gap-3">
            <div class="w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 \${color}">\${ini}</div>
            <div class="flex-1 min-w-0">
              <p class="font-semibold text-slate-800 truncate">\${esc(c.name)}</p>
              \${c.email   ? \`<p class="text-sm text-slate-500 truncate">\${esc(c.email)}</p>\` : ''}
              \${c.phone   ? \`<p class="text-sm text-slate-400">\${esc(c.phone)}</p>\` : ''}
              \${c.address ? \`<p class="text-xs text-slate-400 mt-1 truncate">\${esc(c.address)}</p>\` : ''}
            </div>
          </div>
          <div class="flex gap-2">
            <button onclick="openModal(CONTACTS[\${c.id}])"
              class="flex-1 text-xs font-medium border border-slate-200 text-slate-600 py-1.5 rounded-lg hover:bg-slate-50 transition-colors">
              Edit
            </button>
            <button onclick="deleteContact(\${c.id})"
              class="flex-1 text-xs font-medium border border-red-100 text-red-500 py-1.5 rounded-lg hover:bg-red-50 transition-colors">
              Delete
            </button>
          </div>
        </div>
      \`;
    }

    async function loadContacts() {
      document.getElementById('loading').classList.remove('hidden');
      document.getElementById('grid').innerHTML = '';
      document.getElementById('empty').classList.add('hidden');

      const res = await fetch('/contacts');
      const list = await res.json();

      document.getElementById('loading').classList.add('hidden');

      Object.keys(CONTACTS).forEach(k => delete CONTACTS[k]);
      list.forEach(c => CONTACTS[c.id] = c);

      const count = document.getElementById('count');
      count.textContent = list.length === 0 ? '' : \`\${list.length} contact\${list.length === 1 ? '' : 's'}\`;

      if (list.length === 0) {
        document.getElementById('empty').classList.remove('hidden');
        return;
      }

      document.getElementById('grid').innerHTML = list.map(renderCard).join('');
    }

    function openModal(contact = null) {
      document.getElementById('modal-title').textContent = contact ? 'Edit Contact' : 'Add Contact';
      document.getElementById('f-id').value      = contact?.id      ?? '';
      document.getElementById('f-name').value    = contact?.name    ?? '';
      document.getElementById('f-email').value   = contact?.email   ?? '';
      document.getElementById('f-phone').value   = contact?.phone   ?? '';
      document.getElementById('f-address').value = contact?.address ?? '';
      document.getElementById('form-error').classList.add('hidden');
      document.getElementById('modal').classList.remove('hidden');
      document.getElementById('f-name').focus();
    }

    function closeModal() {
      document.getElementById('modal').classList.add('hidden');
      document.getElementById('contact-form').reset();
    }

    document.getElementById('modal').addEventListener('click', (e) => {
      if (e.target === e.currentTarget) closeModal();
    });

    async function submitForm(e) {
      e.preventDefault();
      const id = document.getElementById('f-id').value;
      const body = {
        name:    document.getElementById('f-name').value.trim(),
        email:   document.getElementById('f-email').value.trim()   || null,
        phone:   document.getElementById('f-phone').value.trim()   || null,
        address: document.getElementById('f-address').value.trim() || null,
      };

      const res = await fetch(id ? \`/contacts/\${id}\` : '/contacts', {
        method:  id ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.json();
        const el = document.getElementById('form-error');
        el.textContent = err.error ?? 'Something went wrong.';
        el.classList.remove('hidden');
        return;
      }

      closeModal();
      loadContacts();
    }

    async function deleteContact(id) {
      const name = CONTACTS[id]?.name ?? 'this contact';
      if (!confirm(\`Delete \${name}?\`)) return;
      await fetch(\`/contacts/\${id}\`, { method: 'DELETE' });
      loadContacts();
    }

    loadContacts();
  </script>
</body>
</html>`;
