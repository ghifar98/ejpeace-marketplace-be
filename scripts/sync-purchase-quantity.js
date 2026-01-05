/**
 * Migration Script: Sync Quantity for Existing Purchases
 * 
 * This script calculates and updates the `quantity` field for existing purchases
 * that don't have it set correctly.
 * 
 * Logic:
 * 1. If original_amount exists: quantity = original_amount / product_price
 * 2. If original_amount is null: quantity = (total_amount + voucher_discount) / product_price
 * 3. If no voucher: quantity = total_amount / product_price
 * 
 * Run: node scripts/sync-purchase-quantity.js
 */

const mysql = require("mysql2/promise");
require("dotenv").config();

async function syncPurchaseQuantity() {
    console.log("🔄 Starting purchase quantity sync...\n");

    // Create database connection
    const pool = mysql.createPool({
        host: process.env.DB_HOST || "localhost",
        port: process.env.DB_PORT || 3306,
        user: process.env.DB_USER || "root",
        password: process.env.DB_PASSWORD || "",
        database: process.env.DB_NAME || "peacetifal_db",
        waitForConnections: true,
        connectionLimit: 5,
    });

    try {
        // Test connection
        const connection = await pool.getConnection();
        console.log("✅ Database connected\n");
        connection.release();

        // Step 1: Get all purchases with product_id that need quantity sync
        console.log("📊 Fetching purchases that need sync...");
        const [purchases] = await pool.execute(`
      SELECT 
        p.id,
        p.product_id,
        p.total_amount,
        p.original_amount,
        p.quantity AS current_quantity,
        p.status,
        pr.price AS product_price,
        pr.name AS product_name,
        pv.discount_amount AS voucher_discount
      FROM purchases p
      LEFT JOIN products pr ON p.product_id = pr.id
      LEFT JOIN purchase_vouchers pv ON p.id = pv.purchase_id
      WHERE p.product_id IS NOT NULL
      ORDER BY p.id DESC
    `);

        console.log(`Found ${purchases.length} purchases to check\n`);

        let updated = 0;
        let skipped = 0;
        let errors = 0;

        for (const purchase of purchases) {
            try {
                const {
                    id,
                    product_id,
                    total_amount,
                    original_amount,
                    current_quantity,
                    product_price,
                    product_name,
                    voucher_discount,
                    status
                } = purchase;

                // Skip if no product price (product might be deleted)
                if (!product_price || product_price <= 0) {
                    console.log(`⚠️  Purchase #${id}: Skipped - Product price not found`);
                    skipped++;
                    continue;
                }

                // Calculate correct quantity
                let calculatedQuantity;
                let source = "";

                if (original_amount && original_amount > 0) {
                    // Best case: use original_amount (before discount)
                    calculatedQuantity = Math.round(original_amount / product_price);
                    source = "original_amount";
                } else if (voucher_discount && voucher_discount > 0) {
                    // Fallback: reconstruct original amount from total + discount
                    const reconstructedOriginal = parseFloat(total_amount) + parseFloat(voucher_discount);
                    calculatedQuantity = Math.round(reconstructedOriginal / product_price);
                    source = "total + voucher_discount";
                } else {
                    // No voucher: total_amount is the original amount
                    calculatedQuantity = Math.round(total_amount / product_price);
                    source = "total_amount";
                }

                // Ensure quantity is at least 1
                calculatedQuantity = Math.max(1, calculatedQuantity);

                // Check if update is needed
                if (current_quantity === calculatedQuantity) {
                    console.log(`✓ Purchase #${id}: Already correct (qty=${calculatedQuantity})`);
                    skipped++;
                    continue;
                }

                // Log the change
                console.log(`📝 Purchase #${id}:`);
                console.log(`   Product: ${product_name || product_id} @ Rp ${product_price}`);
                console.log(`   Total: Rp ${total_amount}, Voucher: Rp ${voucher_discount || 0}`);
                console.log(`   Quantity: ${current_quantity || "NULL"} → ${calculatedQuantity} (source: ${source})`);
                console.log(`   Status: ${status}`);

                // Update the purchase
                await pool.execute(
                    `UPDATE purchases SET quantity = ?, updated_at = NOW() WHERE id = ?`,
                    [calculatedQuantity, id]
                );

                console.log(`   ✅ Updated!\n`);
                updated++;

            } catch (err) {
                console.error(`❌ Purchase #${purchase.id}: Error - ${err.message}`);
                errors++;
            }
        }

        // Summary
        console.log("\n" + "=".repeat(50));
        console.log("📊 SYNC SUMMARY");
        console.log("=".repeat(50));
        console.log(`Total Purchases:  ${purchases.length}`);
        console.log(`Updated:          ${updated}`);
        console.log(`Skipped:          ${skipped}`);
        console.log(`Errors:           ${errors}`);
        console.log("=".repeat(50));

        // Also update order_addresses if quantity column exists
        console.log("\n🔄 Syncing order_addresses quantity...");
        try {
            const [orderAddressResult] = await pool.execute(`
        UPDATE order_addresses oa
        JOIN purchases p ON oa.purchase_id = p.id
        SET oa.quantity = p.quantity, oa.updated_at = NOW()
        WHERE oa.quantity IS NULL OR oa.quantity != p.quantity
      `);
            console.log(`✅ Updated ${orderAddressResult.affectedRows} order_addresses`);
        } catch (oaErr) {
            console.log(`⚠️  order_addresses sync skipped: ${oaErr.message}`);
        }

        console.log("\n✅ Sync completed!");

    } catch (error) {
        console.error("❌ Fatal error:", error.message);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

// Run the script
syncPurchaseQuantity();
