export type Review = {
  id: string;
  author: string;
  rating: number;
  comment: string;
  date: string;
};

export type MenuItem = {
  id: string;
  name: string;
  description: string;
  price: number;
};

export type MenuCategory = {
  id: string;
  title: string;
  items: MenuItem[];
};

export type Menu = MenuCategory[];

export type Restaurant = {
  id: string;
  name: string;
  cuisine: string;
  address: string;
  rating: number;
  reviewsCount: number;
  imageUrl: string;
  imageHint: string;
  menu: Menu;
  reviews: Review[];
  description: string;
  pricing: string; // e.g., "$$", "$$$"
  specials: string[];
};

export type Booking = {
  bookingId: string;
  restaurantId: string;
  guestName: string;
  guestEmail: string;
  guestPhone?: string;
  partySize: number;
  dateTime: string;
  specialRequests?: string;
  confirmedAt: string;
  depositPaid?: number;
};
