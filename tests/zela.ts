import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Zela } from "../target/types/zela";
import { createMint, createAccount, mintTo, getAccount, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { assert } from "chai";

describe("zela", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.Zela as Program<Zela>;

  const owner = anchor.web3.Keypair.generate();
  let usdcMint: anchor.web3.PublicKey;
  let ownerTokenAccount: anchor.web3.PublicKey;
  let vaultPda: anchor.web3.PublicKey;
  let vaultTokenAccount: anchor.web3.PublicKey;

  before(async () => {
    await provider.connection.confirmTransaction(
      await provider.connection.requestAirdrop(owner.publicKey, 2 * anchor.web3.LAMPORTS_PER_SOL)
    );

    usdcMint = await createMint(provider.connection, owner, owner.publicKey, null, 6);
    ownerTokenAccount = await createAccount(provider.connection, owner, usdcMint, owner.publicKey);
    await mintTo(provider.connection, owner, usdcMint, ownerTokenAccount, owner, 1_000_000_000);

    [vaultPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("vault"), owner.publicKey.toBuffer(), usdcMint.toBuffer()],
      program.programId
    );

    vaultTokenAccount = anchor.utils.token.associatedAddress({
      mint: usdcMint,
      owner: vaultPda,
    });
  });

  it("Initializes a Zela vault", async () => {
    await program.methods
      .initializeVault()
      .accounts({
        owner: owner.publicKey,
        mint: usdcMint,
        vault: vaultPda,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([owner])
      .rpc();

    const vault = await program.account.zelaVault.fetch(vaultPda);
    assert.ok(vault.owner.toString() === owner.publicKey.toString());
    assert.ok(vault.totalDeposited.toString() === "0");
    console.log("Vault initialized for:", vault.owner.toString());
  });

  it("Deposits USDC into vault", async () => {
    const depositAmount = new anchor.BN(500_000_000);

    await program.methods
      .deposit(depositAmount)
      .accounts({
        owner: owner.publicKey,
        mint: usdcMint,
        vault: vaultPda,
        ownerTokenAccount,
        vaultTokenAccount,
        associatedTokenProgram: anchor.utils.token.ASSOCIATED_PROGRAM_ID,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([owner])
      .rpc();

    const vaultAccount = await getAccount(provider.connection, vaultTokenAccount);
    const vault = await program.account.zelaVault.fetch(vaultPda);
    assert.ok(vaultAccount.amount.toString() === "500000000");
    assert.ok(vault.totalDeposited.toString() === "500000000");
    assert.ok(vault.depositCount.toString() === "1");
    console.log("Deposited:", vaultAccount.amount.toString(), "USDC");
    console.log("Deposit count:", vault.depositCount.toString());
  });

  it("Withdraws USDC from vault", async () => {
    const withdrawAmount = new anchor.BN(100_000_000);
    const balanceBefore = await getAccount(provider.connection, ownerTokenAccount);

    await program.methods
      .withdraw(withdrawAmount)
      .accounts({
        owner: owner.publicKey,
        mint: usdcMint,
        vault: vaultPda,
        ownerTokenAccount,
        vaultTokenAccount,
        associatedTokenProgram: anchor.utils.token.ASSOCIATED_PROGRAM_ID,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([owner])
      .rpc();

    const balanceAfter = await getAccount(provider.connection, ownerTokenAccount);
    const vault = await program.account.zelaVault.fetch(vaultPda);
    assert.ok(BigInt(balanceAfter.amount) > BigInt(balanceBefore.amount));
    assert.ok(vault.totalWithdrawn.toString() === "100000000");
    console.log("Withdrawn:", withdrawAmount.toString(), "USDC");
    console.log("Owner balance after:", balanceAfter.amount.toString());
  });

  it("Prevents withdrawal exceeding vault balance", async () => {
    try {
      await program.methods
        .withdraw(new anchor.BN(999_999_999_999))
        .accounts({
          owner: owner.publicKey,
          mint: usdcMint,
          vault: vaultPda,
          ownerTokenAccount,
          vaultTokenAccount,
          associatedTokenProgram: anchor.utils.token.ASSOCIATED_PROGRAM_ID,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([owner])
        .rpc();
      assert.fail("Should have thrown insufficient funds error");
    } catch (err) {
      assert.ok(err.toString().includes("InsufficientFunds") || err.toString().includes("insufficient"));
      console.log("Correctly rejected overdraft attempt!");
    }
  });
});
