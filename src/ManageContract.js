import React, { useState } from 'react';

function ManageContract({ togglePause, updateRewardPerSubmission, fundRewardPool, paused, loading }) {
    const [rewardPerSubmission, setRewardPerSubmission] = useState(0);
    const [fundAmount, setFundAmount] = useState(0);

    return (
        <section className="bg-white p-8 rounded-lg shadow-lg">
            <h2 className="text-xl font-semibold mb-6">Manage Contract</h2>
            <div className="space-y-4">
                <button
                    onClick={togglePause}
                    className={`w-full py-3 rounded-md text-white ${loading ? 'bg-gray-400' : 'bg-red-500 hover:bg-red-600'} transition duration-300`}
                    disabled={loading}
                >
                    {loading ? (paused ? 'Unpausing...' : 'Pausing...') : (paused ? 'Unpause Contract' : 'Pause Contract')}
                </button>
                <div className="flex flex-col space-y-2">
                    <input
                        type="number"
                        placeholder="Reward per submission (in EDU)"
                        value={rewardPerSubmission}
                        onChange={(e) => setRewardPerSubmission(e.target.value)}
                        className="w-full p-4 border border-gray-300 rounded-md"
                    />
                    <button
                        onClick={() => updateRewardPerSubmission(rewardPerSubmission)}
                        className={`w-full py-3 rounded-md text-white ${loading ? 'bg-gray-400' : 'bg-yellow-500 hover:bg-yellow-600'} transition duration-300`}
                        disabled={loading}
                    >
                        {loading ? 'Updating...' : 'Update Reward'}
                    </button>
                </div>
                <div className="flex flex-col space-y-2">
                    <input
                        type="number"
                        placeholder="Fund amount (in EDU)"
                        value={fundAmount}
                        onChange={(e) => setFundAmount(e.target.value)}
                        className="w-full p-4 border border-gray-300 rounded-md"
                    />
                    <button
                        onClick={() => fundRewardPool(fundAmount)}
                        className={`w-full py-3 rounded-md text-white ${loading ? 'bg-gray-400' : 'bg-green-500 hover:bg-green-600'} transition duration-300`}
                        disabled={loading}
                    >
                        {loading ? 'Funding...' : 'Fund Reward Pool'}
                    </button>
                </div>
            </div>
        </section>
    );
}

export default ManageContract;
