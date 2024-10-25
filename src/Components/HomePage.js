import React, { useState } from 'react';
import './HomePage.css';

const HomePage = () => {
  const [fasta, setFasta] = useState(''); // State for the FASTA input
  const [blastType, setBlastType] = useState('blastn'); // State for the selected BLAST type
  const [database, setDatabase] = useState('nt'); // State for the selected database
  const [loading, setLoading] = useState(false); // Loading state
  const [error, setError] = useState(''); // Error state

  const handleFindClick = async () => {
    setLoading(true);
    setError(''); // Clear previous errors

    try {
      // Make a POST request to the backend with the FASTA sequence, blast type, and database
      const response = await fetch('http://localhost:5000/blast', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sequence: fasta, blast_type: blastType, database: database }), // Send the FASTA sequence in JSON format
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
        
        {/* Dropdown for selecting BLAST type */}
        <select className="select-blast-type" value={blastType} onChange={(e) => setBlastType(e.target.value)}>
          <option value="blastn">BLASTN (Nucleotide)</option>
          <option value="blastp">BLASTP (Protein)</option>
          <option value="blastx">BLASTX (Translated nucleotide to protein)</option>
          <option value="tblastn">TBLASTN (Protein to translated nucleotide)</option>
          <option value="tblastx">TBLASTX (Translated nucleotide to translated nucleotide)</option>
        </select>

        {/* Dropdown for selecting database */}
        <select className="select-database" value={database} onChange={(e) => setDatabase(e.target.value)}>
          <option value="nt">Nucleotide collection (nt)</option>
          <option value="nr">Non-redundant protein (nr)</option>
          <option value="refseq_rna">RefSeq RNA</option>
          <option value="refseq_protein">RefSeq Protein</option>
          <option value="swissprot">SwissProt (Manually curated protein sequences)</option>
          <option value="core_nt">Core Nucleotide Database (core_nt)</option> {/* Added core_nt option */}
        </select>

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
