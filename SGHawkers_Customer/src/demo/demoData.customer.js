// ─── SGHawkers Customer Demo Data ────────────────────────────────────────────
// Used when VITE_DEMO_MODE=true

export const DEMO_ORDERS_CUSTOMER = [
  {
    id:"demo-cord-001", order_ref:"ORD-0504-8821",
    stall_name:"Tian Tian Hainanese Chicken Rice",
    centre_name:"Maxwell Food Centre",
    stall_slug:"tianchicken", centre_slug:"maxwell",
    order_type:"pickup", status:"collected",
    total:11.00, subtotal:11.00,
    created_at: new Date(Date.now()-2*24*3600000).toISOString(),
    items:[{name:"Chicken Rice (Roasted)",qty:2,unit_price:5.50}],
  },
  {
    id:"demo-cord-002", order_ref:"ORD-0503-7741",
    stall_name:"Tian Tian Hainanese Chicken Rice",
    centre_name:"Maxwell Food Centre",
    stall_slug:"tianchicken", centre_slug:"maxwell",
    order_type:"pickup", status:"collected",
    total:13.50, subtotal:13.50,
    created_at: new Date(Date.now()-4*24*3600000).toISOString(),
    items:[{name:"Chicken Rice (Steamed)",qty:2,unit_price:4.50},{name:"Chicken Soup",qty:2,unit_price:2.00}],
  },
  {
    id:"demo-cord-003", order_ref:"ORD-0501-6612",
    stall_name:"Tiong Bahru Chwee Kueh",
    centre_name:"Tiong Bahru Market",
    stall_slug:"chweekueh", centre_slug:"tiongbahru",
    order_type:"pickup", status:"collected",
    total:4.50, subtotal:4.50,
    created_at: new Date(Date.now()-7*24*3600000).toISOString(),
    items:[{name:"Chwee Kueh (6pc)",qty:1,unit_price:4.50}],
  },
];

export const DEMO_NOTIFICATIONS_CUSTOMER = [
  { id:"demo-n-001", type:"order_placed",         icon:"🎉", title:"Order placed!",             body:"Your order ORD-0504-8821 is being prepared.",      is_read:true,  created_at:new Date(Date.now()-2*24*3600000).toISOString() },
  { id:"demo-n-002", type:"ready",                icon:"✅", title:"Order ready for pick-up!",  body:"ORD-0504-8821 is ready — head to the stall.",      is_read:true,  created_at:new Date(Date.now()-2*24*3600000+15*60000).toISOString() },
  { id:"demo-n-003", type:"order_placed",         icon:"🎉", title:"Order placed!",             body:"Your order ORD-0503-7741 is being prepared.",      is_read:true,  created_at:new Date(Date.now()-4*24*3600000).toISOString() },
  { id:"demo-n-004", type:"loyalty",              icon:"🎟", title:"Stamp earned!",             body:"You have 3/10 stamps at Tian Tian. 7 more to go.", is_read:false, created_at:new Date(Date.now()-30*60000).toISOString() },
  { id:"demo-n-005", type:"promo",                icon:"⚡", title:"Early Bird ends in 30 min", body:"10% off at Tian Tian until 11:30am today.",        is_read:false, created_at:new Date(Date.now()-5*60000).toISOString() },
];