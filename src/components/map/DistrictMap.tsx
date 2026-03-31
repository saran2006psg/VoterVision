'use client';

import { useMemo, useState } from 'react';
import { GeoJSON, MapContainer, TileLayer, ZoomControl } from 'react-leaflet';
import type { Layer } from 'leaflet';
import { getPartyColor } from '@/lib/map/colors';
import type { ConstituencyFeatureCollection, WinnerRow, WinnersByYearMap, WinnerHistoryByAcMap } from '@/lib/map/types';
import { MapTooltip } from './MapTooltip';
import { Legend } from './Legend';
import { SidePanel } from './SidePanel';

type DistrictMapProps = {
  featureCollection: ConstituencyFeatureCollection;
  winnersByYear: WinnersByYearMap;
  winnerHistoryByAc: WinnerHistoryByAcMap;
  availableYears: number[];
  initialYear: number;
};

const TN_CENTER: [number, number] = [10.7905, 78.7047];

export function DistrictMap({
  featureCollection,
  winnersByYear,
  winnerHistoryByAc,
  availableYears,
  initialYear,
}: DistrictMapProps) {
  const [selectedYear, setSelectedYear] = useState(initialYear);
  const [hoveredAcNo, setHoveredAcNo] = useState<number | null>(null);
  const [selectedAcNo, setSelectedAcNo] = useState<number | null>(null);

  const winnerByAc = useMemo(() => winnersByYear[selectedYear] ?? {}, [selectedYear, winnersByYear]);

  const hoveredFeature = useMemo(() => {
    if (!hoveredAcNo) return null;
    return featureCollection.features.find((feature) => feature.properties.ac_no === hoveredAcNo) ?? null;
  }, [featureCollection.features, hoveredAcNo]);

  const selectedFeature = useMemo(() => {
    if (!selectedAcNo) return null;
    return featureCollection.features.find((feature) => feature.properties.ac_no === selectedAcNo) ?? null;
  }, [featureCollection.features, selectedAcNo]);

  const selectedWinner = selectedAcNo ? winnerByAc[selectedAcNo] ?? null : null;
  const selectedHistory = selectedAcNo ? winnerHistoryByAc[selectedAcNo] ?? [] : [];

  return (
    <div className="relative h-[calc(100vh-7rem)] min-h-[620px] overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">
      <div className="pointer-events-auto absolute left-3 top-3 z-[1000] w-56 rounded-xl border border-slate-200 bg-white/95 p-3 shadow-lg backdrop-blur-sm">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Election Year</p>
        <select
          value={selectedYear}
          onChange={(event) => {
            const year = Number(event.target.value);
            setSelectedYear(year);
            setHoveredAcNo(null);
            setSelectedAcNo(null);
          }}
          className="mt-2 w-full rounded-md border border-slate-300 bg-white px-2 py-2 text-sm outline-none ring-emerald-300 focus:ring-2"
        >
          {availableYears.map((year) => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </select>
      </div>

      <div className="pointer-events-none absolute bottom-3 left-3 z-[1000]">
        <Legend />
      </div>

      {hoveredFeature ? (
        <div className="pointer-events-none absolute right-3 top-3 z-[1000] max-w-xs">
          <MapTooltip
            winner={winnerByAc[hoveredFeature.properties.ac_no] ?? null}
            constituencyName={hoveredFeature.properties.name}
            district={hoveredFeature.properties.district}
          />
        </div>
      ) : null}

      <MapContainer
        center={TN_CENTER}
        zoom={7.2}
        minZoom={6.5}
        maxZoom={11}
        zoomControl={false}
        className="h-full w-full"
      >
        <ZoomControl position="bottomright" />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <GeoJSON
          key={selectedYear}
          data={featureCollection}
          style={(feature) => {
            const acNo = feature?.properties?.ac_no as number;
            const winner = winnerByAc[acNo];
            return {
              fillColor: winner ? getPartyColor(winner.party) : '#9CA3AF',
              weight: selectedAcNo === acNo ? 2.2 : 1,
              opacity: 0.95,
              color: selectedAcNo === acNo ? '#0f172a' : '#334155',
              fillOpacity: winner ? 0.72 : 0.35,
            };
          }}
          onEachFeature={(feature, layer: Layer) => {
            const acNo = feature.properties.ac_no as number;
            layer.on({
              mouseover: () => {
                setHoveredAcNo(acNo);
              },
              mouseout: () => {
                setHoveredAcNo((current) => (current === acNo ? null : current));
              },
              click: () => {
                setSelectedAcNo(acNo);
              },
            });
          }}
        />
      </MapContainer>

      <SidePanel
        open={selectedAcNo !== null && selectedFeature !== null}
        selectedConstituencyName={selectedFeature?.properties.name ?? ''}
        selectedDistrict={selectedFeature?.properties.district ?? ''}
        selectedWinner={selectedWinner}
        winnerHistory={selectedHistory}
        year={selectedYear}
        onClose={() => setSelectedAcNo(null)}
      />
    </div>
  );
}
