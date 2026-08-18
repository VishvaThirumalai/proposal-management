package main

import (
	"encoding/json"
	"fmt"
	"time"

	"github.com/hyperledger/fabric-contract-api-go/contractapi"
)

// ===== STRUCTS =====

type StartupHubContract struct {
	contractapi.Contract
}

// Proposal represents a startup proposal on the blockchain
type Proposal struct {
	ID             string  `json:"id"`
	FounderID      string  `json:"founderId"`
	Title          string  `json:"title"`
	Domain         string  `json:"domain"`
	Stage          string  `json:"stage"`
	FundingAmount  float64 `json:"fundingAmount"`
	IPFSCID        string  `json:"ipfsCid"`
	SHA256Hash     string  `json:"sha256Hash"`
	TMeta          string  `json:"tMeta"`
	Version        int     `json:"version"`
	Status         string  `json:"status"`
	Summary        string  `json:"summary"`
	Keywords       string  `json:"keywords"`
	TechnologyStack string `json:"technologyStack"`
	MentorRequirements string `json:"mentorRequirements"`
	InvestorPitch   string `json:"investorPitch"`
	ProblemStatement string `json:"problemStatement"`
	Solution        string `json:"solution"`
	BusinessModel   string `json:"businessModel"`
	Timestamp       string `json:"timestamp"`
	BlockHash       string `json:"blockHash"`
	RandomParam     string `json:"randomParam"`
}

// AccessPermission represents access control on the blockchain
type AccessPermission struct {
	ProposalID string `json:"proposalId"`
	UserID     string `json:"userId"`
	UserRole   string `json:"userRole"`
	Permission bool   `json:"permission"`
	GrantedBy  string `json:"grantedBy"`
	GrantedAt  string `json:"grantedAt"`
	RevokedAt  string `json:"revokedAt"`
}

// DCHParams for Distributed Chameleon Hash
type DCHParams struct {
	BlockHash   string `json:"blockHash"`
	RandomParam string `json:"randomParam"`
}

// ===== PROPOSAL FUNCTIONS =====

// CreateProposal stores a new proposal on the blockchain
func (s *StartupHubContract) CreateProposal(
	ctx contractapi.TransactionContextInterface,
	id string,
	founderId string,
	title string,
	domain string,
	stage string,
	fundingAmount float64,
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
	// Check if proposal already exists
	existing, err := ctx.GetStub().GetState(id)
	if err != nil {
		return fmt.Errorf("failed to read state: %v", err)
	}
	if existing != nil {
		return fmt.Errorf("proposal %s already exists", id)
	}

	proposal := Proposal{
		ID:                id,
		FounderID:         founderId,
		Title:             title,
		Domain:            domain,
		Stage:             stage,
		FundingAmount:     fundingAmount,
		IPFSCID:           ipfsCid,
		SHA256Hash:        sha256Hash,
		TMeta:             tMeta,
		Version:           1,
		Status:            "ACTIVE",
		Summary:           summary,
		Keywords:          keywords,
		TechnologyStack:   technologyStack,
		MentorRequirements: mentorRequirements,
		InvestorPitch:     investorPitch,
		ProblemStatement:  problemStatement,
		Solution:          solution,
		BusinessModel:     businessModel,
		Timestamp:         time.Now().UTC().Format(time.RFC3339),
		BlockHash:         "",
		RandomParam:       "",
	}

	proposalJSON, err := json.Marshal(proposal)
	if err != nil {
		return err
	}

	return ctx.GetStub().PutState(id, proposalJSON)
}

// ReadProposal retrieves a proposal by ID
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

// UpdateProposal updates an existing proposal
func (s *StartupHubContract) UpdateProposal(
	ctx contractapi.TransactionContextInterface,
	id string,
	ipfsCid string,
	sha256Hash string,
	tMeta string,
	summary string,
	keywords string,
) error {
	// Get existing proposal
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

	// Update fields
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

// GetAllProposals returns all proposals
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

// GetProposalsByFounder returns proposals for a specific founder
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

// GrantAccess grants access to a user (mentor/investor)
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

// RevokeAccess revokes access from a user
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

// CheckPermission checks if a user has access to a proposal
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

// StoreDCHParams stores DCH parameters
func (s *StartupHubContract) StoreDCHParams(
	ctx contractapi.TransactionContextInterface,
	blockHash string,
	randomParam string,
) error {
	params := DCHParams{
		BlockHash:   blockHash,
		RandomParam: randomParam,
	}

	paramsJSON, err := json.Marshal(params)
	if err != nil {
		return err
	}

	return ctx.GetStub().PutState("DCH_PARAMS", paramsJSON)
}

// GetDCHParams retrieves DCH parameters
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
