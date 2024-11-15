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
  const [responseText, setResponseText] = useState(''); // State for response
  const [treeImageUrl, setTreeImageUrl] = useState(''); // State for tree image URL
  const [blastResultUrl, setBlastResultUrl] = useState(''); // State for BLAST result URL

  const handleFindClick = async () => {
    setLoading(true);
    setError('');
    setTimer(0);
    setResponseText(''); // Reset response text
    setTreeImageUrl(''); // Reset tree image URL
    setBlastResultUrl(''); // Reset BLAST result URL

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
        setResponseText(data.response); // Set response text
        setTreeImageUrl(`http://localhost:5000${data.tree_image_url}`); // Set tree image URL
        setBlastResultUrl(`http://localhost:5000${data.file_url}`); // Set BLAST result URL
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
    try {
      const response = await fetch('http://localhost:5000/status');
      const data = await response.json();
      setStatus(data.status);
    } catch (error) {
      console.error('Failed to fetch status:', error);
    }
  };

  useEffect(() => {
    if (loading) {
      const intervalId = setInterval(() => setTimer((prev) => prev + 1), 1000);
      return () => clearInterval(intervalId);
    }
  }, [loading]);

  return (
    <div className="homepage-container">
      <h1 className="homepage-title">Ascension Number Search Tool</h1>
      <div className="form-container">
        <input
          className="fasta-input"
          type="text"
          placeholder="Enter Ascension Number"
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
          <h2>Source of collection:</h2>
          <p>{responseText}</p>
        </div>
      )}

      {treeImageUrl && (
        <div className="tree-container">
          <h2>Phylogenetic Tree:</h2>
          <img src={treeImageUrl} alt="Phylogenetic Tree" className="tree-image" />
        </div>
      )}

      {blastResultUrl && (
        <div className="blast-result-container">
          <h2>BLAST Result:</h2>
          <a href={blastResultUrl} target="_blank" rel="noopener noreferrer">View Full BLAST Result</a>
        </div>
      )}
    </div>
  );
};

export default HomePage;
