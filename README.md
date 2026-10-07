# Asahi Distribution Project

A lightweight sales and inventory dashboard for a beverage distribution operation.

## Static opportunity dashboard

The GitHub Pages entry point is a static `Zero-Sugar Channel Opportunity Engine`
for the 菜蟲農食 × Asahi health-channel strategy. It keeps the customer master
data as `rawData`, stores manually qualified alcohol/channel information in
`localStorage`, and derives separate `Strategic Potential` and
`Execution Readiness` scores.

The scoring configuration is at the top of `dashboard.js` in
`scoringConfig`. The current CSV can contain the original ten columns; optional
qualification columns are accepted when present. Use the dashboard's
`Export CSV` button to export raw, qualification, and calculated fields together.

Important: the existing customer master does not identify health-channel
positioning or alcohol status. Those fields therefore remain `Unknown` until a
business user qualifies them; the dashboard does not infer beer potential from
vegetable revenue alone.

The execution summary separates prospects into `可立即推進`, `待驗證`, and
`暫不投入`. Automatic classification uses ownership, next-step/date, decision
maker, alcohol-license, cold-storage, blocker, priority, and pipeline status
signals; users can override it per customer. Pipeline target stores and
estimated monthly sales are manual estimates. The dashboard only sums entered
estimates for active candidates and does not apply an assumed win probability,
so these totals are unweighted and should be treated as planning inputs.

## Run locally

1. Create a virtual environment (optional):
   python3 -m venv .venv
   source .venv/bin/activate
2. Install dependencies:
   pip install -r requirements.txt
3. Start the app:
   python app.py
4. Open http://localhost:5001

## Notes
The app stores data in `asahi.db` and seeds sample beverage products on first run.

## Publish the static dashboard

`index.html` is a public, read-only showcase that does not require Flask or SQLite.
Upload `index.html` and the `static/` folder to GitHub Pages, Netlify, or any
static web host. The Flask dashboard remains available locally for live data entry.
