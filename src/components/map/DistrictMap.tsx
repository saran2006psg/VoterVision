'use client';

import { useMemo, useState, useEffect, useRef } from 'react';
import { GeoJSON, MapContainer, TileLayer, ZoomControl, useMap } from 'react-leaflet';
import L from 'leaflet';
import type { Layer } from 'leaflet';
import { getPartyColor } from '@/lib/map/colors';
import type { ConstituencyFeatureCollection, WinnerRow, WinnersByYearMap, WinnerHistoryByAcMap } from '@/lib/map/types';
import { MapTooltip } from './MapTooltip';
import { Legend } from './Legend';
import { SidePanel } from './SidePanel';
import { CandidatesModal } from './CandidatesModal';

// A helper component to fit Tamil Nadu on initial load
// and zoom to selected constituency when clicked
function MapController({ 
  selectedFeature,
  featureCollection 
}: { 
  selectedFeature: any;
  featureCollection: ConstituencyFeatureCollection;
}) {
  const map = useMap();
  const hasInitialized = useRef(false);
  
  // ONLY fit all features on initial mount - NEVER re-run
  useEffect(() => {
    if (!hasInitialized.current && featureCollection && featureCollection.features.length > 0) {
      const timer = setTimeout(() => {
        const geojsonLayer = L.geoJSON(featureCollection as any);
        const bounds = geojsonLayer.getBounds();
        if (bounds.isValid()) {
          map.fitBounds(bounds, { padding: [80, 350], maxZoom: 7.8, animate: false });
          hasInitialized.current = true;
        }
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [featureCollection, map]);
  
  // FLY to selected feature when clicked - independent effect
  useEffect(() => {
    if (selectedFeature && hasInitialized.current) {
      const timer = setTimeout(() => {
        const layer = L.geoJSON(selectedFeature);
        const bounds = layer.getBounds();
        if (bounds.isValid()) {
          // Fly to the constituency smoothly - keep it focused
          map.flyToBounds(bounds, { 
            padding: [80, 200],
            duration: 0.7,
            maxZoom: 11,
            animate: true 
          });
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [selectedFeature, map]);
  
  return null;
}

type DistrictMapProps = {
  featureCollection: ConstituencyFeatureCollection;
  winnersByYear: WinnersByYearMap;
  winnerHistoryByAc: WinnerHistoryByAcMap;
  availableYears: number[];
  initialYear: number;
};

// Tamil Nadu ONLY - strict, tight bounds
// These bounds ensure only Tamil Nadu is visible and fills the screen
const TN_BOUNDS: [[number, number], [number, number]] = [
  [8.1, 76.4],     // Southwest
  [13.1, 80.2],    // Northeast
];
const TN_CENTER: [number, number] = [11.0, 78.3];

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
  
  // New States for Filtering & Search
  const [selectedParty, setSelectedParty] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  
  // Modal state for candidates
  const [showCandidatesModal, setShowCandidatesModal] = useState(false);
  const [selectedConstituencyId, setSelectedConstituencyId] = useState<number | null>(null);

  const winnerByAc = useMemo(() => winnersByYear[selectedYear] ?? {}, [selectedYear, winnersByYear]);

  const hoveredFeature = useMemo(() => {
    if (!hoveredAcNo) return null;
    return featureCollection.features.find((feature) => feature.properties.ac_no === hoveredAcNo) ?? null;
  }, [featureCollection.features, hoveredAcNo]);

  const selectedFeature = useMemo(() => {
    if (!selectedAcNo) return null;
    return featureCollection.features.find((feature) => feature.properties.ac_no === selectedAcNo) ?? null;
  }, [featureCollection.features, selectedAcNo]);

  // Search autocomplete options
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const query = searchQuery.toLowerCase();
    return featureCollection.features
      .filter((f) => f.properties.name.toLowerCase().includes(query) || f.properties.district.toLowerCase().includes(query))
      .slice(0, 6);
  }, [searchQuery, featureCollection]);

  const selectedWinner = selectedAcNo ? winnerByAc[selectedAcNo] ?? null : null;
  const selectedHistory = selectedAcNo ? winnerHistoryByAc[selectedAcNo] ?? [] : [];

  return (
    <div className="relative h-full w-full overflow-hidden bg-white">
      {/* Top Left Menu Panel */}
      <div className="pointer-events-none absolute left-3 top-4 z-[500] flex w-72 flex-col gap-3">
        {/* Year Selector */}
        <div className="pointer-events-auto rounded-lg border border-slate-300 bg-white/98 p-3 shadow-lg backdrop-blur-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Election Year</p>
          <select
            value={selectedYear}
            onChange={(event) => {
              const year = Number(event.target.value);
              setSelectedYear(year);
              setHoveredAcNo(null);
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

        {/* Search Bar */}
        <div className="pointer-events-auto relative rounded-lg border border-slate-300 bg-white/98 p-3 shadow-lg backdrop-blur-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">Search Constituency</p>
          <input
            type="text"
            placeholder="e.g. Coimbatore South..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)} // delay to allow clicks
            className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none ring-emerald-300 focus:ring-2 placeholder:text-slate-400"
          />
          
          {/* Autocomplete Dropdown */}
          {isSearchFocused && searchResults.length > 0 && (
            <div className="absolute left-0 mt-2 w-full overflow-hidden rounded-lg border border-slate-200 bg-white shadow-xl">
              <ul className="max-h-60 overflow-y-auto">
                {searchResults.map((feature) => (
                  <li
                    key={feature.properties.ac_no}
                    className="cursor-pointer border-b border-slate-50 px-3 py-2 text-sm last:border-b-0 hover:bg-emerald-50"
                    onMouseDown={(e) => {
                      // Using onMouseDown instead of onClick prevents input blur from hiding this before the click registers
                      e.preventDefault(); 
                      setSelectedAcNo(feature.properties.ac_no);
                      setSearchQuery(feature.properties.name);
                      setIsSearchFocused(false);
                    }}
                  >
                    <div className="font-medium text-slate-800">{feature.properties.name}</div>
                    <div className="text-xs text-slate-500">{feature.properties.district}</div>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {isSearchFocused && searchQuery.trim() && searchResults.length === 0 && (
            <div className="absolute left-0 mt-2 w-full rounded-lg border border-slate-200 bg-white p-3 text-sm text-slate-500 shadow-xl">
              No results found.
            </div>
          )}
        </div>
      </div>

      {/* Legend Map Toggle */}
      <div className="pointer-events-none absolute bottom-4 left-3 z-[500]">
        <Legend 
           selectedParty={selectedParty} 
           onToggleParty={(party) => setSelectedParty(prev => prev === party ? null : party)} 
        />
      </div>

      {hoveredFeature ? (
        <div className="pointer-events-none absolute right-4 top-4 z-[500] max-w-xs">
          <MapTooltip
            winner={winnerByAc[hoveredFeature.properties.ac_no] ?? null}
            constituencyName={hoveredFeature.properties.name}
            district={hoveredFeature.properties.district}
          />
        </div>
      ) : null}

      <MapContainer
        center={TN_CENTER}
        zoom={7.5}
        minZoom={7}
        maxZoom={14}
        zoomControl={false}
        className="h-full w-full"
        maxBounds={TN_BOUNDS}
        maxBoundsViscosity={1.0}
      >
        <ZoomControl position="bottomright" zoomInTitle="Zoom In" zoomOutTitle="Zoom Out" />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* This component will listen to selectedAcNo changes and fly the map to the bounds */}
        <MapController selectedFeature={selectedFeature} featureCollection={featureCollection} />

        <GeoJSON
          key={`${selectedYear}-${selectedParty}`} // re-render when year or party filter changes
          data={featureCollection}
          style={(feature) => {
            const acNo = feature?.properties?.ac_no as number;
            const winner = winnerByAc[acNo];
            
            // Check if it's filtered out
            const isFilteredOut = selectedParty !== null && winner?.party !== selectedParty;
            
            return {
              fillColor: winner ? getPartyColor(winner.party) : '#9CA3AF',
              weight: selectedAcNo === acNo ? 2.5 : (isFilteredOut ? 0.5 : 1),
              opacity: isFilteredOut ? 0.2 : 0.95,
              color: selectedAcNo === acNo ? '#0f172a' : (isFilteredOut ? '#cbd5e1' : '#334155'),
              fillOpacity: isFilteredOut ? 0.05 : (winner ? 0.72 : 0.35),
            };
          }}
          onEachFeature={(feature, layer: Layer) => {
            const acNo = feature.properties.ac_no as number;
            
            // Only attach tooltips & clicks if not filtered out
            const winner = winnerByAc[acNo];
            const isFilteredOut = selectedParty !== null && winner?.party !== selectedParty;
            
            if (!isFilteredOut) {
              layer.on({
                mouseover: () => setHoveredAcNo(acNo),
                mouseout: () => setHoveredAcNo((current) => (current === acNo ? null : current)),
                click: () => setSelectedAcNo(acNo),
              });
            }
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
        constituencyId={selectedWinner?.constituencyId ?? 0}
        onClose={() => setSelectedAcNo(null)}
        onViewCandidates={() => {
          if (selectedWinner?.constituencyId) {
            setSelectedConstituencyId(selectedWinner.constituencyId);
            setShowCandidatesModal(true);
          }
        }}
      />

      <CandidatesModal
        open={showCandidatesModal}
        constituencyName={selectedFeature?.properties.name ?? ''}
        constituencyId={selectedConstituencyId ?? 0}
        year={selectedYear}
        onClose={() => setShowCandidatesModal(false)}
      />
    </div>
  );
}
