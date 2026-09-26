import { useState } from "react";
import type { Cabinet, EnvReading, Specimen, StoreRoom } from "../types";
import { ID_STATUS_OPTIONS, PRESSING_OPTIONS } from "../data";
import { isAbnormal, latestReading } from "../env";

interface IntakeFormProps {
  cabinets: Cabinet[];
  rooms: StoreRoom[];
  readings: EnvReading[];
  existingIds: string[];
  onAdd: (specimen: Specimen) => void;
}

function IntakeForm({ cabinets, rooms, readings, existingIds, onAdd }: IntakeFormProps) {
  const [code, setCode] = useState("");
  const [species, setSpecies] = useState("");
  const [location, setLocation] = useState("");
  const [altitude, setAltitude] = useState("");
  const [habitat, setHabitat] = useState("");
  const [collector, setCollector] = useState("");
  const [pressing, setPressing] = useState(PRESSING_OPTIONS[0]);
  const [idStatus, setIdStatus] = useState(ID_STATUS_OPTIONS[0]);
  const [cabinetId, setCabinetId] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const roomName = (id: string) => rooms.find((r) => r.id === id)?.name ?? id;
  const cabinet = cabinets.find((c) => c.id === cabinetId) ?? null;
  const last = cabinet ? latestReading(readings, cabinet.roomId) : null;

  const submit = () => {
    setSuccess("");
    const trimmedCode = code.trim();
    if (!trimmedCode) {
      setError("请填写采集号");
      return;
    }
    if (existingIds.includes(trimmedCode)) {
      setError(`采集号 ${trimmedCode} 已存在`);
      return;
    }
    if (!species.trim()) {
      setError("请填写物种名称");
      return;
    }
    const alt = Number(altitude);
    if (altitude.trim() === "" || Number.isNaN(alt) || alt < 0 || alt > 9000) {
      setError("请填写有效海拔（0~9000 m）");
      return;
    }
    if (cabinet && cabinet.frozen) {
      setError(`柜位 ${cabinet.id} 已冻结，不再接收新标本，请另选柜位`);
      return;
    }
    onAdd({
      id: trimmedCode,
      species: species.trim(),
      location: location.trim() || "未记录",
      altitude: alt,
      habitat: habitat.trim() || "未记录",
      collector: collector.trim() || "未记录",
      pressing,
      idStatus,
      cabinetId: cabinet ? cabinet.id : null,
    });
    setCode("");
    setSpecies("");
    setLocation("");
    setAltitude("");
    setHabitat("");
    setCollector("");
    setCabinetId("");
    setError("");
    setSuccess(`标本 ${trimmedCode} 已加入入库队列`);
  };

  return (
    <section className="panel form-panel">
      <div className="heading">
        <div>
          <p>新增标本</p>
          <h2>入库登记</h2>
        </div>
        <button className="primary" onClick={submit}>
          保存并加入队列
        </button>
      </div>
      <div className="field-grid">
        <label>
          <span>采集号 *</span>
          <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="如 HX-240620-01" />
        </label>
        <label>
          <span>物种名称 *</span>
          <input value={species} onChange={(e) => setSpecies(e.target.value)} placeholder="如 槭属 Acer sp." />
        </label>
        <label>
          <span>采集地点</span>
          <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="如 云南·高黎贡山" />
        </label>
        <label>
          <span>海拔（m）*</span>
          <input type="number" value={altitude} onChange={(e) => setAltitude(e.target.value)} placeholder="如 1420" />
        </label>
        <label>
          <span>采集人</span>
          <input value={collector} onChange={(e) => setCollector(e.target.value)} placeholder="采集人姓名" />
        </label>
        <label>
          <span>压制状态</span>
          <select value={pressing} onChange={(e) => setPressing(e.target.value)}>
            {PRESSING_OPTIONS.map((o) => (
              <option key={o}>{o}</option>
            ))}
          </select>
        </label>
        <label>
          <span>鉴定状态</span>
          <select value={idStatus} onChange={(e) => setIdStatus(e.target.value)}>
            {ID_STATUS_OPTIONS.map((o) => (
              <option key={o}>{o}</option>
            ))}
          </select>
        </label>
        <label>
          <span>馆藏位置（柜位）</span>
          <select value={cabinetId} onChange={(e) => setCabinetId(e.target.value)}>
            <option value="">暂不上柜</option>
            {cabinets.map((c) => (
              <option key={c.id} value={c.id} disabled={c.frozen}>
                {c.id}（{roomName(c.roomId)}）{c.frozen ? " · 冻结中" : ""}
              </option>
            ))}
          </select>
        </label>
        <label className="wide">
          <span>生境描述</span>
          <textarea
            value={habitat}
            onChange={(e) => setHabitat(e.target.value)}
            placeholder="如 常绿阔叶林缘，溪谷旁阴湿处"
          />
        </label>
      </div>

      {cabinet && (
        <div className="env-check">
          <small className="muted">上柜前环境核对 · 柜位 {cabinet.id} 最近读数</small>
          {last ? (
            <p className="env-line">
              <strong>
                {last.temperature.toFixed(1)}℃ / {last.humidity.toFixed(0)}%RH
              </strong>
              <span className="muted">
                {last.shift} · {last.recordedAt}
              </span>
              {isAbnormal(last) ? (
                <span className="badge badge-danger">异常</span>
              ) : (
                <span className="badge badge-ok">正常</span>
              )}
            </p>
          ) : (
            <p className="muted">该库房暂无读数，请先登记环境台账。</p>
          )}
          {cabinet.frozen && <p className="notice notice-danger">该柜位已冻结，不再接收新标本。</p>}
        </div>
      )}

      <div className="form-footer">
        {error && <p className="error-text">{error}</p>}
        {success && <p className="success-text">{success}</p>}
      </div>
    </section>
  );
}

export default IntakeForm;
