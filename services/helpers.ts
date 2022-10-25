import Moment from "moment-timezone"

export enum FilterDateRange {
  Hours1 = "1 hours ago",
  Hours6 = "6 hours ago",
  Hours12 = "12 hours ago",
  Days1 = "1 days ago",
  Days2 = "2 days ago",
  Days3 = "3 days ago",
}

export const DftFilterDateRanges = [
  FilterDateRange.Hours1,
  FilterDateRange.Hours6,
  FilterDateRange.Hours12,
  FilterDateRange.Days1,
  FilterDateRange.Days2,
  FilterDateRange.Days3,
]

export const filterDateToISOString = (filterDateRange: string): string => {
  const parts = filterDateRange.split(" ")
  const units = parseInt(parts[0])
  const duration = parts[1] as Moment.unitOfTime.DurationConstructor
  return Moment().add(-1 * units, duration).toISOString()
}


export enum OrderOption {
  COUNT = "COUNT",
  TIMESTAMP = "TIMESTAMP",
}
export enum OrderDirection {
  ASC = "ASC",
  DESC = "DESC",
}

export const ProjectEntityType = "Project"

export const ListeningProjectIds = [
  1, // degods
  2, // FFF
  32, // monkettes
  7, // yoots
  21, // dens
  17, // tff
]