// EventImage model for MySQL database - Supports unlimited images per event

class EventImage {
    constructor(data) {
        this.id = data.id || null;
        this.event_id = data.event_id;
        this.image_url = data.image_url;
        this.position = data.position || 0; // Order of images
        this.created_at = data.created_at || new Date();
    }

    // Validate event image data
    validate() {
        const errors = [];

        if (!this.event_id) {
            errors.push("Event ID is required");
        }

        if (!this.image_url || this.image_url.trim().length === 0) {
            errors.push("Image URL is required");
        }

        return errors;
    }

    // Convert to JSON
    toJSON() {
        return {
            id: this.id,
            event_id: this.event_id,
            image_url: this.image_url,
            position: this.position,
            created_at: this.created_at,
        };
    }
}

module.exports = EventImage;
