import React, { useState } from 'react';
import './HomePage.css';

const HomePage = () => {
  const [fasta, setFasta] = useState(''); // State for the FASTA input
  const [loading, setLoading] = useState(false); // Loading state
  const [error, setError] = useState(''); // Error state

  const handleFindClick = async () => {
    setLoading(true);
    setError(''); // Clear previous errors

    try {
      // Make a POST request to the backend with the FASTA sequence
      const response = await fetch('http://localhost:5000/blast', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sequence: fasta }), // Send the FASTA sequence in JSON format
      });

      const data = await response.json(); // Parse the JSON response

      if (response.ok) {
        // Open the generated HTML file in a new tab
        window.open('http://localhost:5000/blast-result', '_blank');
      } else {
        setError(`Error: ${data.error}`);
      }
    } catch (error) {
      setError(`Request failed: ${error.message}`);
    } finally {
      setLoading(false); // Stop the loading spinner
    }
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
          onChange={(e) => setFasta(e.target.value)} // Update state with input value
        />
        <button className="find-button" onClick={handleFindClick} disabled={loading}>
          {loading ? 'Finding...' : 'Find'}
        </button>
      </div>

      {error && (
        <div className="error-container">
          <p>{error}</p>
        </div>
      )}
    </div>
  );
};

export default HomePage;
