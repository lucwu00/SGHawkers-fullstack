// src/utils/constants.js
export const DIET_LABELS = { halal:"Halal", vegetarian:"Vegetarian", vegan:"Vegan" };

export const DELIVERY_BANDS = [
  { max:1, fee:1.5 }, { max:3, fee:2.5 }, { max:5, fee:3.5 },
  { max:8, fee:4.5 }, { max:15, fee:6.0 },
];

export const PICKUP_TIMES_TODAY = [
  "Now (~15 min)","11:30 AM","12:00 PM","12:30 PM","1:00 PM",
  "1:30 PM","2:00 PM","3:00 PM","5:00 PM","6:00 PM","7:00 PM",
];

export const PICKUP_TIMES_ADV = [
  "8:00 AM","9:00 AM","10:00 AM","11:00 AM","12:00 PM",
  "1:00 PM","2:00 PM","5:00 PM","6:00 PM","7:00 PM","8:00 PM",
];