# Asahi Distribution Project

A lightweight sales and inventory dashboard for a beverage distribution operation.

## Static opportunity dashboard

The GitHub Pages entry point is a static `Zero-Sugar Channel Opportunity Engine`
for the 菜蟲農食 × Asahi health-channel strategy. It keeps the customer master
data as `rawData`, stores manually qualified alcohol/channel information in
`localStorage`, and derives separate `Strategic Potential` and
`Execution Readiness` scores.

The dashboard is split into five tabbed pages—decision summary, Asahi
customer-pool screening, next actions, opportunity analysis, and customer
database—to keep each work area focused while preserving the existing
sections and anchors.

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

Revenue is shown in two separate measures: existing-customer `近12月M` values
are summed as provided and labeled with the source unit `M` (no currency or
magnitude conversion), while new-development Pipeline estimates remain
`NT$/month`. These figures have different periods and units and must not be
added together. Revenue coverage is shown alongside the historical total.

The executive summary also reports the current priority opportunity pool,
completion of its key qualification fields, attack-list action-plan coverage
(owner, target date, and next action), and overdue open actions. Pipeline
stage cards show current active-candidate counts and the sum of entered
unweighted monthly estimates by stage. The static dashboard does not retain
weekly Pipeline snapshots, so it cannot report stage movement, newly added
leads, or week-over-week changes; those trends require a persisted history.

The next-actions page has a separate strategy addendum for the proposed
12-independent-procurement-unit interview, up-to-6 paid-pilot, and decision-gate
workflow. It is advisory only: it does not change qualification fields, scores,
filters, or the Attack List. Unknown qualification evidence remains unknown.

The `Asahi 客戶池初篩` section contains a dated first-pass snapshot of 526
outlets from the full 4,914-row BigQuery Connected Sheets export, merged with
the existing shortlist by `store_id` so existing entries are retained without
duplicates. It ranks explicit beer occasions (A), meal-pairing restaurant
types (B), and channels requiring an occasion check (C), while applying the
specified active/supplying/not-dropped gate and excluding obvious
staff/event/central-kitchen records. The snapshot includes 43 rows marked
`activeState=notActive` for manual confirmation and 4 name-classified rows
with blank store type for review. These are prospects to qualify, not confirmed
beer opportunities. Other rows are held out, not presumed unfit. The dashboard
is static and the private Connected Sheets source requires Google
authentication, so the shortlist is not live-synced; source-row links and CSV
export are provided for review.

The Flask channel form can request a Cuisine Type suggestion from OpenAI. Set
`OPENAI_API_KEY` in the server environment (and optionally `OPENAI_MODEL`, which
defaults to `gpt-4o-mini`) before starting the app. The form sends the business
name, address, Google Maps category, and pasted menu/about text to OpenAI for
classification. Maps, website, and Instagram URLs are retained as source
references but are not fetched or read by the model; paste relevant excerpts
when available. Suggestions at confidence 70 or higher prefill the formal
Cuisine Type; lower-confidence results stay suggestions for manual review.
Classification outputs, sources, and timestamps are stored with the channel.
The Flask app currently has no user authentication; keep it on a trusted
environment and do not expose the API-backed app publicly without adding
authentication and usage controls. Never commit the API key to the repository.

For a local run on macOS/Linux:

```sh
export OPENAI_API_KEY="your-key"
python3 app.py
```

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
