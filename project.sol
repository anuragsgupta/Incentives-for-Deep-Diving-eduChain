// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract KnowledgeIncentives {
    struct Contributor {
        address addr;
        uint256 totalIncentives;
    }
    
    struct Submission {
        uint256 id;
        address contributor;
        string field;
        string description;
        uint256 timestamp;
        uint256 reward;
        bool isApproved;
    }

    bool private locked;
    bool public paused;
    address public owner;
    uint256 public submissionCounter;
    uint256 public rewardPool;
    uint256 public rewardPerSubmission = 0.1 ether;

    mapping(uint256 => Submission) public submissions;
    mapping(address => uint256) private pendingWithdrawals;
    mapping(address => Contributor) public contributors;

    event SubmissionCreated(uint256 id, address indexed contributor, string field, uint256 timestamp);
    event SubmissionApproved(uint256 id, address indexed contributor, uint256 reward);
    event RewardClaimed(address indexed contributor, uint256 amount);
    event RewardPoolFunded(address indexed funder, uint256 amount);
    event RewardRateChanged(uint256 newRate);
    event ContractPaused(address indexed owner);
    event ContractUnpaused(address indexed owner);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only the owner can perform this action");
        _;
    }

    modifier sufficientPoolBalance(uint256 amount) {
        require(rewardPool >= amount, "Insufficient reward pool balance");
        _;
    }

    modifier noReentrant() {
        require(!locked, "Reentrant call");
        locked = true;
        _;
        locked = false;
    }

    modifier whenNotPaused() {
        require(!paused, "Contract is paused");
        _;
    }

    constructor() {
        owner = msg.sender;
        rewardPool = 10 ether;
    }

    function fundRewardPool() public payable onlyOwner {
        rewardPool += msg.value;
        emit RewardPoolFunded(msg.sender, msg.value);
    }

    function submitContribution(string memory field, string memory description)
        public
        whenNotPaused
    {
        require(bytes(field).length > 0, "Field cannot be empty");
        require(bytes(description).length > 0, "Description cannot be empty");
        require(bytes(description).length <= 2000, "Description too long");
        
        submissionCounter++;
        submissions[submissionCounter] = Submission(
            submissionCounter,
            msg.sender,
            field,
            description,
            block.timestamp,
            0,
            false
        );

        emit SubmissionCreated(submissionCounter, msg.sender, field, block.timestamp);
    }

    function approveSubmission(uint256 submissionId)
        public
        onlyOwner
        sufficientPoolBalance(rewardPerSubmission)
        whenNotPaused
    {
        Submission storage submission = submissions[submissionId];
        require(!submission.isApproved, "Submission already approved");

        submission.isApproved = true;
        submission.reward = rewardPerSubmission;
        rewardPool -= rewardPerSubmission;

        pendingWithdrawals[submission.contributor] += rewardPerSubmission;

        emit SubmissionApproved(submissionId, submission.contributor, rewardPerSubmission);
    }

    function claimRewards() public noReentrant whenNotPaused {
        uint256 amount = pendingWithdrawals[msg.sender];
        require(amount > 0, "No rewards to claim");
        
        pendingWithdrawals[msg.sender] = 0;
        
        (bool success, ) = msg.sender.call{value: amount}("");
        require(success, "Transfer failed");
        
        emit RewardClaimed(msg.sender, amount);
    }

    function getContributorRewards(address contributorAddress) public view returns (uint256) {
        return pendingWithdrawals[contributorAddress];
    }

    function getSubmissionDetails(uint256 submissionId)
        public
        view
        returns (Submission memory)
    {
        return submissions[submissionId];
    }

    function getAllSubmissions() public view returns (Submission[] memory) {
        Submission[] memory allSubmissions = new Submission[](submissionCounter);
        for (uint256 i = 1; i <= submissionCounter; i++) {
            allSubmissions[i - 1] = submissions[i];
        }
        return allSubmissions;
    }
    
    function pause() public onlyOwner {
        paused = true;
        emit ContractPaused(owner);
    }
    
    function unpause() public onlyOwner {
        paused = false;
        emit ContractUnpaused(owner);
    }

    function setRewardPerSubmission(uint256 newRate) public onlyOwner {
        require(newRate > 0, "Invalid reward rate");
        rewardPerSubmission = newRate;
        emit RewardRateChanged(newRate);
    }

    receive() external payable {
        fundRewardPool();
    }
    uint256 public constant CONTRIBUTIONS_PER_PAGE = 10;

    // Modified getPagedContributions with pagination
    function getPagedContributions(uint256 page) 
        public 
        view 
        returns (
            Submission[] memory contributions,
            uint256 totalPages
        ) 
    {
        uint256 totalSubmissions = submissionCounter;
        // Calculate total pages without creating a new variable
        totalPages = (totalSubmissions + CONTRIBUTIONS_PER_PAGE - 1) / CONTRIBUTIONS_PER_PAGE;
        
        uint256 startIndex = page * CONTRIBUTIONS_PER_PAGE + 1;
        uint256 endIndex = startIndex + CONTRIBUTIONS_PER_PAGE;
        if (endIndex > totalSubmissions + 1) {
            endIndex = totalSubmissions + 1;
        }
        
        uint256 length = endIndex - startIndex;
        contributions = new Submission[](length);
        
        for (uint256 i = 0; i < length; i++) {
            contributions[i] = submissions[startIndex + i];
        }
        
        return (contributions, totalPages);
    }

    // Add function to get latest contributions
    function getLatestContributions(uint256 count) 
        public 
        view 
        returns (Submission[] memory) 
    {
        uint256 length = count;
        if (length > submissionCounter) {
            length = submissionCounter;
        }
        
        Submission[] memory latest = new Submission[](length);
        for (uint256 i = 0; i < length; i++) {
            latest[i] = submissions[submissionCounter - i];
        }
        
        return latest;
    }

    // Add function to get contributions by contributor
    function getContributorSubmissions(address contributor) 
        public 
        view 
        returns (uint256[] memory) 
    {
        uint256 count = 0;
        for (uint256 i = 1; i <= submissionCounter; i++) {
            if (submissions[i].contributor == contributor) {
                count++;
            }
        }
        
        uint256[] memory contributorSubmissions = new uint256[](count);
        uint256 index = 0;
        for (uint256 i = 1; i <= submissionCounter; i++) {
            if (submissions[i].contributor == contributor) {
                contributorSubmissions[index] = i;
                index++;
            }
        }
        
        return contributorSubmissions;
    }
}
