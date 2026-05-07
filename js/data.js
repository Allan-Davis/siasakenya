// ===== DATA MODULE =====
const Data = (() => {
  let summary = null;
  let countyCache = {};

  const TOTAL_VOTERS = 21630530;
  const COUNTIES_COUNT = 47;
  const CONSTITUENCIES_COUNT = 290;
  const WARDS_COUNT = 1450;
  const STATIONS_COUNT = 45234;

  const REGIONS = {
    'Coast': ['MOMBASA','KILIFI','KWALE','LAMU','TAITA/TAVETA','TANA RIVER'],
    'North Eastern': ['GARISSA','WAJIR','MANDERA'],
    'Eastern': ['MARSABIT','ISIOLO','MERU','THARAKA NITHI','EMBU','KITUI','MACHAKOS','MAKUENI'],
    'Central': ['KIAMBU','MURANG\'A','KIRINYAGA','NYANDARUA','NYERI'],
    'Rift Valley': ['TURKANA','WEST POKOT','SAMBURU','TRANS NZOIA','UASIN GISHU','ELGEYO/MARAKWET','NANDI','BARINGO','LAIKIPIA','NAKURU','NAROK','KAJIADO','KERICHO','BOMET'],
    'Nyanza': ['SIAYA','KISUMU','HOMA BAY','MIGORI','KISII','NYAMIRA'],
    'Western': ['KAKAMEGA','VIHIGA','BUNGOMA','BUSIA'],
    'Nairobi': ['NAIROBI CITY']
  };

  const POSITIONS = [
    { id: 'president', name: 'President', level: 'national', icon: '🇰🇪' },
    { id: 'governor', name: 'Governor', level: 'county', icon: '🏛️' },
    { id: 'senator', name: 'Senator', level: 'county', icon: '⚖️' },
    { id: 'womens_rep', name: "Women's Rep", level: 'county', icon: '👩‍⚖️' },
    { id: 'mp', name: 'MP (Constituency)', level: 'constituency', icon: '🏅' },
    { id: 'mca', name: 'MCA (Ward)', level: 'ward', icon: '🏘️' }
  ];

  async function loadSummary() {
    if (summary) return summary;
    try {
      const r = await fetch('data/summary.json');
      summary = await r.json();
      return summary;
    } catch(e) {
      console.error('Failed to load summary:', e);
      return {};
    }
  }

  async function loadCounty(code) {
    if (countyCache[code]) return countyCache[code];
    try {
      const r = await fetch(`data/county_${code}.json`);
      const data = await r.json();
      countyCache[code] = data;
      return data;
    } catch(e) {
      return null;
    }
  }

  async function getCounties() {
    const s = await loadSummary();
    return Object.entries(s).map(([name, d]) => ({
      name, code: d.code, voters: d.voters
    })).sort((a,b) => a.name.localeCompare(b.name));
  }

  async function getConstituencies(countyName) {
    const s = await loadSummary();
    if (!s[countyName]) return [];
    return Object.entries(s[countyName].constituencies).map(([name, d]) => ({
      name, code: d.code, voters: d.voters,
      wardCount: Object.keys(d.wards).length
    })).sort((a,b) => a.name.localeCompare(b.name));
  }

  async function getWards(countyName, constituencyName) {
    const s = await loadSummary();
    if (!s[countyName]?.constituencies[constituencyName]) return [];
    return Object.entries(s[countyName].constituencies[constituencyName].wards).map(([name, d]) => ({
      name, code: d.code, voters: d.voters, stationCount: d.station_count
    })).sort((a,b) => a.name.localeCompare(b.name));
  }

  async function getStations(countyName, constituencyName, wardName) {
    const s = await loadSummary();
    if (!s[countyName]?.constituencies[constituencyName]?.wards[wardName]) return [];
    const countyCode = s[countyName].code;
    const countyData = await loadCounty(countyCode);
    if (!countyData) return [];
    return (countyData.constituencies[constituencyName]?.wards[wardName]?.stations || [])
      .sort((a,b) => a.name.localeCompare(b.name));
  }

  async function search(query, limit = 20) {
    if (!query || query.length < 2) return [];
    const s = await loadSummary();
    const q = query.toUpperCase().trim();
    const results = [];

    for (const [cn, county] of Object.entries(s)) {
      if (results.length >= limit) break;
      if (cn.includes(q)) {
        results.push({ type: 'county', name: cn, voters: county.voters, code: county.code });
        continue;
      }
      for (const [constn, const_] of Object.entries(county.constituencies)) {
        if (results.length >= limit) break;
        if (constn.includes(q)) {
          results.push({ type: 'constituency', name: constn, county: cn, voters: const_.voters, code: const_.code });
          continue;
        }
        for (const [wn, ward] of Object.entries(const_.wards)) {
          if (results.length >= limit) break;
          if (wn.includes(q)) {
            results.push({ type: 'ward', name: wn, constituency: constn, county: cn, voters: ward.voters, stationCount: ward.station_count });
          }
        }
      }
    }
    return results;
  }

  function getRegion(countyName) {
    for (const [region, counties] of Object.entries(REGIONS)) {
      if (counties.includes(countyName)) return region;
    }
    return 'Other';
  }

  async function getRegionStats() {
    const s = await loadSummary();
    const stats = {};
    for (const [region, counties] of Object.entries(REGIONS)) {
      stats[region] = { voters: 0, counties: [] };
      for (const cn of counties) {
        if (s[cn]) {
          stats[region].voters += s[cn].voters;
          stats[region].counties.push({ name: cn, voters: s[cn].voters });
        }
      }
    }
    return stats;
  }

  return {
    loadSummary, loadCounty, getCounties, getConstituencies,
    getWards, getStations, search, getRegion, getRegionStats,
    TOTAL_VOTERS, COUNTIES_COUNT, CONSTITUENCIES_COUNT, WARDS_COUNT, STATIONS_COUNT,
    REGIONS, POSITIONS
  };
})();
