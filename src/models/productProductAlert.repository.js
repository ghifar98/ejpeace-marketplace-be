const db = require("../config/db.config");

class ProductProductAlertRepository {
    static async assignAlerts(productId, alerts) {
        const connection = await db.getConnection();
        await connection.beginTransaction();

        try {
            // First, remove existing alerts for this product
            await connection.execute(
                "DELETE FROM product_product_alerts WHERE product_id = ?",
                [productId]
            );

            // Then insert new ones
            if (alerts && alerts.length > 0) {
                for (const alert of alerts) {
                    // alert can be just ID or object with threshold_count
                    const alertId = typeof alert === 'object' ? alert.id : alert;
                    const threshold = typeof alert === 'object' ? alert.threshold_count : null;

                    await connection.execute(
                        `INSERT INTO product_product_alerts (product_id, product_alert_id, threshold_count) VALUES (?, ?, ?)`,
                        [productId, alertId, threshold]
                    );
                }
            }

            await connection.commit();
            return true;
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }

    static async getAlertsForProduct(productId) {
        const query = `
      SELECT pa.*, ppa.threshold_count
      FROM product_alerts pa
      JOIN product_product_alerts ppa ON pa.id = ppa.product_alert_id
      WHERE ppa.product_id = ?
    `;
        const [rows] = await db.execute(query, [productId]);
        return rows;
    }

    static async removeAllAlerts(productId) {
        const query = `DELETE FROM product_product_alerts WHERE product_id = ?`;
        const [result] = await db.execute(query, [productId]);
        return result.affectedRows;
    }
}

module.exports = ProductProductAlertRepository;
