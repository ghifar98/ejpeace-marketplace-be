const productAlertService = require("../services/productAlert.service");

class ProductAlertController {
    async getAllAlerts(req, res) {
        try {
            const alerts = await productAlertService.getAllAlerts();
            res.json({ success: true, data: alerts });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    async getAlertById(req, res) {
        try {
            const alert = await productAlertService.getAlertById(req.params.id);
            res.json({ success: true, data: alert });
        } catch (error) {
            res.status(404).json({ success: false, message: error.message });
        }
    }

    async createAlert(req, res) {
        try {
            const alert = await productAlertService.createAlert(req.body);
            res.status(201).json({ success: true, data: alert });
        } catch (error) {
            res.status(400).json({ success: false, message: error.message });
        }
    }

    async updateAlert(req, res) {
        try {
            const alert = await productAlertService.updateAlert(req.params.id, req.body);
            res.json({ success: true, data: alert });
        } catch (error) {
            res.status(400).json({ success: false, message: error.message });
        }
    }

    async deleteAlert(req, res) {
        try {
            const result = await productAlertService.deleteAlert(req.params.id);
            res.json({ success: true, message: result.message });
        } catch (error) {
            res.status(400).json({ success: false, message: error.message });
        }
    }
}

module.exports = new ProductAlertController();
