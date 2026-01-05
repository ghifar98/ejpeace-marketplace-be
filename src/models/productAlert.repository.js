const db = require("../config/db.config");
const ProductAlert = require("./ProductAlert.model");

class ProductAlertRepository {
    static async create(data) {
        const { icon, color, text } = data;
        const query = `
      INSERT INTO product_alerts (icon, color, text, created_at, updated_at)
      VALUES (?, ?, ?, NOW(), NOW())
    `;
        const [result] = await db.execute(query, [icon, color, text]);
        return result.insertId;
    }

    static async findById(id) {
        const query = `SELECT * FROM product_alerts WHERE id = ?`;
        const [rows] = await db.execute(query, [id]);
        if (rows.length === 0) return null;
        return new ProductAlert(rows[0]);
    }

    static async findAll() {
        const query = `SELECT * FROM product_alerts ORDER BY created_at DESC`;
        const [rows] = await db.execute(query);
        return rows.map((row) => new ProductAlert(row));
    }

    static async update(id, data) {
        const { icon, color, text } = data;
        const query = `
      UPDATE product_alerts 
      SET icon = ?, color = ?, text = ?, updated_at = NOW()
      WHERE id = ?
    `;
        const [result] = await db.execute(query, [icon, color, text, id]);
        return result.affectedRows > 0;
    }

    static async delete(id) {
        const query = `DELETE FROM product_alerts WHERE id = ?`;
        const [result] = await db.execute(query, [id]);
        return result.affectedRows > 0;
    }
}

module.exports = ProductAlertRepository;
