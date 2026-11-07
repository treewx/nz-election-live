const assert = require('assert');
const { parseOverall, parseElectorates } = require('../parse');

// Fixtures mirror the markup observed on electionresults.govt.nz/ge2026 (incl. hidden mobile-show labels).
const overall = `<body><p>Nationwide Party Votes - 24.6% of results counted</p>
<table id="overall-results-table">
<tr><th colspan="3"> </th><th colspan="3" class="heading-projected text-center"> PROJECTED </th></tr>
<tr><th> </th><th> Party Votes </th><th class="pr20"> % of Votes</th><th>Electorate Seats</th><th>List Seats</th><th>Total seats</th></tr>
<tr class="even item"><td class="text-left bold"> National Party </td><td> 391,782 </td><td class="pr20"> 29.66 </td><td>41</td><td>- </td><td>41 </td></tr>
<tr class="odd item"><td class="text-left bold"> Labour Party </td><td> 392,869 </td><td class="pr20"> 29.74 </td><td>21</td><td>15 </td><td>36 </td></tr>
<tr class="even item"><td class="text-left bold"> Opportunity Party </td><td> 70,964 </td><td class="pr20"> 5.40 </td><td>-</td><td>6</td><td>6</td></tr>
<tr><td>Total</td><td>1,320,847</td><td></td><td>71</td><td>58</td><td>129</td></tr>
</table></body>`;
const o = parseOverall(overall);
assert.strictEqual(o.percentCounted, 24.6);
assert.strictEqual(o.parties.length, 3);
assert.deepStrictEqual(o.parties[0], { name: 'National Party', votes: 391782, pct: 29.66, electorateSeats: 41, listSeats: 0, seats: 41 });
assert.strictEqual(o.parties[2].listSeats, 6);
assert.deepStrictEqual(o.totals, { votes: 1320847, electorateSeats: 71, listSeats: 58, seats: 129 });

const elect = `<body><p>Electorate Candidate and Party Votes - 24.9% of results counted</p><p>2,336 of 9,387 results counted</p>
<table id="electorate-status-table"><tr><th>Electorate</th><th>Leading candidate</th><th>2nd place</th><th>Current Margin</th><th> % voting places counted</th></tr>
<tr id="electorate-row-1" class="odd"><td class="col-1"><a href="./electorate-details-01.html">Auckland Central</a></td>
<td><span class="mobile-show"> Leading Candidate: </span> SWARBRICK, Chlöe (GP) </td><td><span class="mobile-show"> 2nd Candidate: </span> KINSER, Candace (NAT) </td>
<td class="text-right"><span class="mobile-show float-left">Margin:</span> 1,911 </td><td class="text-right"><span class="mobile-show float-left">Percent of voting places counted:</span> 27.9 % </td></tr></table></body>`;
const e = parseElectorates(elect);
assert.strictEqual(e.percentCounted, 24.9);
assert.deepStrictEqual(e.resultsCounted, { counted: 2336, total: 9387 });
assert.deepStrictEqual(e.electorates[0], { name: 'Auckland Central', leading: 'SWARBRICK, Chlöe (GP)', second: 'KINSER, Candace (NAT)', margin: 1911, pctCounted: 27.9 });
console.log('parser tests passed');
