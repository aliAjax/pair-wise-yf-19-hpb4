import type { Cabinet, EnvReading, Specimen } from "../types";
import { isAbnormal, latestReading } from "../env";

interface QueuePanelProps {
  specimens: Specimen[];
  cabinets: Cabinet[];
  readings: EnvReading[];
  selectedId: string;
  onSelect: (id: string) => void;
}

function QueuePanel({ specimens, cabinets, readings, selectedId, onSelect }: QueuePanelProps) {
  return (
    <section className="panel">
      <div className="heading">
        <div>
          <p>入库队列</p>
          <h2>待处理标本</h2>
        </div>
        <span className="badge badge-muted">{specimens.length} 份</span>
      </div>
      <div className="queue">
        {specimens.map((s) => {
          const cabinet = cabinets.find((c) => c.id === s.cabinetId) ?? null;
          const last = cabinet ? latestReading(readings, cabinet.roomId) : null;
          const pendingReview = cabinet?.frozen === true;
          return (
            <button
              key={s.id}
              className={s.id === selectedId ? "queue-item selected" : "queue-item"}
              onClick={() => onSelect(s.id)}
            >
              <span className="line1">
                <strong>
                  {s.id} · {s.species}
                </strong>
                <span className="badges">
                  <span className="badge badge-info">{s.idStatus}</span>
                  <span className="badge badge-muted">{s.pressing}</span>
                  {pendingReview && <span className="badge badge-danger">待复核</span>}
                </span>
              </span>
              <span className="env-line">
                {cabinet ? (
                  <>
                    柜位 {cabinet.id} · 最近读数{" "}
                    {last ? (
                      <>
                        <strong>
                          {last.temperature.toFixed(1)}℃ / {last.humidity.toFixed(0)}%RH
                        </strong>
                        <span className="muted">
                          （{last.shift} {last.recordedAt}）
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
                  </>
                ) : (
                  <span className="muted">未上柜 · 入库登记时请核对柜位环境</span>
                )}
              </span>
            </button>
          );
        })}
        {specimens.length === 0 && <p className="muted">当前筛选下没有标本。</p>}
      </div>
    </section>
  );
}

export default QueuePanel;
