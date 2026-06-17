// Internal data state tracking system
let savedLinksArray = [];

// 1. Load the active configuration state automatically on page boot
document.addEventListener('DOMContentLoaded', () => {
    const rawData = localStorage.getItem('monitored_calendar_links');
    if (rawData) {
        try {
            savedLinksArray = JSON.parse(rawData);
        } catch (e) {
            savedLinksArray = [];
        }
    }
    renderLinksList();
});

// 2. Add an items row to our system
function addNewLink() {
    const inputElement = document.getElementById('newLinkInput');
    const urlValue = inputElement.value.trim();

    if (!urlValue) return;
    if (!urlValue.startsWith('http')) {
        alert('Please enter a valid URL starting with http:// or https://');
        return;
    }

    // Push item onto the tracking arrays
    savedLinksArray.push(urlValue);

    // Save modified list state permanently inside browser memory
    localStorage.setItem('monitored_calendar_links', JSON.stringify(savedLinksArray));

    // Wipe input UI clean & update list
    inputElement.value = '';
    renderLinksList();
}

// 3. Delete a link row from the dashboard UI
function deleteLink(index) {
    savedLinksArray.splice(index, 1);
    localStorage.setItem('monitored_calendar_links', JSON.stringify(savedLinksArray));
    renderLinksList();
}

// 4. Update the layout display
function renderLinksList() {
    const container = document.getElementById('linksListContainer');
    container.innerHTML = '';

    if (savedLinksArray.length === 0) {
        container.innerHTML = '<div class="no-links-text">No links added yet. Paste a link above to begin tracking.</div>';
        return;
    }

    savedLinksArray.forEach((link, index) => {
        const row = document.createElement('div');
        row.className = 'link-row';
        row.innerHTML = `
            <div class="link-url" title="${link}">• ${link}</div>
            <button class="delete-btn" onclick="deleteLink(${index})">❌ Remove</button>
        `;
        container.appendChild(row);
    });
}

// 5. Query data records across backend pipeline endpoints sequentially
async function checkAllAvailability() {
    const checkButton = document.getElementById('checkBtn');
    const resultsDiv = document.getElementById('results');

    if (savedLinksArray.length === 0) {
        alert('Your tracking manager is empty. Please add at least one link above.');
        return;
    }

    // Lock UI controls to map ongoing operation workflows
    checkButton.disabled = true;
    checkButton.innerText = '⏳ Processing Layout Grids... Please wait.';
    resultsDiv.innerHTML = '<div style="text-align:center; padding:30px; font-weight:bold; color:#666;">Evaluating... Keep this window open.</div>';

    try {
        const response = await fetch('/api/check-slots', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ links: savedLinksArray })
        });

        const data = await response.json();
        resultsDiv.innerHTML = ''; // Wipe intermediate progress views

        data.results.forEach(res => {
            const firstWordStatus = res.status.split(' ')[0];
            const card = document.createElement('div');
            card.className = `result-item ${firstWordStatus}`;

            card.innerHTML = `
                <div class="status-badge">${res.status} — <span style="font-weight:normal; font-size:14px; color:#333;">${res.details}</span></div>
                <a class="url-link" href="${res.url}" target="_blank">Open Calendar Interface ↗</a>
            `;
            resultsDiv.appendChild(card);
        });

    } catch (err) {
        resultsDiv.innerHTML = '<div class="result-item Error"><strong>System Error:</strong> Cannot reach backend. Ensure "node server.js" is running in your terminal.</div>';
    } finally {
        checkButton.disabled = false;
        checkButton.innerText = '🔄 Check Saved Bookings Now';
    }
}