// observer pattern implementation for device status updates
class observer {
    update(deviceId, newStatus) {
        // if a child class does not implement this method, it will throw an error
        throw new Error("observer 'update()' must be implemented.");
    }
}
//
export class MobileAppService extends observer {
    update(deviceId, newStatus) {
        console.log(`[Mobile Push]: Device ${deviceId} was turned ${newStatus.toUpperCase()}!`);
    }
}
// DeviceManager class that extends the observer class and implements the update method
class DeviceManager {
    constructor() {
        if (DeviceManager.instance) {
            return DeviceManager.instance;
        }

        this.observers = [];
        DeviceManager.instance = this;
    }

    addObserver(observer) {
        // Check if the observer has an update method before adding it to the list
        if (typeof observer.update !== 'function') {
            console.error("failed to add Observer: Object must implement an update() method.");
            return;
        }
        this.observers.push(observer);
        console.log("Observer added. Total observers:", this.observers.length);
    }

    notifyObservers(deviceId, newStatus) {
        // Notify all observers about the status change
        for (const observer of this.observers) {
            try {
                observer.update(deviceId, newStatus);
            } catch (error) {
                const observerName = observer.constructor.name || 'UnknownObserver';
                console.error(`⚠️ Observer '${observerName}' failed to process the update for device ${deviceId}:`, error.message);
            }
        }
    }
}
// Export a singleton instance of DeviceManager to ensure only one instance is used throughout the application.
export const deviceManager = new DeviceManager();
