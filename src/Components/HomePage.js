import React, { useState, useEffect } from 'react';
import './HomePage.css';

const HomePage = () => {
  const [fasta, setFasta] = useState('');
  const [blastType, setBlastType] = useState('blastn');
  const [database, setDatabase] = useState('nt');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('Idle');
  const [timer, setTimer] = useState(0);
  const [responseText, setResponseText] = useState(''); // New state for response

  const handleFindClick = async () => {
    setLoading(true);
    setError('');
    setTimer(0);
    setResponseText(''); // Reset response text

    try {
      const intervalId = setInterval(() => {
        setTimer((prev) => prev + 1);
        fetchStatus();
      }, 1000); // Update every second

      const response = await fetch('http://localhost:5000/blast', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sequence: fasta, blast_type: blastType, database: database }),
      });

      clearInterval(intervalId);

      const data = await response.json();

      if (response.ok) {
        setStatus('Completed');
        // Open the result in a new tab
        setResponseText(data.response); // Set response text
      } else {
        setError(`Error: ${data.error}`);
      }
    } catch (error) {
      setError(`Request failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const fetchStatus = async () => {
    const response = await fetch('http://localhost:5000/status');
    const data = await response.json();
    setStatus(data.status);
  };

  useEffect(() => {
    if (loading) {
      const intervalId = setInterval(() => setTimer((prev) => prev + 1), 1000);
      return () => clearInterval(intervalId);
    }
  }, [loading]);

  return (
    <div className="homepage-container">
      <h1 className="homepage-title">BLAST Search Tool</h1>
      <div className="form-container">
        <input
          className="fasta-input"
          type="text"
          placeholder="Enter FASTA"
          value={fasta}
          onChange={(e) => setFasta(e.target.value)}
        />
        <select className="select-blast-type" value={blastType} onChange={(e) => setBlastType(e.target.value)}>
          <option value="blastn">BLASTN (Nucleotide)</option>
          <option value="blastp">BLASTP (Protein)</option>
          <option value="blastx">BLASTX (Translated nucleotide to protein)</option>
          <option value="tblastn">TBLASTN (Protein to translated nucleotide)</option>
          <option value="tblastx">TBLASTX (Translated nucleotide to translated nucleotide)</option>
        </select>
        <select className="select-database" value={database} onChange={(e) => setDatabase(e.target.value)}>
          <option value="nt">Nucleotide collection (nt)</option>
          <option value="nr">Non-redundant protein (nr)</option>
          <option value="refseq_rna">RefSeq RNA</option>
          <option value="refseq_protein">RefSeq Protein</option>
          <option value="swissprot">SwissProt (Manually curated protein sequences)</option>
          <option value="core_nt">Core Nucleotide Database (core_nt)</option>
        </select>
        <button className="find-button" onClick={handleFindClick} disabled={loading}>
          {loading ? 'Finding...' : 'Find'}
        </button>
      </div>

      <div className="status-container">
        <p>Status: {status}</p>
        <p>Elapsed Time: {timer}s</p>
      </div>

      {error && <div className="error-container"><p>{error}</p></div>}

      {responseText && (
        <div className="response-container">
          <h2>Generated Response:</h2>
          <p>{responseText}</p>
        </div>
      )}
    </div>
  );
};

export default HomePage;
