// src/pages/WorldMapPage/WorldMapPage.jsx
import React, { useEffect, useMemo, useState } from "react";
import { geoNaturalEarth1, geoPath } from "d3-geo";
import { useNavigate } from "react-router-dom";
import { birdsData } from "../../data/birdsData";

const GEO_URL =
  "https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson";

// basit slug: Türkçe karakterleri sadeleştir, boşlukları tire yap
const slug = (s = "") =>
  s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // aksanları kaldır
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ş/g, "s")
    .replace(/ı/g, "i")
    .replace(/İ/g, "I")
    .replace(/ç/g, "c")
    .replace(/ö/g, "o")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();

// basit mobil tespiti (UA + pointer:coarse)
const isLikelyMobile = () => {
  if (typeof navigator !== "undefined") {
    const ua = navigator.userAgent || "";
    if (/Android|iPhone|iPad|iPod|IEMobile|Opera Mini|Mobile/i.test(ua)) {
      return true;
    }
  }
  if (typeof window !== "undefined" && window.matchMedia) {
    try {
      if (window.matchMedia("(pointer: coarse)").matches) return true;
    } catch {}
  }
  return false;
};

export default function WorldMapPage() {
  const [features, setFeatures] = useState([]);
  const [size, setSize] = useState({ w: 800, h: 450 });
  const [hover, setHover] = useState(null); // { id, name, x, y }
  const [mode, setMode] = useState("map"); // "map" | "dropdown"
  const [mobile, setMobile] = useState(false);
  const [forceDropdown, setForceDropdown] = useState(false); // 🔑 mobil + sm/md

  const navigate = useNavigate();

  // Dropdown için ülkeleri birdsData'dan topla (unique + alfabetik)
  const countryOptions = useMemo(() => {
    const s = new Set();
    for (const b of birdsData) if (b?.country) s.add(b.country);
    return Array.from(s).sort((a, b) =>
      a.localeCompare(b, "en", { sensitivity: "base" })
    );
  }, []);
  const [selectedCountry, setSelectedCountry] = useState("");

  // Mobil & breakpoint izle
  useEffect(() => {
    const updateFlags = () => {
      const m = isLikelyMobile();
      setMobile(m);
      // Tailwind sm+md: < 1024px
      const smMd =
        window.matchMedia("(max-width: 1023.98px)")?.matches ?? false;
      setForceDropdown(m || smMd);
    };
    updateFlags();
    window.addEventListener("resize", updateFlags);
    return () => window.removeEventListener("resize", updateFlags);
  }, []);

  // forceDropdown değişince modu zorla
  useEffect(() => {
    setMode(forceDropdown ? "dropdown" : "map");
  }, [forceDropdown]);

  useEffect(() => {
    if (!selectedCountry && countryOptions.length > 0) {
      setSelectedCountry(countryOptions[0]);
    }
  }, [countryOptions, selectedCountry]);

  useEffect(() => {
    // sadece harita görünümündeyken boyutları dinle
    const onResize = () => {
      const w = Math.min(window.innerWidth * 0.92, 1100);
      setSize({ w, h: (w * 9) / 16 });
    };
    onResize();
    if (!forceDropdown && mode === "map") {
      window.addEventListener("resize", onResize);
      return () => window.removeEventListener("resize", onResize);
    }
  }, [mode, forceDropdown]);

  useEffect(() => {
    // harita verisini çek
    (async () => {
      const res = await fetch(GEO_URL);
      const geo = await res.json();
      setFeatures(geo.features || []);
    })();
  }, []);

  const projection = useMemo(
    () => geoNaturalEarth1().fitSize([size.w, size.h], { type: "Sphere" }),
    [size.w, size.h]
  );
  const path = useMemo(() => geoPath(projection), [projection]);

  const handleEnter = (f) => {
    const [x, y] = path.centroid(f);
    setHover({
      id: f.id || f.properties?.name,
      name: f.properties?.name || "Unknown",
      x,
      y,
    });
  };
  const handleLeave = () => setHover(null);

  const handleClick = (name) => {
    if (!name) return;
    navigate(`/details/${slug(name)}`);
  };

  const goToSelected = () => {
    if (!selectedCountry) return;
    navigate(`/details/${slug(selectedCountry)}`);
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-[#f7fbff] to-[#eef5ff] flex flex-col">
      {/* ÜST BAŞLIK */}
      <header className="shrink-0 px-6 pt-6 pb-3">
        <div className="max-w-[1400px] mx-auto">
          <h1 className="text-2xl md:text-3xl font-extrabold text-center">
            Bird Encylopedia
          </h1>
        </div>
      </header>

      {/* İÇERİK: başlık dışındaki tüm alanı kaplar */}
      <section className="flex-1 flex items-center justify-center px-6 pb-6">
        <div className="relative h-[min(88vh,1400px)] aspect-[16/9] bg-white rounded-2xl shadow-xl p-3 flex items-center justify-center overflow-hidden">
          {/* Toggle sadece lg+ ve forceDropdown=false durumunda gösterilir */}
          {!forceDropdown && (
            <div className="absolute top-3 right-3 bg-white/90 backdrop-blur rounded-xl shadow px-1 py-1 flex gap-1">
              <button
                onClick={() => setMode("map")}
                className={`px-3 py-1.5 rounded-lg text-sm font-semibold ${
                  mode === "map"
                    ? "bg-blue-600 text-white"
                    : "hover:bg-gray-100 text-gray-700"
                }`}
                aria-pressed={mode === "map"}
              >
                Harita
              </button>
              <button
                onClick={() => setMode("dropdown")}
                className={`px-3 py-1.5 rounded-lg text-sm font-semibold ${
                  mode === "dropdown"
                    ? "bg-blue-600 text-white"
                    : "hover:bg-gray-100 text-gray-700"
                }`}
                aria-pressed={mode === "dropdown"}
              >
                Liste
              </button>
            </div>
          )}

          {/* HOVER ETİKETİ (sadece haritada) */}
          {!forceDropdown && mode === "map" && hover && (
            <div
              className="pointer-events-none absolute hidden md:block bg-black/60 text-white px-3 py-1.5 rounded-lg text-sm font-semibold"
              style={{
                left: hover.x,
                top: hover.y,
                transform: "translate(-50%, -120%)",
                whiteSpace: "nowrap",
              }}
            >
              {hover.name}
            </div>
          )}

          {/* HARİTA GÖRÜNÜMÜ (sadece lg+ ve forceDropdown=false iken) */}
          {!forceDropdown && mode === "map" && (
            <svg
              width={size.w}
              height={size.h}
              viewBox={`0 0 ${size.w} ${size.h}`}
              className="w-full h-auto"
              role="img"
              aria-label="Dünya Haritası"
            >
              <rect width={size.w} height={size.h} fill="#f3f7ff" />
              <g>
                {features.map((f) => {
                  const id = f.id || f.properties?.name;
                  const name = f.properties?.name;
                  const isHovered = hover?.id === id;

                  return (
                    <path
                      key={id}
                      d={path(f)}
                      style={{
                        fill: isHovered ? "#6ba3ff" : "#e6f0ff",
                        stroke: "#9db7e0",
                        transition:
                          "transform .15s ease-out, fill .15s ease-out, filter .15s",
                        transform: isHovered ? "scale(1.05)" : "none",
                        transformBox: "fill-box",
                        transformOrigin: "center",
                        filter: isHovered
                          ? "drop-shadow(0 0 6px rgba(0,0,0,.15))"
                          : "none",
                        outline: "none",
                        cursor: "pointer",
                      }}
                      onMouseEnter={() => handleEnter(f)}
                      onMouseLeave={handleLeave}
                      onClick={() => handleClick(name)}
                    />
                  );
                })}
              </g>
            </svg>
          )}

          {/* DROPDOWN/LİSTE GÖRÜNÜMÜ (mobil + sm/md'de ZORUNLU, lg+’da seçime bağlı) */}
          {(forceDropdown || mode === "dropdown") && (
            <div className="w-[min(92%,560px)] mx-auto bg-white rounded-2xl shadow-inner p-5 md:p-6">
              <h2 className="text-lg md:text-xl font-bold mb-4">
                Choose a country
              </h2>

              <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-end">
                <label className="flex-1">
                  <span className="block text-sm font-medium text-gray-700 mb-1">
                    Country
                  </span>
                  <select
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={selectedCountry}
                    onChange={(e) => setSelectedCountry(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") goToSelected();
                    }}
                  >
                    {countryOptions.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </label>

                <button
                  type="button"
                  onClick={goToSelected}
                  className="md:w-36 h-10 md:h-[42px] rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700"
                  aria-label="Seçilen ülkeye git"
                >
                  Seç
                </button>
              </div>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
