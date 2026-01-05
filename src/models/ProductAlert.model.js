class ProductAlert {
    constructor(data) {
        this.id = data.id || null;
        this.icon = data.icon; // e.g., "FaFire"
        this.color = data.color; // e.g., "#FF5722"
        this.text = data.text; // e.g., "Hot Sale!"
        this.created_at = data.created_at || new Date();
        this.updated_at = data.updated_at || new Date();
    }

    toJSON() {
        return {
            id: this.id,
            icon: this.icon,
            color: this.color,
            text: this.text,
            created_at: this.created_at,
            updated_at: this.updated_at,
        };
    }
}

module.exports = ProductAlert;
