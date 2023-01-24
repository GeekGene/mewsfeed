use chrono::{Utc, DateTime, Weekday, TimeZone};

pub fn date_range_year(year: i32) -> (DateTime<Utc>, DateTime<Utc>) {
  let start = Utc.ymd(year, 1, 1).and_hms(0, 0, 0);
  let end = Utc.ymd(year, 12, 31).and_hms(23, 59, 59);
  (start, end)
}

pub fn date_range_month(year: i32, month: u32) -> (DateTime<Utc>, DateTime<Utc>) {
  let start = Utc.ymd(year, month, 1).and_hms(0, 0, 0);
  let end = Utc.ymd(year, month, 31).and_hms(23, 59, 59);
  (start, end)
}

pub fn date_range_week(year: i32, iso_week: u32) -> (DateTime<Utc>, DateTime<Utc>) {
  let start = Utc.isoywd(year, iso_week, Weekday::Mon).and_hms(0, 0, 0);
  let end = Utc.isoywd(year, iso_week, Weekday::Sun).and_hms(23, 59, 59);
  (start, end)
}

pub fn date_range_day(year: i32, ordinal: u32) -> (DateTime<Utc>, DateTime<Utc>) {
  let start = Utc.yo(year, ordinal).and_hms(0, 0, 0);
  let end = Utc.yo(year, ordinal).and_hms(23, 59, 59);
  (start, end)
}
