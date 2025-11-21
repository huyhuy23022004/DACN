import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';

// Fix for default markers in Leaflet with React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const NewsMap = ({ location }) => {
  if (!location || !location.lat || !location.lng) {
    return <p className="text-gray-500">No location available</p>;
  }

  const center = [location.lat, location.lng];
  const zoom = 15;

  return (
    <div>
      {location.address && (
        <div className="bg-blue-50 p-3 rounded-lg mb-3 border-l-4 border-blue-500">
          <p className="font-semibold text-blue-800">📍 Địa điểm:</p>
          <p className="text-blue-700">
            {location.address} 
            <a 
              href={`https://www.google.com/maps/place/${encodeURIComponent(location.address)}/@${location.lat},${location.lng},15z`} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="ml-2 text-blue-600 hover:text-blue-800 underline"
            >
              (nhấp vào đây để xem vị trí bằng Google Maps)
            </a>
          </p>
        </div>
      )}
  <MapContainer center={center} zoom={zoom} style={{ height: '300px', width: '100%', position: 'relative', zIndex: 0 }}>
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        <Marker position={center}>
          <Popup>{location.address || 'Location'}</Popup>
        </Marker>
      </MapContainer>
    </div>
  );
};

export default NewsMap;