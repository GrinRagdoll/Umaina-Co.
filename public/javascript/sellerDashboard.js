let activeItemId = null;

function showToast(msg) {
    const t = document.getElementById('toast');
    t.textContent = msg;
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 2200);
}
function openOverlay(id) { document.getElementById(id).classList.add('open'); }
function closeOverlay(id) { document.getElementById(id).classList.remove('open'); }

document.querySelectorAll('[data-close]').forEach(btn => {
    btn.addEventListener('click', () => closeOverlay(btn.dataset.close));
});

document.getElementById('btn-add-item').addEventListener('click', () => openOverlay('add-overlay'));

document.getElementById('add-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('add-name').value;
    const description = document.getElementById('add-desc').value;
    const startingBid = document.getElementById('add-price').value;
    const durationHours = document.getElementById('add-duration').value;
    const imageFile = document.getElementById('add-image').files[0];

    try {
        const res = await fetch('/api/seller/items', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, description, startingBid, durationHours })
        });
        if (!res.ok) throw new Error('Request failed');
        const data = await res.json();

        if (imageFile && data.productId) {
            const formData = new FormData();
            formData.append('image', imageFile);
            await fetch('/api/seller/items/' + data.productId + '/upload', {
                method: 'POST',
                body: formData
            });
        }

        showToast('Item added. Refreshing...');
        setTimeout(() => window.location.reload(), 700);
    } catch (err) {
        showToast('Could not add item.');
    }
});

document.getElementById('items-body').addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-action]');
    if (!btn) return;
    const row = btn.closest('tr');
    activeItemId = row.dataset.itemId;

    if (btn.dataset.action === 'upload') {
        openOverlay('upload-overlay');
    } else if (btn.dataset.action === 'remove') {
        if (!confirm('Remove this item? This cannot be undone.')) return;
        removeItem(activeItemId, row);
    }
});

async function removeItem(id, row) {
    try {
        const res = await fetch('/api/seller/items/' + id, { method: 'DELETE' });
        if (!res.ok) throw new Error('Request failed');
        row.remove();
        showToast('Item removed.');
    } catch (err) {
        showToast('Could not remove item.');
    }
}

document.getElementById('upload-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const fileInput = document.getElementById('upload-file');
    if (!fileInput.files.length || !activeItemId) return;
    const formData = new FormData();
    formData.append('image', fileInput.files[0]);
    try {
        const res = await fetch('/api/seller/items/' + activeItemId + '/upload', {
            method: 'POST',
            body: formData
        });
        if (!res.ok) throw new Error('Request failed');
        showToast('Image uploaded. Refreshing...');
        closeOverlay('upload-overlay');
        setTimeout(() => window.location.reload(), 700);
    } catch (err) {
        showToast('Could not upload image.');
    }
});