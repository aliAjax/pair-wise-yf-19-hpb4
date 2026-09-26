import type { Cabinet, EnvReading, Specimen, StaffMember, StoreRoom } from "../types";
import { isAbnormal, latestReading } from "../env";

interface LocationCardProps {
  specimen: Specimen;
  specimens: Specimen[];
  cabinets: Cabinet[];
  rooms: StoreRoom[];
  staff: StaffMember[];
  readings: EnvReading[];
}

function LocationCard({ specimen, specimens, cabinets, rooms, staff, readings }: LocationCardProps) {
  const sameLocation = specimens.filter((s) => s.location === specimen.location);
  const cabinet = cabinets.find((c) => c.id === specimen.cabinetId) ?? null;
  const room = cabinet ? rooms.find((r) => r.id === cabinet.roomId) ?? null : null;
  const last = cabinet ? latestReading(readings, cabinet.roomId) : null;
  const staffName = (id: string) => staff.find((s) => s.id === id)?.name ?? id;

  return (
    <section className="panel">
      <h2>采集地点信息卡</h2>
      <div className="loc-card">
        <h3>{specimen.location}</h3>
        <p className="muted">
          海拔 {specimen.altitude} m · 采集人 {specimen.collector}
        </p>
        <p className="loc-habitat">{specimen.habitat}</p>
        <div>
          <small className="muted">同地点标本（{sameLocation.length}）</small>
          <div className="chips">
            {sameLocation.map((s) => (
              <span key={s.id} className="chip-static">
                {s.id}
              </span>
            ))}
          </div>
        </div>
        <div className="loc-env">
          <small className="muted">所属柜位最近读数</small>
          {cabinet ? (
            <p className="env-line">
              柜位 {cabinet.id}（{room?.name}）·{" "}
              {last ? (
                <>
                  <strong>
                    {last.temperature.toFixed(1)}℃ / {last.humidity.toFixed(0)}%RH
                  </strong>
                  <span className="muted">
                    {staffName(last.recorderId)} 登记 · {last.recordedAt}
                  </span>
                  {isAbnormal(last) ? (
                    <span className="badge badge-danger">异常</span>
                  ) : (
                    <span className="badge badge-ok">正常</span>
                  )}
                </>
              ) : (
                <span className="muted">暂无读数</span>
              )}
              {cabinet.frozen && <span className="badge badge-danger">冻结中</span>}
            </p>
          ) : (
            <p className="muted">未上柜，入库登记时请核对柜位环境。</p>
          )}
        </div>
      </div>
    </section>
  );
}

export default LocationCard;
