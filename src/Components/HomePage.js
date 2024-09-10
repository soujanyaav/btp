import React, { useState } from 'react';
import './HomePage.css'; // Import the CSS

const HomePage = () => {
  const [fasta, setFasta] = useState(''); // Single state for one input field

  const handleFindClick = () => {
    // Logic for handling the FASTA input
    console.log('FASTA:', fasta);
  };

  return (
    <div className="homepage-container">
      <h1 className="homepage-title">Environmental Source Finder</h1>
      <div className="form-container">
        <input
          className="fasta-input"
          type="text"
          placeholder="Enter FASTA"
          value={fasta}
          onChange={(e) => setFasta(e.target.value)} // Update state on input change
        />
        <button className="find-button" onClick={handleFindClick}>
          Find
        </button>
      </div>
    </div>
  );
};

export default HomePage;
