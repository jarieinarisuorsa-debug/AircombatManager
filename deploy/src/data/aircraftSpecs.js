export const RULE_SCALE = 12;
export const TOLERANCE_PERCENT = 5;
export const WING_THICKNESS_PERCENT = 10;
export const OTHER_TOLERANCE_CM = 2;
export const MAX_STREAMER_CUTTER_MM = 297;

export const AIRCRAFT_TYPES = [
  { name: "Supermarine Spitfire Mk IX", realSpanM: 11.23, realLengthM: 9.47 },
  { name: "Messerschmitt Bf 109 G-6", realSpanM: 9.92, realLengthM: 8.95 },
  { name: "P-51D Mustang", realSpanM: 11.28, realLengthM: 9.83 },
  { name: "Focke-Wulf Fw 190 A-8", realSpanM: 10.51, realLengthM: 9.00 },
  { name: "Yakovlev Yak-9", realSpanM: 9.74, realLengthM: 8.50 },
  { name: "Mitsubishi A6M5 Zero", realSpanM: 11.00, realLengthM: 9.12 },
  { name: "Ilyushin Il-2m3", realSpanM: 14.60, realLengthM: 11.60 },
  { name: "Hawker Hurricane Mk I", realSpanM: 12.19, realLengthM: 9.58 },
  { name: "F4U Corsair", realSpanM: 12.50, realLengthM: 10.12 },
  { name: "Grumman F6F Hellcat", realSpanM: 13.06, realLengthM: 10.24 },
  { name: "Macchi C.202 Folgore", realSpanM: 10.58, realLengthM: 8.85 },
  { name: "Nakajima Ki-84 Hayate", realSpanM: 11.23, realLengthM: 9.92 },
  { name: "Fairey Fulmar", realSpanM: 14.14, realLengthM: 12.24 },
  { name: "Tupolev Tu-2 (Twin)", realSpanM: 18.86, realLengthM: 13.80 }
];

/**
 * Calculates the target 1:12 dimensions in cm based on real meters.
 */
export function calculateModelSpecs(realM) {
  const targetCm = (realM * 100) / RULE_SCALE;
  const minCm = targetCm * (1 - TOLERANCE_PERCENT / 100);
  const maxCm = targetCm * (1 + TOLERANCE_PERCENT / 100);
  
  return {
    target: targetCm.toFixed(1),
    min: minCm.toFixed(1),
    max: maxCm.toFixed(1)
  };
}
