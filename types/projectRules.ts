export interface ProjectRule {
  _id: string,

  // refs
  discordId: string,
  projectId: string,

  active: boolean,
  tags?: string[],

  // alerts
  lastAlertPrice?: number,
  fixedPriceChange: number | null,
  critFixedPriceChange: number | null,
  pctListingChange: number | null,
  floorAbove: number | null,
  floorAboveOn: boolean,
  floorBelow: number | null,
  floorBelowOn: boolean

  // stop loss gain
  lastSupport: number | null,
  newSupportHighTest: number | null,
  newSupportLowTest: number | null,
  customSupport: number | null,
  supportBreakPct: number | null, // % change to trigger a break in support
  stopPct: number | null, // % change to trigger a reversion from a break
  supportHistory: FloorSnap[] | null,

  stats?: ProjectStat
}

interface FloorSnap {
  floor: number,
  timestamp: string,
}

export interface UpsertProjectRule {
  _id?: string,

  // refs
  discordId?: string,
  projectId?: string,

  active?: boolean,
  tags?: string[],

  // alerts
  lastAlertPrice?: number,
  fixedPriceChange?: number | null,
  critFixedPriceChange?: number | null,
  pctListingChange?: number | null,
  floorAbove?: number | null,
  floorAboveOn?: boolean,
  floorBelow?: number | null,
  floorBelowOn?: boolean

  // stop loss gain
  lastSupport?: number | null,
  newSupportHighTest?: number | null,
  newSupportLowTest?: number | null,
  customSupport?: number | null,
  supportBreakPct?: number | null, // % change to trigger a break in support
  stopPct?: number | null, // % change to trigger a reversion from a break
  supportHistory?: FloorSnap[] | null,
}

// hyperspace

export declare type ProjectStat = {
  __typename?: 'ProjectStat';
  average_price?: Maybe<Scalars['Float']>;
  average_price_1day_change?: Maybe<Scalars['Float']>;
  created_at?: Maybe<Scalars['DateTime']>;
  discord_members?: Maybe<Scalars['Float']>;
  floor_price?: Maybe<Scalars['Float']>;
  floor_price_1day_change?: Maybe<Scalars['Float']>;
  market_cap?: Maybe<Scalars['Float']>;
  max_price?: Maybe<Scalars['Float']>;
  num_of_token_holders?: Maybe<Scalars['Float']>;
  num_of_token_listed?: Maybe<Scalars['Float']>;
  percentage_of_token_listed?: Maybe<Scalars['Float']>;
  project?: Maybe<Project>;
  project_id: Scalars['String'];
  rank?: Maybe<Scalars['Float']>;
  supply?: Maybe<Scalars['Float']>;
  twitter_followers?: Maybe<Scalars['Float']>;
  updated_at?: Maybe<Scalars['DateTime']>;
  volume_1day?: Maybe<Scalars['Float']>;
  volume_1day_change?: Maybe<Scalars['Float']>;
  volume_1hr?: Maybe<Scalars['Float']>;
  volume_7day?: Maybe<Scalars['Float']>;
};

export declare type Project = {
  __typename?: 'Project';
  candy_machine_id?: Maybe<Scalars['String']>;
  candy_machine_ids?: Maybe<Array<Scalars['String']>>;
  created_at?: Maybe<Scalars['DateTime']>;
  description?: Maybe<Scalars['String']>;
  discord?: Maybe<Scalars['String']>;
  display_name: Scalars['String'];
  first_creator?: Maybe<Scalars['String']>;
  img_url?: Maybe<Scalars['String']>;
  is_attribute_stats_enabled?: Maybe<Scalars['Boolean']>;
  is_minting?: Maybe<Scalars['Boolean']>;
  is_verified?: Maybe<Scalars['Boolean']>;
  launch_date?: Maybe<Scalars['DateTime']>;
  launch_timestamp?: Maybe<Scalars['String']>;
  lmnft?: Maybe<Scalars['String']>;
  mcc_id?: Maybe<Scalars['String']>;
  me_slug?: Maybe<Scalars['String']>;
  notifi_id?: Maybe<Scalars['String']>;
  project_attributes?: Maybe<Array<ProjectAttribute>>;
  project_id: Scalars['String'];
  project_slug?: Maybe<Scalars['String']>;
  protocol?: Maybe<ProtocolEnum>;
  rarities?: Maybe<Scalars['JSON']>;
  requires_categorization?: Maybe<Scalars['Boolean']>;
  supply?: Maybe<Scalars['Float']>;
  tags?: Maybe<Array<ProjectTag>>;
  twitter?: Maybe<Scalars['String']>;
  updated_at?: Maybe<Scalars['DateTime']>;
  website?: Maybe<Scalars['String']>;
};

export declare type ProjectAttribute = {
  __typename?: 'ProjectAttribute';
  counts?: Maybe<Scalars['JSON']>;
  floor_prices?: Maybe<Scalars['JSON']>;
  name: Scalars['String'];
  type: AttributeTypeEnum;
  values: Array<Scalars['String']>;
};

export declare enum ProtocolEnum {
  Cardano = "CARDANO",
  Ethereum = "ETHEREUM",
  Solana = "SOLANA"
}

export declare type ProjectTag = {
  __typename?: 'ProjectTag';
  created_at?: Maybe<Scalars['DateTime']>;
  project_id?: Maybe<Scalars['String']>;
  tag: Scalars['String'];
  updated_at?: Maybe<Scalars['DateTime']>;
};

export declare enum AttributeTypeEnum {
  Category = "CATEGORY",
  Numeric = "NUMERIC",
  Range = "RANGE"
}

export declare type Maybe<T> = T | null
export declare type Scalars = {
  ID: string;
  String: string;
  Boolean: boolean;
  Int: number;
  Float: number;
  /** Date custom scalar type */
  Date: any;
  /** The javascript `Date` as string. Type represents date and time as the ISO Date string. */
  DateTime: any;
  /** The `JSON` scalar type represents JSON values as specified by [ECMA-404](http://www.ecma-international.org/publications/files/ECMA-ST/ECMA-404.pdf). */
  JSON: any;
}