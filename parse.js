const cheerio = require('cheerio');

const num = (s) => {
  const n = parseInt(String(s).replace(/[^\d-]/g, ''), 10);
  return Number.isNaN(n) ? 0 : n;
};
const clean = (s) => String(s).replace(/\s+/g, ' ').trim();

// Cell text without the hidden "mobile-show" labels the official site adds.
function cellText($, el) {
  const c = $(el).clone();
  c.find('.mobile-show').remove();
  return clean(c.text());
}

function parseOverall(html) {
  const $ = cheerio.load(html);
  const counted = clean($('body').text()).match(/Nationwide Party Votes\s*-\s*([\d.]+)%\s*of results counted/i);
  const parties = [];
  let totals = null;
  $('#overall-results-table tr').each((_, tr) => {
    const cells = $(tr).children('td');
    if (cells.length !== 6) return;
    const vals = cells.map((__, td) => cellText($, td)).get();
    if (/^total$/i.test(vals[0].split(' ')[0]) || /^total/i.test(vals[0])) {
      totals = { votes: num(vals[1]), electorateSeats: num(vals[3]), listSeats: num(vals[4]), seats: num(vals[5]) };
      return;
    }
    parties.push({
      name: vals[0],
      votes: num(vals[1]),
      pct: parseFloat(vals[2]) || 0,
      electorateSeats: num(vals[3]),
      listSeats: num(vals[4]),
      seats: num(vals[5]),
    });
  });
  return { percentCounted: counted ? parseFloat(counted[1]) : null, parties, totals };
}

function parseElectorates(html) {
  const $ = cheerio.load(html);
  const text = clean($('body').text());
  const pc = text.match(/Electorate Candidate and Party Votes\s*-\s*([\d.]+)%\s*of results counted/i);
  const rc = text.match(/([\d,]+)\s+of\s+([\d,]+)\s+results counted/i);
  const electorates = [];
  $('#electorate-status-table tr').each((_, tr) => {
    const cells = $(tr).children('td');
    if (cells.length !== 5) return;
    const v = cells.map((__, td) => cellText($, td)).get();
    electorates.push({
      name: v[0],
      leading: v[1],
      second: v[2],
      margin: num(v[3]),
      pctCounted: parseFloat(v[4]) || 0,
    });
  });
  return {
    percentCounted: pc ? parseFloat(pc[1]) : null,
    resultsCounted: rc ? { counted: num(rc[1]), total: num(rc[2]) } : null,
    electorates,
  };
}

module.exports = { parseOverall, parseElectorates };
