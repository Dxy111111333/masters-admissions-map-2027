"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Map as MapLibreMap, Marker as MapLibreMarker, StyleSpecification } from "maplibre-gl";
import { programs } from "@/lib/programs";

interface GlobeRegion {
  name: string;
  code: string;
  nameEn: string;
  count: number;
  latitude: number;
  longitude: number;
}

interface MarkerRecord {
  element: HTMLButtonElement;
  kind: "region" | "school";
  marker: MapLibreMarker;
  region: string;
}

const SATELLITE_TILES = "https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";
const GLOBAL_VIEW: [number, number] = [28, 18];
const FLAT_MAP_ZOOM = 4;

const mapStyle = {
  version: 8,
  projection: { type: "globe" },
  sources: {
    satellite: {
      type: "raster",
      tiles: [SATELLITE_TILES],
      tileSize: 256,
      maxzoom: 19,
      attribution: "Esri, Maxar, Earthstar Geographics, and the GIS User Community",
    },
  },
  layers: [
    { id: "satellite", type: "raster", source: "satellite", paint: { "raster-saturation": -0.18, "raster-contrast": 0.12, "raster-brightness-max": 0.82 } },
  ],
  sky: {
    "atmosphere-blend": ["interpolate", ["linear"], ["zoom"], 0, 1, 4, 0.72, 7, 0],
  },
} satisfies StyleSpecification;

const campusCoordinates: Record<string, [number, number]> = {
  香港大学: [114.1371, 22.283],
  香港中文大学: [114.2068, 22.4196],
  香港科技大学: [114.2654, 22.3364],
  香港城市大学: [114.1721, 22.3379],
  香港理工大学: [114.1796, 22.3041],
  香港浸会大学: [114.1796, 22.3412],
  澳门大学: [113.5453, 22.1296],
  澳门科技大学: [113.5695, 22.1496],
  澳门城市大学: [113.5557, 22.1536],
  约克大学: [-1.0527, 53.9481],
  贝尔法斯特女王大学: [-5.9343, 54.5845],
  埃克塞特大学: [-3.5357, 50.7353],
  谢菲尔德大学: [-1.4883, 53.3814],
  利兹大学: [-1.555, 53.8067],
  诺丁汉大学: [-1.1956, 52.9399],
  伯明翰大学: [-1.9305, 52.4508],
  格拉斯哥大学: [-4.2882, 55.8721],
  怀卡托大学: [175.3176, -37.787],
  坎特伯雷大学: [172.5829, -43.5235],
  奥塔哥大学: [170.5144, -45.8647],
  林肯大学: [172.4694, -43.6434],
  梅西大学: [175.616, -40.3864],
  奥克兰理工大学: [174.7666, -36.8531],
  奥克兰大学: [174.7691, -36.8523],
  "香港中文大学（深圳）": [114.2076, 22.6895],
  "香港城市大学（东莞）": [113.874, 22.8961],
};

const regionViews: Record<string, { center: [number, number]; zoom: number }> = {
  中国香港: { center: [114.18, 22.34], zoom: 9.5 },
  中国澳门: { center: [113.56, 22.15], zoom: 11 },
  英国: { center: [-2.4, 54.2], zoom: 5.25 },
  新西兰: { center: [174.1, -40.8], zoom: 4.8 },
  湾区校区: { center: [114.05, 22.78], zoom: 8.2 },
};

function createTextElement(tag: "span" | "strong" | "small" | "p", className: string, text: string) {
  const element = document.createElement(tag);
  element.className = className;
  element.textContent = text;
  return element;
}

export function InteractiveGlobe({ regions, selected, onToggle }: { regions: GlobeRegion[]; selected: string[]; onToggle: (name: string) => void }) {
  const mapHostRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const markersRef = useRef<MarkerRecord[]>([]);
  const onToggleRef = useRef(onToggle);
  const selectedRef = useRef(selected);
  const [mapReady, setMapReady] = useState(false);
  const [mapError, setMapError] = useState(false);
  const [mode, setMode] = useState<"globe" | "map">("globe");
  const [zoom, setZoom] = useState(1.25);

  onToggleRef.current = onToggle;
  selectedRef.current = selected;

  const schools = useMemo(() => {
    const grouped = new Map<string, { university: string; universityEn: string | null; region: string; city: string | null; count: number }>();
    for (const program of programs) {
      const current = grouped.get(program.universityNameZh);
      if (current) current.count += 1;
      else grouped.set(program.universityNameZh, { university: program.universityNameZh, universityEn: program.universityNameEn, region: program.region, city: program.city, count: 1 });
    }
    return [...grouped.values()];
  }, []);

  useEffect(() => {
    let disposed = false;
    if (!mapHostRef.current) return;

    const initialise = async () => {
      try {
        const maplibregl = await import("maplibre-gl");
        if (disposed || !mapHostRef.current) return;
        const map = new maplibregl.Map({
          container: mapHostRef.current,
          style: mapStyle,
          center: GLOBAL_VIEW,
          zoom: 1.25,
          minZoom: 0.8,
          maxZoom: 17,
          attributionControl: false,
          pitchWithRotate: false,
          dragRotate: true,
          renderWorldCopies: false,
          fadeDuration: 220,
        });
        mapRef.current = map;
        map.addControl(new maplibregl.NavigationControl({ showCompass: true, showZoom: true }), "bottom-right");
        map.addControl(new maplibregl.AttributionControl({ compact: true }), "bottom-left");

        const addRegionMarker = (region: GlobeRegion) => {
          const element = document.createElement("button");
          element.type = "button";
          element.className = "region-map-marker";
          element.setAttribute("aria-label", `放大查看${region.name}的院校`);
          element.append(createTextElement("strong", "region-marker-code", region.code), createTextElement("span", "region-marker-name", region.name), createTextElement("small", "region-marker-count", `${region.count} 个项目`));
          element.addEventListener("click", (event) => {
            event.stopPropagation();
            if (!selectedRef.current.includes(region.name)) onToggleRef.current(region.name);
            const view = regionViews[region.name] ?? { center: [region.longitude, region.latitude] as [number, number], zoom: 5 };
            map.flyTo({ center: view.center, zoom: view.zoom, duration: 1150, essential: true });
          });
          const marker = new maplibregl.Marker({ element, anchor: "center" }).setLngLat([region.longitude, region.latitude]).addTo(map);
          markersRef.current.push({ element, kind: "region", marker, region: region.name });
        };

        const addSchoolMarker = (school: (typeof schools)[number], index: number) => {
          const region = regions.find((item) => item.name === school.region);
          const fallback: [number, number] = [
            (region?.longitude ?? 0) + ((index % 4) - 1.5) * 0.16,
            (region?.latitude ?? 0) + ((index % 3) - 1) * 0.12,
          ];
          const coordinates = campusCoordinates[school.university] ?? fallback;
          const element = document.createElement("button");
          element.type = "button";
          element.className = "university-map-marker";
          element.setAttribute("aria-label", `${school.university}，${school.count} 个项目`);
          const pin = document.createElement("span");
          pin.className = "university-marker-pin";
          pin.append(createTextElement("span", "university-marker-core", ""));
          element.append(pin, createTextElement("span", "university-marker-label", school.university));

          const popupContent = document.createElement("article");
          popupContent.className = "school-map-popup";
          popupContent.append(createTextElement("small", "school-popup-kicker", `${school.region} · ${school.city ?? "校区"}`), createTextElement("strong", "school-popup-title", school.university));
          if (school.universityEn) popupContent.append(createTextElement("p", "school-popup-en", school.universityEn));
          popupContent.append(createTextElement("span", "school-popup-count", `已收录 ${school.count} 个硕士项目`));
          const popup = new maplibregl.Popup({ offset: 18, closeButton: false, className: "university-popup" }).setDOMContent(popupContent);
          const marker = new maplibregl.Marker({ element, anchor: "bottom" }).setLngLat(coordinates).setPopup(popup).addTo(map);
          markersRef.current.push({ element, kind: "school", marker, region: school.region });
        };

        const updateMapMode = () => {
          const nextZoom = map.getZoom();
          const nextMode = nextZoom >= FLAT_MAP_ZOOM ? "map" : "globe";
          setZoom(nextZoom);
          setMode(nextMode);
          map.setProjection({ type: nextMode === "map" ? "mercator" : "globe" });
          for (const record of markersRef.current) {
            const isRegion = record.kind === "region";
            record.element.classList.toggle("is-visible", nextMode === "globe" ? isRegion : !isRegion);
          }
        };

        map.once("load", () => {
          if (disposed) return;
          for (const region of regions) addRegionMarker(region);
          schools.forEach(addSchoolMarker);
          updateMapMode();
          setMapReady(true);
        });
        map.on("zoomend", updateMapMode);
        map.on("error", (event) => {
          if (!map.loaded() && event.error) setMapError(true);
        });
      } catch {
        if (!disposed) setMapError(true);
      }
    };

    void initialise();
    return () => {
      disposed = true;
      markersRef.current = [];
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, [regions, schools]);

  useEffect(() => {
    for (const record of markersRef.current) record.element.classList.toggle("is-selected", selected.includes(record.region));
  }, [selected]);

  const focusRegion = (region: GlobeRegion) => {
    if (!selected.includes(region.name)) onToggle(region.name);
    const view = regionViews[region.name] ?? { center: [region.longitude, region.latitude] as [number, number], zoom: 5 };
    mapRef.current?.flyTo({ center: view.center, zoom: view.zoom, duration: 1150, essential: true });
  };

  const resetGlobe = () => mapRef.current?.flyTo({ center: GLOBAL_VIEW, zoom: 1.25, bearing: 0, pitch: 0, duration: 1200, essential: true });

  return (
    <section className="globe-card" aria-labelledby="map-heading">
      <div className="globe-map-shell">
        <div ref={mapHostRef} className="globe-map" role="application" aria-label="真实卫星地球，可拖动并使用滚轮缩放查看院校位置" />
        {!mapReady && !mapError ? <div className="map-loading" aria-live="polite"><span /><p>正在连接卫星地图</p></div> : null}
        {mapError ? <div className="map-error" role="status"><strong>卫星地图暂未加载</strong><p>请检查网络连接，右侧筛选与地区快捷入口仍可正常使用。</p></div> : null}

        <div className="globe-heading">
          <span>LIVE GEOGRAPHIC VIEW</span>
          <h2 id="map-heading">在真实世界里<br />找到你的学校</h2>
          <p>拖动探索地球，滚轮放大后自动进入地区平面图。</p>
        </div>

        <div className="map-status" aria-live="polite">
          <span className="map-online-dot" />
          <div><small>{mode === "globe" ? "全球卫星视图" : "地区平面视图"}</small><strong>{zoom.toFixed(1)}×</strong></div>
        </div>

        {mode === "map" ? <button className="return-globe" type="button" onClick={resetGlobe}><span aria-hidden="true">↙</span> 返回全球视图</button> : null}

        <div className="map-zoom-guide" aria-hidden="true"><span className="mouse-glyph">↕</span><p><strong>滚轮缩放</strong><small>放大至地区后显示大学位置</small></p></div>
      </div>

      <nav className="globe-accessible-points" aria-label="地图目的地快捷选择">
        {regions.map((region) => <button type="button" aria-pressed={selected.includes(region.name)} onClick={() => focusRegion(region)} key={region.name}><span>{region.code}</span><strong>{region.name}</strong><small>{region.count} 个项目 · 点击定位</small></button>)}
      </nav>
    </section>
  );
}
