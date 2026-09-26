import { useState } from "react";
import "./styles.css";
import type { Cabinet, EnvReading, Specimen } from "./types";
import { buildInitialCabinets, rooms, seedReadings, seedSpecimens, staff } from "./data";
import { applyReading, formatTime, reviewUnfreeze } from "./env";
import EnvLedger from "./components/EnvLedger";
import CabinetBoard from "./components/CabinetBoard";
import QueuePanel from "./components/QueuePanel";
import LocationCard from "./components/LocationCard";
import SpecimenDetail from "./components/SpecimenDetail";
import IntakeForm from "./components/IntakeForm";

const FILTERS = ["全部", "待鉴定", "鉴定中", "已鉴定", "需补照", "待复核"];

function App() {
  const [readings, setReadings] = useState<EnvReading[]>(seedReadings);
  const [cabinets, setCabinets] = useState<Cabinet[]>(buildInitialCabinets);
  const [specimens, setSpecimens] = useState<Specimen[]>(seedSpecimens);
  const [selectedId, setSelectedId] = useState<string>(seedSpecimens[0].id);
  const [filter, setFilter] = useState<string>("全部");

  const selected = specimens.find((s) => s.id === selectedId) ?? specimens[0];

  const isSpecimenPending = (specimen: Specimen) =>
    specimen.cabinetId !== null && cabinets.some((c) => c.id === specimen.cabinetId && c.frozen);

  const filteredSpecimens = specimens.filter((s) => {
    if (filter === "全部") return true;
    if (filter === "待复核") return isSpecimenPending(s);
    return s.idStatus === filter;
  });

  const addReading = (reading: EnvReading) => {
    setCabinets((current) => applyReading(current, readings, reading));
    setReadings((current) => [...current, reading]);
  };

  const reviewCabinet = (cabinetId: string, reviewerId: string): { ok: boolean; message?: string } => {
    const cabinet = cabinets.find((c) => c.id === cabinetId);
    if (!cabinet) return { ok: false, message: "柜位不存在" };
    const result = reviewUnfreeze(cabinet, reviewerId, readings, formatTime(new Date()));
    if (!result.ok) return { ok: false, message: result.message };
    setCabinets((current) => current.map((c) => (c.id === cabinetId ? result.cabinet : c)));
    return { ok: true };
  };

  const addSpecimen = (specimen: Specimen) => {
    setSpecimens((current) => [...current, specimen]);
    setSelectedId(specimen.id);
    setFilter("全部");
  };

  const metrics = [
    { label: "入库队列", value: specimens.length },
    { label: "待鉴定", value: specimens.filter((s) => s.idStatus === "待鉴定").length },
    { label: "已上柜", value: specimens.filter((s) => s.cabinetId !== null).length },
    { label: "冻结柜位", value: cabinets.filter((c) => c.frozen).length },
  ];

  return (
    <main className="app">
      <section className="hero">
        <p>hxyfront-62007 · 植物标本馆 · Port 62007</p>
        <h1>压制标本入库工作台</h1>
        <span>
          录入采集号、物种名称、采集地点、海拔、生境描述、采集人、压制状态、鉴定状态与馆藏位置。
          入库页内置库房环境台账：值班员每班登记库房温湿度，超上限记为异常；同一库房连续两班异常即冻结库内柜位，
          在柜标本留在原处并在队列标记“待复核”，冻结期间不再接收新标本；异常消除后须另一名值班员复核确认方可解冻。
        </span>
      </section>

      <section className="metrics">
        {metrics.map((m) => (
          <article key={m.label}>
            <small>{m.label}</small>
            <strong>{m.value}</strong>
          </article>
        ))}
      </section>

      <EnvLedger rooms={rooms} staff={staff} readings={readings} onAdd={addReading} />

      <CabinetBoard
        cabinets={cabinets}
        rooms={rooms}
        staff={staff}
        readings={readings}
        specimens={specimens}
        onReview={reviewCabinet}
      />

      <div className="workspace">
        <aside className="side">
          <section className="panel">
            <h2>鉴定状态筛选</h2>
            <div className="chips">
              {FILTERS.map((f) => (
                <button key={f} className={f === filter ? "active" : ""} onClick={() => setFilter(f)}>
                  {f}
                </button>
              ))}
            </div>
            <p className="muted small note">“待复核”指所在柜位被冻结、标本留在原处等待环境复核的条目。</p>
          </section>
          <LocationCard
            specimen={selected}
            specimens={specimens}
            cabinets={cabinets}
            rooms={rooms}
            staff={staff}
            readings={readings}
          />
        </aside>

        <QueuePanel
          specimens={filteredSpecimens}
          cabinets={cabinets}
          readings={readings}
          selectedId={selected.id}
          onSelect={setSelectedId}
        />
      </div>

      <SpecimenDetail specimen={selected} cabinets={cabinets} rooms={rooms} staff={staff} readings={readings} />

      <IntakeForm
        cabinets={cabinets}
        rooms={rooms}
        readings={readings}
        existingIds={specimens.map((s) => s.id)}
        onAdd={addSpecimen}
      />
    </main>
  );
}

export default App;
