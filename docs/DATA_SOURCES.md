# Data sources

All weather data comes from the Central Weather Administration (CWA) Open Data platform.

| Dataset | Content | Used for |
| --- | --- | --- |
| `O-A0003-001` | Manned-station current observations | Current hour: temperature, humidity, wind, UV; station → county lookup |
| `O-A0005-001` | Daily maximum UV per station | Today's UV maximum when the week forecast has none |
| `F-D0047-089` | County forecast, 3 days; time points and intervals vary by metric | Apparent temperature, temperature, rain probability, weather |
| `F-D0047-091` | County forecast, 1 week | Daily UV index, maximum temperature, 12-hour rain, weather |
| `F-C0032-001` | County forecast, 36 hours (optional API mode) | Weather, maximum temperature and rain where the others have gaps |

Each dataset is fetched independently. A failing dataset only removes its own fields and is listed in the status line. Collection runs in GitHub Actions. Default collection uses the official public file targets linked by data.gov.tw datasets [9178](https://data.gov.tw/dataset/9178), [9039](https://data.gov.tw/dataset/9039), [9307](https://data.gov.tw/dataset/9307), and [9308](https://data.gov.tw/dataset/9308); a private Secret selects the API mode. Both modes stop deployment and preserve the existing artifact when no usable weather remains. Demo weather is only shown when explicitly requested with `?demo=1`.

## Parsing notes

- Forecast parsers accept both the current field names (`Locations`, `ElementName: "體感溫度"`, `ElementValue: [{ ApparentTemperature }]`) and the older ones (`locations`, `elementName: "AT"`, `elementValue: [{ value }]`). Timestamps without an offset are read as Taiwan time.
- Public files wrap data in `cwaopendata.dataset` or `cwaopendata.Dataset`; collection converts this to the same `records` envelope used by the API. Single-object and array values are both accepted.
- `O-A0005-001` rows carry only `StationID` and `UVIndex`, with the date on `weatherElement.Date`; counties are resolved through the `O-A0003-001` station list.
- Blank strings and sentinels such as `-99` are treated as missing, never as zero.

## Derived values

- **Hourly apparent temperature** uses the forecast point at that hour, or is interpolated linearly between neighbouring points (no extrapolation across gaps over 6 hours). Past hours of today usually have no forecast and stay empty.
- **Current hour** uses stations observed within the last 45 minutes. Apparent temperature is computed with the CWA formula `AT = 1.04·T + 0.2·e − 0.65·V − 2.7`; the most oppressive station represents the county, and the highest UV reading is used.
- **Hourly UV** other than the current hour is an estimate: the day's forecast maximum spread over a clear-sky curve peaking at 11:30. The UI labels it "本站推估（非逐時官方預報）"; a fallback using today's observed daily maximum is also an estimate, not a forecast.
- **Heat reminder** compares the day's highest forecast or observed air temperature with the CWA 高溫資訊 thresholds (36°C yellow, 38°C orange). Multi-day criteria are not evaluated; the page tells readers to rely on the official alerts.
- **Levels**: UV uses the CWA five-level scale. The five apparent-temperature bands (≤27, ≤31, ≤35, ≤39, >39 °C) are this project's guidance thresholds, not an official classification.

## Freshness

The status line shows the snapshot collection time and whether the selected county has valid observations. Each displayed observed metric identifies its contributing station and actual observation time. The browser re-fetches the same-site snapshot every ten minutes while visible and upon returning to the tab; retained snapshots are re-evaluated every minute. Observations older than 45 minutes cannot supply current readings. Older snapshots are still shown, labelled with the data time and its age (live ≤ 90 minutes, aging ≤ 6 hours, old ≤ 24 hours with a link to CWA, then the age in days). A failed refresh cannot reset these timestamps.

## Map

County outlines come from the Ministry of the Interior via the [`taiwan-atlas`](https://github.com/dkaoster/taiwan-atlas) package (MIT), simplified and pre-projected by `scripts/build-taiwan-map.mjs`.
