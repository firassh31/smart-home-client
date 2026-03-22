import express from 'express';
// Explicitly importing every single function so Express CANNOT get confused
import {
    getDevices,
    addDevice,
    updateDeviceStatus,
    deleteDevice,
    updateDeviceState,
    editDevice
} from '../controllers/deviceController.js';

const router = express.Router();

// --- THE MAP ---
router.get('/', getDevices);
router.post('/', addDevice);
router.delete('/:id', deleteDevice);
router.put('/:id', editDevice);
router.put('/:id/state', updateDeviceState);
router.put('/:id/status', updateDeviceStatus);
export default router;