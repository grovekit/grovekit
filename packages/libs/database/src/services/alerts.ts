
import { STRING } from '@grovekit/homie-core';
import { ensureTrx, DB } from '../client.js';
import { ALERT_STATUS, countDeviceAlerts, insertDeviceAlert, selectDeviceAlertByDeviceIdAndAlertId, updateDeviceAlertByDeviceIdAndAlertId } from '../tables/device-alerts.js';
import { selectDeviceByHomieId, updateDeviceById } from '../tables/devices.js';

export const ingestDeviceAlert = async (db: DB, device_homie_id: string, alert_id: string, message: string) => {
  return ensureTrx(db, async (trx) => {
    const device = await selectDeviceByHomieId(trx, device_homie_id);
    if (!device) {
      return;
    }
    let alert = await selectDeviceAlertByDeviceIdAndAlertId(trx, device.id, alert_id);
    if (message === STRING.NULL) {
      if (alert) {
        alert = await updateDeviceAlertByDeviceIdAndAlertId(trx, device.id, alert_id, {
          status: ALERT_STATUS.CLOSED,
          updated_at: Date.now()
        });
      }
    } else {
      if (alert) {
        alert = await updateDeviceAlertByDeviceIdAndAlertId(trx, device.id, alert_id, {
          status: ALERT_STATUS.OPEN,
          message,
          updated_at: Date.now()
        });
      } else {
        alert = await insertDeviceAlert(trx, {
          device_id: device.id,
          alert_id,
          status: ALERT_STATUS.OPEN,
          message,
          created_at: Date.now(),
          updated_at: Date.now()
        });
      }
    }
    const open_alerts = await countDeviceAlerts(trx, { status: ALERT_STATUS.OPEN, device_id: device.id });
    const total_alerts = await countDeviceAlerts(trx, { device_id: device.id });
    await updateDeviceById(trx, device.id, { open_alerts, total_alerts });
    return alert;
  });
};
