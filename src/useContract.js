import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { Web3Provider } from '@ethersproject/providers';
import { CONTRACT_ABI, CONTRACT_ADDRESS } from './config';

function useContract() {
    const [account, setAccount] = useState(localStorage.getItem('account')); // Load from localStorage
    const [contract, setContract] = useState(null);
    const [submissions, setSubmissions] = useState([]);
    const [paused, setPaused] = useState(false);
    const [rewardPerSubmission, setRewardPerSubmission] = useState(0); // Added state for reward per submission

    const fetchSubmissions = useCallback(async (contractInstance) => {
        try {
            const allSubmissions = await contractInstance.getAllSubmissions();
            const formattedSubmissions = allSubmissions.map((submission) => ({
                id: submission.id.toString(),
                field: submission.field,
                description: submission.description,
                contributor: submission.contributor,
                timestamp: new Date(submission.timestamp.toNumber() * 1000).toLocaleString(),
                reward: ethers.utils.formatUnits(submission.reward, 18),
                isApproved: submission.isApproved,
            }));
            setSubmissions(formattedSubmissions);
        } catch (error) {
            console.error('Error fetching submissions: ', error.message);
        }
    }, []);

    const fetchContractDetails = useCallback(async (contractInstance) => {
        try {
            const isPaused = await contractInstance.paused();
            setPaused(isPaused);

            const reward = await contractInstance.rewardPerSubmission();
            setRewardPerSubmission(ethers.utils.formatUnits(reward, 18));
        } catch (error) {
            console.error('Error fetching contract details: ', error.message);
        }
    }, []);

    useEffect(() => {
        const init = async () => {
            if (window.ethereum) {
                const provider = new Web3Provider(window.ethereum);
                const accounts = await provider.send('eth_requestAccounts', []);
                setAccount(accounts[0]);
                const signer = provider.getSigner();
                const contractInstance = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
                setContract(contractInstance);
                fetchSubmissions(contractInstance);
                fetchContractDetails(contractInstance);
            } else {
                console.error('Please install MetaMask to use this app.');
            }
        };
        init();
    }, [fetchSubmissions, fetchContractDetails]);

    return { account, contract, submissions, paused, rewardPerSubmission };
}

export default useContract;