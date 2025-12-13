const db = require("../config/db.config");
const Event = require("./Event.model");
const EventImageRepository = require("./eventImage.repository");

// Helper function to convert datetime to MySQL format
const formatDateForMySQL = (dateString) => {
  if (!dateString) return null;

  // Create Date object from string
  const date = new Date(dateString);

  // Check if date is valid
  if (isNaN(date.getTime())) {
    return dateString; // Return original if invalid
  }

  // Format to MySQL datetime format: YYYY-MM-DD HH:MM:SS
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
};

class EventRepository {
  // Create a new event
  static async create(eventData) {
    const {
      title,
      description,
      start_date,
      end_date,
      location,
      price,
    } = eventData;
    const createdAt = new Date();
    const updatedAt = new Date();

    const query = `
      INSERT INTO events (title, description, start_date, end_date, location, price, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    try {
      const [result] = await db.execute(query, [
        title,
        description,
        formatDateForMySQL(start_date),
        formatDateForMySQL(end_date),
        location,
        price,
        createdAt,
        updatedAt,
      ]);
      return result.insertId;
    } catch (error) {
      // If it's a connection error, return a special error
      if (error.code === "ECONNREFUSED" || error.code === "ENOTFOUND") {
        throw new Error("Database connection failed");
      }
      throw error;
    }
  }

  // Find event by ID (with images)
  static async findById(id) {
    const query = `
      SELECT id, title, description, start_date, end_date, location, price, created_at, updated_at, deleted_at
      FROM events
      WHERE id = ? AND deleted_at IS NULL
    `;

    try {
      const [rows] = await db.execute(query, [id]);
      if (rows.length === 0) return null;

      // Load images from event_images table
      const images = await EventImageRepository.findByEventId(id);
      const eventData = {
        ...rows[0],
        images: images.map(img => img.toJSON())
      };

      return new Event(eventData);
    } catch (error) {
      // If it's a connection error, return null
      if (error.code === "ECONNREFUSED" || error.code === "ENOTFOUND") {
        console.error("Database connection failed while finding event by ID");
        return null;
      }
      throw error;
    }
  }

  // Get all events (excluding deleted ones, with images)
  static async findAll() {
    const query = `
      SELECT id, title, description, start_date, end_date, location, price, created_at, updated_at
      FROM events
      WHERE deleted_at IS NULL
      ORDER BY start_date ASC
    `;

    try {
      const [rows] = await db.execute(query);

      // Load images for each event
      const eventsWithImages = await Promise.all(
        rows.map(async (row) => {
          const images = await EventImageRepository.findByEventId(row.id);
          return new Event({
            ...row,
            images: images.map(img => img.toJSON())
          });
        })
      );

      return eventsWithImages;
    } catch (error) {
      // If it's a connection error, return empty array
      if (error.code === "ECONNREFUSED" || error.code === "ENOTFOUND") {
        console.error("Database connection failed while fetching all events");
        return [];
      }
      throw error;
    }
  }

  // Update event
  static async update(id, eventData) {
    const allowedFields = [
      "title",
      "description",
      "start_date",
      "end_date",
      "location",
      "price",
    ];
    const updates = [];
    const values = [];

    // Build dynamic query based on provided fields
    for (const field of allowedFields) {
      if (eventData[field] !== undefined) {
        if (field === "start_date" || field === "end_date") {
          updates.push(`${field} = ?`);
          values.push(formatDateForMySQL(eventData[field]));
        } else {
          updates.push(`${field} = ?`);
          values.push(eventData[field]);
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
      UPDATE events
      SET ${updates.join(", ")}
      WHERE id = ? AND deleted_at IS NULL
    `;

    try {
      const [result] = await db.execute(query, values);
      return result.affectedRows > 0;
    } catch (error) {
      // If it's a connection error, return false
      if (error.code === "ECONNREFUSED" || error.code === "ENOTFOUND") {
        console.error("Database connection failed while updating event");
        return false;
      }
      throw error;
    }
  }

  // Soft delete event
  static async softDelete(id) {
    const deletedAt = new Date();

    const query = `
      UPDATE events
      SET deleted_at = ?
      WHERE id = ? AND deleted_at IS NULL
    `;

    try {
      const [result] = await db.execute(query, [deletedAt, id]);
      return result.affectedRows > 0;
    } catch (error) {
      // If it's a connection error, return false
      if (error.code === "ECONNREFUSED" || error.code === "ENOTFOUND") {
        console.error("Database connection failed while deleting event");
        return false;
      }
      throw error;
    }
  }
}

module.exports = EventRepository;
