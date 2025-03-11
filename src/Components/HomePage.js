import React, { useState, useEffect } from 'react';
import './HomePage.css';
import backgroundImage from '../assets/BG.jpg';

// Get API URL from environment variables or use localhost as fallback
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// Improved fetch function with better error handling and CORS options
const fetchWithCORS = async (url, options = {}) => {
  console.log(`Making request to: ${url}`);
  
  // Add default headers including CORS-related ones
  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    // Ensure credentials aren't sent for cross-origin requests
    credentials: 'omit',
    mode: 'cors'
  };
  
  // Merge with user options
  const fetchOptions = {
    ...defaultOptions,
    ...options,
    headers: {
      ...defaultOptions.headers,
      ...(options.headers || {})
    }
  };
  
  try {
    const response = await fetch(url, fetchOptions);
    
    // Log response details for debugging
    console.log(`Response status: ${response.status}`);
    console.log(`Response headers:`, Object.fromEntries([...response.headers]));
    
    // Check if the request was successful
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Error response: ${errorText}`);
      throw new Error(`Request failed with status ${response.status}: ${errorText}`);
    }
    
    return response;
  } catch (error) {
    console.error(`Fetch error for ${url}:`, error);
    console.error("Error name:", error.name);
    console.error("Error message:", error.message);
    throw error;
  }
};

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
  const [topBlastResults, setTopBlastResults] = useState([]);
  const [requestSent, setRequestSent] = useState(false);
  const [statusIntervalId, setStatusIntervalId] = useState(null);

  useEffect(() => {
    // Log API URL on component mount for debugging
    console.log("Using API URL:", API_URL);
  }, []);

  // This effect handles clean-up for the status polling interval
  useEffect(() => {
    return () => {
      if (statusIntervalId) {
        clearInterval(statusIntervalId);
      }
    };
  }, [statusIntervalId]);

  // This effect polls for results when request is sent but not yet complete
  useEffect(() => {
    if (requestSent && loading) {
      const pollForResults = async () => {
        try {
          const response = await fetchWithCORS(`${API_URL}/results`);
          const data = await response.json();
          
          if (data.status === 'completed' && data.results) {
            setLoading(false);
            setRequestSent(false);
            setStatus('Completed');
            
            // Process the results
            setResponseText(data.results.response);
            setTreeHtmlUrl(`${API_URL}${data.results.tree_image_url}`);
            setBlastResultUrl(`${API_URL}${data.results.file_url}`);
            setTopBlastResults(data.results.top_hits || []);
            
            // Clear the polling interval
            if (statusIntervalId) {
              clearInterval(statusIntervalId);
              setStatusIntervalId(null);
            }
          }
        } catch (error) {
          console.error('Failed to poll for results:', error);
        }
      };
      
      // Try once immediately
      pollForResults();
    }
  }, [requestSent, loading, API_URL, statusIntervalId]);

  const handleFindClick = async () => {
    setLoading(true);
    setError('');
    setTimer(0);
    setResponseText('');
    setTreeHtmlUrl('');
    setBlastResultUrl('');
    setTopBlastResults([]);
    setRequestSent(false);

    // Set up status polling
    const intervalId = setInterval(() => {
      setTimer((prev) => prev + 1);
      fetchStatus();
    }, 1000);
    
    setStatusIntervalId(intervalId);

    try {
      // Send the initial request - this might take a while
      const response = await fetchWithCORS(`${API_URL}/blast`, {
        method: 'POST',
        body: JSON.stringify({ 
          sequence: fasta, 
          blast_type: blastType, 
          database: database 
        }),
      });

      // Mark that we've sent the request successfully
      setRequestSent(true);

      // Process immediate response if available
      const data = await response.json();

      if (response.ok) {
        setStatus('Completed');
        setResponseText(data.response);
        setTreeHtmlUrl(`${API_URL}${data.tree_image_url}`);
        setBlastResultUrl(`${API_URL}${data.file_url}`);
        setTopBlastResults(data.top_hits || []);
        
        // Clean up
        clearInterval(intervalId);
        setStatusIntervalId(null);
        setLoading(false);
      } else {
        setError(`Error: ${data.error}`);
        clearInterval(intervalId);
        setStatusIntervalId(null);
        setLoading(false);
      }
    } catch (error) {
      if (error.message.includes('Failed to fetch')) {
        // This might be a timeout - the operation could still be running on the server
        // Keep the loading state active but inform the user
        setError("Server is processing your request. This may take several minutes depending on the BLAST search complexity. The page will update when results are ready.");
        // Don't set loading to false here - we'll keep checking status
      } else {
        // For other errors, show the error and stop loading
        setError(`Request failed: ${error.message}`);
        clearInterval(intervalId);
        setStatusIntervalId(null);
        setLoading(false);
      }
    }
  };

  const fetchStatus = async () => {
    try {
      const response = await fetchWithCORS(`${API_URL}/status`);
      const data = await response.json();
      setStatus(data.status);
      
      // If status indicates completion, try to fetch results
      if (data.status === 'Completed' && requestSent) {
        try {
          const resultsResponse = await fetchWithCORS(`${API_URL}/results`);
          const resultsData = await resultsResponse.json();
          
          if (resultsData && resultsData.response) {
            setLoading(false);
            setRequestSent(false);
            setResponseText(resultsData.response);
            setTreeHtmlUrl(`${API_URL}${resultsData.tree_image_url}`);
            setBlastResultUrl(`${API_URL}${resultsData.file_url}`);
            setTopBlastResults(resultsData.top_hits || []);
            
            if (statusIntervalId) {
              clearInterval(statusIntervalId);
              setStatusIntervalId(null);
            }
          }
        } catch (resultsError) {
          console.error('Failed to fetch results:', resultsError);
        }
      }
    } catch (error) {
      console.error('Failed to fetch status:', error);
    }
  };

  return (
    <div
      className="homepage-container"
      style={{ backgroundImage: `url(${backgroundImage})` }}
    >
      <div className="content-box">
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
          {loading && requestSent && (
            <p className="info-message">
              BLAST searches can take several minutes. Please be patient...
            </p>
          )}
        </div>

        {error && <div className="error-container"><p>{error}</p></div>}

        {treeHtmlUrl && (
          <div className="tree-container">
            <div className="xyz">
              <iframe
                src={treeHtmlUrl}
                title="Phylogenetic Tree"
                className="tree-iframe"
                frameBorder="0"
              ></iframe>
            </div>
          </div>
        )}

        {responseText && (
          <div className="response-container">
            <h2>Source of Collection:</h2>
            <p>{responseText}</p>
          </div>
        )}

        {topBlastResults.length > 0 && (
          <div className="top-blast-results-container">
            <div className="best-match-container">
              <h2>Best Match:</h2>
              <p>{topBlastResults[0].title}</p>
              <p><strong>GenBank Submission:</strong> <a href={topBlastResults[0].publicationLink} target="_blank" rel="noopener noreferrer">{topBlastResults[0].publicationLink}</a></p>
            </div>
            <div className="other-matches-container">
              <h2>Other Top Matches:</h2>
              {topBlastResults.slice(1, 9).map((result, index) => (
                <div key={index + 1} className="blast-result-item">
                  <p><strong>{index + 2}.</strong> <strong>Title:</strong> {result.title}</p>
                  <p><strong>GenBank Submission:</strong> <a href={result.publicationLink} target="_blank" rel="noopener noreferrer">{result.publicationLink}</a></p>
                </div>
              ))}
            </div>
          </div>
        )}

        {blastResultUrl && (
          <div className="blast-result-container">
            <h2>Full BLAST Result:</h2>
            <a href={blastResultUrl} target="_blank" rel="noopener noreferrer">View Full BLAST Result</a>
          </div>
        )}
      </div>
    </div>
  );
};

export default HomePage;