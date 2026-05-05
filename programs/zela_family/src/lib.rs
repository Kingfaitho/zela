use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token_interface::{
        transfer_checked, TransferChecked, Mint, TokenAccount, TokenInterface,
    },
};

declare_id!("4jxXxvP9XS3MGyKGNEsnXe4XzbtopkSr9thif36uGmno");

#[program]
pub mod zela_family {
    use super::*;

    pub fn create_family_vault(
        ctx: Context<CreateFamilyVault>,
        checkin_interval_days: u16,
        monthly_allowance: u64,
    ) -> Result<()> {
        let vault = &mut ctx.accounts.family_vault;
        vault.owner = ctx.accounts.owner.key();
        vault.mint = ctx.accounts.mint.key();
        vault.beneficiary = Pubkey::default();
        vault.checkin_interval_days = checkin_interval_days;
        vault.last_checkin = Clock::get()?.unix_timestamp;
        vault.monthly_allowance = monthly_allowance;
        vault.total_deposited = 0;
        vault.is_active = true;
        vault.bump = ctx.bumps.family_vault;
        msg!("Family vault created for {}", vault.owner);
        Ok(())
    }

    pub fn set_beneficiary(
        ctx: Context<SetBeneficiary>,
        beneficiary: Pubkey,
    ) -> Result<()> {
        let vault = &mut ctx.accounts.family_vault;
        vault.beneficiary = beneficiary;
        msg!("Beneficiary set to {}", beneficiary);
        Ok(())
    }

    pub fn checkin(ctx: Context<Checkin>) -> Result<()> {
        let vault = &mut ctx.accounts.family_vault;
        vault.last_checkin = Clock::get()?.unix_timestamp;
        msg!("Owner checked in at {}", vault.last_checkin);
        Ok(())
    }

    pub fn deposit_family(ctx: Context<DepositFamily>, amount: u64) -> Result<()> {
        require!(amount > 0, FamilyError::InvalidAmount);

        transfer_checked(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                TransferChecked {
                    from: ctx.accounts.owner_token_account.to_account_info(),
                    mint: ctx.accounts.mint.to_account_info(),
                    to: ctx.accounts.vault_token_account.to_account_info(),
                    authority: ctx.accounts.owner.to_account_info(),
                },
            ),
            amount,
            ctx.accounts.mint.decimals,
        )?;

        let vault = &mut ctx.accounts.family_vault;
        vault.total_deposited += amount;
        msg!("Deposited {} to family vault", amount);
        Ok(())
    }

    pub fn claim_inheritance(ctx: Context<ClaimInheritance>) -> Result<()> {
        let vault = &ctx.accounts.family_vault;
        let clock = Clock::get()?;
        let days_since_checkin = (clock.unix_timestamp - vault.last_checkin) / 86400;
        
        require!(
            days_since_checkin >= vault.checkin_interval_days as i64,
            FamilyError::OwnerStillActive
        );
        require!(
            vault.beneficiary == ctx.accounts.beneficiary.key(),
            FamilyError::NotBeneficiary
        );

        let balance = ctx.accounts.vault_token_account.amount;
        require!(balance > 0, FamilyError::EmptyVault);

        let vault_key = vault.key();
        let seeds = &[
            b"family_vault",
            vault.owner.as_ref(),
            vault_key.as_ref(),
            &[vault.bump],
        ];
        let signer_seeds = &[&seeds[..]];

        transfer_checked(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                TransferChecked {
                    from: ctx.accounts.vault_token_account.to_account_info(),
                    mint: ctx.accounts.mint.to_account_info(),
                    to: ctx.accounts.beneficiary_token_account.to_account_info(),
                    authority: ctx.accounts.family_vault.to_account_info(),
                },
                signer_seeds,
            ),
            balance,
            ctx.accounts.mint.decimals,
        )?;

        msg!("Inheritance claimed by {}", ctx.accounts.beneficiary.key());
        Ok(())
    }
}

#[derive(Accounts)]
pub struct CreateFamilyVault<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,
    pub mint: InterfaceAccount<'info, Mint>,
    #[account(
        init,
        payer = owner,
        space = 8 + FamilyVault::INIT_SPACE,
        seeds = [b"family_vault", owner.key().as_ref()],
        bump
    )]
    pub family_vault: Account<'info, FamilyVault>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct SetBeneficiary<'info> {
    pub owner: Signer<'info>,
    #[account(
        mut,
        seeds = [b"family_vault", owner.key().as_ref()],
        bump = family_vault.bump,
        has_one = owner,
    )]
    pub family_vault: Account<'info, FamilyVault>,
}

#[derive(Accounts)]
pub struct Checkin<'info> {
    pub owner: Signer<'info>,
    #[account(
        mut,
        seeds = [b"family_vault", owner.key().as_ref()],
        bump = family_vault.bump,
        has_one = owner,
    )]
    pub family_vault: Account<'info, FamilyVault>,
}

#[derive(Accounts)]
pub struct DepositFamily<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,
    pub mint: InterfaceAccount<'info, Mint>,
    #[account(
        mut,
        seeds = [b"family_vault", owner.key().as_ref()],
        bump = family_vault.bump,
        has_one = owner,
    )]
    pub family_vault: Account<'info, FamilyVault>,
    #[account(
        mut,
        associated_token::mint = mint,
        associated_token::authority = owner,
        associated_token::token_program = token_program,
    )]
    pub owner_token_account: InterfaceAccount<'info, TokenAccount>,
    #[account(
        init_if_needed,
        payer = owner,
        associated_token::mint = mint,
        associated_token::authority = family_vault,
        associated_token::token_program = token_program,
    )]
    pub vault_token_account: InterfaceAccount<'info, TokenAccount>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub token_program: Interface<'info, TokenInterface>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ClaimInheritance<'info> {
    #[account(mut)]
    pub beneficiary: Signer<'info>,
    pub mint: InterfaceAccount<'info, Mint>,
    #[account(
        mut,
        seeds = [b"family_vault", family_vault.owner.as_ref()],
        bump = family_vault.bump,
    )]
    pub family_vault: Account<'info, FamilyVault>,
    #[account(
        mut,
        associated_token::mint = mint,
        associated_token::authority = family_vault,
        associated_token::token_program = token_program,
    )]
    pub vault_token_account: InterfaceAccount<'info, TokenAccount>,
    #[account(
        init_if_needed,
        payer = beneficiary,
        associated_token::mint = mint,
        associated_token::authority = beneficiary,
        associated_token::token_program = token_program,
    )]
    pub beneficiary_token_account: InterfaceAccount<'info, TokenAccount>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub token_program: Interface<'info, TokenInterface>,
    pub system_program: Program<'info, System>,
}

#[account]
#[derive(InitSpace)]
pub struct FamilyVault {
    pub owner: Pubkey,
    pub mint: Pubkey,
    pub beneficiary: Pubkey,
    pub checkin_interval_days: u16,
    pub last_checkin: i64,
    pub monthly_allowance: u64,
    pub total_deposited: u64,
    pub is_active: bool,
    pub bump: u8,
}

#[error_code]
pub enum FamilyError {
    #[msg("Owner is still active")]
    OwnerStillActive,
    #[msg("Not the designated beneficiary")]
    NotBeneficiary,
    #[msg("Vault is empty")]
    EmptyVault,
    #[msg("Invalid amount")]
    InvalidAmount,
}
