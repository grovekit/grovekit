
import { ensureTrx, DB } from "../client.js";
import { selectDeviceById } from "../tables/devices.js";
import { selectPropertyById } from "../tables/properties.js";
import { deleteReportById, deleteReportPropertiesByReportId, insertReportProperty, selectReportById, selectReportProperties, selectReportPropertyById, updateReportById, updateReportPropertyById, updateReportPropertyByReportAndPropertyId, type ExtendedSelectableReportProperty, type SelectableReportProperty, type UpdateableReport, type UpdateableReportProperty } from "../tables/reports.js";

const colors = ['red', 'blue', 'green', 'yellow', 'orange', 'purple', 'pink', 'black', 'white', 'gray'];
let coloridx = 0;
const pickColor = () => colors[coloridx++ % colors.length];

export const addPropertiesToReport = async (db: DB, report_id: string, property_ids: string[]): Promise<void> => {
  await ensureTrx(db, async (trx) => {
    const report = await selectReportById(trx, report_id as string);
    if (!report) {
      throw new Error('report not found')
    }
    const report_properties = await selectReportProperties(trx, { report_id });
    let next_report_property_order = report_properties.length;
    for (const property_id of property_ids) {
      const property = await selectPropertyById(trx, property_id as string);
      if (!property) {
        throw new Error('property not found');
      }
      const device = (await selectDeviceById(trx, property.device_id))!;
      let report_property = report_properties.find(p => p.property_id === property_id);
      if (report_property) {
        const { id } = await updateReportPropertyById(trx, report_property.id, {
          label: `${device.name ?? device.id} ${property.name ?? property.id}`,
        });
        report_property = (await selectReportPropertyById(trx, id))!;
      } else {
        const { id } = await insertReportProperty(trx, {
          report_id,
          property_id,
          order: next_report_property_order++,
          color: pickColor(),
          label: `${device.name ?? device.id} ${property.name ?? property.id}`,
          style: 'line',
          aggr_op: 'avg',
          aggr_unit: 'hour',
        });
        report_property = (await selectReportPropertyById(trx, id))!;
      }
    }
  });
};

export const removeReport = async (db: DB, report_id: string): Promise<void> => {
  await ensureTrx(db, async (trx) => {
    await deleteReportPropertiesByReportId(trx, report_id);
    await deleteReportById(trx, report_id);
  });
};

export type SeriesUpdate = Omit<UpdateableReportProperty, 'report_id' | 'property_id' | 'id'> & { property_id: string };

export const updateReportOpts = async (db: DB, id: string, opts: Omit<UpdateableReport, 'id'>, series: SeriesUpdate[]) => {
  await ensureTrx(db, async (trx) => {
    await updateReportById(trx, id, {
      title: opts.title,
      timezone: opts.timezone,
      from: opts.from,
      to: opts.to,
      aggr_win: opts.aggr_win,
    });
    let series_order = 0;
    for (const s of series) {
      await updateReportPropertyByReportAndPropertyId(trx, id, s.property_id, {
        color: s.color,
        label: s.label,
        style: s.style,
        order: series_order++,
        aggr_op: s.aggr_op,
        aggr_unit: s.aggr_unit,
      });
    }
  });
};
