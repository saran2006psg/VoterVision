import type { Feature, FeatureCollection, Geometry } from 'geojson';

export type WinnerRow = {
  constituencyId: number;
  acNo: number;
  constituencyName: string;
  district: string;
  year: number;
  party: string;
  votes: number;
  voteShare: number;
  margin: number;
  marginPercentage: number;
  turnoutPercentage: number;
  electors: number;
  validVotes: number;
  candidateName: string;
};

export type WinnerByAcMap = Record<number, WinnerRow>;

export type WinnersByYearMap = Record<number, WinnerByAcMap>;

export type WinnerHistoryByAcMap = Record<number, WinnerRow[]>;

export type ConstituencyFeatureProps = {
  ac_no: number;
  name: string;
  district: string;
};

export type ConstituencyFeature = Feature<Geometry, ConstituencyFeatureProps>;

export type ConstituencyFeatureCollection = FeatureCollection<Geometry, ConstituencyFeatureProps>;

export type MapPayload = {
  featureCollection: ConstituencyFeatureCollection;
  winnersByYear: WinnersByYearMap;
  winnerHistoryByAc: WinnerHistoryByAcMap;
  availableYears: number[];
  initialYear: number;
};
