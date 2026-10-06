// Representative CWA payloads in both the current (2024+) and the older field
// naming, used to exercise the parsers without network access.

export const NOW = Date.parse("2026-10-06T13:20:00+08:00");

const threeHourly = (fromIso: string, count: number) =>
  Array.from({ length: count }, (_, i) => new Date(Date.parse(fromIso) + i * 3 * 3600_000));

const iso = (d: Date) => new Date(d.getTime() + 8 * 3600_000).toISOString().replace(/\.\d{3}Z$/, "+08:00");
const local = (d: Date) => new Date(d.getTime() + 8 * 3600_000).toISOString().slice(0, 19).replace("T", " ");

/** F-D0047-089, current format: 臺北市 apparent 30→36→31 over two days. */
export const forecast3dNew = () => {
  const times = threeHourly("2026-10-06T15:00:00+08:00", 12);
  const apparent = [36, 34, 31, 29, 28, 28, 31, 35, 36, 33, 30, 29];
  const temperature = [33, 31, 29, 27, 26, 26, 28, 31, 32, 30, 28, 27];
  return {
    success: "true",
    records: {
      Locations: [
        {
          LocationsName: "臺灣",
          Location: [
            {
              LocationName: "臺北市",
              WeatherElement: [
                { ElementName: "溫度", Time: times.map((t, i) => ({ DataTime: iso(t), ElementValue: [{ Temperature: String(temperature[i]) }] })) },
                { ElementName: "體感溫度", Time: times.map((t, i) => ({ DataTime: iso(t), ElementValue: [{ ApparentTemperature: String(apparent[i]) }] })) },
                {
                  ElementName: "3小時降雨機率",
                  Time: times.map((t, i) => ({
                    StartTime: iso(t),
                    EndTime: iso(new Date(t.getTime() + 3 * 3600_000)),
                    ElementValue: [{ ProbabilityOfPrecipitation: i === 0 ? "60" : "10" }],
                  })),
                },
                {
                  ElementName: "天氣現象",
                  Time: times.map((t) => ({
                    StartTime: iso(t),
                    EndTime: iso(new Date(t.getTime() + 3 * 3600_000)),
                    ElementValue: [{ Weather: "多雲午後短暫雷陣雨", WeatherCode: "15" }],
                  })),
                },
              ],
            },
            { LocationName: "中正區", WeatherElement: [] },
          ],
        },
      ],
    },
  };
};

/** F-D0047-089, older format with element codes and local timestamps. */
export const forecast3dOld = () => {
  const times = threeHourly("2026-10-06T15:00:00+08:00", 4);
  return {
    records: {
      locations: [
        {
          location: [
            {
              locationName: "高雄市",
              weatherElement: [
                { elementName: "T", time: times.map((t, i) => ({ dataTime: local(t), elementValue: [{ value: String(32 - i), measures: "攝氏度" }] })) },
                { elementName: "AT", time: times.map((t, i) => ({ dataTime: local(t), elementValue: [{ value: String(37 - i), measures: "攝氏度" }] })) },
                {
                  elementName: "PoP6h",
                  time: [{ startTime: local(times[0]), endTime: local(new Date(times[0].getTime() + 6 * 3600_000)), elementValue: [{ value: "20", measures: "百分比" }] }],
                },
                {
                  elementName: "Wx",
                  time: [
                    {
                      startTime: local(times[0]),
                      endTime: local(new Date(times[0].getTime() + 6 * 3600_000)),
                      elementValue: [
                        { value: "晴時多雲", measures: "自定義 Wx 文字" },
                        { value: "02", measures: "自定義 Wx 單位" },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
  };
};

/** F-D0047-091 week forecast with daily UV (current format). */
export const forecastWeek = () => ({
  success: "true",
  records: {
    Locations: [
      {
        Location: [
          {
            LocationName: "臺北市",
            WeatherElement: [
              {
                ElementName: "紫外線指數",
                Time: [
                  { StartTime: "2026-10-06T06:00:00+08:00", EndTime: "2026-10-06T18:00:00+08:00", ElementValue: [{ UVIndex: "9", UVExposureLevel: "過量級" }] },
                  { StartTime: "2026-10-07T06:00:00+08:00", EndTime: "2026-10-07T18:00:00+08:00", ElementValue: [{ UVIndex: "6", UVExposureLevel: "高量級" }] },
                ],
              },
              {
                ElementName: "最高溫度",
                Time: [
                  { StartTime: "2026-10-07T06:00:00+08:00", EndTime: "2026-10-07T18:00:00+08:00", ElementValue: [{ MaxTemperature: "36" }] },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
});

/** F-C0032-001 36-hour forecast. */
export const forecast36h = () => ({
  success: "true",
  records: {
    location: [
      {
        locationName: "臺北市",
        weatherElement: [
          { elementName: "Wx", time: [{ startTime: "2026-10-06 12:00:00", endTime: "2026-10-06 18:00:00", parameter: { parameterName: "多雲時晴" } }] },
          { elementName: "MaxT", time: [{ startTime: "2026-10-06 12:00:00", endTime: "2026-10-06 18:00:00", parameter: { parameterName: "34" } }] },
          { elementName: "PoP", time: [{ startTime: "2026-10-06 12:00:00", endTime: "2026-10-06 18:00:00", parameter: { parameterName: "30" } }] },
        ],
      },
    ],
  },
});

/** O-A0003-001 observations: two Taipei stations, one stale Kaohsiung station. */
export const observations = () => ({
  success: "true",
  records: {
    Station: [
      {
        StationId: "466920",
        StationName: "臺北",
        GeoInfo: { CountyName: "臺北市", TownName: "中正區" },
        ObsTime: { DateTime: "2026-10-06T13:10:00+08:00" },
        WeatherElement: { AirTemperature: "33.0", RelativeHumidity: "60", UVIndex: "8.0", WindSpeed: "1.0" },
      },
      {
        StationId: "466910",
        StationName: "鞍部",
        GeoInfo: { CountyName: "臺北市", TownName: "北投區" },
        ObsTime: { DateTime: "2026-10-06T13:10:00+08:00" },
        WeatherElement: { AirTemperature: "27.0", RelativeHumidity: "80", UVIndex: "-99", WindSpeed: "3.0" },
      },
      {
        StationId: "467441",
        StationName: "高雄",
        GeoInfo: { CountyName: "高雄市", TownName: "前鎮區" },
        ObsTime: { DateTime: "2026-10-06T09:00:00+08:00" },
        WeatherElement: { AirTemperature: "31.0", RelativeHumidity: "70", UVIndex: "6" },
      },
    ],
  },
});

/** O-A0005-001 daily max UV: station IDs only, date on the element. */
export const dailyUv = () => ({
  success: "true",
  records: {
    weatherElement: {
      elementName: "每日紫外線指數最大值",
      Date: "2026-10-06",
      location: [
        { StationID: "466920", UVIndex: 9.3 },
        { StationID: "467441", UVIndex: 10.1 },
      ],
    },
  },
});
