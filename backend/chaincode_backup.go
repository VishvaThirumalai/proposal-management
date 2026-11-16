package main

import (
	"encoding/json"
	"fmt"
	"time"
        "strconv"

	"github.com/hyperledger/fabric-contract-api-go/contractapi"
)

// ===== STRUCTS =====

type StartupHubContract struct {
	contractapi.Contract
}

type Proposal struct {
	ID                string  `json:"id"`
	FounderID         string  `json:"founderId"`
	Title             string  `json:"title"`
	Domain            string  `json:"domain"`
	Stage             string  `json:"stage"`
	FundingAmount     float64 `json:"fundingAmount"`
	IPFSCID           string  `json:"ipfsCid"`
	SHA256Hash        string  `json:"sha256Hash"`
	TMeta             string  `json:"tMeta"`
	Version           int     `json:"version"`
	Status            string  `json:"status"`
	Summary           string  `json:"summary"`
	Keywords          string  `json:"keywords"`
	TechnologyStack   string  `json:"technologyStack"`
	MentorRequirements string `json:"mentorRequirements"`
	InvestorPitch     string  `json:"investorPitch"`
	ProblemStatement  string  `json:"problemStatement"`
	Solution          string  `json:"solution"`
	BusinessModel     string  `json:"businessModel"`
	Timestamp         string  `json:"timestamp"`
	BlockHash         string  `json:"blockHash"`
	RandomParam       string  `json:"randomParam"`
}

type AccessPermission struct {
	ProposalID string `json:"proposalId"`
	UserID     string `json:"userId"`
	UserRole   string `json:"userRole"`
	Permission bool   `json:"permission"`
	GrantedBy  string `json:"grantedBy"`
	GrantedAt  string `json:"grantedAt"`
	RevokedAt  string `json:"revokedAt"`
}

// ================================================================
// ESCROW STRUCTS
// ================================================================

// Milestone represents a funding milestone in the escrow
type Milestone struct {
	MilestoneID     string   `json:"milestoneId"`
	Description     string   `json:"description"`
	Amount          float64  `json:"amount"`
	DueDate         string   `json:"dueDate"`
	Status          string   `json:"status"` // PENDING, PROOF_SUBMITTED, APPROVED, REJECTED, FUNDS_RELEASED
	ProofCID        string   `json:"proofCid"`
	ProofHash       string   `json:"proofHash"`
	ProofNotes      string   `json:"proofNotes"`
	SubmittedBy     string   `json:"submittedBy"`
	Approvals       []string `json:"approvals"`
	Rejections      []string `json:"rejections"`
	RejectReason    string   `json:"rejectReason"`
	SubmittedAt     string   `json:"submittedAt"`
	ApprovedAt      string   `json:"approvedAt"`
	ReleasedAt      string   `json:"releasedAt"`
	TransactionHash string   `json:"transactionHash"`
}

// Escrow represents the milestone-based funding escrow
// Escrow represents the milestone-based funding escrow
type Escrow struct {
	EscrowID          string      `json:"escrowId"`
	StartupID         string      `json:"startupId"`
	InvestorID        string      `json:"investorId"`
	FounderID         string      `json:"founderId"`
	TotalAmount       float64     `json:"totalAmount"`
	ReleasedAmount    float64     `json:"releasedAmount"`
	Milestones        []Milestone `json:"milestones"`
	Approvers         []string    `json:"approvers"`
	RequiredApprovals int         `json:"requiredApprovals"`
	Status            string      `json:"status"` // FUNDS_LOCKED, PARTIAL_RELEASED, COMPLETED, DISPUTED
	BlockchainTxHash  string      `json:"blockchainTxHash"`
	CreatedAt         string      `json:"createdAt"`
	UpdatedAt         string      `json:"updatedAt"`
}

// ===== ESCROW STRUCTS =====



type DCHParams struct {
    BlockHash   string `json:"blockHash"`
    RandomParam string `json:"randomParam"`
    PublicKey   string `json:"publicKey"`
    Modulus     string `json:"modulus"`
    Generator   string `json:"generator"`
}

// ===== PROPOSAL FUNCTIONS =====
func (s *StartupHubContract) CreateProposal(
        ctx contractapi.TransactionContextInterface,
        id string,
        founderId string,
        title string,
        domain string,
        stage string,
        fundingAmount string,
        ipfsCid string,
        sha256Hash string,
        tMeta string,
        summary string,
        keywords string,
        technologyStack string,
        mentorRequirements string,
        investorPitch string,
        problemStatement string,
        solution string,
        businessModel string,
) error {
        existing, err := ctx.GetStub().GetState(id)
        if err != nil {
                return fmt.Errorf("failed to read state: %v", err)
        }
        if existing != nil {
                return fmt.Errorf("proposal %s already exists", id)
        }

        funding, _ := strconv.ParseFloat(fundingAmount, 64)

        proposal := Proposal{
                ID:                 id,
                FounderID:          founderId,
                Title:              title,
                Domain:             domain,
                Stage:              stage,
                FundingAmount:      funding,
                IPFSCID:            ipfsCid,
                SHA256Hash:         sha256Hash,
                TMeta:              tMeta,
                Summary:            summary,
                Keywords:           keywords,
                TechnologyStack:    technologyStack,
                MentorRequirements: mentorRequirements,
                InvestorPitch:      investorPitch,
                ProblemStatement:   problemStatement,
                Solution:           solution,
                BusinessModel:      businessModel,
                Version:            1,
                Status:             "ACTIVE",
                Timestamp:          time.Now().UTC().Format(time.RFC3339),
                BlockHash:          "",
                RandomParam:        "",
        }

        proposalJSON, err := json.Marshal(proposal)
        if err != nil {
                return err
        }

        return ctx.GetStub().PutState(id, proposalJSON)
}


func (s *StartupHubContract) ReadProposal(ctx contractapi.TransactionContextInterface, id string) (*Proposal, error) {
	proposalJSON, err := ctx.GetStub().GetState(id)
	if err != nil {
		return nil, fmt.Errorf("failed to read state: %v", err)
	}
	if proposalJSON == nil {
		return nil, fmt.Errorf("proposal %s does not exist", id)
	}

	var proposal Proposal
	err = json.Unmarshal(proposalJSON, &proposal)
	if err != nil {
		return nil, err
	}

	return &proposal, nil
}

func (s *StartupHubContract) UpdateProposal(
	ctx contractapi.TransactionContextInterface,
	id string,
	ipfsCid string,
	sha256Hash string,
	tMeta string,
	summary string,
	keywords string,
) error {
	proposalJSON, err := ctx.GetStub().GetState(id)
	if err != nil {
		return err
	}
	if proposalJSON == nil {
		return fmt.Errorf("proposal %s does not exist", id)
	}

	var proposal Proposal
	err = json.Unmarshal(proposalJSON, &proposal)
	if err != nil {
		return err
	}

	proposal.IPFSCID = ipfsCid
	proposal.SHA256Hash = sha256Hash
	proposal.TMeta = tMeta
	proposal.Summary = summary
	proposal.Keywords = keywords
	proposal.Version = proposal.Version + 1
	proposal.Timestamp = time.Now().UTC().Format(time.RFC3339)

	updatedJSON, err := json.Marshal(proposal)
	if err != nil {
		return err
	}

	return ctx.GetStub().PutState(id, updatedJSON)
}

func (s *StartupHubContract) GetAllProposals(ctx contractapi.TransactionContextInterface) ([]Proposal, error) {
	resultsIterator, err := ctx.GetStub().GetStateByRange("", "")
	if err != nil {
		return nil, err
	}
	defer resultsIterator.Close()

	var proposals []Proposal
	for resultsIterator.HasNext() {
		queryResponse, err := resultsIterator.Next()
		if err != nil {
			return nil, err
		}

		var proposal Proposal
		err = json.Unmarshal(queryResponse.Value, &proposal)
		if err != nil {
			return nil, err
		}
		proposals = append(proposals, proposal)
	}

	return proposals, nil
}

func (s *StartupHubContract) GetProposalsByFounder(ctx contractapi.TransactionContextInterface, founderId string) ([]Proposal, error) {
	allProposals, err := s.GetAllProposals(ctx)
	if err != nil {
		return nil, err
	}

	var result []Proposal
	for _, p := range allProposals {
		if p.FounderID == founderId {
			result = append(result, p)
		}
	}
	return result, nil
}

// ===== ACCESS CONTROL FUNCTIONS =====

func (s *StartupHubContract) GrantAccess(
	ctx contractapi.TransactionContextInterface,
	proposalId string,
	userId string,
	userRole string,
	grantedBy string,
) error {
	key := fmt.Sprintf("%s_%s", proposalId, userId)

	permission := AccessPermission{
		ProposalID: proposalId,
		UserID:     userId,
		UserRole:   userRole,
		Permission: true,
		GrantedBy:  grantedBy,
		GrantedAt:  time.Now().UTC().Format(time.RFC3339),
		RevokedAt:  "",
	}

	permissionJSON, err := json.Marshal(permission)
	if err != nil {
		return err
	}

	return ctx.GetStub().PutState(key, permissionJSON)
}

func (s *StartupHubContract) RevokeAccess(
	ctx contractapi.TransactionContextInterface,
	proposalId string,
	userId string,
) error {
	key := fmt.Sprintf("%s_%s", proposalId, userId)

	permissionJSON, err := ctx.GetStub().GetState(key)
	if err != nil {
		return err
	}
	if permissionJSON == nil {
		return fmt.Errorf("permission not found for proposal %s and user %s", proposalId, userId)
	}

	var permission AccessPermission
	err = json.Unmarshal(permissionJSON, &permission)
	if err != nil {
		return err
	}

	permission.Permission = false
	permission.RevokedAt = time.Now().UTC().Format(time.RFC3339)

	updatedJSON, err := json.Marshal(permission)
	if err != nil {
		return err
	}

	return ctx.GetStub().PutState(key, updatedJSON)
}

func (s *StartupHubContract) CheckPermission(
	ctx contractapi.TransactionContextInterface,
	proposalId string,
	userId string,
) (bool, error) {
	key := fmt.Sprintf("%s_%s", proposalId, userId)

	permissionJSON, err := ctx.GetStub().GetState(key)
	if err != nil {
		return false, err
	}
	if permissionJSON == nil {
		return false, nil
	}

	var permission AccessPermission
	err = json.Unmarshal(permissionJSON, &permission)
	if err != nil {
		return false, err
	}

	return permission.Permission, nil
}

// ===== DCH FUNCTIONS =====

func (s *StartupHubContract) InitDCH(
	ctx contractapi.TransactionContextInterface,
	blockHash string,
	randomParam string,
	publicKey string,
	modulus string,
	generator string,
) error {
	params := DCHParams{
		BlockHash:   blockHash,
		RandomParam: randomParam,
		PublicKey:   publicKey,
		Modulus:     modulus,
		Generator:   generator,
	}

	paramsJSON, err := json.Marshal(params)
	if err != nil {
		return err
	}

	return ctx.GetStub().PutState("DCH_PARAMS", paramsJSON)
}

func (s *StartupHubContract) GetDCHParams(ctx contractapi.TransactionContextInterface) (*DCHParams, error) {
	paramsJSON, err := ctx.GetStub().GetState("DCH_PARAMS")
	if err != nil {
		return nil, err
	}
	if paramsJSON == nil {
		return nil, fmt.Errorf("DCH parameters not found")
	}

	var params DCHParams
	err = json.Unmarshal(paramsJSON, &params)
	if err != nil {
		return nil, err
	}

	return &params, nil
}

func (s *StartupHubContract) UpdateProposalWithDCH(
	ctx contractapi.TransactionContextInterface,
	id string,
	ipfsCid string,
	sha256Hash string,
	tMeta string,
	summary string,
	keywords string,
	newRandomParam string,
) error {
	proposalJSON, err := ctx.GetStub().GetState(id)
	if err != nil {
		return err
	}
	if proposalJSON == nil {
		return fmt.Errorf("proposal %s does not exist", id)
	}

	var proposal Proposal
	err = json.Unmarshal(proposalJSON, &proposal)
	if err != nil {
		return err
	}

	proposal.IPFSCID = ipfsCid
	proposal.SHA256Hash = sha256Hash
	proposal.TMeta = tMeta
	proposal.Summary = summary
	proposal.Keywords = keywords
	proposal.Version = proposal.Version + 1
	proposal.RandomParam = newRandomParam
	proposal.Timestamp = time.Now().UTC().Format(time.RFC3339)

	updatedJSON, err := json.Marshal(proposal)
	if err != nil {
		return err
	}
return ctx.GetStub().PutState(id, updatedJSON)
}

// ================================================================
// ESCROW FUNCTIONS
// ================================================================

// CreateEscrow creates a new escrow
// CreateEscrow creates a new escrow
func (s *StartupHubContract) CreateEscrow(
	ctx contractapi.TransactionContextInterface,
	escrowID string,
	startupID string,
	investorID string,
	founderID string,
	totalAmount string,
	milestonesJSON string,
	approversJSON string,
) error {
	existing, err := ctx.GetStub().GetState(escrowID)
	if err != nil {
		return err
	}
	if existing != nil {
		return fmt.Errorf("escrow %s already exists", escrowID)
	}

	amount, err := strconv.ParseFloat(totalAmount, 64)
	if err != nil {
		return fmt.Errorf("invalid amount: %v", err)
	}

	var milestones []Milestone
	err = json.Unmarshal([]byte(milestonesJSON), &milestones)
	if err != nil {
		return fmt.Errorf("invalid milestones JSON: %v", err)
	}

	// ✅ FIX: Ensure arrays are never nil
	for i := range milestones {
		milestones[i].Status = "PENDING"
		if milestones[i].Approvals == nil {
			milestones[i].Approvals = []string{}
		}
		if milestones[i].Rejections == nil {
			milestones[i].Rejections = []string{}
		}
	}

	var approvers []string
	err = json.Unmarshal([]byte(approversJSON), &approvers)
	if err != nil {
		return fmt.Errorf("invalid approvers JSON: %v", err)
	}
	if approvers == nil {
		approvers = []string{}
	}

	escrow := Escrow{
		EscrowID:    escrowID,
		StartupID:   startupID,
		InvestorID:  investorID,
		FounderID:   founderID,
		TotalAmount: amount,
		Milestones:  milestones,
		Approvers:   approvers,
		Status:      "FUNDS_LOCKED",
		CreatedAt:   time.Now().UTC().Format(time.RFC3339),
		UpdatedAt:   time.Now().UTC().Format(time.RFC3339),
	}

	escrowJSON, err := json.Marshal(escrow)
	if err != nil {
		return err
	}

	return ctx.GetStub().PutState(escrowID, escrowJSON)
}
// 2. SUBMIT MILESTONE PROOF
// ================================================================
// SubmitMilestoneProof submits proof for a milestone
func (s *StartupHubContract) SubmitMilestoneProof(
	ctx contractapi.TransactionContextInterface,
	escrowID string,
	milestoneID string,
	proofCID string,
	proofHash string,
	submittedBy string,
) error {
	// 1. Get the escrow
	escrow, err := s.GetEscrow(ctx, escrowID)
	if err != nil {
		return err
	}

	// 2. Find and update the milestone
	found := false
	for i := range escrow.Milestones {
		if escrow.Milestones[i].MilestoneID == milestoneID {
			// Update proof details
			escrow.Milestones[i].ProofCID = proofCID
			escrow.Milestones[i].ProofHash = proofHash
			escrow.Milestones[i].SubmittedBy = submittedBy
			escrow.Milestones[i].SubmittedAt = time.Now().UTC().Format(time.RFC3339)
			escrow.Milestones[i].Status = "PROOF_SUBMITTED"
			
			// ✅ FIX: Ensure arrays are never nil
			if escrow.Milestones[i].Approvals == nil {
				escrow.Milestones[i].Approvals = []string{}
			}
			if escrow.Milestones[i].Rejections == nil {
				escrow.Milestones[i].Rejections = []string{}
			}
			
			found = true
			break
		}
	}

	if !found {
		return fmt.Errorf("milestone %s not found in escrow %s", milestoneID, escrowID)
	}

	// 3. Update timestamp and save
	escrow.UpdatedAt = time.Now().UTC().Format(time.RFC3339)
	escrowJSON, err := json.Marshal(escrow)
	if err != nil {
		return err
	}

	return ctx.GetStub().PutState(escrowID, escrowJSON)
}
// ================================================================
// 3. APPROVE MILESTONE
// ================================================================
func (s *StartupHubContract) ApproveMilestone(
	ctx contractapi.TransactionContextInterface,
	escrowID string,
	milestoneID string,
	approverID string,
) error {
	escrowJSON, err := ctx.GetStub().GetState("ESCROW_" + escrowID)
	if err != nil || escrowJSON == nil {
		return fmt.Errorf("escrow not found")
	}

	var escrow Escrow
	json.Unmarshal(escrowJSON, &escrow)

	isApprover := false
	for _, a := range escrow.Approvers {
		if a == approverID {
			isApprover = true
			break
		}
	}
	if !isApprover {
		return fmt.Errorf("not an authorized approver")
	}

	for i := range escrow.Milestones {
		if escrow.Milestones[i].MilestoneID == milestoneID {
			if escrow.Milestones[i].Status != "PROOF_SUBMITTED" {
				return fmt.Errorf("milestone not in review state")
			}

			for _, a := range escrow.Milestones[i].Approvals {
				if a == approverID {
					return fmt.Errorf("already approved by you")
				}
			}

			escrow.Milestones[i].Approvals = append(
				escrow.Milestones[i].Approvals, approverID)

			if len(escrow.Milestones[i].Approvals) >= escrow.RequiredApprovals {
				escrow.Milestones[i].Status = "APPROVED"
				// In production: transfer funds here
			}
			break
		}
	}

	escrow.UpdatedAt = time.Now().UTC().Format(time.RFC3339)
	escrowJSON, _ = json.Marshal(escrow)
	return ctx.GetStub().PutState("ESCROW_"+escrowID, escrowJSON)
}

// ================================================================
// 4. REJECT MILESTONE
// ================================================================
func (s *StartupHubContract) RejectMilestone(
	ctx contractapi.TransactionContextInterface,
	escrowID string,
	milestoneID string,
	rejectorID string,
	reason string,
) error {
	escrowJSON, err := ctx.GetStub().GetState("ESCROW_" + escrowID)
	if err != nil || escrowJSON == nil {
		return fmt.Errorf("escrow not found")
	}

	var escrow Escrow
	json.Unmarshal(escrowJSON, &escrow)

	isApprover := false
	for _, a := range escrow.Approvers {
		if a == rejectorID {
			isApprover = true
			break
		}
	}
	if !isApprover {
		return fmt.Errorf("not an authorized approver")
	}

	for i := range escrow.Milestones {
		if escrow.Milestones[i].MilestoneID == milestoneID {
			escrow.Milestones[i].Status = "REJECTED"
			escrow.Milestones[i].Rejections = append(
				escrow.Milestones[i].Rejections, rejectorID)
			escrow.Milestones[i].ProofNotes += " | Rejected: " + reason
			break
		}
	}

	escrow.UpdatedAt = time.Now().UTC().Format(time.RFC3339)
	escrowJSON, _ = json.Marshal(escrow)
	return ctx.GetStub().PutState("ESCROW_"+escrowID, escrowJSON)
}

// ================================================================
// 5. GET ESCROW
// ================================================================
// GetEscrow retrieves an escrow by ID
func (s *StartupHubContract) GetEscrow(
	ctx contractapi.TransactionContextInterface,
	escrowID string,
) (*Escrow, error) {
	escrowJSON, err := ctx.GetStub().GetState(escrowID)
	if err != nil {
		return nil, err
	}
	if escrowJSON == nil {
		return nil, fmt.Errorf("escrow %s not found", escrowID)
	}

	var escrow Escrow
	err = json.Unmarshal(escrowJSON, &escrow)
	if err != nil {
		return nil, err
	}

	// ✅ FIX: Normalize null arrays
	if escrow.Approvers == nil {
		escrow.Approvers = []string{}
	}
	for i := range escrow.Milestones {
		if escrow.Milestones[i].Approvals == nil {
			escrow.Milestones[i].Approvals = []string{}
		}
		if escrow.Milestones[i].Rejections == nil {
			escrow.Milestones[i].Rejections = []string{}
		}
	}

	return &escrow, nil
}
// ================================================================
// 6. GET ESCROWS BY STARTUP
// ================================================================
// GetEscrowsByStartup returns all escrows for a startup
func (s *StartupHubContract) GetEscrowsByStartup(
	ctx contractapi.TransactionContextInterface,
	startupID string,
) ([]Escrow, error) {
	resultsIterator, err := ctx.GetStub().GetStateByPartialCompositeKey(
		"escrowByStartup", []string{startupID},
	)
	if err != nil {
		return nil, err
	}
	defer resultsIterator.Close()

	var escrows []Escrow
	for resultsIterator.HasNext() {
		response, err := resultsIterator.Next()
		if err != nil {
			return nil, err
		}

		_, compositeKeyParts, err := ctx.GetStub().SplitCompositeKey(response.Key)
		if err != nil || len(compositeKeyParts) < 2 {
			continue
		}
		escrowID := compositeKeyParts[1]

		escrowJSON, err := ctx.GetStub().GetState(escrowID)
		if err != nil || escrowJSON == nil {
			continue
		}

		var escrow Escrow
		err = json.Unmarshal(escrowJSON, &escrow)
		if err != nil {
			continue
		}

		escrows = append(escrows, escrow)
	}

	return escrows, nil
}
// DeleteEscrow - Admin only (for schema migration)
func (s *StartupHubContract) DeleteEscrow(
	ctx contractapi.TransactionContextInterface,
	escrowID string,
) error {
	// Get escrow to find startup ID
	escrowJSON, err := ctx.GetStub().GetState(escrowID)
	if err != nil {
		return err
	}
	if escrowJSON == nil {
		return fmt.Errorf("escrow %s not found", escrowID)
	}

	var escrow Escrow
	err = json.Unmarshal(escrowJSON, &escrow)
	if err != nil {
		return err
	}

	// Delete composite key
	compositeKey, err := ctx.GetStub().CreateCompositeKey(
		"escrowByStartup", []string{escrow.StartupID, escrowID},
	)
	if err == nil {
		ctx.GetStub().DelState(compositeKey)
	}

	// Delete escrow
	return ctx.GetStub().DelState(escrowID)
}

func main() {
	chaincode, err := contractapi.NewChaincode(&StartupHubContract{})
	if err != nil {
		fmt.Printf("Error creating chaincode: %s", err.Error())
		return
	}

	if err := chaincode.Start(); err != nil {
		fmt.Printf("Error starting chaincode: %s", err.Error())
	}
}






