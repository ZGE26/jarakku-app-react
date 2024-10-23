// src/App.js
import React from 'react';
import Map from './components/Map';
import './App.css';

const App = () => {
  return (
    <div className='isi'>
      <h1>Peta dengan Leaflet dan OpenStreetMap</h1>
      <Map />
    </div>
  );
};

export default App;
