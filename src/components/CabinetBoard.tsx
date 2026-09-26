import { useState } from "react";
import type { Cabinet, EnvReading, Specimen, StaffMember, StoreRoom } from "../types";
import { isAbnormal, latestReading } from "../env";

interface CabinetBoardProps {
  cabinets: Cabinet[];
  rooms: StoreRoom[];
  staff: StaffMember[];
  readings: EnvReading[];
  specimens: Specimen[];
  onReview: (cabinetId: string, reviewerId: string) => { ok: boolean; message?: string };
}

function CabinetBoard({ cabinets, rooms, staff, readings, specimens, onReview }: CabinetBoardProps) {
  const [reviewerBy, setReviewerBy] = useState<Record<string, string>>({});
  const [errorBy, setErrorBy] = useState<Record<string, string>>({});

  const roomName = (id: string) => rooms.find((r) => r.id === id)?.name ?? id;
  const staffName = (id: string | null) => staff.find((s) => s.id === id)?.name ?? "—";

  const confirmReview = (cabinet: Cabinet) => {
    const reviewerId = reviewerBy[cabinet.id];
    if (!reviewerId) {
      setErrorBy((m) => ({ ...m, [cabinet.id]: "请选择复核值班员" }));
      return;
    }
    const result = onReview(cabinet.id, reviewerId);
    setErrorBy((m) => ({ ...m, [cabinet.id]: result.ok ? "" : result.message ?? "复核未通过" }));
  };

  return (
    <section className="panel">
      <div className="heading">
        <div>
          <p>馆藏柜位记录</p>
          <h2>柜位环境状态</h2>
        </div>
      </div>
      <div className="cabinet-grid">
        {cabinets.map((cabinet) => {
          const last = latestReading(readings, cabinet.roomId);
          const housed = specimens.filter((s) => s.cabinetId === cabinet.id);
          return (
            <article key={cabinet.id} className={cabinet.frozen ? "cabinet-card frozen" : "cabinet-card"}>
              <div className="cabinet-head">
                <h3>柜位 {cabinet.id}</h3>
                {!cabinet.frozen && <span className="badge badge-ok">正常</span>}
                {cabinet.frozen && !cabinet.pendingReview && <span className="badge badge-danger">冻结中</span>}
                {cabinet.frozen && cabinet.pendingReview && <span className="badge badge-warn">待复核解冻</span>}
              </div>
              <p className="muted">
                {roomName(cabinet.roomId)} · 在柜 {housed.length} 份
              </p>
              <p className="env-line">
                最近读数：
                {last ? (
                  <>
                    <strong>
                      {last.temperature.toFixed(1)}℃ / {last.humidity.toFixed(0)}%RH
                    </strong>
                    <span className="muted">
                      {last.shift} · {staffName(last.recorderId)} · {last.recordedAt}
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
              {housed.length > 0 && (
                <p className="muted small">
                  在柜标本：{housed.map((s) => s.id).join("、")}
                  {cabinet.frozen && "（留在原处，队列已标记待复核）"}
                </p>
              )}
              {cabinet.frozen && !cabinet.pendingReview && (
                <p className="notice notice-danger">
                  {cabinet.freezeReason}，{cabinet.frozenAt} 起冻结，不再接收新标本；登记一班正常读数后进入待复核。
                </p>
              )}
              {cabinet.frozen && cabinet.pendingReview && (
                <div className="review-box">
                  <p className="notice notice-warn">异常已消除，须由另一名值班员复核确认后才解冻，未复核前保持冻结。</p>
                  <div className="review-row">
                    <select
                      value={reviewerBy[cabinet.id] ?? ""}
                      onChange={(e) => setReviewerBy((m) => ({ ...m, [cabinet.id]: e.target.value }))}
                    >
                      <option value="">选择复核值班员</option>
                      {staff.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                    <button className="primary" onClick={() => confirmReview(cabinet)}>
                      复核解冻
                    </button>
                  </div>
                  {errorBy[cabinet.id] && <p className="error-text">{errorBy[cabinet.id]}</p>}
                </div>
              )}
              {!cabinet.frozen && cabinet.reviewedBy && (
                <p className="muted small">
                  最近解冻：{staffName(cabinet.reviewedBy)} 复核 · {cabinet.reviewedAt}
                </p>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}

export default CabinetBoard;
