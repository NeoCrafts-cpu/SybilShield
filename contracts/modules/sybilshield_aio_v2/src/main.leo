// ============================================================================
// SybilShield All-in-One v2 - Fixed syntax per official Leo examples
// ============================================================================

program sybilshield_aio_v2.aleo {

    // ========================================================================
    // RECORDS
    // ========================================================================

    record SybilBadge {
        owner: address,
        issuer: address,
        created_at: u32,
        expires_at: u32,
        proof_hash: field,
        nonce: field,
    }

    record VoteRecord {
        owner: address,
        prop_id: u32,
        choice: bool,
        voted_at: u32,
        nullifier: field,
    }

    record ProposalReceipt {
        owner: address,
        prop_id: u32,
    }

    // ========================================================================
    // STRUCTS
    // ========================================================================

    struct IssuerData {
        addr: address,
        name: field,
        reg_at: u32,
        active: bool,
        count: u32,
    }

    struct BadgeData {
        issuer: address,
        created: u32,
        expires: u32,
        revoked: bool,
    }

    struct Proposal {
        id: u32,
        title: field,
        desc: field,
        proposer: field,
        created: u32,
        ends: u32,
        yes: u64,
        no: u64,
        executed: bool,
        passed: bool,
    }

    // ========================================================================
    // MAPPINGS
    // ========================================================================

    mapping adm: u8 => address;
    mapping inited: u8 => bool;
    mapping iss_reg: address => bool;
    mapping iss_data: address => IssuerData;
    mapping bdg_reg: field => BadgeData;
    mapping bdg_revoked: field => bool;
    mapping proof_used: field => bool;
    mapping bdg_count: u8 => u32;
    mapping props: u32 => Proposal;
    mapping prop_cnt: u8 => u32;
    mapping vote_null: field => bool;
    mapping vote_tally: u32 => field;
    mapping prop_active: u32 => bool;

    // ========================================================================
    // INITIALIZATION
    // ========================================================================

    async transition init(owner: address) -> Future {
        return finalize_init(owner);
    }

    async function finalize_init(owner: address) {
        let is_init: bool = Mapping::get_or_use(inited, 0u8, false);
        assert(!is_init);
        Mapping::set(adm, 0u8, owner);
        Mapping::set(inited, 0u8, true);
        Mapping::set(bdg_count, 0u8, 0u32);
        Mapping::set(prop_cnt, 0u8, 0u32);
    }

    // ========================================================================
    // ISSUER MANAGEMENT
    // ========================================================================

    async transition reg_issuer(issuer_addr: address, issuer_name: field) -> Future {
        return finalize_reg_issuer(self.caller, issuer_addr, issuer_name);
    }

    async function finalize_reg_issuer(caller: address, issuer_addr: address, issuer_name: field) {
        let curr_adm: address = Mapping::get(adm, 0u8);
        assert_eq(caller, curr_adm);
        let registered: bool = Mapping::get_or_use(iss_reg, issuer_addr, false);
        assert(!registered);
        let data: IssuerData = IssuerData {
            addr: issuer_addr,
            name: issuer_name,
            reg_at: 0u32,
            active: true,
            count: 0u32,
        };
        Mapping::set(iss_reg, issuer_addr, true);
        Mapping::set(iss_data, issuer_addr, data);
    }

    async transition dereg_issuer(issuer_addr: address) -> Future {
        return finalize_dereg_issuer(self.caller, issuer_addr);
    }

    async function finalize_dereg_issuer(caller: address, issuer_addr: address) {
        let curr_adm: address = Mapping::get(adm, 0u8);
        assert_eq(caller, curr_adm);
        Mapping::set(iss_reg, issuer_addr, false);
        let data: IssuerData = Mapping::get(iss_data, issuer_addr);
        let updated: IssuerData = IssuerData {
            addr: data.addr,
            name: data.name,
            reg_at: data.reg_at,
            active: false,
            count: data.count,
        };
        Mapping::set(iss_data, issuer_addr, updated);
    }

    // ========================================================================
    // BADGE ISSUANCE
    // ========================================================================

    async transition issue_badge(
        recipient: address,
        proof_hash: field,
        expires_at: u32
    ) -> (SybilBadge, Future) {
        assert_neq(proof_hash, 0field);
        let h: field = BHP256::hash_to_field(recipient);
        let nonce: field = BHP256::hash_to_field(h + proof_hash);
        let badge: SybilBadge = SybilBadge {
            owner: recipient,
            issuer: self.caller,
            created_at: 0u32,
            expires_at: expires_at,
            proof_hash: proof_hash,
            nonce: nonce,
        };
        return (badge, finalize_issue_badge(self.caller, nonce, proof_hash, expires_at));
    }

    async function finalize_issue_badge(
        issuer: address,
        nonce: field,
        proof_hash: field,
        expires_at: u32
    ) {
        let is_reg: bool = Mapping::get_or_use(iss_reg, issuer, false);
        assert(is_reg);
        let used: bool = Mapping::get_or_use(proof_used, proof_hash, false);
        assert(!used);
        let exists: bool = Mapping::contains(bdg_reg, nonce);
        assert(!exists);
        let data: BadgeData = BadgeData {
            issuer: issuer,
            created: 0u32,
            expires: expires_at,
            revoked: false,
        };
        Mapping::set(bdg_reg, nonce, data);
        Mapping::set(proof_used, proof_hash, true);
        let iss: IssuerData = Mapping::get(iss_data, issuer);
        let updated_iss: IssuerData = IssuerData {
            addr: iss.addr,
            name: iss.name,
            reg_at: iss.reg_at,
            active: iss.active,
            count: iss.count + 1u32,
        };
        Mapping::set(iss_data, issuer, updated_iss);
        let cnt: u32 = Mapping::get_or_use(bdg_count, 0u8, 0u32);
        Mapping::set(bdg_count, 0u8, cnt + 1u32);
    }

    // ========================================================================
    // BADGE VERIFICATION & MANAGEMENT
    // ========================================================================

    async transition verify_badge(badge: SybilBadge) -> Future {
        assert_eq(badge.owner, self.caller);
        return finalize_verify_badge(badge.nonce, badge.issuer, badge.expires_at);
    }

    async function finalize_verify_badge(nonce: field, expected_issuer: address, expected_expires: u32) {
        let data: BadgeData = Mapping::get(bdg_reg, nonce);
        assert_eq(data.issuer, expected_issuer);
        assert(!data.revoked);
        let iss_active: bool = Mapping::get_or_use(iss_reg, expected_issuer, false);
        assert(iss_active);
    }

    async transition revoke_badge(badge_nonce: field) -> Future {
        return finalize_revoke_badge(self.caller, badge_nonce);
    }

    async function finalize_revoke_badge(caller: address, badge_nonce: field) {
        let data: BadgeData = Mapping::get(bdg_reg, badge_nonce);
        let curr_adm: address = Mapping::get(adm, 0u8);
        let is_adm: bool = caller == curr_adm;
        let is_iss: bool = caller == data.issuer;
        assert(is_adm || is_iss);
        assert(!data.revoked);
        let revoked_data: BadgeData = BadgeData {
            issuer: data.issuer,
            created: data.created,
            expires: data.expires,
            revoked: true,
        };
        Mapping::set(bdg_reg, badge_nonce, revoked_data);
        Mapping::set(bdg_revoked, badge_nonce, true);
    }

    async transition renew_badge(old_badge: SybilBadge, new_expires: u32) -> (SybilBadge, Future) {
        assert_eq(old_badge.owner, self.caller);
        assert(new_expires > old_badge.expires_at);
        let new_nonce: field = BHP256::hash_to_field(old_badge.nonce + old_badge.proof_hash);
        let new_badge: SybilBadge = SybilBadge {
            owner: old_badge.owner,
            issuer: old_badge.issuer,
            created_at: old_badge.created_at,
            expires_at: new_expires,
            proof_hash: old_badge.proof_hash,
            nonce: new_nonce,
        };
        return (new_badge, finalize_renew_badge(old_badge.nonce, new_nonce, old_badge.issuer, new_expires));
    }

    async function finalize_renew_badge(old_nonce: field, new_nonce: field, issuer: address, new_expires: u32) {
        let old_data: BadgeData = Mapping::get(bdg_reg, old_nonce);
        assert(!old_data.revoked);
        let iss_active: bool = Mapping::get_or_use(iss_reg, issuer, false);
        assert(iss_active);
        let old_revoked: BadgeData = BadgeData {
            issuer: old_data.issuer,
            created: old_data.created,
            expires: old_data.expires,
            revoked: true,
        };
        Mapping::set(bdg_reg, old_nonce, old_revoked);
        let new_data: BadgeData = BadgeData {
            issuer: issuer,
            created: 0u32,
            expires: new_expires,
            revoked: false,
        };
        Mapping::set(bdg_reg, new_nonce, new_data);
    }

    transition get_badge_nonce(badge: SybilBadge) -> field {
        assert_eq(badge.owner, self.caller);
        return badge.nonce;
    }

    // ========================================================================
    // GOVERNANCE - PROPOSALS
    // ========================================================================

    async transition create_proposal(
        title: field,
        desc: field,
        duration: u32,
        badge_nonce: field
    ) -> (ProposalReceipt, Future) {
        assert_neq(title, 0field);
        assert_neq(desc, 0field);
        assert(duration >= 100u32);
        assert(duration <= 2592000u32);
        let proposer_hash: field = BHP256::hash_to_field(self.caller);
        let receipt: ProposalReceipt = ProposalReceipt {
            owner: self.caller,
            prop_id: 0u32,
        };
        return (receipt, finalize_create_proposal(proposer_hash, title, desc, duration, badge_nonce));
    }

    async function finalize_create_proposal(
        proposer_hash: field,
        title: field,
        desc: field,
        duration: u32,
        badge_nonce: field
    ) {
        let badge_exists: bool = Mapping::contains(bdg_reg, badge_nonce);
        let cnt: u32 = Mapping::get_or_use(prop_cnt, 0u8, 0u32);
        let id: u32 = cnt + 1u32;
        let ends: u32 = duration;
        let prop: Proposal = Proposal {
            id: id,
            title: title,
            desc: desc,
            proposer: proposer_hash,
            created: 0u32,
            ends: ends,
            yes: 0u64,
            no: 0u64,
            executed: false,
            passed: false,
        };
        Mapping::set(props, id, prop);
        Mapping::set(prop_cnt, 0u8, id);
        Mapping::set(prop_active, id, true);
        Mapping::set(vote_tally, id, 0field);
    }

    // ========================================================================
    // GOVERNANCE - VOTING
    // ========================================================================

    async transition vote(
        prop_id: u32,
        badge_nonce: field,
        badge_expires: u32,
        choice: bool
    ) -> (VoteRecord, Future) {
        let h1: field = BHP256::hash_to_field(self.caller);
        let h2: field = prop_id as field;
        let nullifier: field = BHP256::hash_to_field(h1 + h2 + badge_nonce);
        let vote_rec: VoteRecord = VoteRecord {
            owner: self.caller,
            prop_id: prop_id,
            choice: choice,
            voted_at: 0u32,
            nullifier: nullifier,
        };
        return (vote_rec, finalize_vote(prop_id, nullifier, choice, badge_expires, badge_nonce));
    }

    async function finalize_vote(
        prop_id: u32,
        nullifier: field,
        choice: bool,
        badge_expires: u32,
        badge_nonce: field
    ) {
        let badge_data: BadgeData = Mapping::get(bdg_reg, badge_nonce);
        assert(!badge_data.revoked);
        let prop: Proposal = Mapping::get(props, prop_id);
        assert(!prop.executed);
        let active: bool = Mapping::get_or_use(prop_active, prop_id, false);
        assert(active);
        let voted: bool = Mapping::get_or_use(vote_null, nullifier, false);
        assert(!voted);
        Mapping::set(vote_null, nullifier, true);
        let new_yes: u64 = prop.yes + (choice ? 1u64 : 0u64);
        let new_no: u64 = prop.no + (choice ? 0u64 : 1u64);
        let updated: Proposal = Proposal {
            id: prop.id,
            title: prop.title,
            desc: prop.desc,
            proposer: prop.proposer,
            created: prop.created,
            ends: prop.ends,
            yes: new_yes,
            no: new_no,
            executed: prop.executed,
            passed: prop.passed,
        };
        Mapping::set(props, prop_id, updated);
        let yes_f: field = new_yes as field;
        let no_f: field = new_no as field;
        let tally: field = yes_f * 1000000field + no_f;
        Mapping::set(vote_tally, prop_id, tally);
    }

    // ========================================================================
    // GOVERNANCE - EXECUTION
    // ========================================================================

    async transition end_voting(prop_id: u32) -> Future {
        return finalize_end_voting(prop_id);
    }

    async function finalize_end_voting(prop_id: u32) {
        let prop: Proposal = Mapping::get(props, prop_id);
        let active: bool = Mapping::get_or_use(prop_active, prop_id, false);
        assert(active);
        let passed: bool = prop.yes > prop.no;
        let final_prop: Proposal = Proposal {
            id: prop.id,
            title: prop.title,
            desc: prop.desc,
            proposer: prop.proposer,
            created: prop.created,
            ends: prop.ends,
            yes: prop.yes,
            no: prop.no,
            executed: false,
            passed: passed,
        };
        Mapping::set(props, prop_id, final_prop);
        Mapping::set(prop_active, prop_id, false);
    }

    async transition execute_proposal(prop_id: u32) -> Future {
        return finalize_execute_proposal(self.caller, prop_id);
    }

    async function finalize_execute_proposal(caller: address, prop_id: u32) {
        let prop: Proposal = Mapping::get(props, prop_id);
        assert(!prop.executed);
        assert(prop.passed);
        let curr_adm: address = Mapping::get(adm, 0u8);
        assert_eq(caller, curr_adm);
        let done: Proposal = Proposal {
            id: prop.id,
            title: prop.title,
            desc: prop.desc,
            proposer: prop.proposer,
            created: prop.created,
            ends: prop.ends,
            yes: prop.yes,
            no: prop.no,
            executed: true,
            passed: prop.passed,
        };
        Mapping::set(props, prop_id, done);
    }

    async transition cancel_proposal(prop_id: u32) -> Future {
        return finalize_cancel_proposal(self.caller, prop_id);
    }

    async function finalize_cancel_proposal(caller: address, prop_id: u32) {
        let curr_adm: address = Mapping::get(adm, 0u8);
        assert_eq(caller, curr_adm);
        let prop: Proposal = Mapping::get(props, prop_id);
        let active: bool = Mapping::get_or_use(prop_active, prop_id, false);
        assert(active);
        Mapping::set(prop_active, prop_id, false);
        let cancelled: Proposal = Proposal {
            id: prop.id,
            title: prop.title,
            desc: prop.desc,
            proposer: prop.proposer,
            created: prop.created,
            ends: prop.ends,
            yes: prop.yes,
            no: prop.no,
            executed: true,
            passed: false,
        };
        Mapping::set(props, prop_id, cancelled);
    }

    // ========================================================================
    // ADMIN FUNCTIONS
    // ========================================================================

    async transition transfer_admin(new_admin: address) -> Future {
        return finalize_transfer_admin(self.caller, new_admin);
    }

    async function finalize_transfer_admin(caller: address, new_admin: address) {
        let curr_adm: address = Mapping::get(adm, 0u8);
        assert_eq(caller, curr_adm);
        Mapping::set(adm, 0u8, new_admin);
    }

    async transition check_admin(addr: address) -> Future {
        return finalize_check_admin(addr);
    }

    async function finalize_check_admin(addr: address) {
        let curr_adm: address = Mapping::get(adm, 0u8);
        assert_eq(addr, curr_adm);
    }

    async transition check_issuer(addr: address) -> Future {
        return finalize_check_issuer(addr);
    }

    async function finalize_check_issuer(addr: address) {
        let active: bool = Mapping::get_or_use(iss_reg, addr, false);
        assert(active);
    }

    // Required constructor for ConsensusVersion::V9+
    @noupgrade
    async constructor() {}
}
