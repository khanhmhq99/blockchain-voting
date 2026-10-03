import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture, time } from "@nomicfoundation/hardhat-network-helpers";

describe("VotingSystem", function () {
  async function fixture() {
    const [admin, organizer, voter, other] = await ethers.getSigners();
    const voting = await ethers.deployContract("VotingSystem", [admin.address]);
    await voting.waitForDeployment();
    await voting.grantRole(await voting.ORGANIZER_ROLE(), organizer.address);
    const now = await time.latest();
    const start = now + 100;
    const end = start + 1_000;
    return { voting, admin, organizer, voter, other, start, end };
  }

  async function electionFixture() {
    const state = await loadFixture(fixture);
    await state.voting.connect(state.organizer).createElection(state.start, state.end);
    await state.voting.connect(state.organizer).addCandidate(1, "Candidate A");
    await state.voting.connect(state.organizer).addCandidate(1, "Candidate B");
    return state;
  }

  it("allows authorized organizers to create an election", async () => {
    const { voting, organizer, start, end } = await loadFixture(fixture);
    await expect(voting.connect(organizer).createElection(start, end)).to.emit(voting, "ElectionCreated").withArgs(1, organizer.address, start, end);
  });

  it("rejects unauthorized election creation", async () => {
    const { voting, voter, start, end } = await loadFixture(fixture);
    await expect(voting.connect(voter).createElection(start, end)).to.be.revertedWithCustomError(voting, "AccessControlUnauthorizedAccount");
  });

  it("adds candidates before voting starts", async () => {
    const { voting } = await electionFixture();
    const candidates = await voting.getCandidates(1);
    expect(candidates.map((candidate: { metadata: string }) => candidate.metadata)).to.deep.equal(["Candidate A", "Candidate B"]);
  });

  it("approves a voter", async () => {
    const { voting, organizer, voter } = await electionFixture();
    await expect(voting.connect(organizer).approveVoter(1, voter.address)).to.emit(voting, "VoterApproved").withArgs(1, voter.address);
    expect(await voting.isApprovedVoter(1, voter.address)).to.equal(true);
  });

  it("rejects an unapproved voter", async () => {
    const { voting, voter, start } = await electionFixture();
    await time.increaseTo(start);
    await expect(voting.connect(voter).castVote(1, 1)).to.be.revertedWithCustomError(voting, "VoterNotApproved");
  });

  it("allows an approved voter to vote and counts the result", async () => {
    const { voting, organizer, voter, start } = await electionFixture();
    await voting.connect(organizer).approveVoter(1, voter.address);
    await time.increaseTo(start);
    await expect(voting.connect(voter).castVote(1, 2)).to.emit(voting, "VoteCast").withArgs(1, 2);
    expect(await voting.getResults(1)).to.deep.equal([0n, 1n]);
    expect(await voting.hasVoted(1, voter.address)).to.equal(true);
  });

  it("rejects a double vote", async () => {
    const { voting, organizer, voter, start } = await electionFixture();
    await voting.connect(organizer).approveVoter(1, voter.address);
    await time.increaseTo(start);
    await voting.connect(voter).castVote(1, 1);
    await expect(voting.connect(voter).castVote(1, 2)).to.be.revertedWithCustomError(voting, "AlreadyVoted");
  });

  it("rejects an invalid candidate", async () => {
    const { voting, organizer, voter, start } = await electionFixture();
    await voting.connect(organizer).approveVoter(1, voter.address);
    await time.increaseTo(start);
    await expect(voting.connect(voter).castVote(1, 99)).to.be.revertedWithCustomError(voting, "InvalidCandidate");
  });

  it("rejects a vote before start", async () => {
    const { voting, organizer, voter } = await electionFixture();
    await voting.connect(organizer).approveVoter(1, voter.address);
    await expect(voting.connect(voter).castVote(1, 1)).to.be.revertedWithCustomError(voting, "VotingNotActive");
  });

  it("rejects a vote after end", async () => {
    const { voting, organizer, voter, end } = await electionFixture();
    await voting.connect(organizer).approveVoter(1, voter.address);
    await time.increaseTo(end + 1);
    await expect(voting.connect(voter).castVote(1, 1)).to.be.revertedWithCustomError(voting, "VotingNotActive");
  });

  it("rejects candidate changes once voting starts", async () => {
    const { voting, organizer, start } = await electionFixture();
    await time.increaseTo(start);
    await expect(voting.connect(organizer).addCandidate(1, "Late candidate")).to.be.revertedWithCustomError(voting, "CandidateConfigurationLocked");
  });

  it("rejects unauthorized closure", async () => {
    const { voting, other } = await electionFixture();
    await expect(voting.connect(other).closeElection(1)).to.be.revertedWithCustomError(voting, "NotElectionManager");
  });

  it("allows the organizer to close an election", async () => {
    const { voting, organizer } = await electionFixture();
    await expect(voting.connect(organizer).closeElection(1)).to.emit(voting, "ElectionClosed").withArgs(1);
  });
});
