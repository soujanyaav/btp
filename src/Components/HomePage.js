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
  const [responseText, setResponseText] = useState('');
  const [treeHtmlUrl, setTreeHtmlUrl] = useState('');
  const [blastResultUrl, setBlastResultUrl] = useState('');
  const [topBlastResults, setTopBlastResults] = useState([]); // State for top 10 BLAST results

  const handleFindClick = async () => {
    setLoading(true);
    setError('');
    setTimer(0);
    setResponseText('');
    setTreeHtmlUrl('');
    setBlastResultUrl('');
    setTopBlastResults([]);

    try {
      const intervalId = setInterval(() => {
        setTimer((prev) => prev + 1);
        fetchStatus();
      }, 1000);

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
        setResponseText(data.response);
        setTreeHtmlUrl(`http://localhost:5000${data.tree_image_url}`);
        setBlastResultUrl(`http://localhost:5000${data.file_url}`);
        setTopBlastResults(data.top_hits || []); // Set top 10 BLAST results
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
          <h2>Source of Collection:</h2>
          <p>{responseText}</p>
        </div>
      )}

      {topBlastResults.length > 0 && (
        <div className="top-blast-results-container">
          <h2>Top 10 BLAST Results:</h2>
          <ul>
            {topBlastResults.map((result, index) => (
              <li key={index} className="blast-result-item">
                <p><strong>Title:</strong> {result.title}</p>
                <p><strong>Author/Publication Link:</strong> <a href={result.publicationLink} target="_blank" rel="noopener noreferrer">{result.publicationLink}</a></p>
              </li>
            ))}
          </ul>
        </div>
      )}

      {treeHtmlUrl && (
        <div className="tree-container">
          <h2>Phylogenetic Tree:</h2>
          <iframe
            src={treeHtmlUrl}
            title="Phylogenetic Tree"
            className="tree-iframe"
            frameBorder="0"
          ></iframe>
        </div>
      )}

      {blastResultUrl && (
        <div className="blast-result-container">
          <h2>Full BLAST Result:</h2>
          <a href={blastResultUrl} target="_blank" rel="noopener noreferrer">View Full BLAST Result</a>
        </div>
      )}
    </div>
  );
};

export default HomePage;
