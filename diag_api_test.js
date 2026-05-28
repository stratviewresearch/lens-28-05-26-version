
const fetch = require('node-fetch');

async function diag() {
    try {
        const response = await fetch('http://localhost/stratview/admin/web/new-dashboard-api/subcategory-list.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer placeholder'
            },
            body: JSON.stringify({ category_id: 'all' }),
        });
        const data = await response.json();
        console.log('API Status:', data.status);
        console.log('Count:', data.data ? data.data.length : 'N/A');
        if (data.data) {
            data.data.forEach((sc, i) => {
                console.log(`${i + 1}: ${sc.name} (ID: ${sc.id})`);
            });
        }
    } catch (e) {
        console.error('Error fetching API:', e.message);
    }
}

diag();
