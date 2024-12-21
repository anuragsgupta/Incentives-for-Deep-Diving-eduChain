import React from 'react';

function ApproveSubmissions({ submissions, approveSubmission, loading }) {
    return (
        <section className="bg-white p-8 rounded-lg shadow-lg">
            <h2 className="text-xl font-semibold mb-6">Approve Submissions</h2>
            <div className="space-y-4">
                {submissions.length === 0 ? (
                    <p className="text-center text-gray-500">No submissions found</p>
                ) : (
                    <ul className="space-y-4">
                        {submissions.map((submission) => (
                            <li key={submission.id} className="border p-4 rounded-lg shadow">
                                <p><strong>Field:</strong> {submission.field}</p>
                                <p><strong>Description:</strong> {submission.description}</p>
                                <p><strong>Contributor:</strong> {submission.contributor}</p>
                                <p><strong>Timestamp:</strong> {submission.timestamp}</p>
                                <p><strong>Reward:</strong> {submission.reward} EDU</p>
                                <p><strong>Approved:</strong> {submission.isApproved ? 'Yes' : 'No'}</p>
                                {!submission.isApproved && (
                                    <button
                                        onClick={() => approveSubmission(submission.id)}
                                        className={`mt-2 w-full py-2 rounded-md text-white ${loading ? 'bg-gray-400' : 'bg-blue-500 hover:bg-blue-600'} transition duration-300`}
                                        disabled={loading}
                                    >
                                        {loading ? 'Approving...' : 'Approve Submission'}
                                    </button>
                                )}
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </section>
    );
}

export default ApproveSubmissions;
