import { useState } from "react";
import type { EnvReading, StaffMember, StoreRoom } from "../types";
import { HUMIDITY_LIMIT, SHIFTS, TEMP_LIMIT, formatTime, isAbnormal, shiftForNow } from "../env";

interface EnvLedgerProps {
  rooms: StoreRoom[];
  staff: StaffMember[];
  readings: EnvReading[];
  onAdd: (reading: EnvReading) => void;
}

function EnvLedger({ rooms, staff, readings, onAdd }: EnvLedgerProps) {
  const [roomId, setRoomId] = useState(rooms[0].id);
  const [shift, setShift] = useState(shiftForNow());
  const [temperature, setTemperature] = useState("");
  const [humidity, setHumidity] = useState("");
  const [recorderId, setRecorderId] = useState(staff[0].id);
  const [error, setError] = useState("");

  const roomName = (id: string) => rooms.find((r) => r.id === id)?.name ?? id;
  const staffName = (id: string) => staff.find((s) => s.id === id)?.name ?? id;

  const t = Number(temperature);
  const h = Number(humidity);
  const filled = temperature.trim() !== "" && humidity.trim() !== "" && !Number.isNaN(t) && !Number.isNaN(h);
  const previewAbnormal = filled ? isAbnormal({ temperature: t, humidity: h }) : null;

  const submit = () => {
    if (!filled) {
      setError("请填写有效的温度与湿度数值");
      return;
    }
    if (t < -30 || t > 50 || h < 0 || h > 100) {
      setError("数值超出合理范围（温度 -30~50℃，湿度 0~100%RH）");
      return;
    }
    onAdd({
      id: `r-${Date.now()}`,
      roomId,
      temperature: Math.round(t * 10) / 10,
      humidity: Math.round(h * 10) / 10,
      shift,
      recorderId,
      recordedAt: formatTime(new Date()),
    });
    setTemperature("");
    setHumidity("");
    setError("");
  };

  const recent = [...readings].slice(-8).reverse();

  return (
    <section className="panel">
      <div className="heading">
        <div>
          <p>环境台账</p>
          <h2>库房温湿度登记</h2>
        </div>
        <span className="limits-note">
          上限 {TEMP_LIMIT}℃ · {HUMIDITY_LIMIT}%RH，超限记异常
        </span>
      </div>
      <p className="panel-desc">
        值班员每班登记库房编号、温度与湿度；同一库房连续两班异常将冻结库内柜位——在柜标本留在原处并在队列标记待复核，冻结柜位不再接收新标本。
      </p>
      <div className="ledger">
        <div className="ledger-form">
          <label>
            <span>库房编号</span>
            <select value={roomId} onChange={(e) => setRoomId(e.target.value)}>
              {rooms.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.id}（{r.name}）
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>班次</span>
            <select value={shift} onChange={(e) => setShift(e.target.value)}>
              {SHIFTS.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </label>
          <label>
            <span>温度（℃）</span>
            <input
              type="number"
              step="0.1"
              value={temperature}
              onChange={(e) => setTemperature(e.target.value)}
              placeholder="如 21.5"
            />
          </label>
          <label>
            <span>湿度（%RH）</span>
            <input
              type="number"
              step="0.1"
              value={humidity}
              onChange={(e) => setHumidity(e.target.value)}
              placeholder="如 55"
            />
          </label>
          <label>
            <span>值班员</span>
            <select value={recorderId} onChange={(e) => setRecorderId(e.target.value)}>
              {staff.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </label>
          {previewAbnormal === true && <span className="badge badge-danger">超限，将记为异常</span>}
          {previewAbnormal === false && <span className="badge badge-ok">读数正常</span>}
          {error && <p className="error-text">{error}</p>}
          <button className="primary" onClick={submit}>
            登记本班读数
          </button>
        </div>
        <div className="ledger-list">
          {recent.map((r) => {
            const abnormal = isAbnormal(r);
            return (
              <div key={r.id} className={abnormal ? "ledger-row abnormal" : "ledger-row"}>
                <strong>{roomName(r.roomId)}</strong>
                <span className="badge badge-muted">{r.shift}</span>
                <span>
                  {r.temperature.toFixed(1)}℃ / {r.humidity.toFixed(0)}%RH
                </span>
                <span className="muted">
                  {staffName(r.recorderId)} · {r.recordedAt}
                </span>
                <span className={abnormal ? "badge badge-danger" : "badge badge-ok"}>{abnormal ? "异常" : "正常"}</span>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default EnvLedger;
