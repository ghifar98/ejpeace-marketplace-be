const ProductAlertRepository = require("../models/productAlert.repository");

class ProductAlertService {
    async getAllAlerts() {
        return await ProductAlertRepository.findAll();
    }

    async getAlertById(id) {
        const alert = await ProductAlertRepository.findById(id);
        if (!alert) {
            throw new Error("Product alert not found");
        }
        return alert;
    }

    async createAlert(data) {
        // Validate required fields
        if (!data.icon || !data.color || !data.text) {
            throw new Error("Icon, color, and text are required");
        }
        const id = await ProductAlertRepository.create(data);
        return await this.getAlertById(id);
    }

    async updateAlert(id, data) {
        const existing = await ProductAlertRepository.findById(id);
        if (!existing) {
            throw new Error("Product alert not found");
        }

        // updates
        const updatedData = {
            icon: data.icon || existing.icon,
            color: data.color || existing.color,
            text: data.text || existing.text
        };

        await ProductAlertRepository.update(id, updatedData);
        return await this.getAlertById(id);
    }

    async deleteAlert(id) {
        const existing = await ProductAlertRepository.findById(id);
        if (!existing) {
            throw new Error("Product alert not found");
        }
        await ProductAlertRepository.delete(id);
        return { message: "Product alert deleted successfully" };
    }
}

module.exports = new ProductAlertService();
