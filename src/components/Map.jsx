import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Ganti require dengan import untuk ikon
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

// Menambahkan ikon untuk marker
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: markerIcon2x,
    iconUrl: markerIcon,
    shadowUrl: markerShadow,
});

// Komponen untuk mengupdate peta
const ChangeView = ({ position }) => {
    const map = useMap();
    useEffect(() => {
        map.setView(position);
    }, [position, map]);

    return null;
};

// Fungsi untuk menghitung jarak antara dua titik
const haversineDistance = (coords1, coords2) => {
    const toRad = (value) => (value * Math.PI) / 180;
    const R = 6371; // Radius Bumi dalam kilometer

    const dLat = toRad(coords2.lat - coords1.lat);
    const dLon = toRad(coords2.lng - coords1.lng);

    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(coords1.lat)) * Math.cos(toRad(coords2.lat)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Mengembalikan jarak dalam kilometer
};

const Map = () => {
    // State untuk menyimpan koordinat, nama kota, marker, catatan, dan pesan kesalahan
    const [lat, setLat] = useState(-6.9175); // Koordinat default (contoh: Bandung)
    const [lng, setLng] = useState(107.6191);
    const [city, setCity] = useState('');
    const [note, setNote] = useState(''); // Catatan untuk marker
    const [markers, setMarkers] = useState([]);
    const [errorMessage, setErrorMessage] = useState(''); // Pesan kesalahan
    const [distance, setDistance] = useState(null); // Menyimpan jarak
    const [cityNames, setCityNames] = useState([]); // Menyimpan nama kota
    const [selectedMarker1, setSelectedMarker1] = useState(null); // Marker pertama
    const [selectedMarker2, setSelectedMarker2] = useState(null); // Marker kedua

    const position = [lat, lng];

    // Memuat markers dari localStorage saat komponen dimuat
    useEffect(() => {
        const storedMarkers = JSON.parse(localStorage.getItem('markers')) || [];
        setMarkers(storedMarkers);
    }, []);

    // Fungsi untuk mendapatkan koordinat berdasarkan nama kota
    const getCoordinates = async (cityName) => {
        if (!cityName) return; // Jika cityName kosong, tidak perlu memanggil API

        try {
            const response = await fetch(`https://nominatim.openstreetmap.org/search?q=${cityName}&format=json&addressdetails=1`);
            const data = await response.json();

            if (data && data.length > 0) {
                const { lat, lon } = data[0];
                setLat(lat);
                setLng(lon);
                setErrorMessage(''); // Reset pesan kesalahan jika ditemukan
            } else {
                setErrorMessage('Kota tidak ditemukan.'); // Set pesan kesalahan jika tidak ditemukan
            }
        } catch (error) {
            console.error('Error fetching coordinates:', error);
            setErrorMessage('Terjadi kesalahan dalam mencari kota.'); // Set pesan kesalahan jika ada kesalahan dalam fetching
        }
    };

    // Memanggil getCoordinates saat city berubah
    useEffect(() => {
        getCoordinates(city);
    }, [city]); // Efek ini akan dipanggil setiap kali city berubah

    // Fungsi untuk menambahkan marker
    const addMarker = () => {
        const newMarker = { lat, lng, note, city }; // Menyimpan catatan dan nama kota bersama koordinat
        const updatedMarkers = [...markers, newMarker];

        setMarkers(updatedMarkers);
        localStorage.setItem('markers', JSON.stringify(updatedMarkers));
        setCityNames([...cityNames, city]); // Menyimpan nama kota

        setNote(''); // Reset catatan setelah menambahkan marker
        setCity(''); // Reset nama kota setelah menambahkan marker
    };

    // Fungsi untuk menghapus semua marker
    const clearMarkers = () => {
        setMarkers([]);
        localStorage.removeItem('markers');
        setCityNames([]);
        setSelectedMarker1(null); // Reset pilihan marker
        setSelectedMarker2(null); // Reset pilihan marker
    };

    // Fungsi untuk menghitung jarak antara dua lokasi yang dipilih
    const calculateDistance = () => {
        if (selectedMarker1 === null || selectedMarker2 === null) {
            setDistance(null);
            return;
        }

        const coords1 = { lat: markers[selectedMarker1].lat, lng: markers[selectedMarker1].lng };
        const coords2 = { lat: markers[selectedMarker2].lat, lng: markers[selectedMarker2].lng };
        const dist = haversineDistance(coords1, coords2);
        setDistance(dist);
    };

    // Hitung jarak setiap kali pilihan marker berubah
    useEffect(() => {
        calculateDistance();
    }, [selectedMarker1, selectedMarker2]);

    return (
        <div>
            <h2>Peta dengan Leaflet dan OpenStreetMap</h2>
            <div style={{ display: 'flex', gap: '30px', justifyContent: 'center', marginBottom: '20px', flexWrap: 'wrap'}}>
                <input 
                    type="text" 
                    placeholder="Nama Kota" 
                    value={city} 
                    onChange={(e) => setCity(e.target.value)} 
                />
                <input 
                    type="text" 
                    placeholder="Catatan" 
                    value={note} 
                    onChange={(e) => setNote(e.target.value)} 
                />
                <button onClick={addMarker}>Tandai Lokasi</button>
                <button onClick={clearMarkers}>Hapus Semua Tanda</button>
            </div>
            {errorMessage && <div style={{ color: 'red', textAlign: 'center', marginBottom: '10px' }}>{errorMessage}</div>}
            {distance !== null && (
                <div style={{ textAlign: 'center', marginBottom: '10px' }}>
                    Jarak antara {markers[selectedMarker1]?.city} dan {markers[selectedMarker2]?.city}: {distance.toFixed(2)} km
                </div>
            )}
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                <select onChange={(e) => setSelectedMarker1(e.target.value)} value={selectedMarker1} style={{ marginRight: '10px' }}>
                    <option value="">Pilih Marker Pertama</option>
                    {markers.map((marker, index) => (
                        <option key={index} value={index}>{marker.city}</option>
                    ))}
                </select>
                <select onChange={(e) => setSelectedMarker2(e.target.value)} value={selectedMarker2} style={{ marginRight: '10px' }}>
                    <option value="">Pilih Marker Kedua</option>
                    {markers.map((marker, index) => (
                        <option key={index} value={index}>{marker.city}</option>
                    ))}
                </select>
            </div>
            <MapContainer center={position} zoom={13} style={{ height: '600px', width: '100%' }}>
                <ChangeView position={position} />
                <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />
                {/* Menampilkan semua marker yang tersimpan */}
                {markers.map((marker, index) => (
                    <Marker key={index} position={[marker.lat, marker.lng]}>
                        <Popup>
                            Koordinat: {marker.lat}, {marker.lng} <br />
                            Kota: {marker.city} <br />
                            Catatan: {marker.note}
                        </Popup>
                    </Marker>
                ))}
                <Marker position={position}>
                    <Popup>
                        Koordinat: {lat}, {lng}
                    </Popup>
                </Marker>
            </MapContainer>
        </div>
    );
};

export default Map;
