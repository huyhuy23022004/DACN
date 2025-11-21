// Tiện ích tích hợp Google Maps
const getMapUrl = (lat, lng) => {
  return `https://www.google.com/maps/embed/v1/view?key=${process.env.MAP_API_KEY}&center=${lat},${lng}&zoom=15`;
};

module.exports = { getMapUrl };