const db = require("../config/db.config");
const Product = require("./Product.model");
const ProductProductAlertRepository = require("./productProductAlert.repository");

class ProductRepository {
  // Create a new product
  static async create(productData) {
    const {
      name,
      description,
      price,
      discount_percentage,
      category,
      size,
      quantity,
      image,
      fake_quantity,
    } = productData;
    const createdAt = new Date();
    const updatedAt = new Date();

    // If fake_quantity is provided, set base as well
    const fakeQuantityBase = fake_quantity !== undefined ? fake_quantity : null;

    const query = `
      INSERT INTO products (name, description, price, discount_percentage, category, size, quantity, image, fake_quantity, fake_quantity_base, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    try {
      const [result] = await db.execute(query, [
        name,
        description,
        price,
        discount_percentage || 0,
        category,
        size,
        quantity,
        JSON.stringify(image || []),
        fake_quantity !== undefined ? fake_quantity : null,
        fakeQuantityBase,
        createdAt,
        updatedAt,
      ]);
      return result.insertId;
    } catch (error) {
      if (error.code === "ECONNREFUSED" || error.code === "ENOTFOUND") {
        throw new Error("Database connection failed");
      }
      throw error;
    }
  }

  // Find product by ID
  static async findById(id) {
    const query = `
      SELECT id, name, description, price, discount_percentage, category, size, quantity, image, fake_quantity, fake_quantity_base, fake_quantity_last_edited_at, created_at, updated_at, deleted_at
      FROM products
      WHERE id = ? AND deleted_at IS NULL
    `;

    try {
      const [rows] = await db.execute(query, [id]);
      if (rows.length === 0) return null;

      const productData = { ...rows[0] };
      if (productData.image) {
        try {
          productData.image = JSON.parse(productData.image);
        } catch (e) {
          productData.image = [productData.image];
        }
      }

      // Fetch alerts
      const alerts = await ProductProductAlertRepository.getAlertsForProduct(id);
      productData.alerts = alerts;

      return new Product(productData);
    } catch (error) {
      if (error.code === "ECONNREFUSED" || error.code === "ENOTFOUND") {
        console.error("Database connection failed while finding product by ID");
        return null;
      }
      throw error;
    }
  }

  // Get all products (excluding deleted ones)
  static async findAll() {
    const query = `
      SELECT id, name, description, price, discount_percentage, category, size, quantity, image, fake_quantity, fake_quantity_base, fake_quantity_last_edited_at, created_at, updated_at
      FROM products
      WHERE deleted_at IS NULL
      ORDER BY created_at DESC
    `;

    try {
      const [rows] = await db.execute(query);

      const products = await Promise.all(rows.map(async (row) => {
        const productData = { ...row };
        if (productData.image) {
          try {
            productData.image = JSON.parse(productData.image);
          } catch (e) {
            productData.image = [productData.image];
          }
        }

        // Fetch alerts for each product
        // Note: For high traffic, this should be optimized to a single JOIN query, 
        // but for now keeping it simple as per architecture.
        const alerts = await ProductProductAlertRepository.getAlertsForProduct(row.id);
        productData.alerts = alerts;

        return new Product(productData);
      }));

      return products;
    } catch (error) {
      if (error.code === "ECONNREFUSED" || error.code === "ENOTFOUND") {
        console.error("Database connection failed while fetching all products");
        return [];
      }
      throw error;
    }
  }

  // Update product
  static async update(id, productData) {
    const allowedFields = [
      "name",
      "description",
      "price",
      "discount_percentage",
      "category",
      "size",
      "quantity",
      "image",
      "fake_quantity"
    ];
    const updates = [];
    const values = [];

    // Build dynamic query based on provided fields
    for (const field of allowedFields) {
      if (productData[field] !== undefined) {
        if (field === "image") {
          updates.push(`${field} = ?`);
          values.push(JSON.stringify(productData[field] || []));
        } else if (field === "fake_quantity") {
          // Handle fake_quantity logic
          updates.push(`fake_quantity = ?`);
          values.push(productData[field]);

          // Also update base and last_edited_at
          updates.push(`fake_quantity_base = ?`);
          values.push(productData[field]);

          updates.push(`fake_quantity_last_edited_at = ?`);
          values.push(new Date());
        } else {
          updates.push(`${field} = ?`);
          values.push(productData[field]);
        }
      }
    }

    // Always update updated_at
    updates.push("updated_at = ?");
    values.push(new Date());

    // Add id to values
    values.push(id);

    if (updates.length === 1) {
      // Only updated_at
      return false; // Nothing to update
    }

    const query = `
      UPDATE products
      SET ${updates.join(", ")}
      WHERE id = ? AND deleted_at IS NULL
    `;

    try {
      const [result] = await db.execute(query, values);
      return result.affectedRows > 0;
    } catch (error) {
      if (error.code === "ECONNREFUSED" || error.code === "ENOTFOUND") {
        console.error("Database connection failed while updating product");
        return false;
      }
      throw error;
    }
  }

  // Soft delete product
  static async softDelete(id) {
    const deletedAt = new Date();

    const query = `
      UPDATE products
      SET deleted_at = ?
      WHERE id = ? AND deleted_at IS NULL
    `;

    try {
      const [result] = await db.execute(query, [deletedAt, id]);
      return result.affectedRows > 0;
    } catch (error) {
      if (error.code === "ECONNREFUSED" || error.code === "ENOTFOUND") {
        console.error("Database connection failed while deleting product");
        return false;
      }
      throw error;
    }
  }

  // Transactional update quantity with strict check
  static async updateQuantityWithConnection(id, quantityToReduce, connection) {
    const query = `
      UPDATE products
      SET quantity = quantity - ?, updated_at = ?
      WHERE id = ? AND quantity >= ? AND deleted_at IS NULL
    `;

    try {
      const [result] = await connection.execute(query, [
        quantityToReduce,
        new Date(),
        id,
        quantityToReduce,
      ]);
      return result.affectedRows > 0;
    } catch (error) {
      console.error(
        "Database error while updating product quantity with connection:",
        error.message
      );
      throw error;
    }
  }
}

module.exports = ProductRepository;
