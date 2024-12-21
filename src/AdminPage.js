import React, { useState } from 'react';
import ManageContract from './ManageContract';
import ApproveSubmissions from './ApproveSubmissions';
import useContract from './useContract';
import { ethers } from 'ethers';

function AdminPage() {
    const {
        account,
        contract,
        submissions,
        loading,
        paused,
        setLoading,
        fetchSubmissions,
        fetchContractDetails,
        setPaused,
    } = useContract();

    const [errorMessage, setErrorMessage] = useState('');

    const togglePause = async () => {
        if (contract) {
            try {
                setLoading(true);
                const tx = paused ? await contract.unpause() : await contract.pause();
                await tx.wait();
                setPaused(!paused);
            } catch (error) {
                console.error('Error toggling contract state: ', error.message);
                setErrorMessage('Error toggling contract state: ' + error.message);
            } finally {
                setLoading(false);
            }
        }
    };

    const updateRewardPerSubmission = async (rewardPerSubmission) => {
        if (contract) {
            try {
                setLoading(true);
                const rewardAmountInWei = ethers.utils.parseUnits(rewardPerSubmission.toString(), 18);
                const tx = await contract.setRewardPerSubmission(rewardAmountInWei);
                await tx.wait();
                fetchContractDetails(contract);
            } catch (error) {
                console.error('Error updating reward per submission: ', error.message);
                setErrorMessage('Error updating reward per submission: ' + error.message);
            } finally {
                setLoading(false);
            }
        }
    };

    const fundRewardPool = async (fundAmount) => {
        if (contract) {
            try {
                setLoading(true);
                const fundAmountInWei = ethers.utils.parseUnits(fundAmount.toString(), 18);
                const tx = await contract.fundRewardPool(fundAmountInWei);
                await tx.wait();
            } catch (error) {
                console.error('Error funding reward pool: ', error.message);
                setErrorMessage('Error funding reward pool: ' + error.message);
            } finally {
                setLoading(false);
            }
        }
    };

    const approveSubmission = async (submissionId) => {
        if (contract) {
            try {
                setLoading(true);
                const tx = await contract.approveSubmission(submissionId);
                await tx.wait();
                fetchSubmissions(contract);
            } catch (error) {
                console.error('Error approving submission: ', error.message);
                setErrorMessage('Error approving submission: ' + error.message);
            } finally {
                setLoading(false);
            }
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 font-sans">
            <header className="bg-blue-600 text-white p-6 text-center rounded-b-lg shadow-lg">
                <h1 className="text-3xl font-semibold">Admin Dashboard</h1>
                {account && <p className="mt-4">Connected as: {account}</p>}
            </header>

            <main className="p-8 space-y-8">
                {errorMessage && (
                    <div className="bg-red-200 text-red-700 p-4 rounded-md shadow-lg">
                        <p>{errorMessage}</p>
                    </div>
                )}

                <ManageContract
                    togglePause={togglePause}
                    updateRewardPerSubmission={updateRewardPerSubmission}
                    fundRewardPool={fundRewardPool}
                    paused={paused}
                    loading={loading}
                />

                <ApproveSubmissions
                    submissions={submissions}
                    approveSubmission={approveSubmission}
                    loading={loading}
                />
            </main>
        </div>
    );
}

export default AdminPage;
