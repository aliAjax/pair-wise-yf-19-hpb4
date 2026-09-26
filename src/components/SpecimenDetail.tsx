import type { Cabinet, EnvReading, Specimen, StaffMember, StoreRoom } from "../types";
import { isAbnormal, latestReading } from "../env";

interface SpecimenDetailProps {
  specimen: Specimen;
  cabinets: Cabinet[];
  rooms: StoreRoom[];
  staff: StaffMember[];
  readings: EnvReading[];
}

function SpecimenDetail({ specimen, cabinets, rooms, staff, readings }: SpecimenDetailProps) {
  const cabinet = cabinets.find((c) => c.id === specimen.cabinetId) ?? null;
  const room = cabinet ? rooms.find((r) => r.id === cabinet.roomId) ?? null : null;
  const last = cabinet ? latestReading(readings, cabinet.roomId) : null;
  const staffName = (id: string) => staff.find((s) => s.id === id)?.name ?? id;

  return (
    <section className="panel">
      <div className="heading">
        <div>
          <p>单份详情</p>
          <h2>
            {specimen.id} · {specimen.species}
          </h2>
        </div>
        {cabinet?.frozen && <span className="badge badge-danger">柜位冻结 · 待复核</span>}
      </div>
      <div className="detail-grid">
        <div className="detail-cell">
          <small>采集号</small>
          {specimen.id}
        </div>
        <div className="detail-cell">
          <small>物种名称</small>
          {specimen.species}
        </div>
        <div className="detail-cell">
          <small>采集地点</small>
          {specimen.location}
        </div>
        <div className="detail-cell">
          <small>海拔</small>
          {specimen.altitude} m
        </div>
        <div className="detail-cell">
          <small>采集人</small>
          {specimen.collector}
        </div>
        <div className="detail-cell">
          <small>压制状态</small>
          {specimen.pressing}
        </div>
        <div className="detail-cell">
          <small>鉴定状态</small>
          {specimen.idStatus}
        </div>
        <div className="detail-cell">
          <small>馆藏位置</small>
          {cabinet ? `柜位 ${cabinet.id}（${room?.name ?? cabinet.roomId}）` : "未上柜"}
        </div>
        <div className="detail-cell">
          <small>库房编号</small>
          {cabinet ? cabinet.roomId : "—"}
        </div>
        <div className="detail-cell wide">
          <small>生境描述</small>
          {specimen.habitat}
        </div>
      </div>
      <div className="env-block">
        <h3>所属柜位最近读数</h3>
        {cabinet ? (
          <>
            <p className="env-line">
              柜位 {cabinet.id}（{room?.name}）·{" "}
              {last ? (
                <>
                  <strong>
                    {last.temperature.toFixed(1)}℃ / {last.humidity.toFixed(0)}%RH
                  </strong>
                  <span className="muted">
                    {last.shift} · {staffName(last.recorderId)} 登记 · {last.recordedAt}
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
            </p>
            {cabinet.frozen && !cabinet.pendingReview && (
              <p className="notice notice-danger">
                柜位冻结中（{cabinet.freezeReason}，{cabinet.frozenAt}）。标本留在原处，队列已标记待复核；登记一班正常读数后进入待复核解冻。
              </p>
            )}
            {cabinet.frozen && cabinet.pendingReview && (
              <p className="notice notice-warn">异常已消除，等待另一名值班员复核确认后解冻。</p>
            )}
            {!cabinet.frozen && <p className="notice notice-info">柜位状态正常，可正常出入库。</p>}
          </>
        ) : (
          <p className="muted">该标本尚未上柜；入库登记选择柜位时会同步显示该柜位最近读数，请先核对环境再上柜。</p>
        )}
      </div>
    </section>
  );
}

export default SpecimenDetail;
