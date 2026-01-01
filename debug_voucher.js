const db = require('./src/config/db.config');

async function debug() {
    try {
        // List ALL vouchers - no limit
        const [vouchers] = await db.execute('SELECT id, code, used_count, max_usage FROM vouchers ORDER BY id DESC');
        console.log('Total vouchers:', vouchers.length);
        vouchers.forEach(v => console.log(`  ${v.id}: "${v.code}" used=${v.used_count}/${v.max_usage}`));

        process.exit(0);
    } catch (e) {
        console.error('Error:', e.message);
        process.exit(1);
    }
}

debug();
