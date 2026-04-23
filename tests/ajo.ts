import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Ajo } from "../target/types/ajo";
import { createMint, createAccount, mintTo, getAccount, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { assert } from "chai";

describe("ajo", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.Ajo as Program<Ajo>;

  const admin = anchor.web3.Keypair.generate();
  const member1 = anchor.web3.Keypair.generate();
  const member2 = anchor.web3.Keypair.generate();

  let usdcMint: anchor.web3.PublicKey;
  let adminTokenAccount: anchor.web3.PublicKey;
  let member1TokenAccount: anchor.web3.PublicKey;
  let member2TokenAccount: anchor.web3.PublicKey;
  let groupPda: anchor.web3.PublicKey;

  const GROUP_NAME = "TestAjo";
  const CONTRIBUTION = new anchor.BN(10_000_000);
  const SECURITY_DEPOSIT_MULTIPLIER = 1;

  before(async () => {
    for (const kp of [admin, member1, member2]) {
      await provider.connection.confirmTransaction(
        await provider.connection.requestAirdrop(kp.publicKey, 2 * anchor.web3.LAMPORTS_PER_SOL)
      );
    }

    usdcMint = await createMint(provider.connection, admin, admin.publicKey, null, 6);
    adminTokenAccount = await createAccount(provider.connection, admin, usdcMint, admin.publicKey);
    member1TokenAccount = await createAccount(provider.connection, member1, usdcMint, member1.publicKey);
    member2TokenAccount = await createAccount(provider.connection, member2, usdcMint, member2.publicKey);

    await mintTo(provider.connection, admin, usdcMint, adminTokenAccount, admin, 1_000_000_000);
    await mintTo(provider.connection, admin, usdcMint, member1TokenAccount, admin, 1_000_000_000);
    await mintTo(provider.connection, admin, usdcMint, member2TokenAccount, admin, 1_000_000_000);

    [groupPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("ajo_group"), admin.publicKey.toBuffer(), Buffer.from(GROUP_NAME)],
      program.programId
    );
  });

  it("Creates an Ajo group", async () => {
    await program.methods
      .createGroup(GROUP_NAME, CONTRIBUTION, 2, 7, 0, SECURITY_DEPOSIT_MULTIPLIER)
      .accounts({
        admin: admin.publicKey,
        mint: usdcMint,
        group: groupPda,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([admin])
      .rpc();

    const group = await program.account.ajoGroup.fetch(groupPda);
    assert.ok(group.name === GROUP_NAME);
    assert.ok(group.maxMembers === 2);
    assert.ok(group.status === 0);
    console.log("Ajo group created:", group.name);
    console.log("Contribution amount:", group.contributionAmount.toString());
  });

  it("Admin joins as first member", async () => {
    const [member1Pda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("ajo_member"), groupPda.toBuffer(), admin.publicKey.toBuffer()],
      program.programId
    );

    const [groupVault] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("group_vault"), groupPda.toBuffer()],
      program.programId
    );

    await program.methods
      .joinGroup()
      .accounts({
        member: admin.publicKey,
        mint: usdcMint,
        group: groupPda,
        memberAccount: member1Pda,
        memberTokenAccount: adminTokenAccount,
        groupVault,
        associatedTokenProgram: anchor.utils.token.ASSOCIATED_PROGRAM_ID,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([admin])
      .rpc();

    const member = await program.account.ajoMember.fetch(member1Pda);
    assert.ok(member.position === 0);
    assert.ok(member.securityDeposit.toString() === CONTRIBUTION.toString());
    console.log("Admin joined! Position:", member.position);
    console.log("Security deposit locked:", member.securityDeposit.toString());
  });

  it("Second member joins — group becomes active", async () => {
    const [member2Pda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("ajo_member"), groupPda.toBuffer(), member1.publicKey.toBuffer()],
      program.programId
    );

    const [groupVault] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("group_vault"), groupPda.toBuffer()],
      program.programId
    );

    await program.methods
      .joinGroup()
      .accounts({
        member: member1.publicKey,
        mint: usdcMint,
        group: groupPda,
        memberAccount: member2Pda,
        memberTokenAccount: member1TokenAccount,
        groupVault,
        associatedTokenProgram: anchor.utils.token.ASSOCIATED_PROGRAM_ID,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([member1])
      .rpc();

    const group = await program.account.ajoGroup.fetch(groupPda);
    assert.ok(group.currentMembers === 2);
    assert.ok(group.status === 1);
    console.log("Group is now ACTIVE!");
    console.log("Total members:", group.currentMembers);
    console.log("Next round at:", new Date(group.nextRoundAt.toNumber() * 1000).toLocaleDateString());
  });

  it("Raises an emergency request", async () => {
    const [member1Pda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("ajo_member"), groupPda.toBuffer(), admin.publicKey.toBuffer()],
      program.programId
    );

    const [emergencyPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("emergency"), groupPda.toBuffer(), admin.publicKey.toBuffer()],
      program.programId
    );

    await program.methods
      .raiseEmergency("My child is sick and I need funds urgently")
      .accounts({
        member: admin.publicKey,
        group: groupPda,
        memberAccount: member1Pda,
        emergency: emergencyPda,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([admin])
      .rpc();

    const emergency = await program.account.emergencyRequest.fetch(emergencyPda);
    assert.ok(emergency.status === 0);
    console.log("Emergency raised:", emergency.reason);
    console.log("Votes yes:", emergency.votesYes);
    console.log("Votes no:", emergency.votesNo);
  });
});
