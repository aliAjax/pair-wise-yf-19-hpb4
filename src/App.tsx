import { useMemo, useState } from "react";
import "./styles.css";
import {
  Cabinet,
  CabinetRuntime,
  EnvReading,
  Specimen,
  TEMP_LIMIT,
  HUMIDITY_LIMIT,
  cabinets,
  seedReadings,
  seedSpecimens,
  isAbnormal,
  latestReading,
  consecutiveAbnormal,
} from "./data";

const project = {
  sourceNo: 9,
  id: "hxyfront-62007",
  port: 62007,
  title: "植物标本馆入库",
  domain: "植物标本馆",
  prompt:
    "开发一个植物标本馆压制标本入库前端项目，工作人员可以录入采集号、物种名称、采集地点、海拔、生境描述、采集人、压制状态、鉴定状态和馆藏位置。页面需要有入库队列、鉴定状态筛选、采集地点信息卡、馆藏柜位记录和单份标本详情页。",
  metrics: ["入库队列", "待鉴定", "已上柜", "采集点"],
};

const STATUS_FILTERS = ["全部", "待压制", "待鉴定", "已入库", "需补照", "待复核"];
const SHIFTS = ["早班", "中班", "晚班"];
const PRESSING_OPTIONS = ["未压制", "压制中", "已压制"];
const ID_STATUS_OPTIONS = ["待鉴定", "已鉴定", "存疑"];

function nowLabel(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function fmtReading(r?: EnvReading): string {
  if (!r) return "暂无读数";
  return `${r.temperature.toFixed(1)}℃ · ${r.humidity}%RH`;
}

/** 队列中展示的状态：柜位冻结时一律标为待复核 */
function displayStatus(s: Specimen, runtime: Record<string, CabinetRuntime>): string {
  return runtime[s.cabinetId]?.frozen ? "待复核" : s.status;
}

function badgeClass(status: string): string {
  if (status === "待复核" || status === "需补照") return "badge danger";
  if (status === "已入库") return "badge ok";
  if (status === "待鉴定") return "badge warn";
  return "badge muted";
}

export default function App() {
  const [specimens, setSpecimens] = useState<Specimen[]>(seedSpecimens);
  const [readings, setReadings] = useState<EnvReading[]>(seedReadings);
  const [runtime, setRuntime] = useState<Record<string, CabinetRuntime>>({
    "B-12-04": { frozen: true, frozenAt: "09-26 08:20 · 早班" },
  });
  const [filter, setFilter] = useState("全部");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const metrics = useMemo(
    () => [
      specimens.length,
      specimens.filter((s) => displayStatus(s, runtime) === "待鉴定").length,
      specimens.filter((s) => s.status === "已入库").length,
      new Set(specimens.map((s) => s.location)).size,
    ],
    [specimens, runtime]
  );

  const filteredSpecimens = specimens.filter((s) =>
    filter === "全部" ? true : displayStatus(s, runtime) === filter
  );

  const selected = specimens.find((s) => s.id === selectedId) ?? null;

  /** 登记一班环境读数；若该柜位连续两班超限则自动冻结 */
  function addReading(input: Omit<EnvReading, "id" | "time">) {
    const reading: EnvReading = {
      ...input,
      id: `r${Date.now()}`,
      time: `${nowLabel()} · ${input.shift}`,
    };
    const next = [...readings, reading];
    setReadings(next);

    const lastTwo = next.filter((r) => r.cabinetId === reading.cabinetId).slice(-2);
    const abnormal = isAbnormal(reading);
    if (
      !runtime[reading.cabinetId]?.frozen &&
      lastTwo.length === 2 &&
      lastTwo.every(isAbnormal)
    ) {
      setRuntime((prev) => ({
        ...prev,
        [reading.cabinetId]: { frozen: true, frozenAt: reading.time },
      }));
      setNotice(
        `${reading.cabinetId} 已连续两班超限，柜位自动冻结：在柜标本标为待复核，不再接收新标本。`
      );
    } else if (abnormal) {
      setNotice(
        `${reading.cabinetId} 本班读数超限（${fmtReading(reading)}），再异常一班将冻结柜位。`
      );
    } else {
      setNotice(`${reading.cabinetId} 本班读数正常（${fmtReading(reading)}），已记入台账。`);
    }
  }

  /** 另一名值班员复核确认后解冻 */
  function unfreeze(cabinetId: string, reviewer: string) {
    setRuntime((prev) => ({
      ...prev,
      [cabinetId]: { frozen: false, reviewedBy: reviewer, reviewedAt: nowLabel() },
    }));
    setNotice(`${cabinetId} 已由 ${reviewer} 复核确认，柜位解冻，恢复接收标本。`);
  }

  /** 新标本入库；冻结柜位拒收 */
  function addSpecimen(input: Omit<Specimen, "id" | "status">): boolean {
    if (runtime[input.cabinetId]?.frozen) return false;
    const status = input.pressing === "未压制" ? "待压制" : "待鉴定";
    setSpecimens((prev) => [{ ...input, id: `s${Date.now()}`, status }, ...prev]);
    setNotice(`${input.code} 已加入入库队列，馆藏位置 ${input.cabinetId}。`);
    return true;
  }

  return (
    <main className="app">
      <section className="hero">
        <p>
          {project.id} · 源提示词{project.sourceNo} · Port {project.port}
        </p>
        <h1>{project.title}</h1>
        <span>{project.prompt}</span>
        <span className="hero-note">
          库房环境台账已并入本页：值班员每班登记温湿度，超上限（温度 {TEMP_LIMIT}℃ / 湿度{" "}
          {HUMIDITY_LIMIT}%RH）记为异常；同一柜位连续两班异常即冻结，标本留在原处并标为待复核，
          异常消除后须另一名值班员复核确认方可解冻。
        </span>
      </section>

      <section className="metrics">
        {project.metrics.map((metric, index) => (
          <article key={metric}>
            <small>{metric}</small>
            <strong>{metrics[index]}</strong>
          </article>
        ))}
      </section>

      {notice && (
        <div className="notice" role="status">
          <span>{notice}</span>
          <button onClick={() => setNotice(null)} aria-label="关闭提示">
            ×
          </button>
        </div>
      )}

      <section className="workspace">
        <aside className="panel">
          <h2>{project.domain}筛选</h2>
          <div className="chips">
            {STATUS_FILTERS.map((item) => (
              <button
                key={item}
                className={filter === item ? "chip active" : "chip"}
                onClick={() => setFilter(item)}
              >
                {item}
              </button>
            ))}
          </div>
          <div className="side-note">
            <h3>环境上限</h3>
            <p>温度 ≤ {TEMP_LIMIT}℃ · 湿度 ≤ {HUMIDITY_LIMIT}%RH</p>
            <p>超限读数记为异常；同一柜位连续两班异常即冻结，解冻须另一名值班员复核。</p>
          </div>
        </aside>

        <SpecimenForm runtime={runtime} onAdd={addSpecimen} />
      </section>

      <section className="panel">
        <div className="heading">
          <div>
            <p>环境台账</p>
            <h2>库房温湿度登记</h2>
          </div>
          <span className="heading-hint">每班一次 · 超限记异常</span>
        </div>
        <div className="ledger-grid">
          <ReadingForm onAdd={addReading} />
          <LedgerList readings={readings} />
        </div>
      </section>

      <section className="panel">
        <div className="heading">
          <div>
            <p>馆藏柜位记录</p>
            <h2>柜位信息卡</h2>
          </div>
          <span className="heading-hint">连续两班异常自动冻结</span>
        </div>
        <div className="cabinet-grid">
          {cabinets.map((cab) => (
            <CabinetCard
              key={cab.id}
              cabinet={cab}
              readings={readings}
              runtime={runtime[cab.id]}
              specimenCount={specimens.filter((s) => s.cabinetId === cab.id).length}
              onUnfreeze={unfreeze}
            />
          ))}
        </div>
      </section>

      <section className="panel">
        <div className="heading">
          <div>
            <p>入库队列</p>
            <h2>近期工作台</h2>
          </div>
          <span className="heading-hint">
            {filter === "全部" ? `${filteredSpecimens.length} 份` : `${filter} · ${filteredSpecimens.length} 份`}
          </span>
        </div>
        <div className="records">
          {filteredSpecimens.map((s, index) => {
            const status = displayStatus(s, runtime);
            const latest = latestReading(readings, s.cabinetId);
            const abnormal = latest ? isAbnormal(latest) : false;
            return (
              <article
                key={s.id}
                className={status === "待复核" ? "queue-row flagged" : "queue-row"}
                onClick={() => setSelectedId(s.id)}
              >
                <b>{String(index + 1).padStart(2, "0")}</b>
                <div>
                  <h3>
                    {s.code} · {s.species}
                    <span className={badgeClass(status)}>{status}</span>
                  </h3>
                  <p>
                    {s.location} · {s.altitude} · 采集人 {s.collector}
                  </p>
                </div>
                <div className={abnormal ? "env-chip abnormal" : "env-chip"}>
                  <small>柜位 {s.cabinetId} 最近读数</small>
                  <strong>{fmtReading(latest)}</strong>
                </div>
              </article>
            );
          })}
          {filteredSpecimens.length === 0 && <p className="empty">当前筛选下暂无标本。</p>}
        </div>
      </section>

      {selected && (
        <SpecimenDetail
          specimen={selected}
          readings={readings}
          runtime={runtime[selected.cabinetId]}
          onClose={() => setSelectedId(null)}
        />
      )}
    </main>
  );
}

/* ---------- 新增标本记录 ---------- */

function SpecimenForm({
  runtime,
  onAdd,
}: {
  runtime: Record<string, CabinetRuntime>;
  onAdd: (input: Omit<Specimen, "id" | "status">) => boolean;
}) {
  const empty = {
    code: "",
    species: "",
    location: "",
    altitude: "",
    habitat: "",
    collector: "",
    pressing: "未压制",
    idStatus: "待鉴定",
    cabinetId: cabinets[0].id,
  };
  const [form, setForm] = useState(empty);
  const [error, setError] = useState("");

  const set = (key: keyof typeof empty) => (e: { target: { value: string } }) =>
    setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const frozenSelected = !!runtime[form.cabinetId]?.frozen;

  function submit() {
    if (!form.code.trim() || !form.species.trim()) {
      setError("请填写采集号和物种名称。");
      return;
    }
    const ok = onAdd({ ...form, code: form.code.trim(), species: form.species.trim() });
    if (!ok) {
      setError(`柜位 ${form.cabinetId} 已冻结，不再接收新标本，请另选柜位。`);
      return;
    }
    setError("");
    setForm(empty);
  }

  return (
    <section className="panel form-panel">
      <div className="heading">
        <div>
          <p>专业字段</p>
          <h2>新增记录</h2>
        </div>
        <button className="primary" onClick={submit}>
          保存并入队
        </button>
      </div>
      <div className="field-grid">
        <label>
          <span>采集号</span>
          <input placeholder="如 HX-240619-01" value={form.code} onChange={set("code")} />
        </label>
        <label>
          <span>物种名称</span>
          <input placeholder="如 槭属待定种" value={form.species} onChange={set("species")} />
        </label>
        <label>
          <span>采集地点</span>
          <input placeholder="如 云南大理·点苍山" value={form.location} onChange={set("location")} />
        </label>
        <label>
          <span>海拔</span>
          <input placeholder="如 1420m" value={form.altitude} onChange={set("altitude")} />
        </label>
        <label>
          <span>生境描述</span>
          <input placeholder="如 中山针阔混交林缘" value={form.habitat} onChange={set("habitat")} />
        </label>
        <label>
          <span>采集人</span>
          <input placeholder="采集人姓名" value={form.collector} onChange={set("collector")} />
        </label>
        <label>
          <span>压制状态</span>
          <select value={form.pressing} onChange={set("pressing")}>
            {PRESSING_OPTIONS.map((o) => (
              <option key={o}>{o}</option>
            ))}
          </select>
        </label>
        <label>
          <span>鉴定状态</span>
          <select value={form.idStatus} onChange={set("idStatus")}>
            {ID_STATUS_OPTIONS.map((o) => (
              <option key={o}>{o}</option>
            ))}
          </select>
        </label>
        <label>
          <span>馆藏位置</span>
          <select value={form.cabinetId} onChange={set("cabinetId")}>
            {cabinets.map((c) => (
              <option key={c.id} value={c.id} disabled={!!runtime[c.id]?.frozen}>
                {c.id}（{c.room}）{runtime[c.id]?.frozen ? " · 已冻结" : ""}
              </option>
            ))}
          </select>
        </label>
      </div>
      {frozenSelected && (
        <p className="form-error">柜位 {form.cabinetId} 已冻结，不再接收新标本。</p>
      )}
      {error && <p className="form-error">{error}</p>}
    </section>
  );
}

/* ---------- 环境台账 ---------- */

function ReadingForm({ onAdd }: { onAdd: (input: Omit<EnvReading, "id" | "time">) => void }) {
  const [cabinetId, setCabinetId] = useState(cabinets[0].id);
  const [temperature, setTemperature] = useState("");
  const [humidity, setHumidity] = useState("");
  const [staff, setStaff] = useState("");
  const [shift, setShift] = useState(SHIFTS[0]);
  const [error, setError] = useState("");

  function submit() {
    const t = Number(temperature);
    const h = Number(humidity);
    if (!staff.trim()) {
      setError("请填写值班员姓名。");
      return;
    }
    if (temperature === "" || Number.isNaN(t) || humidity === "" || Number.isNaN(h)) {
      setError("请填写有效的温度和湿度数值。");
      return;
    }
    onAdd({ cabinetId, temperature: t, humidity: h, staff: staff.trim(), shift });
    setError("");
    setTemperature("");
    setHumidity("");
  }

  return (
    <div className="reading-form">
      <label>
        <span>库房编号</span>
        <select value={cabinetId} onChange={(e) => setCabinetId(e.target.value)}>
          {cabinets.map((c) => (
            <option key={c.id} value={c.id}>
              {c.id}（{c.room}）
            </option>
          ))}
        </select>
      </label>
      <label>
        <span>温度（℃）</span>
        <input
          type="number"
          step="0.1"
          placeholder={`上限 ${TEMP_LIMIT}℃`}
          value={temperature}
          onChange={(e) => setTemperature(e.target.value)}
        />
      </label>
      <label>
        <span>湿度（%RH）</span>
        <input
          type="number"
          step="1"
          placeholder={`上限 ${HUMIDITY_LIMIT}%RH`}
          value={humidity}
          onChange={(e) => setHumidity(e.target.value)}
        />
      </label>
      <label>
        <span>值班员</span>
        <input placeholder="当班登记人" value={staff} onChange={(e) => setStaff(e.target.value)} />
      </label>
      <label>
        <span>班次</span>
        <select value={shift} onChange={(e) => setShift(e.target.value)}>
          {SHIFTS.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
      </label>
      <button className="primary" onClick={submit}>
        登记本班读数
      </button>
      {error && <p className="form-error">{error}</p>}
    </div>
  );
}

function LedgerList({ readings }: { readings: EnvReading[] }) {
  const recent = [...readings].slice(-8).reverse();
  return (
    <div className="ledger">
      {recent.map((r) => {
        const abnormal = isAbnormal(r);
        return (
          <div key={r.id} className={abnormal ? "ledger-row abnormal" : "ledger-row"}>
            <div>
              <strong>{r.cabinetId}</strong>
              <span>
                {r.time} · {r.staff}
              </span>
            </div>
            <div className="ledger-nums">
              <span>{r.temperature.toFixed(1)}℃</span>
              <span>{r.humidity}%RH</span>
              {abnormal && <em className="badge danger">异常</em>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ---------- 柜位信息卡 ---------- */

function CabinetCard({
  cabinet,
  readings,
  runtime,
  specimenCount,
  onUnfreeze,
}: {
  cabinet: Cabinet;
  readings: EnvReading[];
  runtime?: CabinetRuntime;
  specimenCount: number;
  onUnfreeze: (cabinetId: string, reviewer: string) => void;
}) {
  const [reviewer, setReviewer] = useState("");
  const [error, setError] = useState("");

  const latest = latestReading(readings, cabinet.id);
  const streak = consecutiveAbnormal(readings, cabinet.id);
  const frozen = !!runtime?.frozen;
  // 异常已消除（最新读数恢复正常）但仍冻结，等待另一名值班员复核
  const cleared = frozen && !!latest && !isAbnormal(latest);

  const status = frozen
    ? cleared
      ? "冻结中 · 待复核"
      : "已冻结"
    : streak > 0
      ? "预警"
      : "正常";
  const cardClass = frozen ? "cabinet-card frozen" : streak > 0 ? "cabinet-card warning" : "cabinet-card";

  function confirmUnfreeze() {
    const name = reviewer.trim();
    if (!name) {
      setError("请填写复核人姓名。");
      return;
    }
    if (latest && name === latest.staff) {
      setError(`须由另一名值班员复核（本班登记人：${latest.staff}）。`);
      return;
    }
    onUnfreeze(cabinet.id, name);
    setReviewer("");
    setError("");
  }

  return (
    <article className={cardClass}>
      <div className="cabinet-head">
        <div>
          <h3>{cabinet.id}</h3>
          <small>
            {cabinet.room} · {cabinet.note}
          </small>
        </div>
        <span
          className={
            status === "正常" ? "badge ok" : status === "预警" ? "badge warn" : "badge danger"
          }
        >
          {status}
        </span>
      </div>

      <div className="reading-now">
        {latest ? (
          <>
            <strong className={isAbnormal(latest) ? "over" : ""}>
              {latest.temperature.toFixed(1)}℃
            </strong>
            <strong className={isAbnormal(latest) ? "over" : ""}>{latest.humidity}%RH</strong>
            <small>
              最近读数 · {latest.time} · {latest.staff}
            </small>
          </>
        ) : (
          <small>暂无读数</small>
        )}
      </div>

      <p className="cabinet-meta">
        在柜标本 {specimenCount} 份
        {streak > 0 && ` · 连续异常 ${streak} 班`}
        {frozen && runtime?.frozenAt && ` · ${runtime.frozenAt} 起冻结`}
        {!frozen && runtime?.reviewedBy && ` · 上次解冻由 ${runtime.reviewedBy} 复核`}
      </p>

      {frozen && !cleared && (
        <p className="cabinet-note">最新读数仍超上限，柜位继续冻结，标本留在原处，不接收新标本。</p>
      )}
      {frozen && cleared && (
        <p className="cabinet-note">读数已恢复正常，须另一名值班员复核确认后解冻。</p>
      )}

      {cleared && (
        <div className="review-form">
          <input
            placeholder="复核人（非本班登记人）"
            value={reviewer}
            onChange={(e) => setReviewer(e.target.value)}
          />
          <button className="primary" onClick={confirmUnfreeze}>
            复核解冻
          </button>
        </div>
      )}
      {error && <p className="form-error">{error}</p>}
    </article>
  );
}

/* ---------- 单份标本详情 ---------- */

function SpecimenDetail({
  specimen,
  readings,
  runtime,
  onClose,
}: {
  specimen: Specimen;
  readings: EnvReading[];
  runtime?: CabinetRuntime;
  onClose: () => void;
}) {
  const latest = latestReading(readings, specimen.cabinetId);
  const frozen = !!runtime?.frozen;
  const fields: Array<[string, string]> = [
    ["采集号", specimen.code],
    ["物种名称", specimen.species],
    ["采集地点", specimen.location],
    ["海拔", specimen.altitude],
    ["生境描述", specimen.habitat],
    ["采集人", specimen.collector],
    ["压制状态", specimen.pressing],
    ["鉴定状态", specimen.idStatus],
    ["馆藏位置", specimen.cabinetId],
    ["队列状态", frozen ? "待复核" : specimen.status],
  ];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="heading">
          <div>
            <p>单份标本详情</p>
            <h2>
              {specimen.code} · {specimen.species}
            </h2>
          </div>
          <button onClick={onClose}>关闭</button>
        </div>
        <div className="detail-grid">
          {fields.map(([k, v]) => (
            <div key={k}>
              <small>{k}</small>
              <span>{v || "—"}</span>
            </div>
          ))}
        </div>
        <div className={frozen ? "detail-env frozen" : "detail-env"}>
          <h3>所属柜位最近读数</h3>
          {latest ? (
            <p>
              柜位 {specimen.cabinetId} · {latest.temperature.toFixed(1)}℃ · {latest.humidity}
              %RH（{latest.time} · {latest.staff}）
              {isAbnormal(latest) && <em className="badge danger">超限</em>}
            </p>
          ) : (
            <p>柜位 {specimen.cabinetId} 暂无环境读数。</p>
          )}
          {frozen && (
            <p className="cabinet-note">
              该柜位已冻结：标本留在原处并标为待复核，解冻前不再接收新标本。
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
