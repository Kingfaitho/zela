use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token_interface::{
        transfer_checked, TransferChecked, Mint, TokenAccount, TokenInterface,
    },
};

declare_id!("DHhqgD4WSanbkFZHPgxM4oSmodn5f24Jw1pyzX7sZcfA");

#[program]
pub mod ajo {
    use super::*;

    pub fn create_group(
        ctx: Context<CreateGroup>,
        name: String,
        contribution_amount: u64,
        max_members: u8,
        round_duration_days: u8,
        group_type: u8,
        security_deposit_multiplier: u8,
    ) -> Result<()> {
        require!(name.len() <= 50, AjoError::NameTooLong);
        require!(max_members >= 2 && max_members <= 50, AjoError::InvalidMemberCount);
        require!(contribution_amount > 0, AjoError::InvalidAmount);
        require!(round_duration_days >= 1, AjoError::InvalidDuration);

        let group = &mut ctx.accounts.group;
        group.name = name;
        group.admin = ctx.accounts.admin.key();
        group.mint = ctx.accounts.mint.key();
        group.contribution_amount = contribution_amount;
        group.max_members = max_members;
        group.current_members = 0;
        group.current_round = 0;
        group.total_rounds = max_members;
        group.round_duration_days = round_duration_days;
        group.group_type = group_type;
        group.security_deposit_multiplier = security_deposit_multiplier;
        group.status = 0;
        group.bump = ctx.bumps.group;
        group.created_at = Clock::get()?.unix_timestamp;
        group.next_round_at = 0;

        msg!("Ajo group created: {}", group.name);
        Ok(())
    }

    pub fn join_group(ctx: Context<JoinGroup>) -> Result<()> {
        require!(ctx.accounts.group.status == 0, AjoError::GroupNotOpen);
        require!(ctx.accounts.group.current_members < ctx.accounts.group.max_members, AjoError::GroupFull);

        let security_deposit = ctx.accounts.group.contribution_amount
            .checked_mul(ctx.accounts.group.security_deposit_multiplier as u64)
            .ok_or(AjoError::MathOverflow)?;

        let group_key = ctx.accounts.group.key();
        let current_members = ctx.accounts.group.current_members;
        let max_members = ctx.accounts.group.max_members;
        let round_duration_days = ctx.accounts.group.round_duration_days;

        transfer_checked(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                TransferChecked {
                    from: ctx.accounts.member_token_account.to_account_info(),
                    mint: ctx.accounts.mint.to_account_info(),
                    to: ctx.accounts.group_vault.to_account_info(),
                    authority: ctx.accounts.member.to_account_info(),
                },
            ),
            security_deposit,
            ctx.accounts.mint.decimals,
        )?;

        let member_account = &mut ctx.accounts.member_account;
        member_account.member = ctx.accounts.member.key();
        member_account.group = group_key;
        member_account.position = current_members;
        member_account.security_deposit = security_deposit;
        member_account.total_contributed = 0;
        member_account.has_received = false;
        member_account.missed_payments = 0;
        member_account.bump = ctx.bumps.member_account;

        let group = &mut ctx.accounts.group;
        group.current_members += 1;

        if group.current_members == max_members {
            group.status = 1;
            group.next_round_at = Clock::get()?.unix_timestamp
                + (round_duration_days as i64 * 86400);
        }

        msg!("Member joined! Position: {}", member_account.position);
        Ok(())
    }

    pub fn contribute(ctx: Context<Contribute>) -> Result<()> {
        let group = &ctx.accounts.group;
        require!(group.status == 1, AjoError::GroupNotActive);

        let clock = Clock::get()?;
        require!(
            clock.unix_timestamp <= ctx.accounts.group.next_round_at,
            AjoError::RoundDeadlinePassed
        );

        transfer_checked(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                TransferChecked {
                    from: ctx.accounts.member_token_account.to_account_info(),
                    mint: ctx.accounts.mint.to_account_info(),
                    to: ctx.accounts.group_vault.to_account_info(),
                    authority: ctx.accounts.member.to_account_info(),
                },
            ),
            group.contribution_amount,
            ctx.accounts.mint.decimals,
        )?;

        let member_account = &mut ctx.accounts.member_account;
        member_account.total_contributed += group.contribution_amount;

        msg!("Contribution made for round {}", group.current_round);
        Ok(())
    }

    pub fn distribute_round(ctx: Context<DistributeRound>) -> Result<()> {
        let group = &mut ctx.accounts.group;
        require!(group.status == 1, AjoError::GroupNotActive);

        let clock = Clock::get()?;
        require!(
            clock.unix_timestamp >= group.next_round_at,
            AjoError::RoundNotReady
        );

        let recipient_member = &mut ctx.accounts.recipient_member;
        require!(!recipient_member.has_received, AjoError::AlreadyReceived);

        let pot_amount = group.contribution_amount
            .checked_mul(group.current_members as u64)
            .ok_or(AjoError::MathOverflow)?;

        let zela_fee = pot_amount
            .checked_div(100)
            .ok_or(AjoError::MathOverflow)?;

        let recipient_amount = pot_amount
            .checked_sub(zela_fee)
            .ok_or(AjoError::MathOverflow)?;

        let group_key = group.key();
        let seeds = &[
            b"group_vault",
            group_key.as_ref(),
            &[ctx.bumps.group_vault],
        ];
        let signer_seeds = &[&seeds[..]];

        transfer_checked(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                TransferChecked {
                    from: ctx.accounts.group_vault.to_account_info(),
                    mint: ctx.accounts.mint.to_account_info(),
                    to: ctx.accounts.recipient_token_account.to_account_info(),
                    authority: ctx.accounts.group_vault.to_account_info(),
                },
                signer_seeds,
            ),
            recipient_amount,
            ctx.accounts.mint.decimals,
        )?;

        recipient_member.has_received = true;
        group.current_round += 1;
        group.next_round_at = clock.unix_timestamp
            + (group.round_duration_days as i64 * 86400);

        if group.current_round >= group.total_rounds as u32 {
            group.status = 2;
        }

        msg!("Round {} distributed: {} USDC to recipient", group.current_round, recipient_amount);
        Ok(())
    }

    pub fn raise_emergency(ctx: Context<RaiseEmergency>, reason: String) -> Result<()> {
        require!(reason.len() <= 200, AjoError::ReasonTooLong);

        let emergency = &mut ctx.accounts.emergency;
        emergency.group = ctx.accounts.group.key();
        emergency.requester = ctx.accounts.member.key();
        emergency.reason = reason;
        emergency.votes_yes = 0;
        emergency.votes_no = 0;
        emergency.status = 0;
        emergency.created_at = Clock::get()?.unix_timestamp;
        emergency.bump = ctx.bumps.emergency;

        msg!("Emergency request raised by {}", ctx.accounts.member.key());
        Ok(())
    }

    pub fn vote_emergency(ctx: Context<VoteEmergency>, approve: bool) -> Result<()> {
        let emergency = &mut ctx.accounts.emergency;
        require!(emergency.status == 0, AjoError::EmergencyResolved);

        let group = &ctx.accounts.group;

        if approve {
            emergency.votes_yes += 1;
        } else {
            emergency.votes_no += 1;
        }

        let total_votes = emergency.votes_yes + emergency.votes_no;
        let approval_threshold = (group.current_members as u32 * 70) / 100;

        if emergency.votes_yes >= approval_threshold {
            emergency.status = 1;
            msg!("Emergency approved by group vote!");
        } else if total_votes >= group.current_members as u32
            && emergency.votes_yes < approval_threshold
        {
            emergency.status = 2;
            msg!("Emergency rejected by group vote");
        }

        Ok(())
    }
}

#[derive(Accounts)]
#[instruction(name: String)]
pub struct CreateGroup<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,
    pub mint: InterfaceAccount<'info, Mint>,
    #[account(
        init,
        payer = admin,
        space = 8 + AjoGroup::INIT_SPACE,
        seeds = [b"ajo_group", admin.key().as_ref(), name.as_bytes()],
        bump
    )]
    pub group: Account<'info, AjoGroup>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct JoinGroup<'info> {
    #[account(mut)]
    pub member: Signer<'info>,
    pub mint: InterfaceAccount<'info, Mint>,
    #[account(mut)]
    pub group: Account<'info, AjoGroup>,
    #[account(
        init,
        payer = member,
        space = 8 + AjoMember::INIT_SPACE,
        seeds = [b"ajo_member", group.key().as_ref(), member.key().as_ref()],
        bump
    )]
    pub member_account: Account<'info, AjoMember>,
    #[account(
        mut,
        associated_token::mint = mint,
        associated_token::authority = member,
        associated_token::token_program = token_program,
    )]
    pub member_token_account: InterfaceAccount<'info, TokenAccount>,
    #[account(
        init_if_needed,
        payer = member,
        seeds = [b"group_vault", group.key().as_ref()],
        bump,
        token::mint = mint,
        token::authority = group_vault,
        token::token_program = token_program,
    )]
    pub group_vault: InterfaceAccount<'info, TokenAccount>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub token_program: Interface<'info, TokenInterface>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Contribute<'info> {
    #[account(mut)]
    pub member: Signer<'info>,
    pub mint: InterfaceAccount<'info, Mint>,
    #[account(mut)]
    pub group: Account<'info, AjoGroup>,
    #[account(
        mut,
        seeds = [b"ajo_member", group.key().as_ref(), member.key().as_ref()],
        bump = member_account.bump,
    )]
    pub member_account: Account<'info, AjoMember>,
    #[account(
        mut,
        associated_token::mint = mint,
        associated_token::authority = member,
        associated_token::token_program = token_program,
    )]
    pub member_token_account: InterfaceAccount<'info, TokenAccount>,
    #[account(
        mut,
        seeds = [b"group_vault", group.key().as_ref()],
        bump,
    )]
    pub group_vault: InterfaceAccount<'info, TokenAccount>,
    pub token_program: Interface<'info, TokenInterface>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct DistributeRound<'info> {
    #[account(mut)]
    pub caller: Signer<'info>,
    pub mint: InterfaceAccount<'info, Mint>,
    #[account(mut)]
    pub group: Account<'info, AjoGroup>,
    #[account(
        mut,
        seeds = [b"ajo_member", group.key().as_ref(), recipient.key().as_ref()],
        bump = recipient_member.bump,
    )]
    pub recipient_member: Account<'info, AjoMember>,
    /// CHECK: recipient wallet
    pub recipient: AccountInfo<'info>,
    #[account(
        mut,
        seeds = [b"group_vault", group.key().as_ref()],
        bump,
    )]
    pub group_vault: InterfaceAccount<'info, TokenAccount>,
    #[account(
        init_if_needed,
        payer = caller,
        associated_token::mint = mint,
        associated_token::authority = recipient,
        associated_token::token_program = token_program,
    )]
    pub recipient_token_account: InterfaceAccount<'info, TokenAccount>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub token_program: Interface<'info, TokenInterface>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct RaiseEmergency<'info> {
    #[account(mut)]
    pub member: Signer<'info>,
    pub group: Account<'info, AjoGroup>,
    #[account(
        seeds = [b"ajo_member", group.key().as_ref(), member.key().as_ref()],
        bump = member_account.bump,
    )]
    pub member_account: Account<'info, AjoMember>,
    #[account(
        init,
        payer = member,
        space = 8 + EmergencyRequest::INIT_SPACE,
        seeds = [b"emergency", group.key().as_ref(), member.key().as_ref()],
        bump
    )]
    pub emergency: Account<'info, EmergencyRequest>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct VoteEmergency<'info> {
    #[account(mut)]
    pub voter: Signer<'info>,
    pub group: Account<'info, AjoGroup>,
    #[account(
        seeds = [b"ajo_member", group.key().as_ref(), voter.key().as_ref()],
        bump = voter_member.bump,
    )]
    pub voter_member: Account<'info, AjoMember>,
    #[account(mut)]
    pub emergency: Account<'info, EmergencyRequest>,
    pub system_program: Program<'info, System>,
}

#[account]
#[derive(InitSpace)]
pub struct AjoGroup {
    pub admin: Pubkey,
    pub mint: Pubkey,
    #[max_len(50)]
    pub name: String,
    pub contribution_amount: u64,
    pub max_members: u8,
    pub current_members: u8,
    pub current_round: u32,
    pub total_rounds: u8,
    pub round_duration_days: u8,
    pub group_type: u8,
    pub security_deposit_multiplier: u8,
    pub status: u8,
    pub created_at: i64,
    pub next_round_at: i64,
    pub bump: u8,
}

#[account]
#[derive(InitSpace)]
pub struct AjoMember {
    pub member: Pubkey,
    pub group: Pubkey,
    pub position: u8,
    pub security_deposit: u64,
    pub total_contributed: u64,
    pub has_received: bool,
    pub missed_payments: u8,
    pub bump: u8,
}

#[account]
#[derive(InitSpace)]
pub struct EmergencyRequest {
    pub group: Pubkey,
    pub requester: Pubkey,
    #[max_len(200)]
    pub reason: String,
    pub votes_yes: u32,
    pub votes_no: u32,
    pub status: u8,
    pub created_at: i64,
    pub bump: u8,
}

#[error_code]
pub enum AjoError {
    #[msg("Group name too long")]
    NameTooLong,
    #[msg("Member count must be between 2 and 50")]
    InvalidMemberCount,
    #[msg("Amount must be greater than zero")]
    InvalidAmount,
    #[msg("Duration must be at least 1 day")]
    InvalidDuration,
    #[msg("Group is not open for new members")]
    GroupNotOpen,
    #[msg("Group is full")]
    GroupFull,
    #[msg("Group is not active")]
    GroupNotActive,
    #[msg("Round deadline has passed")]
    RoundDeadlinePassed,
    #[msg("Round is not ready for distribution")]
    RoundNotReady,
    #[msg("Member has already received their round")]
    AlreadyReceived,
    #[msg("Emergency request already resolved")]
    EmergencyResolved,
    #[msg("Reason too long")]
    ReasonTooLong,
    #[msg("Math overflow")]
    MathOverflow,
}
