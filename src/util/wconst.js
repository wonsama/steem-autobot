////////////////////////////////////////////////////////////
//
// information (소개)
//

/*
  파일명 : wconst.js

  설명 : 전역 상수를 정의한다

  최초작성일 : 2022.03.03
*/

////////////////////////////////////////////////////////////
//
// require (라이브러리 로딩)
//
const path = require("path");

////////////////////////////////////////////////////////////
//
// const (상수정의)
//
const ROOT_PATH = path.resolve(__dirname, "../../");
const OPERATION_LIST = [
  "pow",
  "vote",
  "comment",
  "custom_json",
  "transfer",
  "limit_order_create2",
  "limit_order_create",
  "comment_options",
  "claim_reward_balance",
  "claim_account",
  "feed_publish",
  "limit_order_cancel",
  "create_claimed_account",
  "delegate_vesting_shares",
  "account_update",
  "transfer_to_vesting",
  "account_witness_proxy",
  "account_witness_vote",
  "account_create",
  "withdraw_vesting",
  "witness_update",
  "delete_comment",
  "transfer_to_savings",
  "convert",
  "witness_set_properties",
  "transfer_from_savings",
  "set_withdraw_vesting_route",
  "cancel_transfer_from_savings",
  "request_account_recovery",
  "change_recovery_account",
  "recover_account",
  "custom",
  "create_proposal",
  "update_proposal_votes",
  "remove_proposal",
  "account_update2",
  "escrow_transfer",
  "escrow_approve",
  "escrow_release",
  "escrow_dispute",
];

////////////////////////////////////////////////////////////
//
// let (변수정의)
//

////////////////////////////////////////////////////////////
//
// private function (비공개 함수) 함수명을 _(언더스코어) 로 시작
//

////////////////////////////////////////////////////////////
//
// public function (공개 함수)
//

////////////////////////////////////////////////////////////
//
// exports (외부 노출 함수 지정)
//

module.exports = {
  ROOT_PATH,
  OPERATION_LIST,
};
