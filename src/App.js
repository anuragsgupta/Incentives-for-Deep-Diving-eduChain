import { CONTRACT_ABI, CONTRACT_ADDRESS } from './config';
import React, { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { Web3Provider } from '@ethersproject/providers';

function App() {
  const [account, setAccount] = useState(null);
  const [contract, setContract] = useState(null);
  const [contributions, setContributions] = useState([]);
  const [reward, setReward] = useState(0);
  const [form, setForm] = useState({ field: '', description: '' });
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Connect Wallet
  const connectWallet = async () => {
    try {
      if (window.ethereum) {
        const provider = new Web3Provider(window.ethereum);
        const accounts = await provider.send('eth_requestAccounts', []);
        setAccount(accounts[0]);

        const signer = provider.getSigner();
        const contractInstance = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
        setContract(contractInstance);

        fetchContributorReward(contractInstance, accounts[0]);
      } else {
        alert('Please install MetaMask to use this app.');
      }
    } catch (error) {
      setErrorMessage('Error connecting wallet: ' + error.message);
    }
  };

  // Fetch Contributor Reward
  const fetchContributorReward = useCallback(async (contractInstance, contributor) => {
    try {
      const rewardAmount = await contractInstance.getContributorRewards(contributor);
      setReward(ethers.utils.formatEther(rewardAmount));
    } catch (error) {
      setErrorMessage('Error fetching rewards: ' + error.message);
    }
  }, []);

  // Fetch Contributions
  const fetchContributions = useCallback(async (page = 0) => {
    if (!contract) return;

    try {
      setFetchLoading(true);
      setErrorMessage('');

      const [allSubmissions, totalPages] = await contract.getPagedContributions(page);

      if (allSubmissions.length === 0) {
        console.warn('No contributions found.');
        setContributions([]);
        setTotalPages(0);
        setCurrentPage(0);
        return;
      }

      // Format the submissions data
      const formattedSubmissions = allSubmissions.map((submission) => ({
        id: submission.id.toString(),
        field: submission.field,
        description: submission.description,
        contributor: submission.contributor,
        timestamp: new Date(submission.timestamp.toNumber() * 1000).toLocaleString(),
        reward: ethers.utils.formatEther(submission.reward),
        isApproved: submission.isApproved,
      }));

      setContributions(formattedSubmissions);
      setTotalPages(totalPages.toNumber());
      setCurrentPage(page);
    } catch (error) {
      console.error('Error fetching contributions:', error);
      setErrorMessage('Error fetching contributions: ' + error.message);
    } finally {
      setFetchLoading(false);
    }
  }, [contract]);

  const PaginationControls = () => (
    <div className="flex justify-center gap-2 mt-4">
      <button
        onClick={() => fetchContributions(currentPage - 1)}
        disabled={currentPage === 0 || fetchLoading}
        className="px-4 py-2 bg-blue-500 text-white rounded disabled:bg-gray-300"
      >
        Previous
      </button>
      <span className="px-4 py-2">
        Page {currentPage + 1} of {totalPages}
      </span>
      <button
        onClick={() => fetchContributions(currentPage + 1)}
        disabled={currentPage >= totalPages - 1 || fetchLoading}
        className="px-4 py-2 bg-blue-500 text-white rounded disabled:bg-gray-300"
      >
        Next
      </button>
    </div>
  );

  // Submit Contribution
  const submitContribution = async (e) => {
    e.preventDefault();
    if (contract && form.field && form.description) {
      try {
        setLoading(true);
        setErrorMessage('');
        const tx = await contract.submitContribution(form.field, form.description);
        await tx.wait();
        alert('Contribution submitted successfully!');
        setForm({ field: '', description: '' }); // Clear form
        fetchContributions(); // Refresh the list
      } catch (error) {
        setErrorMessage('Error submitting contribution: ' + error.message);
      } finally {
        setLoading(false);
      }
    }
  };

  // Claim Rewards
  const claimRewards = async () => {
    if (contract) {
      try {
        setLoading(true);
        setErrorMessage('');
        const tx = await contract.claimRewards();
        await tx.wait();
        alert('Rewards claimed successfully!');
        fetchContributorReward(contract, account);
      } catch (error) {
        setErrorMessage('Error claiming rewards: ' + error.message);
      } finally {
        setLoading(false);
      }
    }
  };

  // Auto-fetch contributions when contract is ready
  useEffect(() => {
    if (contract) fetchContributions();
  }, [contract, fetchContributions]);

  // Listen for contract events
  useEffect(() => {
    if (contract) {
      const submissionCreatedFilter = contract.filters.SubmissionCreated();
      const submissionApprovedFilter = contract.filters.SubmissionApproved();

      contract.on(submissionCreatedFilter, () => {
        fetchContributions(currentPage);
      });

      contract.on(submissionApprovedFilter, () => {
        fetchContributions(currentPage);
      });

      return () => {
        contract.removeAllListeners(submissionCreatedFilter);
        contract.removeAllListeners(submissionApprovedFilter);
      };
    }
  }, [contract, fetchContributions, currentPage]);

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <header className="bg-blue-600 text-white p-6 text-center rounded-b-lg shadow-lg">
        <h1 className="text-3xl font-semibold">Incentives for Deep-Diving</h1>
        {!account ? (
          <button
            className="mt-4 bg-blue-800 text-white py-2 px-4 rounded-full hover:bg-blue-700 transition duration-300"
            onClick={connectWallet}
          >
            Connect Wallet
          </button>
        ) : (
          <p className="mt-4">Connected as: {account}</p>
        )}
      </header>

      <main className="p-8 space-y-8">
        {errorMessage && (
          <div className="bg-red-200 text-red-700 p-4 rounded-md shadow-lg">
            <p>{errorMessage}</p>
          </div>
        )}

        {/* Contribution Submission Form */}
        <section className="bg-white p-8 rounded-lg shadow-lg">
          <h2 className="text-xl font-semibold text-center mb-6">Submit a Contribution</h2>
          <form onSubmit={submitContribution} className="space-y-6 max-w-lg mx-auto">
            <input
              type="text"
              placeholder="Field"
              className="w-full p-4 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 transition duration-200"
              value={form.field}
              onChange={(e) => setForm({ ...form, field: e.target.value })}
              required
            />
            <textarea
              placeholder="Description"
              className="w-full p-4 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 transition duration-200"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              required
            />
            <button
              type="submit"
              className={`w-full py-3 text-white rounded-md ${loading ? 'bg-gray-400' : 'bg-green-500 hover:bg-green-600'} transition duration-300`}
              disabled={loading}
            >
              {loading ? 'Submitting...' : 'Submit'}
            </button>
          </form>
        </section>

        {/* Display Rewards */}
        <section className="bg-white p-8 rounded-lg shadow-lg">
          <h2 className="text-xl font-semibold text-center mb-6">Your Rewards</h2>
          <p className="text-2xl font-bold text-center">{reward} ETH</p>
          <button
            onClick={claimRewards}
            className={`mt-4 w-full py-3 rounded-md text-white ${loading ? 'bg-gray-400' : 'bg-yellow-500 hover:bg-yellow-600'} transition duration-300`}
            disabled={loading}
          >
            {loading ? 'Claiming...' : 'Claim Rewards'}
          </button>
        </section>

        {/* Display All Contributions */}
        <section className="bg-white p-8 rounded-lg shadow-lg">
          <h2 className="text-xl font-semibold mb-6">All Contributions</h2>
          <button
            onClick={() => fetchContributions(currentPage)}
            className={`w-full py-3 text-white ${
              fetchLoading ? 'bg-gray-400' : 'bg-blue-500 hover:bg-blue-600'
            } rounded-md transition duration-300`}
            disabled={fetchLoading}
          >
                  {fetchLoading ? 'Fetching...' : 'Refresh Contributions'}
            </button>
            <div className="space-y-4 mt-6">
              {contributions.length === 0 ? (
                <p className="text-center text-gray-500">No contributions found</p>
              ) : (
                <>
                  <ul className="space-y-4">
                    {contributions.map((contribution) => (
                      <li key={contribution.id} className="border p-4 rounded-lg shadow">
                        <p><strong>Field:</strong> {contribution.field}</p>
                        <p><strong>Description:</strong> {contribution.description}</p>
                        <p><strong>Contributor:</strong> {contribution.contributor}</p>
                        <p><strong>Timestamp:</strong> {contribution.timestamp}</p>
                        <p><strong>Reward:</strong> {contribution.reward} ETH</p>
                        <p><strong>Approved:</strong> {contribution.isApproved ? 'Yes' : 'No'}</p>
                      </li>
                    ))}
                  </ul>
                  <PaginationControls />
                </>
              )}
            </div>
          </section>
        </main>
      </div>
    );
}

export default App;
