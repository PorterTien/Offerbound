export type ApplicationStatus = 'Applied' | 'Interview scheduled' | 'Interviewed' | 'Rejected' | 'Offer';
export type Semester = 'Fall' | 'Spring' | 'Winter' | 'Summer';

export interface Application {
  id: string;
  company: string;
  position: string;
  location: string;
  status: ApplicationStatus;
  dateApplied: Date;
  userId: string;
  comments?: string;
  semester?: Semester;
}

export interface User {
  id: string;
  name: string;
  email: string;
  streak: number;
  bankAccountLinked: boolean;
  mode: 'Starter' | 'Full';
  avatar?: string;
}

export interface Group {
  id: string;
  name: string;
  dailyQuota: number;
  durationMonths: number;
  startDate: Date;
  endDate: Date;
  pot: number;
  punishmentPrice: number; // Price charged for not hitting quota
  memberIds: string[];
  createdBy: string;
  code: string; // 6-digit numeric code
  inviteLink?: string; // Deep link: offerbound://join/{code}
  profilePicture?: string; // Image URI or base64
  memberSettings?: {
    [userId: string]: {
      postToGroup: boolean;
      hideNotifications: boolean;
    };
  };
  memberJoinDates?: {
    [userId: string]: Date; // Track when each member joined the group
  };
  memberPenalties?: {
    [userId: string]: {
      missedDays: number; // Number of days quota was missed
      amountOwed: number; // Total amount owed for missed days
    };
  };
}

export interface GroupMember {
  userId: string;
  streak: number;
  missedDays: number;
  amountOwed: number;
  applicationsToday: number;
  totalApplications: number;
  verifiedOffers: number;
}

export interface ActivityFeedItem {
  id: string;
  type: 'application' | 'quota_hit' | 'quota_missed' | 'streak' | 'offer' | 'message';
  userId: string;
  userName: string;
  userAvatar?: string; // User's profile picture
  message: string;
  timestamp: Date;
  likedBy?: string[]; // Array of user IDs who liked this item
  metadata?: {
    company?: string;
    position?: string;
    streakDays?: number;
    applicationId?: string; // Track which application this feed item is for
    groupId?: string; // Which group this activity belongs to
    textMessage?: string; // For text messages
    isSystemMessage?: boolean; // For system messages like "x joined the group"
  };
}

export interface LeaderboardEntry {
  userId: string;
  userName: string;
  value: number;
  rank: number;
}

