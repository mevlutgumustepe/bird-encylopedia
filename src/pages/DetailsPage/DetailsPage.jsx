// src/pages/DetailsPage/DetailsPage.jsx
import React, { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { birdsData } from "../../data/birdsData";

// slug'ı tekrar okunabilir ülke adına çevirmek için yardımcı fonksiyon
const unslug = (s = "") =>
  decodeURIComponent(s)
    .replace(/-/g, " ")
    .replace(/\b\w/g, (m) => m.toUpperCase());

// Basit hash → 0..359 arası hue üret
const hashHue = (str = "") => {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  return h % 360;
};

// XML için basit kaçış
function escapeXml(s = "") {
  return s.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case "&":
        return "&amp;";
      case "'":
        return "&apos;";
      case '"':
        return "&quot;";
      default:
        return c;
    }
  });
}

// Kendi tasarımımız placeholder SVG (gradient + başlık/alt başlık)
const makePlaceholderSVG = ({
  title = "Bird",
  subtitle = "",
  width = 1200,
  height = 800,
}) => {
  const hue = hashHue(title + subtitle);
  const hue2 = (hue + 30) % 360;

  const bg1 = `hsl(${hue} 70% 65%)`;
  const bg2 = `hsl(${hue2} 80% 55%)`;

  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="${title}">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${bg1}"/>
      <stop offset="100%" stop-color="${bg2}"/>
    </linearGradient>
    <filter id="s" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="6" stdDeviation="12" flood-color="rgba(0,0,0,.25)" />
    </filter>
    <pattern id="dots" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
      <circle cx="2" cy="2" r="2" fill="rgba(255,255,255,.22)"/>
    </pattern>
  </defs>

  <rect width="100%" height="100%" fill="url(#g)"/>
  <rect width="100%" height="100%" fill="url(#dots)" opacity=".5"/>

  <g filter="url(#s)" opacity=".18" transform="translate(${width * 0.12}, ${
    height * 0.18
  }) scale(0.75)">
    <path d="M200,180 C240,120 320,90 390,130 C440,160 470,210 460,260 C520,300 560,360 540,420 C500,540 360,520 300,470 C270,490 230,500 200,490 C170,480 150,450 150,420 C120,420 80,400 80,360 C80,320 110,300 140,300 C120,270 130,220 160,200 C175,190 188,185 200,180 Z" fill="white"/>
  </g>

  <g fill="white">
    <text x="50%" y="56%" text-anchor="middle"
      font-family="ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial"
      font-size="${Math.floor(
        height * 0.11
      )}" font-weight="800" letter-spacing="1"
      style="paint-order: stroke; stroke: rgba(0,0,0,.25); stroke-width: 6;">
      ${escapeXml(title).toUpperCase()}
    </text>
    ${
      subtitle
        ? `<text x="50%" y="66%" text-anchor="middle"
      font-family="ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial"
      font-size="${Math.floor(height * 0.045)}" font-weight="600" opacity=".95">
      ${escapeXml(subtitle)}
    </text>`
        : ""
    }
  </g>
</svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
};

// imageUrl yoksa veya hata olursa kendi placeholder'ımız (dile duyarlı)
const getLocalPlaceholder = (bird, lang) =>
  makePlaceholderSVG({
    title:
      lang === "ENG"
        ? bird.nameIng || bird.name || "Bird"
        : bird.name || bird.nameIng || "Kuş",
    subtitle: bird.scientificName || "",
    width: 1200,
    height: 800, // 3:2 oran
  });

// imageUrl varsa src/assets/images içinden gerçek görseli üret
const getImageSrc = (bird) => {
  if (bird.imageUrl) {
    const imgUrl = new URL(
      `../../assets/images/${bird.imageUrl}`,
      import.meta.url
    ).href;
    return imgUrl;
  }
  return null;
};

const DetailsPage = () => {
  const { country } = useParams();
  const countryName = unslug(country);
  const data = birdsData.filter((bD) => bD.country === countryName);

  // Dil: ENG varsayılan
  const [lang, setLang] = useState("ENG");

  const ui = {
    back: lang === "ENG" ? "← Back to Map" : "← Haritaya Dön",
    intro:
      lang === "ENG"
        ? `Bird species for ${countryName}:`
        : `${countryName} ülkesine ait kuş türleri:`,
    eng: "ENG",
    tr: "TR",
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-[#f7fbff] to-[#eef5ff] p-6">
      <div className="max-w-6xl mx-auto">
        {/* Başlık + Dil seçici + (altında) geri linki */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <h1 className="text-2xl md:text-3xl font-extrabold">
              {countryName}
            </h1>

            <div className="flex flex-col items-start sm:items-end gap-2">
              {/* Dil seçici */}
              <div className="inline-flex rounded-full bg-gray-100 p-1">
                <button
                  type="button"
                  onClick={() => setLang("ENG")}
                  className={`px-3 py-1.5 text-sm font-semibold rounded-full ${
                    lang === "ENG"
                      ? "bg-white shadow text-blue-700"
                      : "text-gray-700 hover:text-black"
                  }`}
                  aria-pressed={lang === "ENG"}
                >
                  {ui.eng}
                </button>
                <button
                  type="button"
                  onClick={() => setLang("TR")}
                  className={`px-3 py-1.5 text-sm font-semibold rounded-full ${
                    lang === "TR"
                      ? "bg-white shadow text-blue-700"
                      : "text-gray-700 hover:text-black"
                  }`}
                  aria-pressed={lang === "TR"}
                >
                  {ui.tr}
                </button>
              </div>

              {/* Dil seçeneğinin ALTINDA geri linki */}
              <Link
                to="/"
                className="text-blue-600 font-semibold hover:underline"
              >
                {ui.back}
              </Link>
            </div>
          </div>

          <p className="mt-4 text-black/70">{ui.intro}</p>
        </div>

        {/* Boş durum */}
        {data.length === 0 && (
          <div className="bg-white rounded-2xl shadow p-8 text-center">
            <p className="text-black/70">
              {lang === "ENG"
                ? "No bird data for this country yet."
                : "Bu ülke için henüz kuş verisi yok."}
            </p>
          </div>
        )}

        {/* Kartlı grid */}
        {data.length > 0 && (
          <section
            className="
              grid gap-6
              grid-cols-1
              sm:grid-cols-2
              md:grid-cols-3
              lg:grid-cols-4
            "
          >
            {data.map((bird, idx) => {
              const displayName =
                lang === "ENG"
                  ? bird.nameIng || bird.name
                  : bird.name || bird.nameIng;

              const displayDesc =
                lang === "ENG"
                  ? bird.descriptionIng || bird.description
                  : bird.description || bird.descriptionIng;

              const src = getImageSrc(bird) || getLocalPlaceholder(bird, lang);

              return (
                <article
                  key={`${bird.scientificName}-${idx}`}
                  className="
                    group bg-white rounded-2xl overflow-hidden shadow
                    ring-1 ring-black/5 hover:shadow-lg transition-shadow
                  "
                  title={bird.scientificName}
                >
                  {/* Sabit oranlı görsel alanı: oran korunur */}
                  <div
                    className="relative bg-gray-100"
                    style={{ aspectRatio: "3 / 2" }}
                  >
                    <img
                      src={src}
                      alt={displayName}
                      loading="lazy"
                      className="absolute inset-0 w-full h-full object-contain transition-transform duration-300 group-hover:scale-[1.02]"
                      onError={(e) => {
                        e.currentTarget.src = getLocalPlaceholder(bird, lang);
                      }}
                    />
                    {/* Üst sağ köşede bilimsel ad etiketi */}
                    <span
                      className="
                        absolute top-2 right-2 text-[11px] md:text-xs
                        bg-black/60 text-white px-2 py-1 rounded-full backdrop-blur
                      "
                    >
                      {bird.scientificName}
                    </span>
                  </div>

                  <div className="p-4">
                    <h3 className="text-lg font-bold leading-tight">
                      {displayName}
                    </h3>
                    <p className="text-sm text-black/70">
                      {lang === "ENG" ? bird.name || "" : bird.nameIng || ""}
                    </p>

                    <p className="mt-3 text-sm text-black/70 line-clamp-3">
                      {displayDesc}
                    </p>
                  </div>
                </article>
              );
            })}
          </section>
        )}
      </div>
    </main>
  );
};

export default DetailsPage;
